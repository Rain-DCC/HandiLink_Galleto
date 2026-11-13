import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { createNotification, logAudit } from '../utils/audit.ts';

export const orderWorkflowRouter = Router();

function formatOrder(row: any) {
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(row.id) as any[];
  const shipment = db.prepare('SELECT * FROM shipments WHERE order_id = ?').get(row.id) as any;
  return {
    id: row.id,
    orderNumber: row.order_number,
    date: row.date,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    items: items.map(i => ({
      id: i.id,
      productId: i.product_id,
      productCode: i.product_code,
      productName: i.product_name,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unit_price,
      amount: i.amount,
      pattern: i.pattern,
    })),
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    total: row.total,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    productionStatus: row.production_status,
    targetCompletionDate: row.target_completion_date,
    assignedArtisan: row.assigned_artisan,
    notes: row.notes,
    poNumber: row.po_number,
    terms: row.terms,
    shipment: shipment
      ? {
          id: shipment.id,
          trackingNumber: shipment.tracking_number,
          courier: shipment.courier,
          status: shipment.status,
          estimatedDelivery: shipment.estimated_delivery,
        }
      : null,
  };
}

function formatBatch(row: any) {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    productName: row.product_name,
    productCode: row.product_code,
    designPattern: row.design_pattern,
    quantity: row.quantity,
    startDate: row.start_date,
    targetCompletion: row.target_completion,
    status: row.status,
    progressPercentage: row.progress_percentage,
    assignedArtisan: row.assigned_artisan,
    communityCluster: row.community_cluster,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

// --- CART ENDPOINTS ---
orderWorkflowRouter.get('/cart', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const rows = db
    .prepare(`
      SELECT c.id as cart_id, c.quantity, c.selected_pattern, p.*
      FROM cart_items c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ?
    `)
    .all(req.user!.id) as any[];

  const cart = rows.map(r => ({
    cartId: r.cart_id,
    quantity: r.quantity,
    selectedPattern: r.selected_pattern || r.pattern,
    product: {
      id: r.id,
      code: r.code,
      name: r.name,
      category: r.category,
      price: r.price,
      stock: r.stock,
      artisan: r.artisan,
      community: r.community,
      description: r.description,
      culturalStory: r.cultural_story,
      materials: JSON.parse(r.materials || '[]'),
      pattern: r.pattern,
      craftType: r.craft_type,
      status: r.status,
      imageUrl: r.image_url,
      featured: r.featured === 1,
    },
  }));

  res.json({ cart });
});

orderWorkflowRouter.post('/cart', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(100).default(1),
    selectedPattern: z.string().optional().default(''),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid cart item payload.' });
    return;
  }

  const { productId, quantity, selectedPattern } = parsed.data;
  const prod = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!prod) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const existing = db
    .prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(req.user!.id, productId) as { id: string; quantity: number } | undefined;

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ?, selected_pattern = COALESCE(NULLIF(?, ""), selected_pattern) WHERE id = ?').run(
      existing.quantity + quantity,
      selectedPattern,
      existing.id
    );
  } else {
    db.prepare('INSERT INTO cart_items (id, user_id, product_id, quantity, selected_pattern) VALUES (?, ?, ?, ?, ?)').run(
      `crt-${crypto.randomUUID().slice(0, 8)}`,
      req.user!.id,
      productId,
      quantity,
      selectedPattern
    );
  }

  res.status(201).json({ ok: true });
});

orderWorkflowRouter.put('/cart/:productId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const qty = Number(req.body?.quantity ?? 0);
  if (qty <= 0) {
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.user!.id, req.params.productId);
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?').run(qty, req.user!.id, req.params.productId);
  }
  res.json({ ok: true });
});

orderWorkflowRouter.delete('/cart/:productId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.user!.id, req.params.productId);
  res.json({ ok: true });
});

orderWorkflowRouter.delete('/cart', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user!.id);
  res.json({ ok: true });
});

// --- FAVORITES ---
orderWorkflowRouter.get('/favorites', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const rows = db.prepare('SELECT product_id FROM favorites WHERE user_id = ?').all(req.user!.id) as { product_id: string }[];
  res.json({ favorites: rows.map(r => r.product_id) });
});

orderWorkflowRouter.post('/favorites/toggle', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const productId = String(req.body?.productId || '');
  if (!productId) {
    res.status(400).json({ error: 'Product ID required.' });
    return;
  }
  const existing = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user!.id, productId);
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(req.user!.id, productId);
    res.json({ favorited: false });
  } else {
    db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)').run(req.user!.id, productId);
    res.json({ favorited: true });
  }
});

