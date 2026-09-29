#!/usr/bin/env node

/**
 * Byteform SEO Automated Health & Regression Test Suite
 * Validates headings, titles, descriptions, canonicals, links, images, JSON-LD, and sitemap.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');

let errors = [];
let warnings = [];
let passCount = 0;

function reportPass(msg) {
  passCount++;
}

function reportFail(file, msg) {
  errors.push(`[FAIL] ${file}: ${msg}`);
}

function reportWarn(file, msg) {
  warnings.push(`[WARN] ${file}: ${msg}`);
}

// 1. Gather all HTML files
function getHtmlFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item.startsWith('.')) continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getHtmlFiles(fullPath, fileList);
    } else if (item.endsWith('.html')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allHtmlFiles = getHtmlFiles(ROOT_DIR);
console.log(`\n======================================================`);
console.log(`🔎 Byteform Automated SEO Check: Scanning ${allHtmlFiles.length} HTML files...`);
console.log(`======================================================\n`);

const seenTitles = new Map();
const seenDescriptions = new Map();
const noindexPages = new Set();
const publishedCleanUrls = new Set();

const REDIRECT_TARGETS = new Set([
  '/capabilities',
  '/capabilities.html',
  '/collective',
  '/collective.html',
  '/protocol',
  '/protocol.html',
  '/services.html',
  '/team.html',
  '/process.html',
  '/reviews.html',
  '/careers.html',
  '/contact.html',
  '/estimator',
  '/estimator.html',
  '/index.html'
]);

// Read and parse each file
for (const filePath of allHtmlFiles) {
  const relPath = path.relative(ROOT_DIR, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Determine clean URL corresponding to this file
  let cleanUrl = '/' + relPath.replace(/\\/g, '/').replace(/\.html$/, '');
  if (cleanUrl === '/index') cleanUrl = '/';
  if (cleanUrl.endsWith('/index')) cleanUrl = cleanUrl.slice(0, -6) || '/';

  const isNoIndex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(content);
  if (isNoIndex) {
    noindexPages.add('https://www.byteform.org' + (cleanUrl === '/' ? '/' : cleanUrl));
  } else {
    publishedCleanUrls.add(cleanUrl);
  }

  // --- Check 1: Headings (Exactly 1 H1, no skipped levels) ---
  const headingMatches = Array.from(content.matchAll(/<(h[1-6])[^>]*>(.*?)<\/\1>/gis));
  const h1s = headingMatches.filter(m => m[1].toLowerCase() === 'h1');

  if (h1s.length !== 1) {
    reportFail(relPath, `Expected exactly 1 <h1>, found ${h1s.length}`);
  } else {
    reportPass(`1 H1 in ${relPath}`);
  }

  let prevLevel = 1;
  for (const h of headingMatches) {
    const level = parseInt(h[1][1], 10);
    if (level > prevLevel + 1) {
      reportFail(relPath, `Skipped heading level: <${h[1]}> directly under <h${prevLevel}> ("${h[2].replace(/\s+/g, ' ').trim().slice(0, 40)}")`);
    }
    prevLevel = level;
  }

  // --- Check 2: Title and Description Lengths & Uniqueness ---
  const titleMatch = content.match(/<title>(.*?)<\/title>/is);
  if (!titleMatch) {
    reportFail(relPath, `Missing <title> tag`);
  } else {
    const titleText = titleMatch[1].replace(/&amp;/g, '&').trim();
    if (titleText.length < 30 || titleText.length > 60) {
      // Draft / Redirect pages like estimator can be exempted if noindex
      if (!isNoIndex) {
        reportFail(relPath, `Title length ${titleText.length} outside 30-60 chars ("${titleText}")`);
      }
    } else {
      reportPass(`Title length OK in ${relPath}`);
    }

    if (!isNoIndex) {
      if (seenTitles.has(titleText)) {
        reportFail(relPath, `Duplicate title identical to ${seenTitles.get(titleText)} ("${titleText}")`);
      } else {
        seenTitles.set(titleText, relPath);
      }
    }
  }

  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=(?:"([^"]*)"|'([^']*)')/is);
  if (!descMatch) {
    if (!isNoIndex) reportFail(relPath, `Missing meta description`);
  } else {
    const descText = (descMatch[1] !== undefined ? descMatch[1] : descMatch[2]).replace(/&amp;/g, '&').trim();
    if (descText.length < 70 || descText.length > 160) {
      if (!isNoIndex) {
        reportFail(relPath, `Meta description length ${descText.length} outside 70-160 chars`);
      }
    } else {
      reportPass(`Description length OK in ${relPath}`);
    }

    if (!isNoIndex) {
      if (seenDescriptions.has(descText)) {
        reportFail(relPath, `Duplicate description identical to ${seenDescriptions.get(descText)}`);
      } else {
        seenDescriptions.set(descText, relPath);
      }
    }
  }

  // --- Check 3: Canonical URLs ---
  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
  if (!canonicalMatch) {
    if (!isNoIndex) reportFail(relPath, `Missing canonical link tag`);
  } else {
    const canonical = canonicalMatch[1];
    if (!canonical.startsWith('https://www.byteform.org')) {
      reportFail(relPath, `Canonical URL must be absolute with host https://www.byteform.org, got "${canonical}"`);
    } else if (canonical.endsWith('.html')) {
      reportFail(relPath, `Canonical URL contains .html: "${canonical}"`);
    } else {
      // Verify self-referencing
      const expectedCanonical = 'https://www.byteform.org' + (cleanUrl === '/' ? '/' : cleanUrl);
      if (canonical !== expectedCanonical && !isNoIndex) {
        reportFail(relPath, `Canonical is not self-referencing: expected "${expectedCanonical}", found "${canonical}"`);
      } else {
        reportPass(`Canonical valid in ${relPath}`);
      }
    }
  }

  // --- Check 4: Viewport Settings ---
  const viewportMatch = content.match(/<meta\s+name=["']viewport["']\s+content=["'](.*?)["']/i);
  if (!viewportMatch) {
    reportFail(relPath, `Missing viewport meta tag`);
  } else {
    const vpContent = viewportMatch[1];
    if (/user-scalable\s*=\s*no/i.test(vpContent) || /maximum-scale/i.test(vpContent)) {
      reportFail(relPath, `Viewport contains zoom blocker (user-scalable=no or maximum-scale): "${vpContent}"`);
    } else {
      reportPass(`Accessible viewport in ${relPath}`);
    }
  }

  // --- Check 5: Internal Links Hygiene ---
  const hrefMatches = Array.from(content.matchAll(/href=["'](.*?)["']/gi));
  for (const m of hrefMatches) {
    const href = m[1].trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (href.startsWith('https://www.byteform.org') || href.startsWith('https://byteform.org')) {
        // Internal absolute link check
        const urlObj = new URL(href);
        if (urlObj.pathname.endsWith('.html') && urlObj.pathname !== '/index.html') {
          reportFail(relPath, `Internal link ends in .html: "${href}"`);
        }
      }
      continue;
    }

    // Relative / path link
    const cleanHrefPath = href.split('?')[0].split('#')[0];
    if (cleanHrefPath.endsWith('.html')) {
      reportFail(relPath, `Internal link ends in .html: "${href}"`);
    }
    if (REDIRECT_TARGETS.has(cleanHrefPath)) {
      reportFail(relPath, `Internal link points to a 301 redirect: "${href}"`);
    }
  }

  // --- Check 6: Images (alt, width, height, spaces in filename) ---
  const imgMatches = Array.from(content.matchAll(/<img\s+([^>]*?)>/gis));
  for (const imgMatch of imgMatches) {
    const imgTag = imgMatch[0];
    const attrs = imgMatch[1];

    const srcMatch = attrs.match(/src=["'](.*?)["']/i);
    const src = srcMatch ? srcMatch[1] : '';

    if (/\s/.test(src)) {
      reportFail(relPath, `Image filename contains space: "${src}"`);
    }

    if (!/alt=["']/i.test(attrs)) {
      reportFail(relPath, `Image missing alt attribute: "${imgTag}"`);
    }

    const hasWidth = /width=["']/i.test(attrs) || /style=["'][^"']*width:/i.test(attrs);
    const hasHeight = /height=["']/i.test(attrs) || /style=["'][^"']*height:/i.test(attrs);
    if (!hasWidth || !hasHeight) {
      reportFail(relPath, `Image missing explicit width or height: "${imgTag}"`);
    }
  }

  // --- Check 7: Open Graph and Twitter Tags ---
  if (!isNoIndex) {
    const ogTitle = content.match(/<meta\s+property=["']og:title["']/i);
    const ogDesc = content.match(/<meta\s+property=["']og:description["']/i);
    const ogUrl = content.match(/<meta\s+property=["']og:url["']/i);
    const ogImage = content.match(/<meta\s+property=["']og:image["']/i);
    const twCard = content.match(/<meta\s+name=["']twitter:card["']/i);

    if (!ogTitle || !ogDesc || !ogUrl || !ogImage) {
      reportFail(relPath, `Missing required Open Graph tags (og:title, og:description, og:url, og:image)`);
    } else {
      reportPass(`OG tags OK in ${relPath}`);
    }

    if (!twCard) {
      reportFail(relPath, `Missing twitter:card meta tag`);
    }
  }

  // --- Check 8: Structured Data JSON-LD ---
  const jsonLdMatches = Array.from(content.matchAll(/<script\s+type=["']application\/ld\+json["']>(.*?)<\/script>/gis));
  for (const scriptMatch of jsonLdMatches) {
    try {
      const parsed = JSON.parse(scriptMatch[1]);
      if (parsed['@context'] !== 'https://schema.org') {
        reportFail(relPath, `JSON-LD @context must be https://schema.org, got "${parsed['@context']}"`);
      }
      reportPass(`Valid JSON-LD in ${relPath}`);
    } catch (e) {
      reportFail(relPath, `Invalid JSON-LD syntax: ${e.message}`);
    }
  }
}

// --- Check 9: Sitemap Validation ---
if (!fs.existsSync(SITEMAP_PATH)) {
  reportFail('sitemap.xml', `sitemap.xml does not exist`);
} else {
  const sitemapXml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const locMatches = Array.from(sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)).map(m => m[1]);

  console.log(`Checking sitemap.xml: found ${locMatches.length} URLs`);

  for (const loc of locMatches) {
    if (loc.endsWith('.html')) {
      reportFail('sitemap.xml', `Sitemap contains .html URL: "${loc}"`);
    }
    if (noindexPages.has(loc)) {
      reportFail('sitemap.xml', `Sitemap contains noindex page: "${loc}"`);
    }
    const pathPart = loc.replace('https://www.byteform.org', '');
    const cleanPath = pathPart === '' ? '/' : pathPart;
    if (!publishedCleanUrls.has(cleanPath)) {
      reportFail('sitemap.xml', `Sitemap lists nonexistent or unpublished URL: "${loc}"`);
    }
  }
  reportPass(`Sitemap valid with ${locMatches.length} URLs`);
}

// --- Check 9: Favicon and App Icon Physical Files ---
const iconFilesToCheck = [
  'favicon.ico',
  'favicon-48x48.png',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'apple-touch-icon.png'
];

for (const iconRelPath of iconFilesToCheck) {
  const iconFullPath = path.join(ROOT_DIR, iconRelPath);
  if (!fs.existsSync(iconFullPath)) {
    reportFail(iconRelPath, `Physical icon file missing: expected raw file at "${iconRelPath}"`);
  } else {
    const iconStat = fs.statSync(iconFullPath);
    if (iconStat.size < 100) {
      reportFail(iconRelPath, `Icon file is suspiciously small or empty (${iconStat.size} bytes)`);
    } else {
      reportPass(`Icon file verified: ${iconRelPath} (${iconStat.size} bytes)`);
    }
  }
}

// Final Summary
console.log(`\n======================================================`);
console.log(`📊 SEO Automated Audit Summary:`);
console.log(`   Passed assertions: ${passCount}`);
console.log(`   Warnings: ${warnings.length}`);
console.log(`   Errors / Failures: ${errors.length}`);
console.log(`======================================================\n`);

if (warnings.length > 0) {
  console.log(`Warnings:`);
  warnings.forEach(w => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.error(`❌ Automated SEO check FAILED with ${errors.length} errors:`);
  errors.forEach(e => console.error(`  ${e}`));
  process.exit(1);
} else {
  console.log(`✅ ALL AUTOMATED SEO ASSERTIONS PASSED PERFECTLY!\n`);
  process.exit(0);
}
