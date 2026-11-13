import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, optionalAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { createNotification, logAudit } from '../utils/audit.ts';

export const catalogueInventoryRouter = Router();

function formatProduct(row: any) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    price: row.price,
    stock: row.stock,
    artisan: row.artisan,
    community: row.community,
    description: row.description,
    culturalStory: row.cultural_story,
    materials: JSON.parse(row.materials || '[]'),
    pattern: row.pattern,
    craftType: row.craft_type,
    status: row.status,
    imageUrl: row.image_url,
    featured: row.featured === 1,
  };
}

function formatPattern(row: any) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    culturalOrigin: row.cultural_origin,
    description: row.description,
    associatedProduct: row.associated_product,
    imageUrl: row.image_url,
    symbolism: row.symbolism,
    complexity: row.complexity,
    fpicVerified: row.fpic_verified === 1,
  };
}

function formatMaterial(row: any) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    unit: row.unit,
    currentStock: row.current_stock,
    minimumStock: row.minimum_stock,
    status: row.status,
    category: row.category,
    unitCost: row.unit_cost,
    lastUpdated: row.last_updated,
  };
}

// GET /api/gateway/catalogue/products
catalogueInventoryRouter.get('/products', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const showAll = req.user && ['admin', 'creative_director', 'artisan_weaver'].includes(req.user.role);
  const rows = showAll
    ? db.prepare('SELECT * FROM products ORDER BY created_at DESC').all()
    : db.prepare("SELECT * FROM products WHERE status = 'Published' ORDER BY featured DESC, created_at DESC").all();

  res.json({ products: rows.map(formatProduct) });
});

