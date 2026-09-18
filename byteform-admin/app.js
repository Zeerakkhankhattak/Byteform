// ============================================================================
// BYTEFORM PRIVATE ADMIN PORTAL - CLIENT APPLICATION ENGINE
// ============================================================================

import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  collection, 
  doc, 
  updateDoc, 
  onSnapshot 
} from "./firebase-config.js";

// Application State
let applicationsData = [];
let currentFilterStatus = "All";
let currentFilterPosition = "All";
let searchQuery = "";
let currentSort = "newest";
let selectedApplicationId = null;
let unsubscribeSnapshot = null;

// DOM Elements
const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const loginForm = document.getElementById("login-form");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginSubmitBtn = document.getElementById("login-submit-btn");
const demoModeBtn = document.getElementById("demo-mode-btn");
const loginErrorBox = document.getElementById("login-error");
const loginErrorText = document.getElementById("login-error-text");
const togglePasswordBtn = document.getElementById("toggle-password-btn");
const forgotPasswordLink = document.getElementById("forgot-password-link");

let isDemoMode = false;
const SAMPLE_APPLICATIONS = [
  {
    id: "demo_01",
    name: "Alex Vance",
    email: "alex.vance@engineering.dev",
    position: "Full Stack Developer",
    link: "https://github.com/alexvance",
    experience: "5+ years building distributed cloud platforms with Next.js 15, Node.js, and PostgreSQL. Architected microservices handling 20k req/s.",
    status: "Reviewing",
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: "demo_02",
    name: "Elena Rostova",
    email: "elena@motioncraft.design",
    position: "Video Editor",
    link: "https://vimeo.com/elenarostova",
    experience: "Specialized in kinetic typography, 3D product pacing, and After Effects micro-animations for enterprise SaaS launches.",
    status: "Shortlisted",
    submittedAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: "demo_03",
    name: "Marcus Chen",
    email: "marcus.chen@infraops.cloud",
    position: "DevOps Engineer",
    link: "https://linkedin.com/in/marcuschen-devops",
    experience: "Kubernetes orchestration, Terraform automation across multi-region AWS and GCP. 99.99% uptime track record.",
    status: "New",
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "demo_04",
    name: "Sophia Martinez",
    email: "sophia@organicgrowth.co",
    position: "SEO Specialist",
    link: "https://sophiamartinez.me",
    experience: "Programmatic SEO architecture, Core Web Vitals optimization, schema engineering. Grew organic search traffic 400% in 9 months.",
    status: "Interview",
    submittedAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

const adminUserEmail = document.getElementById("admin-user-email");
const adminAvatar = document.getElementById("admin-avatar");
const logoutBtn = document.getElementById("logout-btn");
const refreshDataBtn = document.getElementById("refresh-data-btn");

const countTotalEl = document.getElementById("count-total");
const countNewEl = document.getElementById("count-new");
const countReviewingEl = document.getElementById("count-reviewing");
const countShortlistedEl = document.getElementById("count-shortlisted");
const countInterviewEl = document.getElementById("count-interview");
const countRejectedEl = document.getElementById("count-rejected");
const countHiredEl = document.getElementById("count-hired");

const searchInput = document.getElementById("search-input");
const filterPositionSelect = document.getElementById("filter-position");
const filterStatusSelect = document.getElementById("filter-status");
const sortOrderSelect = document.getElementById("sort-order");
const resetFiltersBtn = document.getElementById("reset-filters-btn");
const metricCards = document.querySelectorAll(".metric-card");

const tableBody = document.getElementById("applications-tbody");
const emptyState = document.getElementById("table-empty-state");

const detailModal = document.getElementById("detail-modal-overlay");
const closeDetailModalBtn = document.getElementById("close-detail-modal-btn");
const modalCandidateName = document.getElementById("modal-candidate-name");
const modalCandidatePosition = document.getElementById("modal-candidate-position");
const modalCandidateEmail = document.getElementById("modal-candidate-email");
const modalCandidateLink = document.getElementById("modal-candidate-link");
const modalCandidateNotes = document.getElementById("modal-candidate-notes");
const modalSubmittedDate = document.getElementById("modal-submitted-date");
const modalStatusSelect = document.getElementById("modal-status-select");
const saveStatusBtn = document.getElementById("save-status-btn");
const copyEmailBtn = document.getElementById("copy-email-btn");

// ============================================================================
// 1. AUTHENTICATION LIFECYCLE
// ============================================================================

// Monitor Firebase Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Authenticated Admin User
    loginScreen.style.display = "none";
    dashboardScreen.style.display = "block";
    adminUserEmail.textContent = user.email || "Admin User";
    adminAvatar.textContent = (user.email ? user.email.charAt(0).toUpperCase() : "A");

    // Initialize real-time applications sync
    initFirestoreSync();
  } else {
    // Unauthenticated State
    dashboardScreen.style.display = "none";
    loginScreen.style.display = "flex";
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    applicationsData = [];
  }
});

