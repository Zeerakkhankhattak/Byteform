import fs from 'fs';
import path from 'path';

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'byteform-website';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyCqpW-onC0DfN9hmMGXhI1l6501QWLX5NQ';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/applications`;

// Fetch applications from Firestore REST API
async function fetchFirestoreApplications() {
  try {
    const url = `${FIRESTORE_BASE_URL}?key=${FIREBASE_API_KEY}&pageSize=100`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const message = errBody.error?.message || `HTTP ${res.status}`;
      return { ok: false, error: message, status: res.status, apps: [] };
    }
    const data = await res.json();
    const documents = data.documents || [];
    const apps = documents.map(doc => {
      const id = doc.name ? doc.name.split('/').pop() : '';
      const fields = doc.fields || {};
      return {
        id: fields.id?.stringValue || id,
        name: fields.name?.stringValue || 'Anonymous',
        email: fields.email?.stringValue || '',
        position: fields.position?.stringValue || 'General Application',
        link: fields.link?.stringValue || '',
        experience: fields.experience?.stringValue || '',
        status: fields.status?.stringValue || 'New',
        submittedAt: fields.submittedAt?.stringValue || doc.createTime || new Date().toISOString()
      };
    });
    return { ok: true, apps };
  } catch (err) {
    return { ok: false, error: err.message, apps: [] };
  }
}

// Persist an application to Firestore REST API
async function saveFirestoreApplication(application) {
  try {
    const docId = encodeURIComponent(application.id);
    const url = `${FIRESTORE_BASE_URL}/${docId}?key=${FIREBASE_API_KEY}`;
    const firestoreBody = {
      fields: {
        id: { stringValue: String(application.id) },
        name: { stringValue: String(application.name) },
        email: { stringValue: String(application.email) },
        position: { stringValue: String(application.position) },
        link: { stringValue: String(application.link || '') },
        experience: { stringValue: String(application.experience || '') },
        status: { stringValue: String(application.status || 'New') },
        submittedAt: { stringValue: String(application.submittedAt || new Date().toISOString()) }
      }
    };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreBody)
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { ok: false, error: errBody.error?.message || `HTTP ${res.status}`, status: res.status };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Update status in Firestore REST API
async function updateFirestoreApplicationStatus(id, newStatus) {
  try {
    const docId = encodeURIComponent(id);
    const updatedAt = new Date().toISOString();
    const url = `${FIRESTORE_BASE_URL}/${docId}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt&key=${FIREBASE_API_KEY}`;
    const firestoreBody = {
      fields: {
        status: { stringValue: String(newStatus) },
        updatedAt: { stringValue: updatedAt }
      }
    };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreBody)
    });
    return { ok: res.ok };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const readLocalApplications = () => {
    try {
      const file = path.join(process.cwd(), 'applications.json');
      if (fs.existsSync(file)) {
        const data = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      // Gracefully ignore local read failure
    }
    return [];
  };

  const saveLocalApplications = (apps) => {
    try {
      const file = path.join(process.cwd(), 'applications.json');
      fs.writeFileSync(file, JSON.stringify(apps, null, 2), 'utf8');
      return true;
    } catch (e) {
      // Read-only filesystem on Vercel lambda (EROFS) - safely handled
      return false;
    }
  };

  // GET: Fetch applications
  if (req.method === 'GET') {
    const firestoreResult = await fetchFirestoreApplications();
    const localApps = readLocalApplications();

    // Merge Firestore + local applications, deduplicated by id
    const combined = [];
    const seenIds = new Set();

    if (firestoreResult.ok && firestoreResult.apps.length > 0) {
      firestoreResult.apps.forEach(app => {
        if (app.id && !seenIds.has(app.id)) {
          seenIds.add(app.id);
          combined.push(app);
        }
      });
    }

    localApps.forEach(app => {
      if (app.id && !seenIds.has(app.id)) {
        seenIds.add(app.id);
        combined.push(app);
      }
    });

    return res.status(200).json({
      success: true,
      applications: combined,
      count: combined.length,
      firestoreActive: firestoreResult.ok,
      firestoreStatus: firestoreResult.ok ? 'connected' : firestoreResult.error
    });
  }

  // POST: Create / Submit application
  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (!data.name || !data.email) {
        return res.status(400).json({ success: false, error: 'Name and email are required.' });
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

      // 1. Try persisting to Cloud Firestore
      const firestoreResult = await saveFirestoreApplication(application);

      // 2. Try persisting locally (for local node server.js dev)
      const localApps = readLocalApplications();
      const existingIndex = localApps.findIndex(a => a.id === application.id);
      if (existingIndex >= 0) {
        localApps[existingIndex] = application;
      } else {
        localApps.unshift(application);
      }
      saveLocalApplications(localApps);

      console.log('\n📥 [JOB APPLICATION RECEIVED]');
      console.log('Candidate:', application.name, `<${application.email}>`);
      console.log('Position:', application.position);
      console.log('Firestore Status:', firestoreResult.ok ? 'Saved' : `Notice: ${firestoreResult.error}`);
      console.log('-----------------------------\n');

      return res.status(201).json({
        success: true,
        message: 'Application registered successfully',
        application,
        cloudPersisted: firestoreResult.ok,
        cloudNotice: firestoreResult.ok ? null : firestoreResult.error
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // PATCH / PUT: Update status
  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (!data.id) {
        return res.status(400).json({ success: false, error: 'Application id is required' });
      }

      if (data.status) {
        await updateFirestoreApplicationStatus(data.id, data.status);
      }

      const localApps = readLocalApplications();
      const targetIndex = localApps.findIndex(a => a.id === data.id);
      if (targetIndex >= 0) {
        if (data.status) localApps[targetIndex].status = data.status;
        localApps[targetIndex].updatedAt = new Date().toISOString();
        saveLocalApplications(localApps);
      }

      return res.status(200).json({
        success: true,
        message: 'Status updated successfully'
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
