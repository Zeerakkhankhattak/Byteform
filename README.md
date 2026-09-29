# Byteform &middot; Independent Digital Studio & Tech Engineering

<p align="center">
  <img src="assets/for dark bg.png" alt="Byteform Logo" width="280" />
</p>

<p align="center">
  <strong>High-impact web applications, cloud native infrastructure, and refined design systems.</strong>
</p>

<p align="center">
  <a href="https://www.byteform.org/"><strong>Live Deployment &rarr;</strong></a> &bull;
  <a href="#core-capabilities">Capabilities</a> &bull;
  <a href="#architecture--tech-stack">Tech Stack</a> &bull;
  <a href="#project-structure">Structure</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#security--seo">Security & SEO</a>
</p>

---

## Overview

**[Byteform](https://www.byteform.org/)** is an independent IT company and digital studio founded by a group of senior engineers and designers. We build full-stack web and mobile platforms, cloud architecture, autonomous AI automations, IoT & embedded systems, and tactile design systems.

### Core Metrics & Guarantees
- **Under 60ms** &mdash; Low-latency API response times.
- **100% Direct Contact** &mdash; Direct interaction with technical service managers without account-manager overhead.
- **99.99% Production SLA** &mdash; Resilient cloud architecture and monitoring.
- **Zero Outsourcing** &mdash; In-house design and engineering across all sprints.

---

## Core Capabilities

1. **Full-Stack Web & Mobile Platforms** &mdash; High-throughput React/Next.js and Node.js architectures with low latency.
2. **IoT & Embedded Systems** &mdash; Hardware-level integration, telemetry pipelines, and edge device firmware.
3. **Autonomous AI & Automations** &mdash; Intelligent workflow pipelines, LLM-powered services, and custom agents.
4. **Cloud DevOps & Infrastructure** &mdash; Containerized deployments, Kubernetes orchestration, CI/CD automation, and AWS/Vercel scaling.
5. **Technical SEO & Search Dominance** &mdash; Core Web Vitals optimization, semantic schema markup, and crawl budget engineering.
6. **Design Systems & Motion** &mdash; Refined typography, glassmorphism, responsive UI/UX, and cinematic motion graphics.

---

## Site Pages & Routes

The application runs with clean URLs (`cleanUrls: true` on Vercel):

| Route | File | Description |
|---|---|---|
| `/` | `index.html` | Studio homepage with hero metrics, capability portals, and brief submission form. |
| `/services` | `services.html` | In-depth breakdown of engineering disciplines, stacks, and deliverables. |
| `/team` | `team.html` | Engineering philosophy, studio background, and multidisciplinary squads. |
| `/process` | `process.html` | Sprint delivery framework: Discovery, Architecture, Sprints, Hardening, and Handover. |
| `/reviews` | `reviews.html` | Verified founder and client testimonials. |
| `/careers` | `careers.html` | Open positions (DevOps, Full Stack, Video Editor, SEO) with interactive modal application. |
| `/contact` | `contact.html` | Dedicated contact coordinates and project brief submission interface. |
| `/sitemap.xml` | `sitemap.xml` | Search console XML sitemap covering all canonical pages. |
| `/robots.txt` | `robots.txt` | Crawler directive indexing sitemap and shielding private endpoints. |

---

## Architecture & Tech Stack

- **Frontend Core**: Semantic HTML5, Vanilla JavaScript (ES6+), custom CSS design system.
- **Typography**: Google Sans, Plus Jakarta Sans, and JetBrains Mono.
- **Forms & Inquiries**:
  - Direct delivery via [Web3Forms API](https://web3forms.com).
  - Internal backend logging endpoint (`/api/contact`).
  - Honeypot bot protection (`botcheck`).
- **Server Runtime**: Node.js standard library HTTP server (`server.js`) with zero third-party runtime dependencies.
- **Edge Deployment**: Vercel Serverless Function (`api/contact.js`) with custom edge headers.

---

## Project Structure

```text
Byteform/
├── api/
│   └── contact.js          # Vercel serverless function for contact briefs
├── assets/                 # Brand logos, dark/light variations, icons, visual assets
├── careers.html            # Open engineering and creative roles with application modal
├── contact.html            # Dedicated contact coordinates and project brief submission
├── index.html              # Primary landing page and project brief interface
├── inquiries.json          # Local persistence store for submitted briefs (capped)
├── package.json            # Project manifest and runner scripts
├── process.html            # Sprint execution methodology and milestones
├── reviews.html            # Verified founder testimonials and case reviews
├── robots.txt              # Search engine directives and sitemap pointer
├── script.js               # Theme engine, navigation drawer, form handlers, animations
├── server.js               # Standalone Node.js server with path traversal and rate-limit defenses
├── services.html           # Technical services and capabilities catalog
├── sitemap.xml             # Canonical XML sitemap for Google Search Console
├── style.css               # Bespoke design system, dark/light tokens, responsive layout
├── team.html               # Team structure, squad models, and philosophy
├── vercel.json             # Vercel routing, clean URLs, and edge HTTP security headers
└── .vercelignore           # Deployment shield for sensitive files and assets
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0 or higher recommended)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/Zeerakkhankhattak/Byteform.git
cd Byteform
```

### 2. Run Locally with Built-in Server
Start the local server (configured with security headers and clean URL routing):
```bash
npm start
# or
node server.js
```
The application will be live at:
```
http://localhost:3000/
```

### 3. Deploying to Vercel
Deploy seamlessly using the Vercel CLI or via GitHub integration:
```bash
npx vercel
```
Production deployments automatically utilize `vercel.json` for edge caching, clean URLs, and HTTP security headers.

---

## Security & SEO Hardening

The repository has undergone a comprehensive security audit and hardening:

- **Path Traversal Defense**: `server.js` canonicalizes paths using `path.resolve()` and prevents escaping root directory boundaries.
- **Sensitive File Shielding**: `.git`, `.env*`, `package.json`, `inquiries.json`, and source files are explicitly denied public access in both `server.js` and `.vercelignore`.
- **HTTP Security Headers**:
  - `Content-Security-Policy` (CSP)
  - `X-Frame-Options: DENY` (Clickjacking mitigation)
  - `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
  - `Strict-Transport-Security` (HSTS enabled)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (Camera, microphone, and geolocation restrictions)
- **Input Sanitization & DOM XSS Prevention**: Form feedback and user inputs are strictly escaped via HTML encoding utilities before rendering into the DOM.
- **Rate Limiting**: Sliding window IP rate limiter (5 submissions per minute) on API endpoints with bot honeypots.
- **Search Engine Optimization**: Standard sitemaps protocol conformant (`sitemap.xml`), clean canonical tags (`rel="canonical"`), and `robots.txt` configuration for Google Search Console.

---

## Connect & Social

- **Website**: [https://www.byteform.org/](https://www.byteform.org/)
- **Email**: [byteform3@gmail.com](mailto:byteform3@gmail.com)
- **LinkedIn**: [Byteform on LinkedIn](https://www.linkedin.com/company/byteform/)
- **Instagram**: [@byteform_](https://www.instagram.com/byteform_/)
- **Facebook**: [Byteform on Facebook](https://www.facebook.com/profile.php?id=61595005520939)

---

&copy; 2026 Byteform Digital Studio &middot; All rights reserved.