// Login Form Submission
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideLoginError();

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
      showLoginError("Please provide both email and password.");
      return;
    }

    setButtonLoading(loginSubmitBtn, true, "Signing In...");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Signed in successfully", "success");
      loginForm.reset();
    } catch (error) {
      console.error("Login authentication error:", error);
      let message = "Failed to sign in. Please verify your admin credentials.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        message = "Invalid administrator email or password. (Make sure this user is added in Firebase Console > Authentication > Users, or click 'Preview Dashboard in Demo Mode' below).";
      } else if (error.code === "auth/too-many-requests") {
        message = "Access temporarily blocked due to repeated failed attempts. Try again later.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection.";
      }
      showLoginError(message);
    } finally {
      setButtonLoading(loginSubmitBtn, false, "Sign In to Dashboard");
    }
  });
}

// Password Visibility Toggle
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = loginPasswordInput.getAttribute("type") === "password";
    loginPasswordInput.setAttribute("type", isPassword ? "text" : "password");
    togglePasswordBtn.style.color = isPassword ? "var(--text-primary)" : "var(--text-muted)";
  });
}

// Forgot Password Handler
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value.trim() || prompt("Enter your administrator email address for password reset:");
    if (!email) return;

    try {
      await sendPasswordResetEmail(auth, email);
      showToast(`Password reset link sent to ${email}`, "success");
    } catch (err) {
      console.error("Password reset error:", err);
      showToast("Unable to send reset email: " + (err.message || "User not found"), "error");
    }
  });
}

// Logout Handler
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (isDemoMode) {
      isDemoMode = false;
      dashboardScreen.style.display = "none";
      loginScreen.style.display = "flex";
      applicationsData = [];
      showToast("Signed out of demo mode", "success");
      return;
    }
    try {
      await signOut(auth);
      showToast("Signed out successfully", "success");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  });
}

// Demo Mode Handler
if (demoModeBtn) {
  demoModeBtn.addEventListener("click", async () => {
    isDemoMode = true;
    hideLoginError();
    loginScreen.style.display = "none";
    dashboardScreen.style.display = "block";
    adminUserEmail.textContent = "admin@byteform.agency (Demo / Local)";
    adminAvatar.textContent = "A";

    const externalApps = await fetchExternalApplications();
    const existingIds = new Set(externalApps.map(a => a.id));
    const samples = SAMPLE_APPLICATIONS.filter(s => !existingIds.has(s.id));
    const merged = [...externalApps, ...samples];

    applicationsData = merged;
    updateDistinctPositions(merged);
    updateMetrics(merged);
    renderApplicationsTable();
    if (externalApps.length > 0) {
      showToast(`Dashboard active: ${externalApps.length} submitted application(s) loaded`, "success");
    } else {
      showToast("Demo Mode active with sample applicant pipeline", "success");
    }
  });
}

function showLoginError(msg) {
  if (loginErrorBox && loginErrorText) {
    loginErrorText.textContent = msg;
    loginErrorBox.style.display = "flex";
  }
}

function hideLoginError() {
  if (loginErrorBox) {
    loginErrorBox.style.display = "none";
  }
}

// ============================================================================
// 2. MULTI-LAYER APPLICATIONS SYNCHRONIZATION & REALTIME CHANNELS
// ============================================================================

