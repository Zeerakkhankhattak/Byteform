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

  // Handle Applications API
  if (reqPath === '/api/applications') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const applicationsFile = path.join(__dirname, 'applications.json');

    const readApplications = () => {
      if (fs.existsSync(applicationsFile)) {
        try {
          const raw = fs.readFileSync(applicationsFile, 'utf8');
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }
      return [];
    };

    const saveApplications = (apps) => {
      fs.writeFileSync(applicationsFile, JSON.stringify(apps, null, 2), 'utf8');
    };

    if (req.method === 'GET') {
      const apps = readApplications();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, applications: apps, count: apps.length }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          if (!data.name || !data.email) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Name and email are required.' }));
            return;
          }

          const application = {
            id: data.id || ('app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
            name: String(data.name).trim(),
            email: String(data.email).trim(),
            position: String(data.position || data.role || 'General Application').trim(),
            link: String(data.link || data.portfolioUrl || '').trim(),
            experience: String(data.experience || data.notes || data.highlights || '').trim(),
            status: data.status || 'New',
            submittedAt: data.submittedAt || new Date().toISOString()
          };

          const apps = readApplications();
          // Deduplicate if already exists with same id
          const existingIndex = apps.findIndex(a => a.id === application.id);
          if (existingIndex >= 0) {
            apps[existingIndex] = application;
          } else {
            apps.unshift(application);
          }
          saveApplications(apps);

          // Background sync to Cloud Firestore
          const firestoreDocId = encodeURIComponent(application.id);
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/byteform-website/databases/(default)/documents/applications/${firestoreDocId}?key=AIzaSyCqpW-onC0DfN9hmMGXhI1l6501QWLX5NQ`;
          fetch(firestoreUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                id: { stringValue: application.id },
                name: { stringValue: application.name },
                email: { stringValue: application.email },
                position: { stringValue: application.position },
                link: { stringValue: application.link || '' },
                experience: { stringValue: application.experience || '' },
                status: { stringValue: application.status || 'New' },
                submittedAt: { stringValue: application.submittedAt || new Date().toISOString() }
              }
            })
          }).catch(() => {});

          console.log('\n📥 [NEW JOB APPLICATION RECEIVED]');
          console.log('Candidate:', application.name, `<${application.email}>`);
          console.log('Position:', application.position);
          console.log('Profile Link:', application.link || 'None');
          console.log('Experience Notes:', application.experience ? (application.experience.slice(0, 80) + '...') : 'None');
          console.log('Status:', application.status);
          console.log('Submitted At:', application.submittedAt);
          console.log('------------------------------------\n');

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Application submitted successfully', application }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          if (!data.id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Application id is required' }));
            return;
          }
          const apps = readApplications();
          const targetIndex = apps.findIndex(a => a.id === data.id);
          if (targetIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Application not found' }));
            return;
          }
          if (data.status) apps[targetIndex].status = data.status;
          apps[targetIndex].updatedAt = new Date().toISOString();
          saveApplications(apps);

          if (data.status) {
            const firestoreDocId = encodeURIComponent(data.id);
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/byteform-website/databases/(default)/documents/applications/${firestoreDocId}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt&key=AIzaSyCqpW-onC0DfN9hmMGXhI1l6501QWLX5NQ`;
            fetch(firestoreUrl, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: {
                  status: { stringValue: String(data.status) },
                  updatedAt: { stringValue: new Date().toISOString() }
                }
              })
            }).catch(() => {});
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, application: apps[targetIndex] }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }
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