// POST /api/gateway/catalogue/products
catalogueInventoryRouter.post(
  '/products',
  authenticate,
  requireRole('admin', 'creative_director', 'artisan_weaver'),
  (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      code: z.string().trim().min(2),
      name: z.string().trim().min(3),
      category: z.enum(['Textiles', 'Apparel', 'Accessories', 'Home Decor']),
      price: z.number().positive(),
      stock: z.number().int().min(0),
      artisan: z.string().trim().min(2),
      community: z.string().trim().optional().default('Binugao, Toril, Davao City'),
      description: z.string().trim().min(5),
      culturalStory: z.string().trim().min(5),
      materials: z.array(z.string()).optional().default(['Natural Abaca', 'Plant Dyes']),
      pattern: z.string().trim().min(2),
      craftType: z.enum(['Backstrap Loom Inabal', 'Beadwork & Brass', 'Hand Embroidery', 'Natural Dyeing']),
      status: z.enum(['Published', 'Draft', 'Archived']).optional().default('Published'),
      imageUrl: z.string().trim().min(1),
      featured: z.boolean().optional().default(false),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid product fields.' });
      return;
    }

    const d = parsed.data;
    const prodId = `prod-${crypto.randomUUID().slice(0, 8)}`;

    db.prepare(`
      INSERT INTO products (id, code, name, category, price, stock, artisan_id, artisan, community, description, cultural_story, materials, pattern, craft_type, status, image_url, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      prodId,
      d.code,
      d.name,
      d.category,
      d.price,
      d.stock,
      req.user!.id,
      d.artisan,
      d.community,
      d.description,
      d.culturalStory,
      JSON.stringify(d.materials),
      d.pattern,
      d.craftType,
      d.status,
      d.imageUrl,
      d.featured ? 1 : 0
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'CatalogueInventoryService',
      action: 'CREATE_PRODUCT',
      resourceType: 'product',
      resourceId: prodId,
      details: `Published ${d.code} — ${d.name}`,
    });

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(prodId);
    res.status(201).json({ product: formatProduct(created) });
  }
);

// PUT /api/gateway/catalogue/products/:id
catalogueInventoryRouter.put(
  '/products/:id',
  authenticate,
  requireRole('admin', 'creative_director', 'artisan_weaver'),
  (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const schema = z.object({
      code: z.string().trim().min(2).optional(),
      name: z.string().trim().min(3).optional(),
      category: z.enum(['Textiles', 'Apparel', 'Accessories', 'Home Decor']).optional(),
      price: z.number().positive().optional(),
      stock: z.number().int().min(0).optional(),
      artisan: z.string().trim().optional(),
      community: z.string().trim().optional(),
      description: z.string().trim().optional(),
      culturalStory: z.string().trim().optional(),
      materials: z.array(z.string()).optional(),
      pattern: z.string().trim().optional(),
      craftType: z.enum(['Backstrap Loom Inabal', 'Beadwork & Brass', 'Hand Embroidery', 'Natural Dyeing']).optional(),
      status: z.enum(['Published', 'Draft', 'Archived']).optional(),
      imageUrl: z.string().trim().optional(),
      featured: z.boolean().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid product update.' });
      return;
    }

    const d = parsed.data;
    db.prepare(`
      UPDATE products
      SET code = ?, name = ?, category = ?, price = ?, stock = ?, artisan = ?, community = ?,
          description = ?, cultural_story = ?, materials = ?, pattern = ?, craft_type = ?, status = ?, image_url = ?, featured = ?
      WHERE id = ?
    `).run(
      d.code ?? existing.code,
      d.name ?? existing.name,
      d.category ?? existing.category,
      d.price ?? existing.price,
      d.stock ?? existing.stock,
      d.artisan ?? existing.artisan,
      d.community ?? existing.community,
      d.description ?? existing.description,
      d.culturalStory ?? existing.cultural_story,
      d.materials ? JSON.stringify(d.materials) : existing.materials,
      d.pattern ?? existing.pattern,
      d.craftType ?? existing.craft_type,
      d.status ?? existing.status,
      d.imageUrl ?? existing.image_url,
      d.featured !== undefined ? (d.featured ? 1 : 0) : existing.featured,
      req.params.id
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'CatalogueInventoryService',
      action: 'UPDATE_PRODUCT',
      resourceType: 'product',
      resourceId: req.params.id,
      details: `Updated ${d.name ?? existing.name}`,
    });

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ product: formatProduct(updated) });
  }
);

// DELETE /api/gateway/catalogue/products/:id
catalogueInventoryRouter.delete(
  '/products/:id',
  authenticate,
  requireRole('admin', 'creative_director'),
  (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'CatalogueInventoryService',
      action: 'DELETE_PRODUCT',
      resourceType: 'product',
      resourceId: req.params.id,
      details: `Removed ${existing.code} — ${existing.name}`,
    });

    res.json({ deleted: true });
  }
);

// GET /api/gateway/catalogue/patterns
catalogueInventoryRouter.get('/patterns', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM patterns ORDER BY code ASC').all();
  res.json({ patterns: rows.map(formatPattern) });
});

// GET /api/gateway/catalogue/pattern-selections
catalogueInventoryRouter.get('/pattern-selections', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const rows =
    req.user!.role === 'admin' || req.user!.role === 'creative_director'
      ? db.prepare('SELECT * FROM designer_selections ORDER BY created_at DESC').all()
      : db.prepare('SELECT * FROM designer_selections WHERE designer_id = ? ORDER BY created_at DESC').all(req.user!.id);

  res.json({ selections: rows });
});

// POST /api/gateway/catalogue/pattern-selections
catalogueInventoryRouter.post(
  '/pattern-selections',
  authenticate,
  requireRole('fashion_designer', 'creative_director', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      patternId: z.string().min(1),
      patternName: z.string().min(1),
      productCode: z.string().min(1),
      productName: z.string().min(1),
      quantity: z.number().int().min(1).max(1000),
      notes: z.string().trim().min(3),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid pattern selection.' });
      return;
    }

    const d = parsed.data;
    const id = `sel-${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO designer_selections (id, designer_id, designer_name, pattern_id, pattern_name, product_code, product_name, quantity, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, req.user!.name, d.patternId, d.patternName, d.productCode, d.productName, d.quantity, d.notes);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'CatalogueInventoryService',
      action: 'SAVE_PATTERN_SELECTION',
      resourceType: 'pattern_selection',
      resourceId: id,
      details: `${d.patternName} -> ${d.productCode} (${d.quantity} units)`,
    });

    const created = db.prepare('SELECT * FROM designer_selections WHERE id = ?').get(id);
    res.status(201).json({ selection: created });
  }
);

