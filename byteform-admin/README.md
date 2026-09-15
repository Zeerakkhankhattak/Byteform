# Byteform &middot; Private Admin Portal

A dedicated, secure administration portal for reviewing and managing candidate job applications submitted through the Byteform public website.

---

## Architecture

```text
       Candidate Submits Application
                    │
                    ▼
       Public Website (mycompany.com)
                    │
                    ▼
     Firebase Firestore ('applications')
                    │
                    ▼
   Private Admin Portal (admin.mycompany.com)
                    │
           Firebase Authentication
                    │
                    ▼
   Real-Time Applications Dashboard
   - Candidate details modal
   - Dynamic metrics & status pipelines
   - Search & filtering
```

---

## 1. Firebase Setup

Both the public website and this admin portal use the same unified Firebase project:
`byteform-website`

### A. Enable Firebase Authentication
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select the **byteform-website** project.
3. In the left navigation, click **Build > Authentication**.
4. Click **Get Started** (if not already enabled) and enable **Email/Password** under Sign-in providers.
5. In the **Users** tab, click **Add user**:
   - Enter your admin email (e.g. `admin@byteform.agency` or your personal admin email).
   - Set a strong password.
   - Click **Add user**.
6. This email and password will be used to log in at `admin.mycompany.com`.

### B. Apply Firestore Security Rules
1. In the Firebase Console, navigate to **Build > Firestore Database > Rules**.
2. Replace the rules with the contents of [`firestore.rules`](./firestore.rules):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /applications/{applicationId} {
         allow create: if request.resource.data.name is string
                       && request.resource.data.email is string
                       && request.resource.data.status == "New";
         allow read, update, delete: if request.auth != null;
       }
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
3. Click **Publish**.

---

## 2. Running Locally

### Option 1: Using Node.js
From this directory:
```bash
node server.js
```
The Admin Portal will be available at:
`http://localhost:3001`

### Option 2: Using npm
```bash
npm start
```

---

## 3. Deploying to Vercel (Separate Project)

As requested, deploy the Admin Portal as a **separate Vercel Project** so your existing website remains 100% untouched.

### Step-by-Step Vercel Deployment:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New... > Project**.
3. Select your repository (`byteformweb`).
4. In the **Configure Project** settings:
   - **Project Name:** `byteform-admin`
   - **Framework Preset:** `Other`
   - **Root Directory:** Click **Edit** and choose `byteform-admin`.
5. Click **Deploy**.

### Setting Up Your Custom Domain (`admin.[YOUR DOMAIN]`):
1. In the newly created `byteform-admin` project on Vercel, go to **Settings > Domains**.
2. Add your desired subdomain:
   ```text
   admin.yourdomain.com
   ```
   *(e.g., `admin.byteform.co`)*
3. Add the DNS CNAME record indicated by Vercel in your domain registrar / DNS provider:
   - **Type:** `CNAME`
   - **Name:** `admin`
   - **Value:** `cname.vercel-dns.com`
4. Once verified, your private admin portal is live at `https://admin.yourdomain.com`!

---

## 4. Features & Usage Guide

- **Executive Login:** Protected by Firebase Auth. Unauthenticated visitors are kept strictly on the login screen.
- **Metric Counters:** Live application counts for `Total`, `New`, `Reviewing`, `Shortlisted`, `Interview`, `Rejected`, and `Hired`. Clicking any metric card instantly filters the table.
- **Instant Search:** Search candidates by full name, email, or position.
- **Dynamic Filters:** Filter by specific position and status.
- **Status Workflow:** Update a candidate's pipeline status via the table dropdown or candidate profile modal. Statuses persist directly to Firestore with instant visual confirmation.
- **Candidate Profile Modal:** Displays candidate name, applied position, email (with 1-click copy button), portfolio/GitHub/LinkedIn link, experience notes, and formatted submission timestamp.
- **Privacy & Security:** As specified, no candidate CV or resume files are processed or stored in this phase.
