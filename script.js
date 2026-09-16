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
    applyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const role = (document.getElementById('apply-role') || {}).value || 'General Application';
      const name = (document.getElementById('apply-name') || {}).value || '';
      const email = (document.getElementById('apply-email') || {}).value || '';
      const link = (document.getElementById('apply-link') || {}).value || '';
      const notes = (document.getElementById('apply-notes') || {}).value || '';

      fetch('https://formsubmit.co/ajax/byteform3@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          position: role,
          portfolio_or_linkedin: link,
          experience_highlights: notes,
          _subject: `Career Application: ${role} - ${name}`,
          _captcha: 'false',
          _template: 'table'
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
    if (activeIds.includes('uiux') || activeIds.includes('graphic') || activeIds.includes('social')) {
      squadContainer.innerHTML += '<span class="pill pill-blue">Design & UI Team</span> ';
    }
    if (activeIds.includes('cloud') || activeIds.includes('gamedev')) {
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

// 7. Contact Form Submission & Email Routing
function openMailClient(subjectText, bodyText) {
  const targetEmail = 'byteform3@gmail.com';
  const sub = encodeURIComponent(subjectText || 'Project Inquiry - Byteform Service Management');
  const body = encodeURIComponent(bodyText || 'Hello Byteform Service Team,\n\nI would like to discuss an upcoming engineering project with your service and operational managers.\n\nProject Overview:\n- Timeline:\n- Scope & Requirements:\n\nBest regards,\n');

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
  // Redirect to contact/mail section as requested
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    scrollToSection('contact');
  } else {
    window.location.href = 'index.html#contact';
  }
}

window.openMailClient = openMailClient;
window.handleDirectEmailClick = handleDirectEmailClick;

function initContactForm() {
  const forms = [document.getElementById('contact-form'), document.getElementById('inquiry-form')];

  forms.forEach(form => {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (form.querySelector('#contact-name') || form.querySelector('#form-name') || form.querySelector('[name="name"]') || {}).value || 'Client';
      const email = (form.querySelector('#contact-email') || form.querySelector('#form-email') || form.querySelector('[name="email"]') || {}).value || '';
      const interest = (form.querySelector('#contact-interest') || form.querySelector('#form-services') || form.querySelector('[name="track"]') || {}).value || 'Full Stack Web Platform';
      const budget = (form.querySelector('#contact-budget') || form.querySelector('[name="budget"]') || {}).value || 'Standard';
      const message = (form.querySelector('#contact-message') || form.querySelector('#form-message') || form.querySelector('[name="message"]') || {}).value || '';

      const feedback = document.getElementById('contact-feedback') || document.getElementById('form-success');
      const submitBtn = form.querySelector('button[type="submit"]');
      const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
          <span>Sending Brief to byteform3@gmail.com...</span>
        `;
      }

      // Send to local server / backend logger if running
      const payload = { name, email, interest, track: interest, budget, message };
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => { });

      // Build pre-filled email links
      const emailSubject = `Project Brief from ${name} [${interest}]`;
      const emailBody = `Sender Name: ${name}\nSender Email: ${email}\nProject Track: ${interest}\nBudget: ${budget}\n\nProject Scope & Targets:\n${message}\n`;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=byteform3@gmail.com&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      const mailtoUrl = `mailto:byteform3@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      // Dispatch directly to byteform3@gmail.com via FormSubmit endpoint
      fetch('https://formsubmit.co/ajax/byteform3@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          "Project Track": interest,
          "Budget": budget,
          message: message,
          _subject: `New Project Brief from ${name} [${interest || 'General'}]`,
          _captcha: 'false',
          _template: 'table'
        })
      })
        .then(res => res.json().catch(() => ({ success: true })))
        .then(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
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
            feedback.style.padding = '1.25rem 1.4rem';
            feedback.style.borderRadius = '12px';
            feedback.style.textAlign = 'left';
            feedback.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 0.4rem; color: #10b981; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Brief Delivered to byteform3@gmail.com</span>
            </div>
            <p style="font-size: 0.92rem; line-height: 1.55; color: var(--text-secondary); margin-bottom: 0.85rem;">
              Thank you, <strong>${name}</strong>! Your project brief has been sent directly to <strong>byteform3@gmail.com</strong>. Our service management team will review your scope and get back to you within a few hours.
            </p>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <a href="${gmailUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;">
                <span>Open in Gmail Web</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
              </a>
            </div>
          `;
          }

          form.reset();
        })
        .catch(() => {
          // Fallback for offline or blocked environments
          window.location.href = mailtoUrl;

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origBtnHtml;
          }

          if (feedback) {
            feedback.style.display = 'block';
            feedback.style.color = 'var(--text-primary)';
            feedback.style.background = 'rgba(59, 130, 246, 0.12)';
            feedback.style.border = '1px solid rgba(59, 130, 246, 0.3)';
            feedback.style.padding = '1.25rem 1.4rem';
            feedback.style.borderRadius = '12px';
            feedback.style.textAlign = 'left';
            feedback.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 0.4rem; color: var(--accent-blue); font-size: 1rem;">
              Send Brief to byteform3@gmail.com
            </div>
            <p style="font-size: 0.92rem; line-height: 1.55; color: var(--text-secondary); margin-bottom: 0.85rem;">
              Click below to send your brief directly to our service management team via Gmail:
            </p>
            <a href="${gmailUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;">
              <span>Open in Gmail Web</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </a>
          `;
          }
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