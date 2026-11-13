import crypto from 'crypto';
import { db } from '../db.ts';

export function logAudit(params: {
  userId?: string;
  userName: string;
  userRole: string;
  serviceName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
}): void {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, user_role, service_name, action, resource_type, resource_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud-${crypto.randomUUID().slice(0, 8)}`,
    params.userId || '',
    params.userName,
    params.userRole,
    params.serviceName,
    params.action,
    params.resourceType,
    params.resourceId || '',
    params.details || '',
    params.ipAddress || ''
  );
}

export function createNotification(params: {
  targetRole?: string;
  title: string;
  message: string;
  type: 'proposal' | 'order' | 'production' | 'inventory' | 'payment' | 'logistics' | 'vision' | 'speech';
}): void {
  db.prepare(`
    INSERT INTO notifications (id, target_role, title, message, type, is_read)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(
    `notif-${crypto.randomUUID().slice(0, 8)}`,
    params.targetRole || 'all',
    params.title,
    params.message,
    params.type
  );
}