// GET /api/gateway/catalogue/inventory
catalogueInventoryRouter.get(
  '/inventory',
  authenticate,
  requireRole('admin', 'artisan_weaver', 'creative_director'),
  (_req: AuthenticatedRequest, res: Response) => {
    const materials = db.prepare('SELECT * FROM materials ORDER BY code ASC').all().map(formatMaterial);
    const logs = db.prepare('SELECT * FROM material_logs ORDER BY created_at DESC LIMIT 25').all();
    res.json({ materials, logs });
  }
);

// POST /api/gateway/catalogue/inventory (Add new material)
catalogueInventoryRouter.post(
  '/inventory',
  authenticate,
  requireRole('admin', 'artisan_weaver'),
  (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      code: z.string().trim().min(2),
      name: z.string().trim().min(2),
      unit: z.string().trim().min(1),
      currentStock: z.number().min(0),
      minimumStock: z.number().min(1),
      category: z.enum(['Natural Fiber', 'Organic Dye', 'Seed Beads', 'Brass Elements', 'Loom Hardware']),
      unitCost: z.number().min(0),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid material data.' });
      return;
    }

    const d = parsed.data;
    const status = d.currentStock === 0 ? 'Out of Stock' : d.currentStock < d.minimumStock ? 'Low Stock' : 'Available';
    const matId = `mat-${crypto.randomUUID().slice(0, 8)}`;
    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO materials (id, code, name, unit, current_stock, minimum_stock, status, category, unit_cost, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(matId, d.code, d.name, d.unit, d.currentStock, d.minimumStock, status, d.category, d.unitCost, today);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'CatalogueInventoryService',
      action: 'ADD_MATERIAL',
      resourceType: 'material',
      resourceId: matId,
      details: `${d.code} — ${d.name} (${d.currentStock} ${d.unit})`,
    });

    const created = db.prepare('SELECT * FROM materials WHERE id = ?').get(matId);
    res.status(201).json({ material: formatMaterial(created) });
  }
);

// POST /api/gateway/catalogue/inventory/:id/adjust
catalogueInventoryRouter.post(
  '/inventory/:id/adjust',
  authenticate,
  requireRole('admin', 'artisan_weaver'),
  (req: AuthenticatedRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Material not found.' });
      return;
    }

    const schema = z.object({
      actionType: z.enum(['in', 'out', 'adjust']),
      amount: z.number().min(0),
      notes: z.string().trim().optional().default(''),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid stock adjustment.' });
      return;
    }

    const { actionType, amount, notes } = parsed.data;
    const prevStock = Number(existing.current_stock);
    let nextStock = prevStock;
    let delta = 0;

    if (actionType === 'in') {
      nextStock = prevStock + amount;
      delta = amount;
    } else if (actionType === 'out') {
      nextStock = Math.max(0, prevStock - amount);
      delta = -Math.min(prevStock, amount);
    } else {
      nextStock = amount;
      delta = amount - prevStock;
    }

    let nextStatus = 'Available';
    if (nextStock === 0) nextStatus = 'Out of Stock';
    else if (nextStock < existing.minimum_stock) nextStatus = 'Low Stock';

    const today = new Date().toISOString().split('T')[0];

    const tx = db.transaction(() => {
      db.prepare('UPDATE materials SET current_stock = ?, status = ?, last_updated = ? WHERE id = ?').run(
        nextStock,
        nextStatus,
        today,
        existing.id
      );

      db.prepare(`
        INSERT INTO material_logs (id, material_id, action_type, delta, previous_stock, new_stock, notes, performed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `mlog-${crypto.randomUUID().slice(0, 8)}`,
        existing.id,
        actionType,
        delta,
        prevStock,
        nextStock,
        notes,
        req.user!.name
      );
    });

    tx();

    if (nextStatus === 'Low Stock' || nextStatus === 'Out of Stock') {
      createNotification({
        targetRole: 'admin',
        title: `${nextStatus}: ${existing.name}`,
        message: `Inventory level is now ${nextStock} ${existing.unit} (Minimum threshold: ${existing.minimum_stock}).`,
        type: 'inventory',
      });
    }

    logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      serviceName: 'CatalogueInventoryService',
      action: `INVENTORY_${actionType.toUpperCase()}`,
      resourceType: 'material',
      resourceId: existing.id,
      details: `${prevStock} -> ${nextStock} ${existing.unit}`,
    });

    const updated = db.prepare('SELECT * FROM materials WHERE id = ?').get(existing.id);
    res.json({ material: formatMaterial(updated) });
  }
);