// Real-time synchronization channels (Instant cross-tab updates without refresh)
if (typeof BroadcastChannel !== "undefined") {
  try {
    const channel = new BroadcastChannel("byteform_applications_channel");
    channel.onmessage = (event) => {
      if (event.data && event.data.type === "NEW_APPLICATION" && event.data.application) {
        handleIncomingRealtimeApplication(normalizeApplicationObject(event.data.application));
      }
    };
  } catch (e) {}
}

window.addEventListener("storage", (e) => {
  if (e.key === "byteform_applications") {
    syncLocalApplications();
  }
});

function handleIncomingRealtimeApplication(newApp) {
  if (!newApp || !newApp.id) return;
  const existsIndex = applicationsData.findIndex(a => a.id === newApp.id);
  if (existsIndex >= 0) {
    applicationsData[existsIndex] = newApp;
  } else {
    applicationsData.unshift(newApp);
  }
  updateDistinctPositions(applicationsData);
  updateMetrics(applicationsData);
  renderApplicationsTable();
  showToast(`New candidate applied: ${newApp.name} (${newApp.position})`, "success");
}

async function syncLocalApplications() {
  const externalApps = await fetchExternalApplications();
  if (externalApps.length > 0) {
    const map = new Map();
    applicationsData.forEach(a => map.set(a.id, a));
    externalApps.forEach(a => {
      if (!map.has(a.id)) {
        map.set(a.id, a);
      }
    });
    applicationsData = Array.from(map.values());
    updateDistinctPositions(applicationsData);
    updateMetrics(applicationsData);
    renderApplicationsTable();
  }
}

async function fetchExternalApplications() {
  const allApps = [];
  const seenIds = new Set();

  // 1. Read from localStorage
  try {
    const localRaw = localStorage.getItem("byteform_applications");
    if (localRaw) {
      const localParsed = JSON.parse(localRaw);
      if (Array.isArray(localParsed)) {
        localParsed.forEach(app => {
          if (app && app.id && !seenIds.has(app.id)) {
            seenIds.add(app.id);
            allApps.push(normalizeApplicationObject(app));
          }
        });
      }
    }
  } catch (e) {
    console.warn("Could not read localStorage applications:", e);
  }

  // 2. Fetch from /api/applications
  const apiUrls = ["/api/applications"];
  if (window.location.port === "3001") {
    apiUrls.push("http://localhost:3000/api/applications");
  } else if (window.location.port === "3000") {
    apiUrls.push("http://localhost:3001/api/applications");
  }

  for (const url of apiUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const list = json.applications || (Array.isArray(json) ? json : []);
        list.forEach(app => {
          if (app && app.id && !seenIds.has(app.id)) {
            seenIds.add(app.id);
            allApps.push(normalizeApplicationObject(app));
          }
        });
        break;
      }
    } catch (e) {}
  }

  return allApps;
}

function normalizeApplicationObject(data) {
  return {
    id: data.id || ("app_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6)),
    name: data.name || "Anonymous Applicant",
    email: data.email || "No email",
    position: data.position || data.role || "General Application",
    link: data.link || data.portfolioUrl || "",
    experience: data.experience || data.notes || data.coverLetter || "No notes provided.",
    status: normalizeStatus(data.status),
    submittedAt: data.submittedAt || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString())
  };
}

function initFirestoreSync() {
  const appsCol = collection(db, "applications");

  // Real-time listener on the applications collection
  try {
    unsubscribeSnapshot = onSnapshot(appsCol, async (snapshot) => {
      const apps = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        apps.push(normalizeApplicationObject({ ...data, id: docSnap.id }));
      });

      // Merge with API and local storage applications
      const externalApps = await fetchExternalApplications();
      const firestoreIds = new Set(apps.map(a => a.id));
      externalApps.forEach(ext => {
        if (!firestoreIds.has(ext.id)) {
          apps.push(ext);
        }
      });

      applicationsData = apps;
      updateDistinctPositions(apps);
      updateMetrics(apps);
      renderApplicationsTable();
    }, async (error) => {
      console.warn("Firestore sync unavailable, switching to internal API & local storage:", error.message);
      const externalApps = await fetchExternalApplications();
      applicationsData = externalApps;
      updateDistinctPositions(externalApps);
      updateMetrics(externalApps);
      renderApplicationsTable();
      if (externalApps.length > 0) {
        showToast(`Loaded ${externalApps.length} application(s) from local storage`, "success");
      }
    });
  } catch (err) {
    console.warn("Firestore error, loading from local API:", err);
    fetchExternalApplications().then(externalApps => {
      applicationsData = externalApps;
      updateDistinctPositions(externalApps);
      updateMetrics(externalApps);
      renderApplicationsTable();
    });
  }
}

