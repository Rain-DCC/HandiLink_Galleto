import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.ts';
import {
  authenticate,
  passwordPolicySchema,
  requireRole,
  type AuthenticatedRequest,
  type ValidRole,
} from '../middleware/auth.ts';
import { formatUserRow, ROLE_TITLES } from './authService.ts';
import { createNotification, logAudit } from '../utils/audit.ts';

export const analyticsReportingRouter = Router();

// GET /api/gateway/analytics/overview
analyticsReportingRouter.get('/overview', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt;
  const pendingArtisans = (
    db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'artisan_weaver' AND verified = 0").get() as { cnt: number }
  ).cnt;
  const totalProducts = (db.prepare('SELECT COUNT(*) as cnt FROM products').get() as { cnt: number }).cnt;
  const pendingProposals = (
    db.prepare("SELECT COUNT(*) as cnt FROM proposals WHERE status IN ('Submitted', 'Under Review')").get() as { cnt: number }
  ).cnt;
  const activeOrders = (
    db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE order_status NOT IN ('Completed', 'Cancelled')").get() as { cnt: number }
  ).cnt;
  const activeBatches = (
    db.prepare("SELECT COUNT(*) as cnt FROM production_batches WHERE status IN ('Pending', 'In Production')").get() as { cnt: number }
  ).cnt;
  const totalSales = (db.prepare('SELECT COALESCE(SUM(total), 0) as sum FROM orders').get() as { sum: number }).sum;
  const lowStockCount = (
    db.prepare("SELECT COUNT(*) as cnt FROM materials WHERE status IN ('Low Stock', 'Out of Stock')").get() as { cnt: number }
  ).cnt;

  const salesByMethod = db
    .prepare('SELECT payment_method as method, COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM orders GROUP BY payment_method')
    .all();

  const ordersByStatus = db
    .prepare('SELECT order_status as status, COUNT(*) as count FROM orders GROUP BY order_status')
    .all();

  res.json({
    kpis: {
      totalUsers,
      pendingArtisans,
      totalProducts,
      pendingProposals,
      activeOrders,
      activeBatches,
      totalSales,
      lowStockCount,
      artisanShareTotal: Math.round(totalSales * 0.82),
      trustFundTotal: Math.round(totalSales * 0.18),
    },
    salesByMethod,
    ordersByStatus,
  });
});

// GET /api/gateway/analytics/users (Admin only)
analyticsReportingRouter.get(
  '/users',
  authenticate,
  requireRole('admin'),
  (_req: AuthenticatedRequest, res: Response) => {
    const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    res.json({ users: rows.map(formatUserRow) });
  }
);

// POST /api/gateway/analytics/users (Admin enroll user)
analyticsReportingRouter.post(
  '/users',
  authenticate,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        firstName: z.string().trim().min(1),
        lastName: z.string().trim().min(1),
        email: z.string().trim().email().toLowerCase(),
        password: passwordPolicySchema,
        phone: z.string().trim().optional().default(''),
        role: z.enum(['customer', 'admin', 'creative_director', 'ncip_secretary', 'fashion_designer', 'artisan_weaver']),
        community: z.string().trim().optional().default('Binugao, Toril, Davao City'),
        address: z.string().trim().optional().default(''),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid user fields.' });
        return;
      }

      const d = parsed.data;
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(d.email);
      if (existing) {
        res.status(409).json({ error: 'Email already registered.' });
        return;
      }

      const hash = await bcrypt.hash(d.password, 10);
      const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
      const fullName = `${d.firstName} ${d.lastName}`.trim();

      db.prepare(`
        INSERT INTO users (id, first_name, last_name, name, email, password_hash, auth_provider, phone, role, role_title, community, address, status, verified, last_login)
        VALUES (?, ?, ?, ?, ?, ?, 'local', ?, ?, ?, ?, ?, 'Active', 1, 'Never')
      `).run(id, d.firstName, d.lastName, fullName, d.email, hash, d.phone, d.role, ROLE_TITLES[d.role as ValidRole], d.community, d.address);

      logAudit({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        serviceName: 'AnalyticsReportingService',
        action: 'ADMIN_ENROLL_USER',
        resourceType: 'user',
        resourceId: id,
        details: `Enrolled ${fullName} (${d.role})`,
      });

      const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      res.status(201).json({ user: formatUserRow(created) });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/gateway/analytics/users/:id/verify (Admin verify artisan registration or change status)
