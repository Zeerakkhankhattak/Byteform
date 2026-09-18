import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const getApplicationsFile = () => {
    return path.join(process.cwd(), 'applications.json');
  };

  const readApplications = () => {
    try {
      const file = getApplicationsFile();
      if (fs.existsSync(file)) {
        const data = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error reading applications file:', e);
    }
    return [];
  };

  const saveApplications = (apps) => {
    try {
      const file = getApplicationsFile();
      fs.writeFileSync(file, JSON.stringify(apps, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Error saving applications file:', e);
      return false;
    }
  };

  if (req.method === 'GET') {
    const applications = readApplications();
    return res.status(200).json({
      success: true,
      applications,
      count: applications.length
    });
  }

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

      const applications = readApplications();
      const existingIndex = applications.findIndex(a => a.id === application.id);
      if (existingIndex >= 0) {
        applications[existingIndex] = application;
      } else {
        applications.unshift(application);
      }
      saveApplications(applications);

      console.log('\n📥 [NEW JOB APPLICATION - VERCEL API]');
      console.log('Candidate:', application.name, `<${application.email}>`);
      console.log('Position:', application.position);
      console.log('------------------------------------\n');

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        application
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (!data.id) {
        return res.status(400).json({ success: false, error: 'Application id is required' });
      }
      const applications = readApplications();
      const targetIndex = applications.findIndex(a => a.id === data.id);
      if (targetIndex === -1) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }
      if (data.status) applications[targetIndex].status = data.status;
      applications[targetIndex].updatedAt = new Date().toISOString();
      saveApplications(applications);

      return res.status(200).json({
        success: true,
        application: applications[targetIndex]
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
