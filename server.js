const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

// Allowed origins for API requests
const ALLOWED_ORIGINS = new Set([
  'https://www.byteform.org',
  'https://byteform.org',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

// IP-based Rate Limiter for API endpoints (5 requests per minute)
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

// Periodic cleanup of rate limiter entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000).unref();

// Security Headers applied to every response
function setSecurityHeaders(res) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.web3forms.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com;"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.removeHeader('X-Powered-By');
}

// Sanitize string for logs (prevent CRLF injection)
function sanitizeForLog(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\r\n\x00-\x1F\x7F]/g, ' ').slice(0, 200);
}

// Check if a path targets sensitive or blocked files
function isBlockedPath(filePath) {
  const relative = path.relative(ROOT_DIR, filePath);
  // Deny hidden files or folders starting with '.'
  const parts = relative.split(path.sep);
  for (const part of parts) {
    if (part.startsWith('.') && part !== '.' && part !== '..') {
      return true;
    }
  }

  const base = path.basename(filePath).toLowerCase();
  const blockedFiles = new Set([
    'inquiries.json',
    'package.json',
    'package-lock.json',
    'server.js',
    'vercel.json',
    '.vercelignore'
  ]);
  if (blockedFiles.has(base)) return true;

  const ext = path.extname(filePath).toLowerCase();
  const blockedExtensions = new Set(['.psd', '.log', '.bak', '.sh', '.env']);
  if (blockedExtensions.has(ext)) return true;

  return false;
}