// Manual Sync Button
if (refreshDataBtn) {
  refreshDataBtn.addEventListener("click", async () => {
    showToast("Synchronizing applications...", "success");
    const externalApps = await fetchExternalApplications();
    if (isDemoMode) {
      const existingIds = new Set(externalApps.map(a => a.id));
      const samples = SAMPLE_APPLICATIONS.filter(s => !existingIds.has(s.id));
      applicationsData = [...externalApps, ...samples];
    } else if (externalApps.length > 0) {
      const map = new Map();
      applicationsData.forEach(a => map.set(a.id, a));
      externalApps.forEach(a => {
        if (!map.has(a.id)) {
          map.set(a.id, a);
        }
      });
      applicationsData = Array.from(map.values());
    }
    updateDistinctPositions(applicationsData);
    updateMetrics(applicationsData);
    renderApplicationsTable();
  });
}

function normalizeStatus(status) {
  const s = (status || "").toLowerCase().trim();
  if (s === "new") return "New";
  if (s === "reviewing" || s === "in review") return "Reviewing";
  if (s === "shortlisted" || s === "shortlist") return "Shortlisted";
  if (s === "interview" || s === "interviewing") return "Interview";
  if (s === "rejected" || s === "reject") return "Rejected";
  if (s === "hired" || s === "hire") return "Hired";
  return "New";
}

// ============================================================================
// 3. METRICS & COUNTERS
// ============================================================================

function updateMetrics(apps) {
  const counts = {
    total: apps.length,
    new: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    rejected: 0,
    hired: 0
  };

  apps.forEach((app) => {
    const s = (app.status || "New").toLowerCase();
    if (s === "new") counts.new++;
    else if (s === "reviewing") counts.reviewing++;
    else if (s === "shortlisted") counts.shortlisted++;
    else if (s === "interview") counts.interview++;
    else if (s === "rejected") counts.rejected++;
    else if (s === "hired") counts.hired++;
  });

  if (countTotalEl) countTotalEl.textContent = counts.total;
  if (countNewEl) countNewEl.textContent = counts.new;
  if (countReviewingEl) countReviewingEl.textContent = counts.reviewing;
  if (countShortlistedEl) countShortlistedEl.textContent = counts.shortlisted;
  if (countInterviewEl) countInterviewEl.textContent = counts.interview;
  if (countRejectedEl) countRejectedEl.textContent = counts.rejected;
  if (countHiredEl) countHiredEl.textContent = counts.hired;
}

// Populate Distinct Positions in Filter
function updateDistinctPositions(apps) {
  if (!filterPositionSelect) return;
  const currentVal = filterPositionSelect.value;
  const positions = new Set();

  apps.forEach(app => {
    if (app.position) positions.add(app.position);
  });

  const sorted = Array.from(positions).sort();
  filterPositionSelect.innerHTML = `<option value="All">All Positions</option>`;
  sorted.forEach(pos => {
    const opt = document.createElement("option");
    opt.value = pos;
    opt.textContent = pos;
    filterPositionSelect.appendChild(opt);
  });

  if (positions.has(currentVal)) {
    filterPositionSelect.value = currentVal;
  }
}

// ============================================================================
// 4. FILTERING, SEARCHING & SORTING
// ============================================================================

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderApplicationsTable();
  });
}

if (filterPositionSelect) {
  filterPositionSelect.addEventListener("change", (e) => {
    currentFilterPosition = e.target.value;
    renderApplicationsTable();
  });
}

if (filterStatusSelect) {
  filterStatusSelect.addEventListener("change", (e) => {
    currentFilterStatus = e.target.value;
    updateActiveMetricCard(currentFilterStatus);
    renderApplicationsTable();
  });
}

if (sortOrderSelect) {
  sortOrderSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderApplicationsTable();
  });
}

