const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

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
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Handle CORS preflight for API routes
  if (req.method === 'OPTIONS' && reqPath.startsWith('/api/')) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  // Handle direct contact form API
  if (req.method === 'POST' && reqPath === '/api/contact') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        data.receivedAt = new Date().toISOString();
        data.forwardedTo = 'byteform3@gmail.com';
        
        console.log('\n📩 [INCOMING PROJECT BRIEF RECEIVED]');
        console.log('To: byteform3@gmail.com');
        console.log('From:', data.name, `<${data.email}>`);
        console.log('Track:', data.interest || data.track);
        console.log('Budget:', data.budget);
        console.log('Brief:', data.message);
        console.log('------------------------------------\n');

        // Persist to inquiries.json
        const inquiriesFile = path.join(__dirname, 'inquiries.json');
        let inquiries = [];
        if (fs.existsSync(inquiriesFile)) {
          try {
            inquiries = JSON.parse(fs.readFileSync(inquiriesFile, 'utf8'));
          } catch(e) {}
        }
        inquiries.push(data);
        fs.writeFileSync(inquiriesFile, JSON.stringify(inquiries, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Brief logged for byteform3@gmail.com' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }



  if (reqPath === '/estimator' || reqPath === '/estimator.html') {
    res.writeHead(302, { 'Location': '/' });
    res.end();
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(__dirname, reqPath);
  let ext = path.extname(filePath).toLowerCase();

  // If no extension, try serving matching .html file
  if (!ext && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
    ext = '.html';
  }

  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n⚡ BYTEFORM Node.js server running live at: http://localhost:${PORT}/\n`);
});
