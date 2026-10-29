import { Router } from 'express';
import crypto from 'node:crypto';
import validator from 'validator';
import { query, isDatabaseConfigured } from '../config/db.js';
import { recordLookup } from '../config/supabase.js';

const router = Router();

// Helper to hash password using SHA-256 with salt
function hashPassword(password, salt = 'iltk_salt_2026') {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

// Generate secure API key
function generateApiKey(prefix = 'iltk_live') {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}

// Administrator Passkey Configuration
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'ADMIN2026';

// In-memory session cache for authenticated users (populated on authentic user registration or DB load)
const users = new Map();

/**
 * Helper to fetch a user by email from PostgreSQL or fallback cache
 */
export async function findUserByEmail(email) {
  const cleanEmail = email.toLowerCase().trim();

  if (isDatabaseConfigured) {
    try {
      const res = await query('SELECT * FROM public.users WHERE LOWER(email) = $1 LIMIT 1;', [cleanEmail]);
      if (res.rows?.[0]) {
        const row = res.rows[0];
        const userObj = {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          organization: row.organization,
          passwordHash: row.password_hash,
          apiKey: row.api_key,
          createdAt: row.created_at,
          lookupsCount: row.lookups_count || 0
        };
        users.set(cleanEmail, userObj); // sync memory cache
        return userObj;
      }
    } catch (e) {
      // Fall through to memory store
    }
  }

  return users.get(cleanEmail) || null;
}

/**
 * Express middleware to strictly enforce Administrator role for sensitive endpoints
 * (Dashboard metrics, investigation history, audit logs).
 */
export async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required to access administrative data.'
      });
    }

    const rawToken = authHeader.split(' ')[1];
    let user = null;

    // Check if token is an API key (e.g. iltk_live_admin_...)
    if (rawToken.startsWith('iltk_')) {
      if (isDatabaseConfigured) {
        try {
          const dbRes = await query('SELECT * FROM public.users WHERE api_key = $1 LIMIT 1;', [rawToken]);
          if (dbRes.rows?.[0]) {
            const row = dbRes.rows[0];
            user = {
              id: row.id,
              name: row.name,
              email: row.email,
              role: row.role,
              organization: row.organization,
              apiKey: row.api_key
            };
          }
        } catch (e) {}
      }
      if (!user) {
        for (const u of users.values()) {
          if (u.apiKey === rawToken) {
            user = u;
            break;
          }
        }
      }
    } else {
      // Decode Base64 JSON session token
      let payload;
      try {
        payload = JSON.parse(Buffer.from(rawToken, 'base64').toString('utf8'));
      } catch {
        return res.status(401).json({
          success: false,
          error: 'Invalid authorization token format.'
        });
      }

      if (!payload?.email || (payload.exp && payload.exp < Date.now())) {
        return res.status(401).json({
          success: false,
          error: 'Session expired or invalid. Please sign in again.'
        });
      }

      user = await findUserByEmail(payload.email);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not recognized or deleted.'
      });
    }

    const normalizedRole = (user.role || '').toLowerCase().trim();
    if (normalizedRole !== 'administrator' && normalizedRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Dashboard and investigation logs are restricted to Administrator accounts only.'
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Authorization check failed.'
    });
  }
}

