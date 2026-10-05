import { verifyPassword, createSessionToken, verifyAdminRequest } from '../_lib/auth.js';
import { createRateLimiter, getClientIp } from '../_lib/rate-limit.js';

// Rate limiter for admin login attempts: max 10 attempts per 15 minutes per IP
const loginRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

const ALLOWED_ORIGINS = new Set([
  'https://www.byteform.org',
  'https://byteform.org',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // GET: Check authentication status
  if (req.method === 'GET') {
    const isAuthenticated = verifyAdminRequest(req);
    return res.status(200).json({
      success: true,
      authenticated: isAuthenticated
    });
  }

  // DELETE: Logout / Clear session cookie
  if (req.method === 'DELETE' || (req.method === 'POST' && req.query?.action === 'logout')) {
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
      'Set-Cookie',
      `admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${isProd ? 'Secure;' : ''}`
    );
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  // POST: Admin Login
  if (req.method === 'POST') {
    const clientIp = getClientIp(req);
    const limitCheck = loginRateLimiter(clientIp);
    if (!limitCheck.allowed) {
      res.setHeader('Retry-After', '900');
      return res.status(429).json({
        success: false,
        error: 'Too many failed login attempts. Please try again in 15 minutes.'
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
      }
    }

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid request body' });
    }

    const { password } = body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    try {
      const isValid = verifyPassword(password);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid admin passphrase' });
      }

      const token = createSessionToken();
      const isProd = process.env.NODE_ENV === 'production' || !req.headers.host?.includes('localhost');
      
      // Cookie expires in 7 days (604800 seconds)
      const cookieHeader = `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; ${isProd ? 'Secure;' : ''}`;
      res.setHeader('Set-Cookie', cookieHeader);

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        token // Provided for clients using Bearer tokens
      });
    } catch (err) {
      console.error('Error during admin authentication:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Server error during authentication'
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
