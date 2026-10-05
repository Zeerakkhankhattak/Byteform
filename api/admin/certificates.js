import { getSupabaseAdmin, isSupabaseConfigured } from '../_lib/supabase.js';
import { verifyAdminRequest } from '../_lib/auth.js';
import { generateUniqueCertificateId } from '../_lib/cert-id.js';
import { generateQrPngDataUrl, generateQrSvg } from '../_lib/qr.js';

const ALLOWED_ORIGINS = new Set([
  'https://www.byteform.org',
  'https://byteform.org',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

function getSiteUrl(req) {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/+$/, '');
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (host?.includes('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : 'https://www.byteform.org';
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return null;
    }
  }
  return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Admin Authentication Guard
  if (!verifyAdminRequest(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin authentication required.'
    });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Supabase credentials are not configured in environment variables.'
    });
  }

  const supabase = getSupabaseAdmin();
  const siteUrl = getSiteUrl(req);

  // 1. GET: List all issued certificates
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('id, certificate_id, name, internship_field, start_date, end_date, status, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch certificates error:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve certificates' });
      }

      // Append verification URL to each record
      const enrichedCertificates = (data || []).map(cert => ({
        ...cert,
        verification_url: `${siteUrl}/verify/${cert.certificate_id}`
      }));

      return res.status(200).json({
        success: true,
        certificates: enrichedCertificates
      });
    } catch (err) {
      console.error('Error fetching certificates:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // 2. POST: Create a new certificate
  if (req.method === 'POST') {
    const body = parseBody(req);
    if (!body) {
      return res.status(400).json({ success: false, error: 'Invalid JSON request body' });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const internship_field = typeof body.internship_field === 'string' ? body.internship_field.trim() : '';
    const start_date = typeof body.start_date === 'string' ? body.start_date.trim() : '';
    const end_date = typeof body.end_date === 'string' ? body.end_date.trim() : '';
    const status = body.status === 'revoked' ? 'revoked' : 'valid';

    // Strict validation
    if (!name || name.length < 2 || name.length > 100) {
      return res.status(400).json({ success: false, error: "Recipient's name must be between 2 and 100 characters." });
    }

    if (!internship_field || internship_field.length < 2 || internship_field.length > 100) {
      return res.status(400).json({ success: false, error: 'Internship field is required (2-100 characters).' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!start_date || !dateRegex.test(start_date) || isNaN(Date.parse(start_date))) {
      return res.status(400).json({ success: false, error: 'Valid start date (YYYY-MM-DD) is required.' });
    }

    if (!end_date || !dateRegex.test(end_date) || isNaN(Date.parse(end_date))) {
      return res.status(400).json({ success: false, error: 'Valid end date (YYYY-MM-DD) is required.' });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ success: false, error: 'End date cannot be earlier than start date.' });
    }

    try {
      // Automatically generate unique certificate ID
      const certificate_id = await generateUniqueCertificateId(supabase, start_date);
      const verification_url = `${siteUrl}/verify/${certificate_id}`;

      // Insert record into Supabase
      const { data, error } = await supabase
        .from('certificates')
        .insert([{
          certificate_id,
          name,
          internship_field,
          start_date,
          end_date,
          status
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert certificate error:', error);
        let msg = error.message;
        if (msg.includes('Could not find the table') || error.code === '42P01') {
          msg = "Database table 'certificates' does not exist yet in Supabase! Please open your Supabase SQL Editor and run the script in supabase/schema.sql.";
        }
        return res.status(400).json({ success: false, error: msg });
      }

      // Generate QR codes for admin and graphic designer download
      const qr_data_url = await generateQrPngDataUrl(verification_url, 600);
      const qr_svg = await generateQrSvg(verification_url);

      return res.status(201).json({
        success: true,
        message: 'Certificate successfully created',
        certificate: {
          ...data,
          verification_url,
          qr_data_url,
          qr_svg
        }
      });
    } catch (err) {
      console.error('Error creating certificate:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error while creating certificate' });
    }
  }

  // 3. PATCH: Revoke a certificate
  if (req.method === 'PATCH') {
    const body = parseBody(req);
    if (!body) {
      return res.status(400).json({ success: false, error: 'Invalid JSON request body' });
    }

    const certId = typeof body.certificate_id === 'string' ? body.certificate_id.trim().toUpperCase() : null;
    const dbId = typeof body.id === 'string' ? body.id.trim() : null;

    if (!certId && !dbId) {
      return res.status(400).json({ success: false, error: 'Missing certificate_id or id to revoke.' });
    }

    try {
      let query = supabase.from('certificates').update({ status: 'revoked' });
      if (certId) {
        query = query.eq('certificate_id', certId);
      } else {
        query = query.eq('id', dbId);
      }

      const { data, error } = await query.select().single();

      if (error) {
        console.error('Supabase revoke error:', error);
        return res.status(500).json({ success: false, error: 'Failed to revoke certificate: ' + error.message });
      }

      return res.status(200).json({
        success: true,
        message: `Certificate ${data.certificate_id} has been revoked.`,
        certificate: data
      });
    } catch (err) {
      console.error('Error revoking certificate:', err);
      return res.status(500).json({ success: false, error: 'Internal server error while revoking certificate' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