// --- ORDERS ENDPOINTS ---
orderWorkflowRouter.get('/orders', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const isStaff = ['admin', 'creative_director', 'artisan_weaver', 'ncip_secretary'].includes(req.user!.role);
  const rows = isStaff
    ? db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
    : db
        .prepare('SELECT * FROM orders WHERE customer_id = ? OR customer_email = ? ORDER BY created_at DESC')
        .all(req.user!.id, req.user!.email);

  res.json({ orders: rows.map(formatOrder) });
});

orderWorkflowRouter.post('/orders', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const itemSchema = z.object({
    productId: z.string().optional(),
    productCode: z.string().min(1),
    productName: z.string().min(1),
    quantity: z.number().int().min(1),
    unit: z.string().optional().default('Piece'),
    unitPrice: z.number().positive(),
    pattern: z.string().optional().default(''),
  });

  const schema = z.object({
    customerName: z.string().trim().min(2),
    customerEmail: z.string().trim().email(),
    customerPhone: z.string().trim().optional().default(''),
    shippingAddress: z.string().trim().min(5),
    items: z.array(itemSchema).min(1, 'Order must contain at least one item.'),
    shippingFee: z.number().min(0).optional().default(0),
    paymentMethod: z.enum(['GCash', 'Maya', 'Landbank', 'Cash on Delivery']),
    notes: z.string().optional().default(''),
    poNumber: z.string().optional().default(''),
    terms: z.string().optional().default('Standard Retail'),
    clearUserCart: z.boolean().optional().default(true),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid order details.' });
    return;
  }

  const d = parsed.data;
  const subtotal = d.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total = subtotal + d.shippingFee;
  const orderId = `ord-${crypto.randomUUID().slice(0, 8)}`;
  const orderNumber = `HL-ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
  const today = new Date().toISOString().split('T')[0];
  const targetCompletion = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const isInstantPaid = d.paymentMethod === 'GCash' || d.paymentMethod === 'Maya';
  const paymentStatus = isInstantPaid ? 'Paid' : 'Pending';
  const assignedArtisan = 'Bae Salome Linganay';

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO orders (
        id, order_number, date, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, subtotal, shipping_fee, total, payment_method, payment_status,
        order_status, production_status, target_completion_date, assigned_artisan, notes, po_number, terms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', 'In Progress', ?, ?, ?, ?, ?)
    `).run(
      orderId,
      orderNumber,
      today,
      req.user!.id,
      d.customerName,
      d.customerEmail,
      d.customerPhone,
      d.shippingAddress,
      subtotal,
      d.shippingFee,
      total,
      d.paymentMethod,
      paymentStatus,
      targetCompletion,
      assignedArtisan,
      d.notes,
      d.poNumber,
      d.terms
    );

    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_code, product_name, quantity, unit, unit_price, amount, pattern)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertBatch = db.prepare(`
      INSERT INTO production_batches (
        id, order_id, order_number, product_name, product_code, design_pattern, quantity,
        start_date, target_completion, status, progress_percentage, assigned_artisan, community_cluster, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 0, ?, 'Binugao Weaving Hub', ?)
    `);

    for (const item of d.items) {
      const amount = item.quantity * item.unitPrice;
      insertItem.run(
        `oi-${crypto.randomUUID().slice(0, 8)}`,
        orderId,
        item.productId || '',
        item.productCode,
        item.productName,
        item.quantity,
        item.unit,
        item.unitPrice,
        amount,
        item.pattern
      );

      if (item.productId) {
        db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').run(item.quantity, item.productId);
      }

      insertBatch.run(
        `bat-${crypto.randomUUID().slice(0, 8)}`,
        orderId,
        orderNumber,
        item.productName,
        item.productCode,
        item.pattern || 'Traditional Inabal',
        item.quantity,
        today,
        targetCompletion,
        assignedArtisan,
        d.notes || 'Commission queued for backstrap loom warping.'
      );
    }

    // Create linked Payment & Trust split record (82% artisan / 18% trust fund)
    const artisanShare = Math.round(total * 0.82 * 100) / 100;
    const trustShare = Math.round((total - artisanShare) * 100) / 100;
    db.prepare(`
      INSERT INTO payments (id, order_id, order_number, reference_code, amount, artisan_share, trust_fund_share, payment_method, status, verified_by, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `pay-${crypto.randomUUID().slice(0, 8)}`,
      orderId,
      orderNumber,
      `${d.paymentMethod.slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 899999)}`,
      total,
      artisanShare,
      trustShare,
      d.paymentMethod,
      paymentStatus,
      isInstantPaid ? 'Automated Payment Gateway' : '',
      isInstantPaid ? new Date().toISOString().replace('T', ' ').slice(0, 16) : ''
    );

    // Create linked Shipment record
    db.prepare(`
      INSERT INTO shipments (id, order_id, order_number, tracking_number, courier, destination, status, estimated_delivery)
      VALUES (?, ?, ?, ?, 'ABest Cultural Parcel', ?, 'Preparing', ?)
    `).run(
      `shp-${crypto.randomUUID().slice(0, 8)}`,
      orderId,
      orderNumber,
      `HL-TRK-2026-${Math.floor(1000 + Math.random() * 8999)}`,
      d.shippingAddress,
      targetCompletion
    );

    if (d.clearUserCart) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user!.id);
    }
  });

  tx();

  createNotification({
    targetRole: 'artisan_weaver',
    title: `New Weaving Commission: ${orderNumber}`,
    message: `${d.customerName} placed an order worth ₱${total.toLocaleString()} (${d.items.length} line item/s).`,
    type: 'order',
  });

  logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    serviceName: 'OrderWorkflowService',
    action: 'CREATE_ORDER',
    resourceType: 'order',
    resourceId: orderId,
    details: `${orderNumber} · Total ₱${total.toLocaleString()} · ${d.paymentMethod}`,
  });

  const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.status(201).json({ order: formatOrder(created) });
});

orderWorkflowRouter.patch(
  '/orders/:id/status',
  authenticate,
  requireRole('admin', 'creative_director', 'artisan_weaver'),
  (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      orderStatus: z.enum(['Pending', 'Confirmed', 'In Production', 'Ready', 'Completed', 'Cancelled']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }

    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    db.prepare('UPDATE orders SET order_status = ? WHERE id = ?').run(parsed.data.orderStatus, existing.id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'OrderWorkflowService',
      action: 'UPDATE_ORDER_STATUS',
      resourceType: 'order',
      resourceId: existing.id,
      details: `${existing.order_number} -> ${parsed.data.orderStatus}`,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(existing.id);
    res.json({ order: formatOrder(updated) });
  }
);

// --- PRODUCTION BATCHES ---
orderWorkflowRouter.get(
  '/production',
  authenticate,
  requireRole('admin', 'artisan_weaver', 'creative_director', 'fashion_designer'),
  (_req: AuthenticatedRequest, res: Response) => {
    const rows = db.prepare('SELECT * FROM production_batches ORDER BY start_date DESC').all();
    res.json({ batches: rows.map(formatBatch) });
  }
);

orderWorkflowRouter.patch(
  '/production/:id',
  authenticate,
  requireRole('admin', 'artisan_weaver'),
  (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM production_batches WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Production batch not found.' });
      return;
    }

    const schema = z.object({
      progressPercentage: z.number().int().min(0).max(100),
      status: z.enum(['Pending', 'In Production', 'Completed', 'Delayed']).optional(),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid production update.' });
      return;
    }

    const { progressPercentage, notes } = parsed.data;
    const derivedStatus =
      parsed.data.status || (progressPercentage >= 100 ? 'Completed' : progressPercentage === 0 ? 'Pending' : 'In Production');
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE production_batches
        SET progress_percentage = ?, status = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `).run(progressPercentage, derivedStatus, notes ?? existing.notes, nowStr, existing.id);

      if (existing.order_id) {
        const orderProdStatus = derivedStatus === 'Completed' ? 'Completed' : derivedStatus === 'Pending' ? 'Not Started' : 'In Progress';
        const orderStatus = derivedStatus === 'Completed' ? 'Ready' : 'In Production';
        db.prepare('UPDATE orders SET production_status = ?, order_status = ? WHERE id = ?').run(
          orderProdStatus,
          orderStatus,
          existing.order_id
        );
      }
    });

    tx();

    if (derivedStatus === 'Completed') {
      createNotification({
        targetRole: 'admin',
        title: `Loom Batch Completed: ${existing.order_number}`,
        message: `${existing.product_name} reached 100% completion and is ready for dispatch.`,
        type: 'production',
      });
    }

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'OrderWorkflowService',
      action: 'UPDATE_PRODUCTION_BATCH',
      resourceType: 'production_batch',
      resourceId: existing.id,
      details: `${existing.order_number} -> ${progressPercentage}% (${derivedStatus})`,
    });

    const updated = db.prepare('SELECT * FROM production_batches WHERE id = ?').get(existing.id);
    res.json({ batch: formatBatch(updated) });
  }
);
