const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');

// Public canonical clean URLs that are indexable (no .html, no noindex, no redirects)
const PUBLIC_ROUTES = [
  { url: 'https://www.byteform.org/', changefreq: 'weekly', priority: '1.0' },
  { url: 'https://www.byteform.org/services', changefreq: 'weekly', priority: '0.9' },
  { url: 'https://www.byteform.org/services/web-development', changefreq: 'monthly', priority: '0.8' },
  { url: 'https://www.byteform.org/services/mobile-app-development', changefreq: 'monthly', priority: '0.8' },
  { url: 'https://www.byteform.org/services/ai-automation', changefreq: 'monthly', priority: '0.8' },
  { url: 'https://www.byteform.org/services/ui-ux-design', changefreq: 'monthly', priority: '0.8' },
  { url: 'https://www.byteform.org/services/cloud-devops', changefreq: 'monthly', priority: '0.8' },
  { url: 'https://www.byteform.org/services/technical-seo', changefreq: 'monthly', priority: '0.8' },
  { url: 'https://www.byteform.org/team', changefreq: 'monthly', priority: '0.7' },
  { url: 'https://www.byteform.org/process', changefreq: 'monthly', priority: '0.7' },
  { url: 'https://www.byteform.org/reviews', changefreq: 'weekly', priority: '0.8' },
  { url: 'https://www.byteform.org/careers', changefreq: 'weekly', priority: '0.8' },
  { url: 'https://www.byteform.org/contact', changefreq: 'monthly', priority: '0.9' }
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  const xmlEntries = PUBLIC_ROUTES.map(route => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
  console.log(`Generated sitemap.xml with ${PUBLIC_ROUTES.length} canonical URLs at ${SITEMAP_PATH}`);
}

generateSitemap();
