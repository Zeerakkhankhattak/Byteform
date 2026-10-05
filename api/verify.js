import { getSupabaseAdmin, isSupabaseConfigured } from './_lib/supabase.js';
import { createRateLimiter, getClientIp } from './_lib/rate-limit.js';

// Rate limiter: 40 requests per minute per IP to prevent scraping
const rateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 40 });

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
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Rate Limiting Check
  const clientIp = getClientIp(req);
  const limitCheck = rateLimiter(clientIp);
  if (!limitCheck.allowed) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please wait a moment before trying again.'
    });
  }

  // Extract certificate ID from query parameters or URL
  let certId = req.query?.id;
  if (!certId && req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      certId = parsedUrl.searchParams.get('id');
    } catch (e) {
      certId = null;
    }
  }

  if (!certId || typeof certId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing required certificate ID parameter (e.g. ?id=BF-INT-2026-X7K92P)'
    });
  }

  // Sanitize Certificate ID: trim, uppercase, remove any dangerous characters
  const cleanId = certId.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 50);

  if (!cleanId) {
    return res.status(400).json({ success: false, error: 'Invalid certificate ID format' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Supabase credentials are not yet configured in environment variables.'
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Query ONLY public allowed fields - NEVER private credentials or extra data
    const { data, error } = await supabase
      .from('certificates')
      .select('certificate_id, name, internship_field, start_date, end_date, status, created_at')
      .eq('certificate_id', cleanId)
      .maybeSingle();

    if (error) {
      console.error('Supabase query error in verify handler:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to query certificate database'
      });
    }

    if (!data) {
      return res.status(404).json({
        success: true,
        found: false,
        message: 'No certificate found matching the provided identifier.'
      });
    }

    // Return sanitized public certificate record
    return res.status(200).json({
      success: true,
      found: true,
      certificate: {
        certificate_id: data.certificate_id,
        name: data.name,
        internship_field: data.internship_field,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status, // 'valid' or 'revoked'
        created_at: data.created_at
      }
    });
  } catch (err) {
    console.error('Unexpected error in verify handler:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while verifying certificate'
    });
  }
}
