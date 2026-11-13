import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.ts';

const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

export function getJwtSecret(): string {
  return process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16
    ? process.env.JWT_SECRET
    : EPHEMERAL_FALLBACK_SECRET;
}

export const ALLOWED_ROLES = [
  'customer',
  'admin',
  'creative_director',
  'ncip_secretary',
  'fashion_designer',
  'artisan_weaver',
] as const;

export type ValidRole = (typeof ALLOWED_ROLES)[number];

export interface AuthPayload {
  sub: string;
  email: string;
  role: ValidRole;
  name: string;
  jti: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: ValidRole;
    name: string;
    roleTitle: string;
    community: string;
    status: string;
    verified: boolean;
    jti: string;
  };
}

export const passwordPolicySchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must include at least one number.');

export function issueSessionToken(user: {
  id: string;
  email: string;
  role: ValidRole;
  name: string;
}, req: Request): { token: string; jti: string; expiresAt: string } {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, token_jti, user_agent, ip_address, expires_at, revoked)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(
    `ses-${crypto.randomUUID().slice(0, 8)}`,
    user.id,
    jti,
    String(req.headers['user-agent'] || '').slice(0, 200),
    String(req.ip || req.socket.remoteAddress || ''),
    expiresAt
  );

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      jti,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  return { token, jti, expiresAt };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie('handilink_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.cookies && typeof req.cookies.handilink_token === 'string') {
    return req.cookies.handilink_token;
  }
  return null;
}

function resolveUserFromToken(token: string) {
  const decoded = jwt.verify(token, getJwtSecret()) as AuthPayload;
  const session = db
    .prepare('SELECT revoked, expires_at FROM sessions WHERE token_jti = ?')
    .get(decoded.jti) as { revoked: number; expires_at: string } | undefined;

  if (!session || session.revoked === 1 || new Date(session.expires_at) < new Date()) {
    return null;
  }

  const user = db
    .prepare('SELECT id, email, role, name, role_title, community, status, verified FROM users WHERE id = ?')
    .get(decoded.sub) as
    | {
        id: string;
        email: string;
        role: ValidRole;
        name: string;
        role_title: string;
        community: string;
        status: string;
        verified: number;
      }
    | undefined;

  if (!user || user.status === 'Suspended') {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    roleTitle: user.role_title,
    community: user.community,
    status: user.status,
    verified: user.verified === 1,
    jti: decoded.jti,
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  try {
    const resolved = resolveUserFromToken(token);
    if (!resolved) {
      res.status(401).json({ error: 'Session expired or revoked. Please sign in again.' });
      return;
    }
    req.user = resolved;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      const resolved = resolveUserFromToken(token);
      if (resolved) {
        req.user = resolved;
      }
    } catch {
      // Ignore invalid optional token
    }
  }
  next();
}

export function requireRole(...roles: ValidRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Current role: ${req.user.role}.`,
      });
      return;
    }
    next();
  };
}
