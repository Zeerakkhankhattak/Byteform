export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    data.receivedAt = new Date().toISOString();
    data.forwardedTo = 'byteform3@gmail.com';

    console.log('\n📩 [NEW PROJECT BRIEF RECEIVED]');
    console.log('To: byteform3@gmail.com');
    console.log('From:', data.name, `<${data.email}>`);
    console.log('Track:', data.interest || data.track);
    console.log('Budget:', data.budget);
    console.log('Brief:', data.message);
    console.log('-------------------------------\n');

    return res.status(200).json({
      success: true,
      message: 'Brief successfully registered for byteform3@gmail.com',
      destination: 'byteform3@gmail.com',
      timestamp: data.receivedAt
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
