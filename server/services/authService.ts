import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.ts';
import {
  ALLOWED_ROLES,
  authenticate,
  issueSessionToken,
  passwordPolicySchema,
  setAuthCookie,
  type AuthenticatedRequest,
  type ValidRole,
} from '../middleware/auth.ts';
import { createNotification, logAudit } from '../utils/audit.ts';

export const authRouter = Router();

const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: z.string().trim().email('Please provide a valid email address.').toLowerCase(),
  password: passwordPolicySchema,
  phone: z.string().trim().optional().default(''),
  address: z.string().trim().optional().default('Davao City, Philippines'),
  community: z.string().trim().optional().default('Davao City'),
  role: z.enum(['customer', 'fashion_designer', 'artisan_weaver']).optional().default('customer'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address.').toLowerCase(),
  password: z.string().min(1, 'Password is required.'),
});

function formatUserRow(row: any) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    roleTitle: row.role_title,
    community: row.community,
    address: row.address,
    status: row.status,
    verified: row.verified === 1,
    authProvider: row.auth_provider,
    avatarUrl: row.avatar_url || '',
    lastLogin: row.last_login || '',
  };
}

const ROLE_TITLES: Record<ValidRole, string> = {
  customer: 'Cultural Advocate & Customer',
  admin: 'Systems & Association Administrator',
  creative_director: 'Creative Director & Project Lead',
  ncip_secretary: 'NCIP Legal Officer & Evaluation Secretary',
  fashion_designer: 'Collaborating Fashion Designer',
  artisan_weaver: 'BIBATAWA Artisan Weaver',
};

// POST /api/gateway/auth/register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid registration data.' });
      return;
    }

    const { firstName, lastName, email, password, phone, address, community, role } = parsed.data;
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const fullName = `${firstName} ${lastName}`.trim();
    const isArtisan = role === 'artisan_weaver';
    const status = isArtisan ? 'Pending' : 'Active';
    const verified = isArtisan ? 0 : 1;
    const nowLabel = new Date().toISOString().replace('T', ' ').slice(0, 16);

    db.prepare(`
      INSERT INTO users (id, first_name, last_name, name, email, password_hash, auth_provider, phone, role, role_title, community, address, status, verified, last_login)
      VALUES (?, ?, ?, ?, ?, ?, 'local', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      firstName,
      lastName,
      fullName,
      email,
      passwordHash,
      phone,
      role,
      ROLE_TITLES[role],
      community || (isArtisan ? 'Binugao, Toril, Davao City' : 'Davao City'),
      address,
      status,
      verified,
      nowLabel
    );

    if (isArtisan) {
      createNotification({
        targetRole: 'admin',
        title: 'New Artisan Registration Pending Verification',
        message: `${fullName} registered as an Artisan Weaver and requires BIBATAWA verification.`,
        type: 'proposal',
      });
    }

    logAudit({
      userId,
      userName: fullName,
      userRole: role,
      serviceName: 'AuthService',
      action: 'USER_REGISTER',
      resourceType: 'user',
      resourceId: userId,
      details: `Email/password registration (${role})`,
      ipAddress: req.ip,
    });

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const { token } = issueSessionToken({ id: userId, email, role, name: fullName }, req);
    setAuthCookie(res, token);

    res.status(201).json({
      token,
      user: formatUserRow(userRow),
      message: isArtisan
        ? 'Registration submitted. Your artisan account is active with pending BIBATAWA elder verification.'
        : 'Account created successfully.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/gateway/auth/login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid login credentials.' });
      return;
    }

    const { email, password } = parsed.data;
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!userRow || !userRow.password_hash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (userRow.status === 'Suspended') {
      res.status(403).json({ error: 'This account has been suspended. Please contact the BIBATAWA Administrator.' });
      return;
    }

    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const nowLabel = new Date().toISOString().replace('T', ' ').slice(0, 16);
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(nowLabel, userRow.id);

    const { token } = issueSessionToken(
      { id: userRow.id, email: userRow.email, role: userRow.role as ValidRole, name: userRow.name },
      req
    );
    setAuthCookie(res, token);

    logAudit({
      userId: userRow.id,
      userName: userRow.name,
      userRole: userRow.role,
      serviceName: 'AuthService',
      action: 'USER_LOGIN',
      resourceType: 'session',
      resourceId: userRow.id,
      details: 'Password login verified via JWT',
      ipAddress: req.ip,
    });

    const refreshed = db.prepare('SELECT * FROM users WHERE id = ?').get(userRow.id);
    res.json({ token, user: formatUserRow(refreshed) });
  } catch (err) {
    next(err);
  }
});

// GET /api/gateway/auth/google/url
authRouter.get('/google/url', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

  if (!clientId) {
    res.status(503).json({
      configured: false,
      error:
        'Google OAuth is not yet configured in environment secrets (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET). Please add your Google OAuth 2.0 credentials or sign in with email and password.',
      redirectUriHint: `${appUrl}/api/gateway/auth/google/callback`,
    });
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${appUrl}/api/gateway/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  res.json({
    configured: true,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  });
});

// GET /api/gateway/auth/google/callback
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  const code = String(req.query.code || '');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const redirectUri = `${appUrl}/api/gateway/auth/google/callback`;

  if (!code || !clientId || !clientSecret) {
    res.status(400).send(`
      <html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'HANDILINK_GOOGLE_AUTH_ERROR', error: 'Missing OAuth code or client credentials.' }, '*');
          window.close();
        }
      </script><p>Google OAuth configuration error.</p></body></html>
    `);
    return;
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error('Failed to exchange Google OAuth authorization code.');
    }

    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });

    if (!profileRes.ok) {
      throw new Error('Failed to retrieve Google profile information.');
    }

    const profile = (await profileRes.json()) as {
      sub: string;
      email: string;
      given_name?: string;
      family_name?: string;
      name?: string;
      picture?: string;
    };

    const email = profile.email.toLowerCase();
    let userRow = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(profile.sub, email) as any;
    const nowLabel = new Date().toISOString().replace('T', ' ').slice(0, 16);

    if (!userRow) {
      const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
      const firstName = profile.given_name || profile.name?.split(' ')[0] || 'Google';
      const lastName = profile.family_name || profile.name?.split(' ').slice(1).join(' ') || 'User';
      const fullName = profile.name || `${firstName} ${lastName}`.trim();

      db.prepare(`
        INSERT INTO users (id, first_name, last_name, name, email, google_id, auth_provider, role, role_title, community, status, verified, avatar_url, last_login)
        VALUES (?, ?, ?, ?, ?, ?, 'google', 'customer', ?, 'Davao City', 'Active', 1, ?, ?)
      `).run(userId, firstName, lastName, fullName, email, profile.sub, ROLE_TITLES.customer, profile.picture || '', nowLabel);

      userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    } else {
      db.prepare('UPDATE users SET google_id = ?, avatar_url = COALESCE(NULLIF(?, ""), avatar_url), last_login = ? WHERE id = ?').run(
        profile.sub,
        profile.picture || '',
        nowLabel,
        userRow.id
      );
      userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userRow.id);
    }

    const { token } = issueSessionToken(
      { id: userRow.id, email: userRow.email, role: userRow.role as ValidRole, name: userRow.name },
      req
    );
    setAuthCookie(res, token);

    logAudit({
      userId: userRow.id,
      userName: userRow.name,
      userRole: userRow.role,
      serviceName: 'AuthService',
      action: 'GOOGLE_OAUTH_LOGIN',
      resourceType: 'session',
      resourceId: userRow.id,
      details: 'Authenticated via Google OAuth 2.0',
      ipAddress: req.ip,
    });

    const formatted = formatUserRow(userRow);
    res.send(`
      <!doctype html>
      <html>
        <body>
          <p style="font-family: sans-serif; color: #3B2418;">Authentication successful. Returning to HandiLink...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'HANDILINK_GOOGLE_AUTH_SUCCESS',
                token: ${JSON.stringify(token)},
                user: ${JSON.stringify(formatted)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send(`
      <html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'HANDILINK_GOOGLE_AUTH_ERROR', error: ${JSON.stringify(err?.message || 'Google authentication failed')} }, '*');
          window.close();
        }
      </script><p>Authentication failed.</p></body></html>
    `);
  }
});

