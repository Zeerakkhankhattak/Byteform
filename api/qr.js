import { generateQrSvg } from './_lib/qr.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const urlObj = new URL(req.url, 'http://localhost');
  const text = urlObj.searchParams.get('text') || req.query?.text;
  const download = urlObj.searchParams.get('download') === 'true' || req.query?.download === 'true';
  const filename = urlObj.searchParams.get('filename') || 'certificate-qr';

  if (!text) {
    return res.status(400).json({ success: false, error: 'Missing text parameter' });
  }

  try {
    const svg = await generateQrSvg(text);
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    if (download) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.svg"`);
    }
    return res.status(200).send(svg);
  } catch (err) {
    console.error('QR generation error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate QR code' });
  }
}