analyticsReportingRouter.patch(
  '/users/:id/verify',
  authenticate,
  requireRole('admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      verified: z.boolean(),
      status: z.enum(['Active', 'Pending', 'Suspended']).optional(),
      role: z.enum(['customer', 'admin', 'creative_director', 'ncip_secretary', 'fashion_designer', 'artisan_weaver']).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid verification payload.' });
      return;
    }

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const nextVerified = parsed.data.verified ? 1 : 0;
    const nextStatus = parsed.data.status || (parsed.data.verified ? 'Active' : 'Pending');
    const nextRole = parsed.data.role || existing.role;
    const nextRoleTitle = parsed.data.role ? ROLE_TITLES[parsed.data.role as ValidRole] : existing.role_title;

    db.prepare('UPDATE users SET verified = ?, status = ?, role = ?, role_title = ? WHERE id = ?').run(
      nextVerified,
      nextStatus,
      nextRole,
      nextRoleTitle,
      existing.id
    );

    if (parsed.data.verified) {
      createNotification({
        targetRole: existing.role,
        title: 'Artisan Registration Verified',
        message: `${existing.name} has been verified by the BIBATAWA Administrator.`,
        type: 'proposal',
      });
    }

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'AnalyticsReportingService',
      action: parsed.data.verified ? 'VERIFY_USER' : 'UPDATE_USER_STATUS',
      resourceType: 'user',
      resourceId: existing.id,
      details: `${existing.name} -> status=${nextStatus}, verified=${nextVerified}`,
    });

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
    res.json({ user: formatUserRow(updated) });
  }
);

// GET /api/gateway/analytics/audit-logs (Admin only)
analyticsReportingRouter.get(
  '/audit-logs',
  authenticate,
  requireRole('admin'),
  (_req: AuthenticatedRequest, res: Response) => {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 60').all();
    res.json({ logs });
  }
);

// GET /api/gateway/analytics/notifications
analyticsReportingRouter.get('/notifications', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const rows = db
    .prepare(`
      SELECT id, target_role as targetRole, title, message, type, is_read as isRead, created_at as time
      FROM notifications
      WHERE target_role = 'all' OR target_role = ? OR ? = 'admin'
      ORDER BY created_at DESC
      LIMIT 30
    `)
    .all(req.user!.role, req.user!.role) as any[];

  res.json({
    notifications: rows.map(r => ({
      ...r,
      read: r.isRead === 1,
    })),
  });
});

analyticsReportingRouter.post('/notifications/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.params.id === 'all') {
    db.prepare('UPDATE notifications SET is_read = 1').run();
  } else {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  }
  res.json({ ok: true });
});

// GET /api/gateway/analytics/reports/export?type=sales|orders|production|inventory|proposals&format=csv|json
analyticsReportingRouter.get(
  '/reports/export',
  authenticate,
  requireRole('admin', 'creative_director'),
  (req: AuthenticatedRequest, res: Response) => {
    const type = String(req.query.type || 'sales');
    const format = String(req.query.format || 'csv');

    let rows: any[] = [];
    if (type === 'sales') {
      rows = db.prepare('SELECT order_number, reference_code, amount, artisan_share, trust_fund_share, payment_method, status, verified_at FROM payments').all();
    } else if (type === 'orders') {
      rows = db.prepare('SELECT order_number, date, customer_name, total, payment_method, payment_status, order_status, production_status FROM orders').all();
    } else if (type === 'production') {
      rows = db.prepare('SELECT order_number, product_name, design_pattern, quantity, progress_percentage, status, assigned_artisan, target_completion FROM production_batches').all();
    } else if (type === 'inventory') {
      rows = db.prepare('SELECT code, name, category, current_stock, minimum_stock, unit, status, last_updated FROM materials').all();
    } else if (type === 'proposals') {
      rows = db.prepare('SELECT proposal_number, date, person_involved, organization, subject, status, submitted_by FROM proposals').all();
    } else {
      rows = db.prepare('SELECT code, name, category, price, stock, artisan, status FROM products').all();
    }

    if (format === 'json') {
      res.json({ reportType: type, generatedAt: new Date().toISOString(), rows });
      return;
    }

    const headers = rows.length > 0 ? Object.keys(rows[0]) : ['no_data'];
    const csvLines = [
      headers.join(','),
      ...rows.map(r =>
        headers
          .map(h => {
            const val = String(r[h] ?? '').replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="handilink_${type}_report.csv"`);
    res.send(csvLines.join('\n'));
  }
);