// Clicking Metric Cards to Quick Filter
metricCards.forEach((card) => {
  card.addEventListener("click", () => {
    const filter = card.getAttribute("data-filter") || "All";
    currentFilterStatus = filter;
    if (filterStatusSelect) filterStatusSelect.value = filter;
    updateActiveMetricCard(filter);
    renderApplicationsTable();
  });
});

function updateActiveMetricCard(filter) {
  metricCards.forEach((c) => {
    if (c.getAttribute("data-filter") === filter) {
      c.classList.add("active");
    } else {
      c.classList.remove("active");
    }
  });
}

if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener("click", () => {
    searchQuery = "";
    currentFilterStatus = "All";
    currentFilterPosition = "All";
    currentSort = "newest";

    if (searchInput) searchInput.value = "";
    if (filterStatusSelect) filterStatusSelect.value = "All";
    if (filterPositionSelect) filterPositionSelect.value = "All";
    if (sortOrderSelect) sortOrderSelect.value = "newest";

    updateActiveMetricCard("All");
    renderApplicationsTable();
  });
}

// ============================================================================
// 5. APPLICATIONS TABLE RENDERING
// ============================================================================

function renderApplicationsTable() {
  if (!tableBody) return;

  // Filter applications
  let filtered = applicationsData.filter((app) => {
    // Status Filter
    if (currentFilterStatus !== "All" && app.status !== currentFilterStatus) {
      return false;
    }
    // Position Filter
    if (currentFilterPosition !== "All" && app.position !== currentFilterPosition) {
      return false;
    }
    // Search Query (Name or Email)
    if (searchQuery) {
      const matchName = app.name.toLowerCase().includes(searchQuery);
      const matchEmail = app.email.toLowerCase().includes(searchQuery);
      const matchPos = app.position.toLowerCase().includes(searchQuery);
      if (!matchName && !matchEmail && !matchPos) return false;
    }
    return true;
  });

  // Sort applications
  filtered.sort((a, b) => {
    const timeA = new Date(a.submittedAt).getTime() || 0;
    const timeB = new Date(b.submittedAt).getTime() || 0;
    return currentSort === "newest" ? (timeB - timeA) : (timeA - timeB);
  });

  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  } else {
    if (emptyState) emptyState.style.display = "none";
  }

  filtered.forEach((app) => {
    const tr = document.createElement("tr");

    // Format Date
    const formattedDate = formatDateString(app.submittedAt);
    const statusClass = `status-${app.status.toLowerCase()}`;

    tr.innerHTML = `
      <td>
        <div class="candidate-meta">
          <span class="candidate-name">${escapeHtml(app.name)}</span>
          <span class="candidate-email mono">${escapeHtml(app.email)}</span>
        </div>
      </td>
      <td>
        <span class="position-badge">${escapeHtml(app.position)}</span>
      </td>
      <td>
        <select class="status-select-inline" data-id="${app.id}">
          <option value="New" ${app.status === 'New' ? 'selected' : ''}>New</option>
          <option value="Reviewing" ${app.status === 'Reviewing' ? 'selected' : ''}>Reviewing</option>
          <option value="Shortlisted" ${app.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
          <option value="Interview" ${app.status === 'Interview' ? 'selected' : ''}>Interview</option>
          <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
          <option value="Hired" ${app.status === 'Hired' ? 'selected' : ''}>Hired</option>
        </select>
      </td>
      <td class="mono" style="font-size: 0.8rem; color: var(--text-muted);">
        ${formattedDate}
      </td>
      <td style="text-align: right;">
        <button class="btn btn-secondary btn-sm view-app-btn" data-id="${app.id}">
          <span>View Profile</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </td>
    `;

    // Inline Status Change Event
    const statusSelect = tr.querySelector(".status-select-inline");
    if (statusSelect) {
      statusSelect.addEventListener("change", async (e) => {
        const newStatus = e.target.value;
        await updateApplicationStatus(app.id, newStatus, app.name);
      });
    }

    // View Application Details
    const viewBtn = tr.querySelector(".view-app-btn");
    if (viewBtn) {
      viewBtn.addEventListener("click", () => {
        openCandidateModal(app.id);
      });
    }

    tableBody.appendChild(tr);
  });
}

