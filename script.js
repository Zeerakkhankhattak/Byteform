/* 
   BYTEFORM · Minimalist Digital Atelier & Tech Engineering
   Interactive Behaviors & Feature Logic
*/

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollProgress();
  initReviewsCarousel();
  initCareersModal();
  initScopeCalculator();
  initContactForm();
});

// 1. Theme Management (Default Dark)
function initTheme() {
  const savedTheme = localStorage.getItem('byteform_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('byteform_theme', next);
      updateThemeIcon(next);
    });
  }
}

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;
  if (theme === 'dark') {
    // Show sun icon to switch to light
    toggleBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    toggleBtn.setAttribute('title', 'Switch to light theme');
  } else {
    // Show moon icon to switch to dark
    toggleBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    toggleBtn.setAttribute('title', 'Switch to dark theme');
  }
}

// 2. Scroll Progress Bar
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total > 0) {
      const progress = (window.scrollY / total) * 100;
      bar.style.width = `${progress}%`;
    }
  });
}

// 3. Smooth Scroll
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    const headerHeight = 84;
    const pos = el.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    window.scrollTo({ top: pos, behavior: 'smooth' });
  }
}

// 4. Infinite Loop Reviews Carousel with Drag & Hold Support
function initReviewsCarousel() {
  const viewport = document.getElementById('reviews-viewport');
  const track = document.getElementById('reviews-track');
  const prevBtn = document.getElementById('reviews-prev');
  const nextBtn = document.getElementById('reviews-next');

  if (!viewport || !track) return;

  // Duplicate cards for seamless infinite sliding
  const originalCards = Array.from(track.children);
  originalCards.forEach(card => {
    const clone = card.cloneNode(true);
    track.appendChild(clone);
  });

  let currentPos = 0;
  let isDragging = false;
  let startX = 0;
  let dragOffset = 0;
  let isPaused = false;
  let animId = null;

  // Calculate card width + gap
  function getSingleCardSpan() {
    const firstCard = track.firstElementChild;
    if (!firstCard) return 400;
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.gap) || 24;
    return firstCard.offsetWidth + gap;
  }

  function getHalfWidth() {
    return (track.scrollWidth / 2);
  }

  // Animation Loop
  const speed = 0.75; // Pixels per frame

  function step() {
    if (!isPaused && !isDragging) {
      currentPos -= speed;
      const halfWidth = getHalfWidth();

      // Wrap around seamlessly
      if (Math.abs(currentPos) >= halfWidth) {
        currentPos += halfWidth;
      } else if (currentPos > 0) {
        currentPos -= halfWidth;
      }
      track.style.transform = `translateX(${currentPos}px)`;
    }
    animId = requestAnimationFrame(step);
  }

  animId = requestAnimationFrame(step);

  // Hold to Pause (Hover & Touch)
  viewport.addEventListener('mouseenter', () => {
    isPaused = true;
  });

  viewport.addEventListener('mouseleave', () => {
    if (!isDragging) isPaused = false;
  });

  // Drag Handling (Pointer events for mouse + touch)
  viewport.addEventListener('pointerdown', (e) => {
    isDragging = true;
    isPaused = true;
    startX = e.clientX;
    dragOffset = 0;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    startX = e.clientX;
    currentPos += diff;

    const halfWidth = getHalfWidth();
    if (Math.abs(currentPos) >= halfWidth) {
      currentPos += halfWidth;
    } else if (currentPos > 0) {
      currentPos -= halfWidth;
    }

    track.style.transform = `translateX(${currentPos}px)`;
  });

  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('is-dragging');
    // Brief delay before resuming auto-slide
    setTimeout(() => {
      isPaused = false;
    }, 400);
  }

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // Manual Previous / Next Arrow Controls
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      isPaused = true;
      const span = getSingleCardSpan();
      currentPos += span;
      const halfWidth = getHalfWidth();
      if (currentPos > 0) {
        currentPos -= halfWidth;
      }
      track.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      track.style.transform = `translateX(${currentPos}px)`;
      setTimeout(() => {
        track.style.transition = 'none';
        isPaused = false;
      }, 500);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      isPaused = true;
      const span = getSingleCardSpan();
      currentPos -= span;
      const halfWidth = getHalfWidth();
      if (Math.abs(currentPos) >= halfWidth) {
        currentPos += halfWidth;
      }
      track.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      track.style.transform = `translateX(${currentPos}px)`;
      setTimeout(() => {
        track.style.transition = 'none';
        isPaused = false;
      }, 500);
    });
  }
}

