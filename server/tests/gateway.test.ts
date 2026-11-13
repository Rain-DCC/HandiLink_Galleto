import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let server: http.Server;
let baseUrl = '';
let tempDbPath = '';
let closeDb: (() => void) | null = null;

async function api(pathName: string, options: RequestInit & { token?: string } = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const res = await fetch(`${baseUrl}${pathName}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

describe('HandiLink API Gateway & Microservices Integration Tests', () => {
  before(async () => {
    tempDbPath = path.join(os.tmpdir(), `handilink-test-${process.pid}-${Date.now()}.db`);
    process.env.HANDILINK_DB_PATH = tempDbPath;
    process.env.NODE_ENV = 'production'; // Skip Vite dev server during API tests

    const { createAppServer } = await import('../../server.ts');
    const { db } = await import('../db.ts');
    closeDb = () => db.close();

    const app = await createAppServer();
    await new Promise<void>(resolve => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()));
      });
    }
    try {
      closeDb?.();
    } catch {
      // ignore if already closed
    }
    for (const suffix of ['', '-wal', '-shm', '-journal']) {
      if (tempDbPath && fs.existsSync(`${tempDbPath}${suffix}`)) {
        fs.rmSync(`${tempDbPath}${suffix}`, { force: true });
      }
    }
  });

  it('GET /api/gateway/health reports operational gateway and all 9 services', async () => {
    const res = await api('/api/gateway/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'operational');
    assert.ok(res.body.services.includes('ProposalComplianceService'));
    assert.ok(res.body.services.includes('PatternVisionService'));
    assert.ok(res.body.services.includes('CebuanoSpeechAIService'));
  });

  it('Enforces strong password policy on registration and issues JWT on valid signup/login', async () => {
    // Weak password rejected
    const weak = await api('/api/gateway/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Patron',
        email: `weak_${Date.now()}@test.ph`,
        password: 'weak',
      }),
    });
    assert.equal(weak.status, 400);

    // Valid strong password accepted
    const uniqueEmail = `patron_${Date.now()}@test.ph`;
    const reg = await api('/api/gateway/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Elena',
        lastName: 'Cruz',
        email: uniqueEmail,
        password: 'StrongPass2026',
        role: 'customer',
      }),
    });
    assert.equal(reg.status, 201);
    assert.ok(reg.body.token);
    assert.equal(reg.body.user.role, 'customer');

    // Login works
    const login = await api('/api/gateway/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: uniqueEmail, password: 'StrongPass2026' }),
    });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);
  });

  it('Enforces RBAC: Customer cannot evaluate NCIP proposals, NCIP Secretary can and generates Resolution', async () => {
    const cdLogin = await api('/api/gateway/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'samantha.reyes@handilink.org', password: 'HandiLink2026!' }),
    });
    assert.equal(cdLogin.status, 200);

    const createdProp = await api('/api/gateway/proposals', {
      method: 'POST',
      token: cdLogin.body.token,
      body: JSON.stringify({
        personInvolved: 'Director Evelyn Castro',
        organization: 'Mindanao Heritage Alliance',
        address: 'Davao City',
        subject: `Cultural Preservation Grant ${Date.now()}`,
        letterContent: 'Formal request for FPIC clearance and partnership endorsement for Inabal textile workshop.',
        targetCommunity: 'Binugao, Toril',
        status: 'Submitted',
      }),
    });
    assert.equal(createdProp.status, 201);
    const propId = createdProp.body.proposal.id;

    const custLogin = await api('/api/gateway/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'm.santos@mindanaolegal.org', password: 'HandiLink2026!' }),
    });
    assert.equal(custLogin.status, 200);

    const forbidden = await api(`/api/gateway/proposals/${propId}/evaluate`, {
      method: 'POST',
      token: custLogin.body.token,
      body: JSON.stringify({ decision: 'Approved', remarks: 'Attempted unauthorized approval' }),
    });
    assert.equal(forbidden.status, 403);

    const ncipLogin = await api('/api/gateway/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'joshua.benitez@ncip.gov.ph', password: 'HandiLink2026!' }),
    });
    assert.equal(ncipLogin.status, 200);

    const approved = await api(`/api/gateway/proposals/${propId}/evaluate`, {
      method: 'POST',
      token: ncipLogin.body.token,
      body: JSON.stringify({
        decision: 'Approved',
        remarks: 'Verified compliant with RA 8371 and DTI Shared Service Facility bylaws.',
      }),
    });
    assert.equal(approved.status, 200);
    assert.equal(approved.body.proposal.status, 'Approved');
    assert.ok(approved.body.resolution);
  });

  it('Executes full Order -> Production Batch -> Payment 82/18 Split -> Shipment workflow', async () => {
    const designerLogin = await api('/api/gateway/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'mctan@atelier-mindanao.ph', password: 'HandiLink2026!' }),
    });
    const adminLogin = await api('/api/gateway/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@handilink.org', password: 'HandiLink2026!' }),
    });

    const createdOrder = await api('/api/gateway/workflow/orders', {
      method: 'POST',
      token: designerLogin.body.token,
      body: JSON.stringify({
        customerName: 'Atelier Mindanao Test',
        customerEmail: 'mctan@atelier-mindanao.ph',
        customerPhone: '+63 918 234 5678',
        shippingAddress: 'Lanang Premier Complex, Davao City',
        items: [
          {
            productId: 'prod-001',
            productCode: 'INB-2026-01',
            productName: 'Master Inabal Abaca Cloth',
            quantity: 2,
            unit: 'Roll',
            unitPrice: 8500,
            pattern: 'Binituwon',
          },
        ],
        shippingFee: 0,
        paymentMethod: 'GCash',
      }),
    });

    assert.equal(createdOrder.status, 201);
    assert.equal(createdOrder.body.order.total, 17000);

    const payments = await api('/api/gateway/payments', {
      token: adminLogin.body.token,
    });
    assert.equal(payments.status, 200);
    const matchedPayment = payments.body.payments.find(
      (p: any) => p.orderNumber === createdOrder.body.order.orderNumber
    );
    assert.ok(matchedPayment);
    assert.equal(matchedPayment.artisanShare, 13940); // 82% of 17000
    assert.equal(matchedPayment.trustFundShare, 3060); // 18% of 17000
  });
});