// ============================================================================
// 6. CANDIDATE DETAILS MODAL (STRICTLY NO CV SECTION)
// ============================================================================

function openCandidateModal(appId) {
  const app = applicationsData.find(a => a.id === appId);
  if (!app) return;

  selectedApplicationId = appId;
  modalCandidateName.textContent = app.name;
  modalCandidatePosition.textContent = app.position;
  modalCandidateEmail.textContent = app.email;
  modalCandidateNotes.textContent = app.experience || "No experience summary or notes provided.";
  modalSubmittedDate.textContent = `Submitted on ${formatFullDate(app.submittedAt)}`;
  modalStatusSelect.value = app.status;

  // Handle Portfolio / Profile link
  if (app.link && app.link.trim()) {
    let cleanUrl = app.link.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    modalCandidateLink.href = cleanUrl;
    modalCandidateLink.innerHTML = `<span>Visit Profile Link &rarr;</span>`;
    modalCandidateLink.style.display = "inline-flex";
  } else {
    modalCandidateLink.href = "#";
    modalCandidateLink.innerHTML = `<span style="color: var(--text-muted);">No link provided</span>`;
    modalCandidateLink.removeAttribute("target");
  }

  detailModal.classList.add("active");
}

function closeCandidateModal() {
  detailModal.classList.remove("active");
  selectedApplicationId = null;
}

if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", closeCandidateModal);

if (detailModal) {
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) closeCandidateModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && detailModal.classList.contains("active")) {
    closeCandidateModal();
  }
});

// Copy Candidate Email
if (copyEmailBtn) {
  copyEmailBtn.addEventListener("click", () => {
    const email = modalCandidateEmail.textContent;
    if (navigator.clipboard && email) {
      navigator.clipboard.writeText(email).then(() => {
        showToast("Email copied to clipboard", "success");
      });
    }
  });
}

// Save Status from Modal
if (saveStatusBtn) {
  saveStatusBtn.addEventListener("click", async () => {
    if (!selectedApplicationId) return;
    const newStatus = modalStatusSelect.value;
    const app = applicationsData.find(a => a.id === selectedApplicationId);
    await updateApplicationStatus(selectedApplicationId, newStatus, app ? app.name : "Candidate");
  });
}

// Update Status across all persistent stores
async function updateApplicationStatus(appId, newStatus, candidateName) {
  // 1. Update in-memory state and re-render immediately
  const target = applicationsData.find(a => a.id === appId);
  if (target) target.status = newStatus;
  updateMetrics(applicationsData);
  renderApplicationsTable();

  // 2. Persist to localStorage
  try {
    const stored = JSON.parse(localStorage.getItem("byteform_applications") || "[]");
    const idx = stored.findIndex(a => a.id === appId);
    if (idx >= 0) {
      stored[idx].status = newStatus;
      stored[idx].updatedAt = new Date().toISOString();
      localStorage.setItem("byteform_applications", JSON.stringify(stored));
    }
  } catch (err) {}

  // 3. Persist to backend /api/applications via PATCH
  const patchPayload = JSON.stringify({ id: appId, status: newStatus });
  fetch("/api/applications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: patchPayload
  }).catch(() => {});

  if (window.location.port === "3001") {
    fetch("http://localhost:3000/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: patchPayload
    }).catch(() => {});
  }

  // 4. Try Firestore if not in pure demo mode
  if (!isDemoMode) {
    try {
      const docRef = doc(db, "applications", appId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn("Firestore status update skipped or unavailable:", error.message);
    }
  }

  showToast(`Status for ${candidateName} updated to "${newStatus}"`, "success");
}

// ============================================================================
// 7. TOAST NOTIFICATIONS & HELPERS
// ============================================================================

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const icon = type === "success" 
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  toast.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setButtonLoading(btn, isLoading, text) {
  if (!btn) return;
  btn.disabled = isLoading;
  const span = btn.querySelector("span");
  if (span) span.textContent = text;
}

function formatDateString(iso) {
  if (!iso) return "Recent";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Recent";
    const now = new Date();
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recent";
  }
}

function formatFullDate(iso) {
  if (!iso) return "Unknown Date";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  } catch {
    return iso;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