const server = http.createServer((req, res) => {
  setSecurityHeaders(res);

  // Prevent null-byte injection
  if (req.url.includes('%00') || req.url.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  let reqPath;
  try {
    reqPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  const origin = req.headers.origin;
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.has(origin);

  // Handle CORS preflight for API routes
  if (req.method === 'OPTIONS' && reqPath.startsWith('/api/')) {
    const corsHeaders = {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };
    if (isAllowedOrigin) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
      corsHeaders['Vary'] = 'Origin';
    }
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Handle direct contact form API
  if (reqPath === '/api/contact') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
      return;
    }

    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }

    // IP address extraction
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
      .split(',')[0]
      .trim();

    if (!checkRateLimit(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '60' });
      res.end(JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }));
      return;
    }

    let body = '';
    const MAX_BODY_BYTES = 50 * 1024; // 50 KB limit to prevent DoS
    let bodyOverflow = false;

    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        bodyOverflow = true;
        req.destroy();
      }
    });

    req.on('end', () => {
      if (bodyOverflow) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Payload too large' }));
        return;
      }

      try {
        const rawData = JSON.parse(body);

        // Type check: body must be a non-null plain object
        if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
          return;
        }

        // Honeypot check: reject bot submissions silently
        if (rawData.botcheck) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Brief received' }));
          return;
        }

        // Strict input validation and sanitization
        const name = typeof rawData.name === 'string' ? rawData.name.trim().slice(0, 100) : '';
        const email = typeof rawData.email === 'string' ? rawData.email.trim().slice(0, 254) : '';
        const interest = typeof (rawData.interest || rawData.track) === 'string'
          ? (rawData.interest || rawData.track).trim().slice(0, 100)
          : '';
        const budget = typeof rawData.budget === 'string' ? rawData.budget.trim().slice(0, 100) : '';
        const message = typeof rawData.message === 'string' ? rawData.message.trim().slice(0, 5000) : '';

        // Email validation regex (RFC 5322 standard conformant)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Valid email address is required' }));
          return;
        }

        const sanitizedEntry = {
          name,
          email,
          interest,
          budget,
          message,
          receivedAt: new Date().toISOString(),
          forwardedTo: 'byteform3@gmail.com'
        };

        console.log('\n📩 [INCOMING PROJECT BRIEF RECEIVED]');
        console.log('To: byteform3@gmail.com');
        console.log('From:', sanitizeForLog(sanitizedEntry.name), `<${sanitizeForLog(sanitizedEntry.email)}>`);
        console.log('Track:', sanitizeForLog(sanitizedEntry.interest));
        console.log('Budget:', sanitizeForLog(sanitizedEntry.budget));
        console.log('Brief:', sanitizeForLog(sanitizedEntry.message));
        console.log('------------------------------------\n');

        // Persist safely to inquiries.json (bounded to max 500 items)
        const inquiriesFile = path.join(ROOT_DIR, 'inquiries.json');
        let inquiries = [];
        if (fs.existsSync(inquiriesFile)) {
          try {
            const fileData = fs.readFileSync(inquiriesFile, 'utf8');
            const parsed = JSON.parse(fileData);
            if (Array.isArray(parsed)) inquiries = parsed;
          } catch (e) {}
        }
        inquiries.push(sanitizedEntry);
        if (inquiries.length > 500) {
          inquiries = inquiries.slice(-500);
        }
        fs.writeFileSync(inquiriesFile, JSON.stringify(inquiries, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Brief logged for byteform3@gmail.com' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Apex host redirect to canonical www host (byteform.org -> www.byteform.org)
  const reqHost = (req.headers.host || '').split(':')[0].toLowerCase();
  if (reqHost === 'byteform.org') {
    res.writeHead(301, { 'Location': `https://www.byteform.org${req.url}` });
    res.end();
    return;
  }

  // Trailing slash normalization (strip trailing slash from paths other than root '/')
  if (reqPath.length > 1 && reqPath.endsWith('/')) {
    const cleanSlashPath = reqPath.slice(0, -1);
    const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    res.writeHead(301, { 'Location': cleanSlashPath + queryString });
    res.end();
    return;
  }

  // 301 Permanent Redirects for Clean URLs & Legacy Routes
  if (reqPath === '/index.html') {
    res.writeHead(301, { 'Location': '/' });
    res.end();
    return;
  }
  // Asset redirects for legacy URLs
  if (reqPath === '/assets/for dark bg.png' || reqPath === '/assets/for%20dark%20bg.png') {
    res.writeHead(301, { 'Location': '/assets/byteform-logo-dark.png' });
    res.end();
    return;
  }
  if (reqPath === '/assets/for light bg.png' || reqPath === '/assets/for%20light%20bg.png') {
    res.writeHead(301, { 'Location': '/assets/byteform-logo-light.png' });
    res.end();
    return;
  }
  if (reqPath === '/assets/website icon.png' || reqPath === '/assets/website%20icon.png') {
    res.writeHead(301, { 'Location': '/assets/byteform-icon.png' });
    res.end();
    return;
  }
  if (reqPath === '/capabilities' || reqPath === '/capabilities.html') {
    res.writeHead(301, { 'Location': '/services' });
    res.end();
    return;
  }
  if (reqPath === '/collective' || reqPath === '/collective.html') {
    res.writeHead(301, { 'Location': '/team' });
    res.end();
    return;
  }
  if (reqPath === '/protocol' || reqPath === '/protocol.html') {
    res.writeHead(301, { 'Location': '/process' });
    res.end();
    return;
  }
  if (reqPath === '/estimator' || reqPath === '/estimator.html') {
    res.writeHead(301, { 'Location': '/' });
    res.end();
    return;
  }
  // Redirect direct .html requests to clean URLs
  if (reqPath.endsWith('.html') && reqPath !== '/index.html') {
    const cleanPath = reqPath.slice(0, -5);
    res.writeHead(301, { 'Location': cleanPath });
    res.end();
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';

  // PATH TRAVERSAL DEFENSE: Resolve path safely and ensure it does not escape ROOT_DIR
  const normalizedPath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.resolve(ROOT_DIR, '.' + path.sep + normalizedPath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  let ext = path.extname(filePath).toLowerCase();

  // If no extension, try clean URL serving matching .html file
  if (!ext && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
    ext = '.html';
  }

  // Re-verify that resolved path does not escape ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  function serve404(response) {
    const notFoundPage = path.join(ROOT_DIR, '404.html');
    if (fs.existsSync(notFoundPage)) {
      const html = fs.readFileSync(notFoundPage, 'utf8');
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(html);
    } else {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('404 Not Found');
    }
  }

  // Block access to sensitive files and hidden resources
  if (isBlockedPath(filePath)) {
    serve404(res);
    return;
  }

  // Block direct directory browsing
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const indexFile = path.join(filePath, 'index.html');
      if (fs.existsSync(indexFile) && !isBlockedPath(indexFile)) {
        filePath = indexFile;
        ext = '.html';
      } else {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden');
        return;
      }
    }
  } catch (err) {
    serve404(res);
    return;
  }

  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        serve404(res);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error');
      }
    } else {
      // Long-term caching for immutable static assets & icons
      if (reqPath.startsWith('/assets/') || reqPath.startsWith('/public/') || ext === '.ico' || ext === '.png' || reqPath === '/favicon.ico') {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (ext === '.html') {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n⚡ BYTEFORM Node.js server running live at: http://localhost:${PORT}/\n`);
});