/**
 * POST /api/auth/register
 * Register a new user account (supports Administrator role with admin authorization passkey)
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, organization, adminSecretKey } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid full name (at least 2 characters).'
      });
    }

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.'
      });
    }

    // Role handling: Verify Admin security code if creating an Administrator
    let assignedRole = role?.trim() || 'Security Researcher';
    const isRequestingAdmin = assignedRole.toLowerCase() === 'administrator' || assignedRole.toLowerCase() === 'admin';

    if (isRequestingAdmin) {
      if (!adminSecretKey || adminSecretKey.trim() !== ADMIN_SECRET_KEY) {
        return res.status(403).json({
          success: false,
          error: `Invalid Admin Authorization Key. To register with Administrator privileges, provide the correct Admin Security Passcode (default: ${ADMIN_SECRET_KEY}).`
        });
      }
      assignedRole = 'Administrator';
    }

    const apiKeyPrefix = assignedRole === 'Administrator' ? 'iltk_live_admin' : 'iltk_live';
    const newUser = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: name.trim(),
      email: cleanEmail,
      role: assignedRole,
      organization: organization?.trim() || (assignedRole === 'Administrator' ? 'Cyber Defense Operations' : 'Independent'),
      passwordHash: hashPassword(password),
      apiKey: generateApiKey(apiKeyPrefix),
      createdAt: new Date().toISOString(),
      lookupsCount: 0
    };

    // Store in PostgreSQL if configured
    if (isDatabaseConfigured) {
      try {
        await query(
          `INSERT INTO public.users (id, name, email, role, organization, password_hash, api_key, created_at, lookups_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
          [
            newUser.id,
            newUser.name,
            newUser.email,
            newUser.role,
            newUser.organization,
            newUser.passwordHash,
            newUser.apiKey,
            newUser.createdAt,
            newUser.lookupsCount
          ]
        );
      } catch (e) {
        console.warn('Could not persist user to PostgreSQL, cached in memory:', e.message);
      }
    }

    // Store in local session cache
    users.set(cleanEmail, newUser);

    // Record registration audit log
    await recordLookup({
      lookup_type: 'register',
      query_value: `${newUser.name} (${cleanEmail})`,
      status: 'success',
      result_summary: {
        action: 'Account Registered',
        userName: newUser.name,
        userEmail: cleanEmail,
        role: newUser.role,
        organization: newUser.organization,
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      }
    }).catch(err => console.warn('Auth register log record failed:', err.message));

    // Create session token
    const token = Buffer.from(JSON.stringify({ id: newUser.id, email: cleanEmail, exp: Date.now() + 86400000 })).toString('base64');

    return res.status(201).json({
      success: true,
      message: `Account registered successfully as ${assignedRole}.`,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organization: newUser.organization,
        apiKey: newUser.apiKey,
        createdAt: newUser.createdAt,
        lookupsCount: newUser.lookupsCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Registration failed.' });
  }
});

/**
 * POST /api/auth/login
 * User login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      // Record failed login audit log
      await recordLookup({
        lookup_type: 'login',
        query_value: cleanEmail,
        status: 'failed',
        result_summary: {
          action: 'Failed Login Attempt',
          userEmail: cleanEmail,
          reason: 'User account not found',
          ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        }
      }).catch(err => console.warn('Auth log record failed:', err.message));

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const inputHash = hashPassword(password);
    if (inputHash !== user.passwordHash) {
      // Record failed login audit log
      await recordLookup({
        lookup_type: 'login',
        query_value: `${user.name} (${cleanEmail})`,
        status: 'failed',
        result_summary: {
          action: 'Failed Login Attempt',
          userEmail: cleanEmail,
          reason: 'Incorrect password',
          ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        }
      }).catch(err => console.warn('Auth log record failed:', err.message));

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Record successful login audit log
    await recordLookup({
      lookup_type: 'login',
      query_value: `${user.name} (${cleanEmail})`,
      status: 'success',
      result_summary: {
        action: 'User Signed In',
        userName: user.name,
        userEmail: cleanEmail,
        role: user.role,
        organization: user.organization,
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      }
    }).catch(err => console.warn('Auth log record failed:', err.message));

    // Create session token
    const token = Buffer.from(JSON.stringify({ id: user.id, email: cleanEmail, exp: Date.now() + 86400000 })).toString('base64');

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        apiKey: user.apiKey,
        createdAt: user.createdAt,
        lookupsCount: user.lookupsCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Login failed.' });
  }
});

/**
 * POST /api/auth/logout
 * User logout with authentication audit logging
 */
router.post('/logout', async (req, res) => {
  try {
    const { email, name } = req.body || {};
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const userName = name || 'Analyst';

    await recordLookup({
      lookup_type: 'logout',
      query_value: cleanEmail ? `${userName} (${cleanEmail})` : 'User Signed Out',
      status: 'success',
      result_summary: {
        action: 'User Signed Out',
        userName: userName,
        userEmail: cleanEmail || 'N/A',
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      }
    }).catch(err => console.warn('Auth logout log record failed:', err.message));

    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Logout failed.' });
  }
});

