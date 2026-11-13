import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { createNotification, logAudit } from '../utils/audit.ts';

export const shippingLogisticsRouter = Router();

function formatShipment(row: any) {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    trackingNumber: row.tracking_number,
    courier: row.courier,
    origin: row.origin,
    destination: row.destination,
    status: row.status,
    estimatedDelivery: row.estimated_delivery,
    updatedAt: row.updated_at,
  };
}

// GET /api/gateway/logistics/shipments
shippingLogisticsRouter.get('/shipments', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const isStaff = ['admin', 'creative_director', 'artisan_weaver'].includes(req.user!.role);
  const rows = isStaff
    ? db.prepare('SELECT * FROM shipments ORDER BY updated_at DESC').all()
    : db
        .prepare(`
          SELECT s.* FROM shipments s
          JOIN orders o ON o.id = s.order_id
          WHERE o.customer_id = ? OR o.customer_email = ?
          ORDER BY s.updated_at DESC
        `)
        .all(req.user!.id, req.user!.email);

  res.json({ shipments: rows.map(formatShipment) });
});

// PATCH /api/gateway/logistics/shipments/:id
shippingLogisticsRouter.patch(
  '/shipments/:id',
  authenticate,
  requireRole('admin', 'artisan_weaver', 'creative_director'),
  (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      status: z.enum(['Preparing', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered']),
      courier: z.string().trim().min(2).optional(),
      estimatedDelivery: z.string().trim().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid shipment update payload.' });
      return;
    }

    const existing = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Shipment record not found.' });
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const { status, courier, estimatedDelivery } = parsed.data;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE shipments SET status = ?, courier = ?, estimated_delivery = ?, updated_at = ? WHERE id = ?
      `).run(status, courier ?? existing.courier, estimatedDelivery ?? existing.estimated_delivery, nowStr, existing.id);

      if (status === 'Delivered') {
        db.prepare("UPDATE orders SET order_status = 'Completed' WHERE id = ?").run(existing.order_id);
      }
    });

    tx();

    createNotification({
      targetRole: 'customer',
      title: `Parcel ${status}: ${existing.order_number}`,
      message: `Tracking #${existing.tracking_number} via ${courier ?? existing.courier} is now ${status}.`,
      type: 'logistics',
    });

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'ShippingLogisticsService',
      action: 'UPDATE_SHIPMENT',
      resourceType: 'shipment',
      resourceId: existing.id,
      details: `${existing.tracking_number} -> ${status}`,
    });

    const updated = db.prepare('SELECT * FROM shipments WHERE id = ?').get(existing.id);
    res.json({ shipment: formatShipment(updated) });
  }
);