// 5. Careers & Join Our Team Modal Flow
function initCareersModal() {
  const modal = document.getElementById('apply-modal');
  const closeBtn = document.getElementById('close-apply-modal');
  const modalRoleInput = document.getElementById('apply-role');
  const applyForm = document.getElementById('careers-apply-form');
  const successState = document.getElementById('apply-success');

  if (!modal) return;

  // Open Modal triggers
  document.querySelectorAll('.open-apply-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const role = e.currentTarget.getAttribute('data-role') || 'General Application';
      if (modalRoleInput) modalRoleInput.value = role;
      if (applyForm) applyForm.style.display = 'flex';
      if (successState) successState.style.display = 'none';
      modal.classList.add('active');
    });
  });

  // Close Modal triggers
  function closeModal() {
    modal.classList.remove('active');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Handle Form Submit
  if (applyForm) {
    applyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = applyForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Submitting Application...</span>';
      }

      const payload = {
        name: (document.getElementById('apply-name')?.value || '').trim(),
        email: (document.getElementById('apply-email')?.value || '').trim(),
        position: (document.getElementById('apply-role')?.value || 'General Application').trim(),
        link: (document.getElementById('apply-link')?.value || '').trim(),
        notes: (document.getElementById('apply-notes')?.value || '').trim(),
        experience: (document.getElementById('apply-notes')?.value || '').trim(),
        status: 'New',
        submittedAt: new Date().toISOString()
      };

      // 1. Send to local server / fallback endpoint
      fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});

      // 2. Persist to Firebase Firestore
      try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
        const { getFirestore, collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        
        const firebaseConfig = {
          apiKey: "AIzaSyCqpW-onC0DfN9hmMGXhI1l6501QWLX5NQ",
          authDomain: "byteform-website.firebaseapp.com",
          projectId: "byteform-website",
          storageBucket: "byteform-website.firebasestorage.app",
          messagingSenderId: "126791292420",
          appId: "1:126791292420:web:f807ce86d55ea15862c751",
          measurementId: "G-67RTVMC4NT"
        };
        const app = initializeApp(firebaseConfig, "CareersSubmitter");
        const db = getFirestore(app);
        await addDoc(collection(db, "applications"), {
          ...payload,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore application submission info:", err);
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
      applyForm.reset();
      applyForm.style.display = 'none';
      if (successState) successState.style.display = 'block';
    });
  }
}

// 6. Interactive Scope Calculator (Clean & Free of Dashes)
let selectedScaleMult = 1.6;
let selectedScaleName = 'Production Build';

function toggleScopeService(el) {
  const activeCount = document.querySelectorAll('.scope-pill.active').length;
  if (el.classList.contains('active') && activeCount <= 1) return;
  el.classList.toggle('active');
  calculateScope();
}

