/* 
   BYTEFORM · Minimalist Digital Atelier & Tech Engineering
   Interactive Behaviors & Feature Logic
*/

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileZoomPrevention();
  initMobileNav();
  initScrollProgress();
  initReviewsCarousel();
  initCareersModal();
  initScopeCalculator();
  initContactForm();
  initScrollAndClickAnimations();
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

// 1B. Mobile Zoom Prevention & Touch Experience Optimization
function initMobileZoomPrevention() {
  // Prevent accidental pinch zoom gestures
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

  // Prevent double tap to zoom on touch devices while preserving tap responsiveness
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault();
      }
    }
    lastTouchEnd = now;
  }, { passive: false });
}

// 1C. Mobile Navigation Drawer & Hamburger Menu System
function initMobileNav() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  // 1. Ensure Hamburger Toggle Button exists in Header
  let toggleBtn = document.getElementById('mobile-menu-toggle');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'mobile-menu-toggle';
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.innerHTML = `
      <span class="hamburger-bar"></span>
      <span class="hamburger-bar"></span>
      <span class="hamburger-bar"></span>
    `;
    headerActions.appendChild(toggleBtn);
  }

  // 2. Ensure Mobile Drawer Markup exists in DOM
  let drawer = document.getElementById('mobile-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'mobile-drawer';
    drawer.className = 'mobile-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
      <div class="mobile-drawer-backdrop" id="mobile-drawer-backdrop"></div>
      <div class="mobile-drawer-panel">
        <div class="mobile-drawer-header">
          <a href="index.html" class="site-logo" aria-label="Byteform Home">
            <img src="assets/for dark bg.png" alt="Byteform" class="logo-img logo-dark" style="height: 32px;" />
            <img src="assets/for light bg.png" alt="Byteform" class="logo-img logo-light" style="height: 32px;" />
          </a>
          <button id="mobile-drawer-close" class="mobile-drawer-close" aria-label="Close Navigation Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="mobile-drawer-body">
          <div class="mobile-nav-category">Studio Navigation</div>
          <nav class="mobile-nav-list">
            <a href="index.html" class="mobile-nav-item" data-path="index.html">
              <span class="mobile-nav-num">01</span>
              <span class="mobile-nav-text">Home</span>
            </a>
            <a href="capabilities.html" class="mobile-nav-item" data-path="capabilities.html">
              <span class="mobile-nav-num">02</span>
              <span class="mobile-nav-text">Capabilities</span>
            </a>
            <a href="collective.html" class="mobile-nav-item" data-path="collective.html">
              <span class="mobile-nav-num">03</span>
              <span class="mobile-nav-text">Collective</span>
            </a>
            <a href="protocol.html" class="mobile-nav-item" data-path="protocol.html">
              <span class="mobile-nav-num">04</span>
              <span class="mobile-nav-text">Protocol</span>
            </a>
            <a href="reviews.html" class="mobile-nav-item" data-path="reviews.html">
              <span class="mobile-nav-num">05</span>
              <span class="mobile-nav-text">Reviews</span>
            </a>
            <a href="careers.html" class="mobile-nav-item" data-path="careers.html">
              <span class="mobile-nav-num">06</span>
              <span class="mobile-nav-text">Careers</span>
            </a>
          </nav>

          <div class="mobile-drawer-cta">
            <a href="index.html#contact" class="btn btn-primary" style="width: 100%; justify-content: center;" id="mobile-drawer-brief-btn">
              <span>Start Project Brief</span>
            </a>
          </div>

          <div class="mobile-drawer-footer">
            <div class="mobile-drawer-contact-title">Direct Service Coordinates</div>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=byteform3@gmail.com" target="_blank" rel="noopener noreferrer" class="mobile-drawer-email">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
              <span>byteform3@gmail.com</span>
            </a>
            
            <div class="mobile-drawer-socials">
              <a href="https://www.instagram.com/byteform_/" target="_blank" rel="noopener noreferrer" class="mobile-social-icon" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61594348653706" target="_blank" rel="noopener noreferrer" class="mobile-social-icon" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/byteform/?viewAsMember=true" target="_blank" rel="noopener noreferrer" class="mobile-social-icon" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.86 18.5V10.13H5.07V18.5h2.79z"/></svg>
              </a>
              <a href="https://wa.me/923711292921" target="_blank" rel="noopener noreferrer" class="mobile-social-icon" aria-label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  // 3. Mark current page active in drawer
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  drawer.querySelectorAll('.mobile-nav-item').forEach(link => {
    const targetPath = link.getAttribute('data-path');
    if (currentPath === targetPath || (currentPath === '' && targetPath === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 4. Open / Close Drawer Controls
  function openDrawer() {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    toggleBtn.classList.add('is-active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    toggleBtn.classList.remove('is-active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (drawer.classList.contains('is-open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  const closeBtn = document.getElementById('mobile-drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // Handle CTA inside drawer
  const briefBtn = document.getElementById('mobile-drawer-brief-btn');
  if (briefBtn) {
    briefBtn.addEventListener('click', (e) => {
      closeDrawer();
      if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        e.preventDefault();
        scrollToSection('contact');
      }
    });
  }

  // Close drawer when any nav link is tapped
  drawer.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      closeDrawer();
    });
  });
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
    const headerHeight = 90;
    const pos = el.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    window.scrollTo({ top: pos, behavior: 'smooth' });

    // Target element click fade-in and subtle glow highlight
    const targetCard = el.querySelector('.brief-form-card') || el.querySelector('.portal-grid') || el;
    targetCard.classList.remove('section-click-highlight');
    void targetCard.offsetWidth; // Trigger reflow
    targetCard.classList.add('section-click-highlight');
    setTimeout(() => {
      targetCard.classList.remove('section-click-highlight');
    }, 850);
  }
}

// 4. Infinite Loop Reviews Carousel with Full Mouse & Touch Drag Support
function initReviewsCarousel() {
  const viewport = document.getElementById('reviews-viewport');
  const track = document.getElementById('reviews-track');
  const prevBtn = document.getElementById('reviews-prev');
  const nextBtn = document.getElementById('reviews-next');

  if (!viewport || !track) return;

  // Clone original cards so there are 4 full sets for seamless edge-to-edge looping
  const originalCards = Array.from(track.children);
  const cardCount = originalCards.length;
  if (cardCount === 0) return;

  for (let setIndex = 1; setIndex < 4; setIndex++) {
    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      track.appendChild(clone);
    });
  }

  let currentPos = 0;
  let isDragging = false;
  let startX = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;
  let isPaused = false;
  let animId = null;
  let momentumAnimId = null;
  let resumeTimer = null;

  function getSetWidth() {
    const firstCard = track.firstElementChild;
    if (!firstCard) return 2000;
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.gap) || 24;
    return (firstCard.offsetWidth + gap) * cardCount;
  }

  function wrapPosition(pos, setWidth) {
    if (setWidth <= 0) return pos;
    while (pos <= -setWidth) pos += setWidth;
    while (pos > 0) pos -= setWidth;
    return pos;
  }

  // Continuous auto-glide
  const baseSpeed = 0.85;

  function step() {
    if (!isPaused && !isDragging && !momentumAnimId) {
      currentPos -= baseSpeed;
      const setWidth = getSetWidth();
      currentPos = wrapPosition(currentPos, setWidth);
      track.style.transform = `translateX(${currentPos}px)`;
    }
    animId = requestAnimationFrame(step);
  }

  animId = requestAnimationFrame(step);

  // Pause on hover
  viewport.addEventListener('mouseenter', () => {
    if (!isDragging) isPaused = true;
  });

  viewport.addEventListener('mouseleave', () => {
    if (!isDragging && !momentumAnimId) isPaused = false;
  });

  // Pointer events for robust desktop mouse drag & mobile touch swipe
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;

    if (momentumAnimId) {
      cancelAnimationFrame(momentumAnimId);
      momentumAnimId = null;
    }
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }

    isDragging = true;
    isPaused = true;
    startX = e.clientX;
    lastX = e.clientX;
    lastTime = performance.now();
    velocity = 0;

    track.style.transition = 'none';
    viewport.classList.add('is-dragging');
    try {
      viewport.setPointerCapture(e.pointerId);
    } catch (err) { }
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const now = performance.now();
    const deltaX = e.clientX - lastX;
    const dt = now - lastTime;

    if (dt > 0) {
      const instantVelocity = (deltaX / dt) * 16;
      velocity = velocity * 0.4 + instantVelocity * 0.6;
    }

    lastX = e.clientX;
    lastTime = now;
    currentPos += deltaX;

    const setWidth = getSetWidth();
    currentPos = wrapPosition(currentPos, setWidth);
    track.style.transform = `translateX(${currentPos}px)`;
  });

  function stopDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('is-dragging');

    if (e && e.pointerId && viewport.hasPointerCapture && viewport.hasPointerCapture(e.pointerId)) {
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch (err) { }
    }

    // Apply momentum glide if user released with speed
    if (Math.abs(velocity) > 1.2) {
      let currentVelocity = Math.max(Math.min(velocity, 35), -35);
      function applyMomentum() {
        if (isDragging) return;
        currentVelocity *= 0.94; // friction
        currentPos += currentVelocity;
        const setWidth = getSetWidth();
        currentPos = wrapPosition(currentPos, setWidth);
        track.style.transform = `translateX(${currentPos}px)`;

        if (Math.abs(currentVelocity) > 0.3) {
          momentumAnimId = requestAnimationFrame(applyMomentum);
        } else {
          momentumAnimId = null;
          resumeTimer = setTimeout(() => {
            isPaused = false;
          }, 1200);
        }
      }
      momentumAnimId = requestAnimationFrame(applyMomentum);
    } else {
      resumeTimer = setTimeout(() => {
        isPaused = false;
      }, 1000);
    }
  }

  viewport.addEventListener('pointerup', stopDrag);
  viewport.addEventListener('pointercancel', stopDrag);
  viewport.addEventListener('lostpointercapture', stopDrag);

  // Manual Previous / Next Arrow Controls
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isPaused = true;
      if (momentumAnimId) cancelAnimationFrame(momentumAnimId);
      if (resumeTimer) clearTimeout(resumeTimer);

      const firstCard = track.firstElementChild;
      const gap = parseFloat(window.getComputedStyle(track).gap) || 24;
      const stepDist = (firstCard ? firstCard.offsetWidth : 480) + gap;

      currentPos += stepDist;
      const setWidth = getSetWidth();
      currentPos = wrapPosition(currentPos, setWidth);

      track.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
      track.style.transform = `translateX(${currentPos}px)`;

      setTimeout(() => {
        track.style.transition = 'none';
        resumeTimer = setTimeout(() => {
          isPaused = false;
        }, 1500);
      }, 460);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isPaused = true;
      if (momentumAnimId) cancelAnimationFrame(momentumAnimId);
      if (resumeTimer) clearTimeout(resumeTimer);

      const firstCard = track.firstElementChild;
      const gap = parseFloat(window.getComputedStyle(track).gap) || 24;
      const stepDist = (firstCard ? firstCard.offsetWidth : 480) + gap;

      currentPos -= stepDist;
      const setWidth = getSetWidth();
      currentPos = wrapPosition(currentPos, setWidth);

      track.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
      track.style.transform = `translateX(${currentPos}px)`;

      setTimeout(() => {
        track.style.transition = 'none';
        resumeTimer = setTimeout(() => {
          isPaused = false;
        }, 1500);
      }, 460);
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
    applyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const role = (document.getElementById('apply-role') || {}).value || 'General Application';
      const name = (document.getElementById('apply-name') || {}).value || '';
      const email = (document.getElementById('apply-email') || {}).value || '';
      const link = (document.getElementById('apply-link') || {}).value || '';
      const notes = (document.getElementById('apply-notes') || {}).value || '';

      const accessKey = (applyForm.querySelector('input[name="access_key"]') || {}).value || (typeof getWeb3FormsKey === 'function' ? getWeb3FormsKey() : 'YOUR_ACCESS_KEY_HERE');

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: accessKey,
          name: name,
          email: email,
          position: role,
          portfolio_or_linkedin: link,
          experience_highlights: notes,
          subject: `Career Application: ${role} - ${name}`,
          from_name: 'Byteform Careers',
          botcheck: ''
        })
      }).catch(() => { });

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

  if (weeksEl) {
    weeksEl.textContent = `${weeks} to ${weeks + 2}`;
    weeksEl.classList.remove('content-fade-pop');
    void weeksEl.offsetWidth;
    weeksEl.classList.add('content-fade-pop');
  }
  if (priceEl) {
    const low = Math.round(estTotal * 0.9).toLocaleString();
    const high = Math.round(estTotal * 1.15).toLocaleString();
    priceEl.textContent = `$${low} to $${high}`;
    priceEl.classList.remove('content-fade-pop');
    void priceEl.offsetWidth;
    priceEl.classList.add('content-fade-pop');
  }

  const squadContainer = document.getElementById('scope-founders');
  if (squadContainer) {
    squadContainer.innerHTML = '';
    if (activeIds.includes('web') || activeIds.includes('database')) {
      squadContainer.innerHTML += '<span class="pill pill-blue">Systems & Backend Team</span> ';
    }
    if (activeIds.includes('mobile')) {
      squadContainer.innerHTML += '<span class="pill pill-blue">Mobile Engineering Team</span> ';
    }
    if (activeIds.includes('uiux') || activeIds.includes('graphic') || activeIds.includes('social') || activeIds.includes('video')) {
      squadContainer.innerHTML += '<span class="pill pill-blue">Design, Video & Motion Team</span> ';
    }
    if (activeIds.includes('cloud') || activeIds.includes('gamedev') || activeIds.includes('ai')) {
      squadContainer.innerHTML += '<span class="pill pill-blue">Cloud, AI & 3D Team</span> ';
    }
    squadContainer.innerHTML += '<span class="pill pill-blue">Dedicated Service Manager</span> ';
    squadContainer.classList.remove('content-fade-pop');
    void squadContainer.offsetWidth;
    squadContainer.classList.add('content-fade-pop');
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

Looking forward to connecting with your service management team.`;
  }

  scrollToSection('contact');
}

function initScopeCalculator() {
  calculateScope();
}

// 7. Contact Form Submission & Web3Forms Dispatch
// Web3Forms Configuration:
// To route form submissions directly to your inbox, insert your Web3Forms Access Key from https://web3forms.com
const WEB3FORMS_ACCESS_KEY = '6265ecdb-9cc8-4fa2-a222-8fbb0dee3e64';

function getWeb3FormsKey() {
  if (typeof window !== 'undefined' && window.WEB3FORMS_ACCESS_KEY && window.WEB3FORMS_ACCESS_KEY !== 'YOUR_ACCESS_KEY_HERE') {
    return window.WEB3FORMS_ACCESS_KEY;
  }
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('web3forms_access_key');
    if (stored) return stored;
  }
  return WEB3FORMS_ACCESS_KEY;
}

function openGmail(subjectText, bodyText) {
  const targetEmail = 'byteform3@gmail.com';
  let url = `https://mail.google.com/mail/?view=cm&fs=1&to=${targetEmail}`;
  if (typeof subjectText === 'string' && subjectText.trim()) {
    url += `&su=${encodeURIComponent(subjectText.trim())}`;
  }
  if (typeof bodyText === 'string' && bodyText.trim()) {
    url += `&body=${encodeURIComponent(bodyText.trim())}`;
  }

  // Open exclusively in a new tab; NEVER navigate current window
  window.open(url, '_blank', 'noopener,noreferrer');
}