/**
 * GET /api/auth/me
 * Validate session token and return user profile
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No token provided.' });
    }

    const rawToken = authHeader.split(' ')[1];
    let payload;
    try {
      payload = JSON.parse(Buffer.from(rawToken, 'base64').toString('utf8'));
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token format.' });
    }

    if (!payload.email || payload.exp < Date.now()) {
      return res.status(401).json({ success: false, error: 'Token expired or invalid.' });
    }

    const user = await findUserByEmail(payload.email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        apiKey: user.apiKey,
        createdAt: user.createdAt,
        lookupsCount: user.lookupsCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Session verification failed.' });
  }
});

/**
 * GET /api/auth/users
 * Admin only: Retrieve all registered accounts
 */
router.get('/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
    }

    const rawToken = authHeader.split(' ')[1];
    let payload;
    try {
      payload = JSON.parse(Buffer.from(rawToken, 'base64').toString('utf8'));
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token format.' });
    }

    const user = await findUserByEmail(payload.email);
    if (!user || user.role !== 'Administrator') {
      return res.status(403).json({ success: false, error: 'Access denied: Administrator role required.' });
    }

    let userList = [];
    if (isDatabaseConfigured) {
      try {
        const dbRes = await query(`
          SELECT id, name, email, role, organization, api_key, created_at, lookups_count 
          FROM public.users 
          ORDER BY created_at DESC;
        `);
        userList = dbRes.rows || [];
        // Keep in-memory cache aligned with database rows
        userList.forEach(u => {
          if (!users.has(u.email)) {
            users.set(u.email, u);
          }
        });
      } catch (e) {
        console.warn('Could not query PostgreSQL users, falling back to memory:', e.message);
        userList = Array.from(users.values()).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          organization: u.organization,
          apiKey: u.apiKey,
          createdAt: u.createdAt,
          lookupsCount: u.lookupsCount || 0
        }));
      }
    } else {
      userList = Array.from(users.values()).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        organization: u.organization,
        apiKey: u.apiKey,
        createdAt: u.createdAt,
        lookupsCount: u.lookupsCount || 0
      }));
    }

    return res.json({
      success: true,
      count: userList.length,
      users: userList
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch users.' });
  }
});

/**
 * POST /api/auth/api-key
 * Regenerate analyst API key
 */
router.post('/api-key', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
    }

    const rawToken = authHeader.split(' ')[1];
    let payload;
    try {
      payload = JSON.parse(Buffer.from(rawToken, 'base64').toString('utf8'));
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token format.' });
    }

    const cleanEmail = payload.email?.toLowerCase();
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const prefix = user.role === 'Administrator' ? 'iltk_live_admin' : 'iltk_live';
    const newKey = generateApiKey(prefix);
    user.apiKey = newKey;
    users.set(cleanEmail, user);

    if (isDatabaseConfigured) {
      try {
        await query('UPDATE public.users SET api_key = $1 WHERE LOWER(email) = $2;', [newKey, cleanEmail]);
      } catch (e) {
        console.warn('Could not update API key in PostgreSQL, updated cache:', e.message);
      }
    }

    return res.json({
      success: true,
      message: 'New API key generated successfully.',
      apiKey: newKey
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to generate API key.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset an analyst or admin account password using the Admin Security Passkey
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, adminSecretKey } = req.body || {};

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid registered email address.'
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.'
      });
    }

    if (!adminSecretKey || adminSecretKey.trim() !== ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        error: `Invalid Admin Authorization Passkey. To reset account credentials, provide the correct Admin Security Passkey (default: ${ADMIN_SECRET_KEY}).`
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: `No account found with email "${cleanEmail}". If you haven't created an account yet, you can sign up as an Administrator on the Sign Up page.`
      });
    }

    const newHash = hashPassword(newPassword);
    user.passwordHash = newHash;
    users.set(cleanEmail, user);

    if (isDatabaseConfigured) {
      try {
        await query('UPDATE public.users SET password_hash = $1 WHERE LOWER(email) = $2;', [newHash, cleanEmail]);
      } catch (e) {
        console.warn('Could not update password in PostgreSQL, updated cache:', e.message);
      }
    }

    // Record audit log
    await recordLookup({
      lookup_type: 'password_reset',
      query_value: `${user.name} (${cleanEmail})`,
      status: 'success',
      result_summary: {
        action: 'Password Reset',
        userEmail: cleanEmail,
        role: user.role,
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      }
    }).catch(err => console.warn('Auth reset log record failed:', err.message));

    return res.json({
      success: true,
      message: `Password reset successfully for ${cleanEmail}. You can now log in with your new password.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Password reset failed.' });
  }
});

export default router;

