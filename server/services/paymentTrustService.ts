import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { createNotification, logAudit } from '../utils/audit.ts';

export const paymentTrustRouter = Router();

function formatPayment(row: any) {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    referenceCode: row.reference_code,
    amount: row.amount,
    artisanShare: row.artisan_share,
    trustFundShare: row.trust_fund_share,
    paymentMethod: row.payment_method,
    status: row.status,
    verifiedBy: row.verified_by || '',
    verifiedAt: row.verified_at || '',
    createdAt: row.created_at,
  };
}

// GET /api/gateway/payments
paymentTrustRouter.get(
  '/',
  authenticate,
  requireRole('admin', 'creative_director', 'artisan_weaver'),
  (_req: AuthenticatedRequest, res: Response) => {
    const rows = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all();
    const summary = db
      .prepare(`
        SELECT
          COALESCE(SUM(amount), 0) as totalGross,
          COALESCE(SUM(CASE WHEN status = 'Paid' THEN artisan_share ELSE 0 END), 0) as disbursedArtisanShare,
          COALESCE(SUM(CASE WHEN status = 'Paid' THEN trust_fund_share ELSE 0 END), 0) as accruedTrustFund,
          COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) as pendingReceivables
        FROM payments
      `)
      .get();

    res.json({ payments: rows.map(formatPayment), summary });
  }
);

// POST /api/gateway/payments/:orderId/verify
paymentTrustRouter.post(
  '/:orderId/verify',
  authenticate,
  requireRole('admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      status: z.enum(['Paid', 'Pending', 'Refunded']).default('Paid'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payment status.' });
      return;
    }

    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(req.params.orderId) as any;
    if (!payment) {
      res.status(404).json({ error: 'Payment record not found.' });
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const nextStatus = parsed.data.status;

    const tx = db.transaction(() => {
      db.prepare('UPDATE payments SET status = ?, verified_by = ?, verified_at = ? WHERE id = ?').run(
        nextStatus,
        req.user!.name,
        nowStr,
        payment.id
      );
      db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run(nextStatus, payment.order_id);
    });

    tx();

    createNotification({
      targetRole: 'artisan_weaver',
      title: `Payment ${nextStatus}: ${payment.order_number}`,
      message: `₱${Number(payment.amount).toLocaleString()} verified (82% direct artisan share: ₱${Number(payment.artisan_share).toLocaleString()}).`,
      type: 'payment',
    });

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'PaymentTrustService',
      action: `PAYMENT_${nextStatus.toUpperCase()}`,
      resourceType: 'payment',
      resourceId: payment.id,
      details: `${payment.order_number} · ₱${payment.amount}`,
    });

    const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id);
    res.json({ payment: formatPayment(updated) });
  }
);
