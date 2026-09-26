// Rate limiting map for Vercel Serverless Function instances
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    record.count++;
  }
  rateLimitMap.set(ip, record);
  return record.count <= RATE_LIMIT_MAX;
}

const ALLOWED_ORIGINS = new Set([
  'https://www.byteform.org',
  'https://byteform.org',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

function sanitizeForLog(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\r\n\x00-\x1F\x7F]/g, ' ').slice(0, 200);
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.has(origin);

  // Set restrictive CORS headers
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Rate Limiting
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();

  if (!checkRateLimit(clientIp)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
  }

  try {
    let rawData = req.body;
    if (typeof rawData === 'string') {
      try {
        rawData = JSON.parse(rawData);
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
      }
    }

    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
      return res.status(400).json({ success: false, error: 'Invalid request body' });
    }

    // Bot honeypot verification
    if (rawData.botcheck) {
      return res.status(200).json({
        success: true,
        message: 'Brief successfully registered for byteform3@gmail.com'
      });
    }

    // Validation & Length constraints
    const name = typeof rawData.name === 'string' ? rawData.name.trim().slice(0, 100) : '';
    const email = typeof rawData.email === 'string' ? rawData.email.trim().slice(0, 254) : '';
    const track = typeof (rawData.interest || rawData.track) === 'string'
      ? (rawData.interest || rawData.track).trim().slice(0, 100)
      : '';
    const budget = typeof rawData.budget === 'string' ? rawData.budget.trim().slice(0, 100) : '';
    const message = typeof rawData.message === 'string' ? rawData.message.trim().slice(0, 5000) : '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Valid email address is required' });
    }

    const receivedAt = new Date().toISOString();

    console.log('\n📩 [NEW PROJECT BRIEF RECEIVED]');
    console.log('To: byteform3@gmail.com');
    console.log('From:', sanitizeForLog(name), `<${sanitizeForLog(email)}>`);
    console.log('Track:', sanitizeForLog(track));
    console.log('Budget:', sanitizeForLog(budget));
    console.log('Brief:', sanitizeForLog(message));
    console.log('-------------------------------\n');

    return res.status(200).json({
      success: true,
      message: 'Brief successfully registered for byteform3@gmail.com',
      destination: 'byteform3@gmail.com',
      timestamp: receivedAt
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Failed to process brief submission' });
  }
}