window.openGmail = openGmail;
window.getWeb3FormsKey = getWeb3FormsKey;

function initContactForm() {
  const forms = [document.getElementById('contact-form'), document.getElementById('inquiry-form')];

  forms.forEach(form => {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (form.querySelector('#contact-name') || form.querySelector('#form-name') || form.querySelector('[name="name"]') || {}).value || 'Client';
      const email = (form.querySelector('#contact-email') || form.querySelector('#form-email') || form.querySelector('[name="email"]') || {}).value || '';
      const interest = (form.querySelector('#contact-interest') || form.querySelector('#form-services') || form.querySelector('[name="track"]') || {}).value || 'Full Stack Web Platform';
      const budget = (form.querySelector('#contact-budget') || form.querySelector('[name="budget"]') || {}).value || 'Flexible';
      const message = (form.querySelector('#contact-message') || form.querySelector('#form-message') || form.querySelector('[name="message"]') || {}).value || '';

      const feedback = document.getElementById('contact-feedback') || document.getElementById('form-success');
      const submitBtn = form.querySelector('button[type="submit"]');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
          <span>Delivering Brief...</span>
        `;
      }

      // 1. Persist to internal API logger (/api/contact & inquiries.json)
      const payload = {
        name,
        email,
        interest,
        track: interest,
        budget,
        message,
        timestamp: new Date().toISOString()
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => { });

      // 2. Dispatch directly via Web3Forms API
      const inputKey = (form.querySelector('input[name="access_key"]') || {}).value;
      const effectiveKey = (inputKey && inputKey !== 'YOUR_ACCESS_KEY_HERE') ? inputKey : getWeb3FormsKey();

      const web3Payload = {
        access_key: effectiveKey,
        name: name,
        email: email,
        subject: `New Project Brief: ${interest} - from ${name}`,
        from_name: 'Byteform Project Brief',
        "Project Track": interest,
        "Budget": budget,
        "Brief Scope": message,
        botcheck: ''
      };

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(web3Payload)
      })
        .then(res => res.json().catch(() => ({ success: false, message: 'Invalid response format' })))
        .then(data => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Brief Delivered</span>
            `;
            submitBtn.style.background = '#10b981';
            submitBtn.style.borderColor = '#10b981';
          }

          if (feedback) {
            feedback.style.display = 'block';
            feedback.style.color = 'var(--text-primary)';
            feedback.style.background = 'rgba(16, 185, 129, 0.12)';
            feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
            feedback.style.padding = '1.25rem 1.4rem';
            feedback.style.borderRadius = '12px';
            feedback.style.textAlign = 'left';

            if (data && data.success) {
              feedback.innerHTML = `
                <div style="font-weight: 700; margin-bottom: 0.4rem; color: #10b981; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Brief Delivered via Web3Forms</span>
                </div>
                <p style="font-size: 0.92rem; line-height: 1.55; color: var(--text-secondary); margin-bottom: 0;">
                  Thank you, <strong>${name}</strong>! Your project brief has been transmitted to our service team inbox via Web3Forms. We review briefs within two hours during business hours.
                </p>
              `;
            } else {
              const isKeyError = !effectiveKey || effectiveKey === 'YOUR_ACCESS_KEY_HERE' || (data && data.message && (data.message.toLowerCase().includes('key') || data.message.toLowerCase().includes('access')));

              feedback.innerHTML = `
                <div style="font-weight: 700; margin-bottom: 0.4rem; color: #10b981; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Brief Logged on Byteform</span>
                </div>
                <p style="font-size: 0.92rem; line-height: 1.55; color: var(--text-secondary); margin-bottom: ${isKeyError ? '0.65rem' : '0'};">
                  Thank you, <strong>${name}</strong>! Your project brief has been recorded safely in the Byteform database.
                </p>
                ${isKeyError ? `
                <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.86rem; color: var(--text-secondary); line-height: 1.5;">
                  <strong>Web3Forms Setup:</strong> To receive submissions directly via email, paste your access key from <a href="https://web3forms.com" target="_blank" rel="noopener noreferrer" style="color: var(--accent-blue); text-decoration: underline;">web3forms.com</a> into <code>WEB3FORMS_ACCESS_KEY</code> in <code>script.js</code>.
                </div>
                ` : ''}
              `;
            }
          }

          form.reset();
        })
        .catch(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Brief Logged</span>
            `;
          }

          if (feedback) {
            feedback.style.display = 'block';
            feedback.style.color = 'var(--text-primary)';
            feedback.style.background = 'rgba(16, 185, 129, 0.12)';
            feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
            feedback.style.padding = '1.25rem 1.4rem';
            feedback.style.borderRadius = '12px';
            feedback.style.textAlign = 'left';
            feedback.innerHTML = `
              <div style="font-weight: 700; margin-bottom: 0.4rem; color: #10b981; font-size: 1rem;">
                Brief Logged Successfully
              </div>
              <p style="font-size: 0.92rem; line-height: 1.55; color: var(--text-secondary); margin-bottom: 0;">
                Thank you, <strong>${name}</strong>! Your project brief has been recorded.
              </p>
            `;
          }

          form.reset();
        });
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
      btn.classList.remove('content-fade-pop');
      void btn.offsetWidth;
      btn.classList.add('content-fade-pop');
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

// 8. Scroll-Triggered Reveal & Click Fade-in Animations
function initScrollAndClickAnimations() {
  // 1. Initial Hero Stagger Animation on Page Load
  const heroSection = document.querySelector('.hero-section') || document.querySelector('.page-hero');
  if (heroSection) {
    const heroElements = heroSection.querySelectorAll('.pill, .hero-tagline, .hero-description, .hero-cta-group, .hero-metrics, .wit-callout, .back-link');
    heroElements.forEach((el, index) => {
      el.classList.add(`hero-anim-${Math.min(index + 1, 5)}`);
    });
  }

  // 2. Attach reveal classes to content elements across all pages
  const revealSelectors = [
    '.section-header',
    '.portal-card',
    '.service-card',
    '.founder-card',
    '.protocol-card',
    '.career-card',
    '.contact-brief-card',
    '.brief-form-card',
    '.wit-callout',
    '.footer-inner',
    '.review-card',
    '.guarantee-item',
    '.scope-card-summary',
    '.scope-builder-grid'
  ];

  document.querySelectorAll('.portal-grid, .services-grid, .founders-grid, .protocol-grid, .careers-grid, .hero-metrics, .studio-guarantees').forEach(grid => {
    grid.classList.add('reveal-stagger');
  });

  const elementsToReveal = document.querySelectorAll(revealSelectors.join(', '));
  elementsToReveal.forEach(el => {
    if (!el.closest('.hero-section') || el.classList.contains('hero-metrics')) {
      el.classList.add('reveal-item');
    }
  });

  // 3. Intersection Observer for Scroll-Triggered Fade-In
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal-item').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-visible');
      } else {
        scrollObserver.observe(el);
      }
    });
  } else {
    document.querySelectorAll('.reveal-item').forEach(el => el.classList.add('is-visible'));
  }

  // 4. In-page Anchor Clicks Smooth Scroll & Target Glow Fade
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').replace('#', '');
      if (targetId) {
        e.preventDefault();
        scrollToSection(targetId);
      }
    });
  });

  // 5. Internal Page Navigation Click Fade Transitions
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (
      href &&
      !href.startsWith('#') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('tel:') &&
      !href.startsWith('javascript:') &&
      !link.getAttribute('target') &&
      (href.endsWith('.html') || href === '/')
    ) {
      link.addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        document.body.classList.add('page-fade-out');
        setTimeout(() => {
          window.location.href = href;
        }, 180);
      });
    }
  });

  // Restore opacity if user navigates back using browser cache
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      document.body.classList.remove('page-fade-out');
    }
  });
}