// GET /api/gateway/auth/me
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id);
  if (!row) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }
  res.json({ user: formatUserRow(row) });
});

// PUT /api/gateway/auth/profile
authRouter.put('/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    name: z.string().trim().min(2).optional(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    community: z.string().trim().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid profile input.' });
    return;
  }

  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
  const nextName = parsed.data.name || current.name;
  const parts = nextName.split(' ');
  const firstName = parts[0] || current.first_name;
  const lastName = parts.slice(1).join(' ') || current.last_name;

  db.prepare(`
    UPDATE users SET name = ?, first_name = ?, last_name = ?, phone = ?, address = ?, community = ? WHERE id = ?
  `).run(
    nextName,
    firstName,
    lastName,
    parsed.data.phone ?? current.phone,
    parsed.data.address ?? current.address,
    parsed.data.community ?? current.community,
    req.user!.id
  );

  logAudit({
    userId: req.user!.id,
    userName: nextName,
    userRole: req.user!.role,
    serviceName: 'AuthService',
    action: 'UPDATE_PROFILE',
    resourceType: 'user',
    resourceId: req.user!.id,
    details: 'Updated personal profile details',
  });

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id);
  res.json({ user: formatUserRow(updated) });
});

// POST /api/gateway/auth/change-password
authRouter.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: passwordPolicySchema,
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid password input.' });
      return;
    }

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
    if (userRow.password_hash) {
      const ok = await bcrypt.compare(parsed.data.currentPassword, userRow.password_hash);
      if (!ok) {
        res.status(400).json({ error: 'Current password is incorrect.' });
        return;
      }
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user!.id);
    res.json({ message: 'Password updated securely.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/gateway/auth/logout
authRouter.post('/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.prepare('UPDATE sessions SET revoked = 1 WHERE token_jti = ?').run(req.user!.jti);
  res.clearCookie('handilink_token', { path: '/' });
  res.json({ message: 'Signed out cleanly.' });
});

export { ALLOWED_ROLES, ROLE_TITLES, formatUserRow };
