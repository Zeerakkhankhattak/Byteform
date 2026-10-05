import crypto from 'crypto';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('ADMIN_PASSWORD or ADMIN_JWT_SECRET is not set in environment variables.');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

export function verifyPassword(providedPassword) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is not configured.');
  }

  if (typeof providedPassword !== 'string') return false;

  const bufProvided = Buffer.from(providedPassword);
  const bufExpected = Buffer.from(adminPassword);

  if (bufProvided.length !== bufExpected.length) {
    // Constant-time dummy comparison to mitigate timing attacks
    crypto.timingSafeEqual(bufProvided, bufProvided);
    return false;
  }

  return crypto.timingSafeEqual(bufProvided, bufExpected);
}

export function createSessionToken() {
  const secret = getSecret();
  const timestamp = Date.now().toString();
  const payload = 'byteform_admin';
  const dataToSign = `${payload}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
  return `${dataToSign}:${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [payload, timestampStr, signature] = parts;
  if (payload !== 'byteform_admin') return false;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp) || Date.now() - timestamp > SESSION_TTL_MS) {
    return false; // Expired
  }

  try {
    const secret = getSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(`${payload}:${timestampStr}`).digest('hex');
    const bufSig = Buffer.from(signature, 'hex');
    const bufExpected = Buffer.from(expectedSig, 'hex');

    if (bufSig.length !== bufExpected.length) return false;
    return crypto.timingSafeEqual(bufSig, bufExpected);
  } catch (err) {
    return false;
  }
}

export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx !== -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      try {
        cookies[key] = decodeURIComponent(val);
      } catch (e) {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

export function verifyAdminRequest(req) {
  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (verifySessionToken(token)) return true;
  }

  // 2. Check HttpOnly cookie
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.admin_session && verifySessionToken(cookies.admin_session)) {
    return true;
  }

  return false;
}
