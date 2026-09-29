# Baseline Technical SEO & Performance Audit: byteform.org

**Date:** September 2026  
**Auditor:** Antigravity AI Agent  
**Repository:** Zeerakkhankhattak/Byteform  
**Canonical Domain:** https://www.byteform.org  

---

## 1. Stack & Architecture Identification

### Technology Stack
- **Architecture:** Static HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+).
- **Local Development / Node Server:** `server.js` (Custom Node.js HTTP server listening on port 3000, provides static file delivery with clean URL fallback, rate limiting, path traversal protection, and `/api/contact` handling).
- **Deployment Platform:** Vercel (configured via `vercel.json` with `"cleanUrls": true`, security headers, and `/api/contact.js` serverless function).
- **Build Command:** Currently configured in `package.json` as `"build": "echo 'Static build complete'"`. No build step or transpiler is currently required.
- **Production Asset Pipeline:**
  - **HTML Pages:** Hand-authored individual `.html` files in root directory.
  - **Head Tags:** Hardcoded manually in the `<head>` of each HTML file.
  - **Stylesheets:** Single monolithic `style.css` stylesheet linked via `<link rel="stylesheet" href="/style.css?v=2.4" />`.
  - **Client Scripts:** Single client-side script `script.js` loaded via `<script src="/script.js?v=2.4"></script>`.
  - **Robots Exclusion:** Static `robots.txt` in the root.
  - **Sitemap:** Static `sitemap.xml` in the root.

---

## 2. Inventory of Site Assets & Resources

### 2.1 Pages Inventory
| Page Slug | Physical File | Status / Purpose |
|---|---|---|
| `/` | `index.html` | Studio homepage with hero metrics, capability portals, client brief submission form. |
| `/capabilities` | `capabilities.html` | In-depth engineering disciplines catalog (to be renamed to `/services`). |
| `/collective` | `collective.html` | Studio engineering philosophy, squads, and culture (to be renamed to `/team`). |
| `/protocol` | `protocol.html` | 5-phase sprint execution framework (to be renamed to `/process`). |
| `/reviews` | `reviews.html` | Client testimonials, project reviews, and founder feedback. |
| `/careers` | `careers.html` | Open roles and interactive modal application form. |
| `/estimator` | `estimator.html` | Legacy project budget estimator (currently redirects to `index.html` via client script and `server.js`). |

### 2.2 Visual Assets & Media Inventory
| File Name | File Type | File Size | Dimensions | Current Status / Usage |
|---|---|---|---|---|
| `assets/for dark bg.png` | PNG | 58,482 bytes (57.1 KB) | 2168 × 725 | Primary studio logo for dark mode. Contains spaces in filename. |
| `assets/for light bg.png` | PNG | 299,142 bytes (292.1 KB) | 2168 × 725 | Studio logo for light mode. Uncompressed; contains spaces in filename. |
| `assets/website icon.png` | PNG | 101,873 bytes (99.5 KB) | 567 × 597 | Favicon and touch icon. Uncompressed; contains spaces in filename. |
| `assets/robot.png` | PNG | 669,611 bytes (653.9 KB) | 585 × 1136 | Hero robot illustration. Heavy PNG lacking WebP modern compression. |
| `assets/robot_original.png`| PNG | 1,689,137 bytes (1.61 MB)| 1024 × 1536| Uncompressed source asset (not directly embedded). |
| `assets/corporate-team.jpg`| JPEG | 704,192 bytes (687.7 KB)| 1376 × 768 | Studio squad photo on `index.html` and `collective.html`. Lacks WebP. |
| `assets/corporate-brief.jpg`| JPEG| 827,139 bytes (807.8 KB)| 1376 × 768 | Project consultation showcase on `index.html`. Lacks WebP. |
| `assets/chameleon.png` | PNG | 1,658,242 bytes (1.58 MB)| 1145 × 1374| Unused graphic asset. |
| `assets/chameleon_original.png` | PNG | 1,682,037 bytes (1.60 MB)| 1145 × 1374| Unused graphic asset. |
| `assets/banner.psd` | PSD | 32,246,930 bytes (30.8 MB)| N/A | Raw source design file (blocked by robots.txt and server.js). |
| `assets/logo.psd` | PSD | 8,994,121 bytes (8.58 MB) | N/A | Raw source design file (blocked by robots.txt and server.js). |

### 2.3 Scripts Inventory
1. `/script.js?v=2.4`: Main client runtime. Bundles theme management, mobile navigation drawer injection, scroll progress bar, testimonials carousel, careers application modal, budget estimator slider logic, contact brief form AJAX submission, and click micro-animations. Loaded at bottom of `<body>` synchronously (without `defer`).
2. Inline script in `estimator.html` (line 8): `window.location.replace('index.html');`.