function selectScale(mult, name, el) {
  selectedScaleMult = mult;
  selectedScaleName = name;
  document.querySelectorAll('.scale-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  el.classList.add('active');
  calculateScope();
}

function calculateScope() {
  const activePills = document.querySelectorAll('.scope-pill.active');
  let baseTotal = 0;
  let activeIds = [];

  activePills.forEach(p => {
    baseTotal += parseInt(p.getAttribute('data-price') || '0', 10);
    activeIds.push(p.getAttribute('data-id'));
  });

  const estTotal = Math.round(baseTotal * selectedScaleMult);
  const weeks = Math.max(2, Math.round(activePills.length * 1.4));

  const weeksEl = document.getElementById('scope-weeks');
  const priceEl = document.getElementById('scope-price');

  if (weeksEl) weeksEl.textContent = `${weeks} to ${weeks + 2}`;
  if (priceEl) {
    const low = Math.round(estTotal * 0.9).toLocaleString();
    const high = Math.round(estTotal * 1.15).toLocaleString();
    priceEl.textContent = `$${low} to $${high}`;
  }

  const squadContainer = document.getElementById('scope-founders');
  if (squadContainer) {
    squadContainer.innerHTML = '';
    if (activeIds.includes('web') || activeIds.includes('database')) {
      squadContainer.innerHTML += '<span class="pill pill-blue">Systems Lead</span> ';
    }
    if (activeIds.includes('uiux') || activeIds.includes('graphic') || activeIds.includes('social')) {
      squadContainer.innerHTML += '<span class="pill pill-blue">Design Lead</span> ';
    }
    if (activeIds.includes('cloud') || activeIds.includes('gamedev')) {
      squadContainer.innerHTML += '<span class="pill pill-blue">DevOps and 3D Lead</span> ';
    }
  }
}

function applyBriefToInquiry() {
  const activeNames = [];
  document.querySelectorAll('.scope-pill.active .scope-pill-title').forEach(d => {
    activeNames.push(d.textContent.trim());
  });

  const weeks = document.getElementById('scope-weeks')?.textContent || '4 to 6';
  const price = document.getElementById('scope-price')?.textContent || '$10,000 to $14,000';

  const servicesInput = document.getElementById('form-services');
  const messageInput = document.getElementById('form-message');

  if (servicesInput) servicesInput.value = activeNames.join(', ');
  if (messageInput) {
    messageInput.value = `Selected Scope Details:
Tier: ${selectedScaleName}
Timeline: ${weeks} Weeks
Estimated Range: ${price}
Capabilities: ${activeNames.join(', ')}

Looking forward to connecting with the founders.`;
  }

  scrollToSection('contact');
}

function initScopeCalculator() {
  calculateScope();
}

// 7. Contact Form Submission & Email Routing
function openMailClient(subjectText, bodyText) {
  const targetEmail = 'byteform3@gmail.com';
  const sub = encodeURIComponent(subjectText || 'Direct Inquiry for Byteform Founders');
  const body = encodeURIComponent(bodyText || 'Hello Byteform Founders,\n\nI would like to discuss an engineering project with you.\n\nBest regards,\n');

  const mailtoUrl = `mailto:${targetEmail}?subject=${sub}&body=${body}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${targetEmail}&su=${sub}&body=${body}`;

  // Launch system default mail app (Apple Mail, Outlook, Thunderbird, Windows Mail)
  window.location.href = mailtoUrl;

  // Also open Gmail web composer in a new tab for instant browser composing
  setTimeout(() => {
    window.open(gmailUrl, '_blank');
  }, 350);
}

function handleDirectEmailClick(e) {
  if (e) e.preventDefault();
  openMailClient('Direct Inquiry for Byteform Founders', 'Hello Byteform Founders,\n\nI would like to discuss an engineering project with you.\n\nBest regards,\n');
}

window.openMailClient = openMailClient;
window.handleDirectEmailClick = handleDirectEmailClick;

function initContactForm() {
  const forms = [document.getElementById('contact-form'), document.getElementById('inquiry-form')];
  
  forms.forEach(form => {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (form.querySelector('#contact-name') || form.querySelector('[name="name"]') || {}).value || 'Client';
      const email = (form.querySelector('#contact-email') || form.querySelector('[name="email"]') || {}).value || '';
      const interest = (form.querySelector('#contact-interest') || {}).value || 'Full Stack Web Platform';
      const budget = (form.querySelector('#contact-budget') || {}).value || 'Standard';
      const message = (form.querySelector('#contact-message') || {}).value || '';

      const feedback = document.getElementById('contact-feedback') || document.getElementById('form-success');
      const submitBtn = form.querySelector('button[type="submit"]');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
          <span>Sending Brief...</span>
        `;
      }

      // Send to local server / backend logger
      const payload = { name, email, interest, budget, message };
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});

      // Build pre-filled email
      const emailSubject = `Project Brief from ${name} [${interest}]`;
      const emailBody = `Sender Name: ${name}\nSender Email: ${email}\nProject Track: ${interest}\nEstimated Investment: ${budget}\n\nProject Scope & Targets:\n${message}\n`;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=byteform3@gmail.com&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      const mailtoUrl = `mailto:byteform3@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      setTimeout(() => {
        // Trigger mail app
        window.location.href = mailtoUrl;

        if (submitBtn) {
          submitBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Brief Transmitted</span>
          `;
          submitBtn.style.background = '#10b981';
          submitBtn.style.borderColor = '#10b981';
        }

        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.color = 'var(--text-primary)';
          feedback.style.background = 'rgba(16, 185, 129, 0.12)';
          feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
          feedback.style.padding = '1.2rem 1.4rem';
          feedback.style.borderRadius = '12px';
          feedback.style.textAlign = 'left';
          feedback.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 0.4rem; color: #10b981; font-size: 1rem;">
              ✓ Brief Logged for byteform3@gmail.com
            </div>
            <p style="font-size: 0.92rem; line-height: 1.55; color: var(--text-secondary); margin-bottom: 0.85rem;">
              Your mail app has been launched. If you prefer to compose in Gmail Web directly, click below:
            </p>
            <a href="${gmailUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;">
              <span>Open in Gmail Web</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </a>
          `;
        }
      }, 600);
    });
  });
}

function copyEmail(btn) {
  navigator.clipboard.writeText('byteform3@gmail.com').then(() => {
    const span = btn ? btn.querySelector('span') : null;
    const orig = span ? span.textContent : 'COPY';
    if (span) span.textContent = 'COPIED';
    if (btn) {
      btn.style.color = 'var(--accent-blue)';
      btn.style.borderColor = 'var(--accent-blue)';
    }
    setTimeout(() => {
      if (span) span.textContent = orig;
      if (btn) {
        btn.style.color = '';
        btn.style.borderColor = '';
      }
    }, 2000);
  });
}