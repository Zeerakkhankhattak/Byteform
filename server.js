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

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error: ' + err.message);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Handle direct contact form API
  if (req.method === 'POST' && reqPath === '/api/contact') {
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

  // Handle job applications API (local persistence backup)
  if (req.method === 'POST' && reqPath === '/api/applications') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        data.id = 'app_' + Date.now();
        data.submittedAt = data.submittedAt || new Date().toISOString();
        data.status = data.status || 'New';

        console.log('\n💼 [NEW JOB APPLICATION RECEIVED]');
        console.log('Name:', data.name);
        console.log('Email:', data.email);
        console.log('Position:', data.position);
        console.log('Portfolio/Link:', data.link);
        console.log('------------------------------------\n');

        const appsFile = path.join(__dirname, 'applications.json');
        let apps = [];
        if (fs.existsSync(appsFile)) {
          try {
            apps = JSON.parse(fs.readFileSync(appsFile, 'utf8'));
          } catch(e) {}
        }
        apps.unshift(data);
        fs.writeFileSync(appsFile, JSON.stringify(apps, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Application received', id: data.id }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // GET local applications backup
  if (req.method === 'GET' && reqPath === '/api/applications') {
    const appsFile = path.join(__dirname, 'applications.json');
    let apps = [];
    if (fs.existsSync(appsFile)) {
      try {
        apps = JSON.parse(fs.readFileSync(appsFile, 'utf8'));
      } catch(e) {}
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, applications: apps }));
    return;
  }

  // Redirect legacy estimator
  if (reqPath === '/estimator' || reqPath === '/estimator.html') {
    res.writeHead(302, { 'Location': '/' });
    res.end();
    return;
  }

  // Normalize admin routes: redirect /admin to /admin/
  if (reqPath === '/admin' || reqPath === '/byteform-admin' || reqPath === '/byteform-admin/') {
    res.writeHead(302, { 'Location': '/admin/' });
    res.end();
    return;
  }

  // Serve Admin Portal at /admin/
  if (reqPath === '/admin/') {
    serveFile(res, path.join(__dirname, 'byteform-admin', 'index.html'));
    return;
  }

  // Serve Admin Portal sub-assets at /admin/*
  if (reqPath.startsWith('/admin/')) {
    const sub = reqPath.slice('/admin/'.length);
    let adminFile = path.join(__dirname, 'byteform-admin', sub);
    if (fs.existsSync(adminFile) && !fs.statSync(adminFile).isDirectory()) {
      serveFile(res, adminFile);
      return;
    }
    // Fallback to root assets if requested through /admin/assets/...
    let rootFallback = path.join(__dirname, sub);
    if (fs.existsSync(rootFallback) && !fs.statSync(rootFallback).isDirectory()) {
      serveFile(res, rootFallback);
      return;
    }
  }

  // Root website requests
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(__dirname, reqPath);

  // If path is a directory, look for index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexInside = path.join(filePath, 'index.html');
    if (fs.existsSync(indexInside)) {
      filePath = indexInside;
    }
  }

  let ext = path.extname(filePath).toLowerCase();

  // If no extension, try serving matching .html file
  if (!ext && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
    ext = '.html';
  }

  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`\n⚡ BYTEFORM Node.js server running live at: http://localhost:${PORT}/`);
  console.log(`🔒 BYTEFORM Admin Portal accessible at:     http://localhost:${PORT}/admin/\n`);
});