### 2.4 Typography & Fonts Inventory
Loaded via Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`):
- **Google Sans**: weights 400, 500, 600, 700 (normal & italic).
- **Plus Jakarta Sans**: weights 400, 500, 600, 700, 800 (normal & italic).
- **JetBrains Mono**: weights 400, 500, 600, 700.
*Observations:* Loaded via external CSS font sheet with `display=swap`. However, no preloading of critical font weights exists, causing Flash of Unstyled Text (FOUT) / Cumulative Layout Shift (CLS).

---

## 3. Lighthouse & Core Web Vitals Audit

### Chrome Binary Availability Notice
> **Notice:** A native Google Chrome / Chromium binary is not installed in the execution environment (`PATH` check for `google-chrome`, `chromium`, `chromium-browser` exited with non-zero status). As instructed, this unavailability is recorded explicitly in this audit report.

### Static Code & Architectural Performance Audit (Simulated CWV Baseline)
Based on direct static analysis of the codebase, the following performance and SEO vulnerabilities were identified:

1. **Largest Contentful Paint (LCP) Risks:**
   - Hero section on `index.html` loads `assets/robot.png` (654 KB) as a raw PNG without `fetchpriority="high"`.
   - The corporate showcase images (`assets/corporate-team.jpg` at 688 KB and `assets/corporate-brief.jpg` at 808 KB) are heavy uncompressed JPEGs. Total media payload on homepage exceeds 2.2 MB.
   - Images are loaded without modern WebP or AVIF formats.

2. **Cumulative Layout Shift (CLS) Risks:**
   - Image tags (`<img>`) lack explicit `width` and `height` attributes (e.g. `hero-robot-img`, `corporate-showcase-img`, `logo-img`). Browsers cannot reserve aspect ratio boxes before image decoding, leading to layout shifts during page loading.
   - Dynamic injection of elements via `script.js` (mobile menu toggle button and mobile drawer) can cause layout recalculations if rendered post-DOM ready.

3. **Interaction to Next Paint (INP) & Total Blocking Time (TBT):**
   - In `script.js`, global touch gesture handlers (`gesturestart`, `gesturechange`, `gestureend`) and `touchend` handlers intercept all touches to suppress pinch zoom and double-tap zoom. This creates unnecessary main-thread overhead and degrades touch responsiveness.
   - Testimonial carousel running `setInterval` without `IntersectionObserver` continuously triggers script work and potential reflows even when scrolled out of view.

4. **SEO & Crawlability Deficiencies:**
   - **Internal Linking Mismatch:** Canonical URLs specify clean routes (e.g. `https://www.byteform.org/`), but all internal links point to `.html` files (e.g., `index.html`, `capabilities.html`, `reviews.html`).
   - **Deprecated Query Strings:** LinkedIn social links contain `?viewAsMember=true`.
   - **Email Inconsistencies:** Contact email links point to `https://mail.google.com/mail/?view=cm&fs=1&to=byteform3@gmail.com` instead of RFC-compliant `mailto:byteform3@gmail.com`.
   - **Zoom Blockers:** Viewport `<meta>` tag contains `maximum-scale=1.0, user-scalable=no`, directly violating WCAG accessibility criteria and Google Mobile-Friendly guidelines.
   - **Heading Structure:** Multiple pages contain skipped heading levels or generic headings (e.g. "Interactive review carousel." as H2).
   - **Asset Filenames:** Asset names contain spaces (`for dark bg.png`, `for light bg.png`, `website icon.png`), breaking URL conventions and risking encoding bugs across web servers.
   - **Structured Data:** No JSON-LD schema exists anywhere on the site.

---

## 4. Remediation Plan by Phase

- **Phase 1:** Clean URLs, route renaming (`services`, `team`, `process`), 301 redirects, internal link updates, canonical tag synchronization.
- **Phase 2:** Viewport fixing, metadata standardizing (title ≤60 chars, description 70–155 chars), Open Graph, Twitter Cards, 1200×630 branded image.
- **Phase 3:** Heading hierarchy repair (H1, H2, H3), descriptive anchor text, keyword-focused H1s.
- **Phase 4:** Valid JSON-LD structured data (`ProfessionalService`, `WebSite`, `BreadcrumbList`, `Service`).
- **Phase 5:** Hub and dedicated service pages (`/services/web-development`, etc.), contact page, case studies scaffold (`noindex`), blog scaffold and content plan.
- **Phase 6:** Consistent NAP (Peshawar, PK), brand disambiguation ("Byteform Digital Studio"), `mailto:` integration.
- **Phase 7:** Kebab-case assets, WebP conversion, explicit `width`/`height`, `decoding="async"`, `fetchpriority="high"`, lazy loading, script deferral, reduced motion support.
- **Phase 8:** Production `robots.txt`, dynamic/clean `sitemap.xml`, custom `404.html`, caching and security headers.
- **Phase 9:** Inter-page link architecture and breadcrumbs.
- **Phase 10:** Automated SEO validation test suite (`scripts/seo-check.js`) and comprehensive changelog (`SEO_CHANGELOG.md`).
