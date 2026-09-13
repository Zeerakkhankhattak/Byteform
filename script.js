// 1. Smooth Scroll
      function scrollToSection(id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }

      // 2. Scroll Progress Bar
      window.addEventListener('scroll', function() {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total > 0) {
          const progress = (window.scrollY / total) * 100;
          document.getElementById('scroll-progress').style.width = progress + '%';
        }
      });

      // 3. Live System Clock
      function updateClock() {
        const now = new Date();
        const str = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const clockEl = document.getElementById('clock-val');
        if (clockEl) clockEl.textContent = str;
      }
      setInterval(updateClock, 1000);
      updateClock();

      // 4. Hero Particle Canvas
      (function initCanvas() {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const count = Math.min(Math.floor((width * height) / 14000), 85);
        const particles = [];
        const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2, active: false };

        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
            r: Math.random() * 2 + 1.2,
            isBlue: Math.random() > 0.65
          });
        }

        window.addEventListener('resize', function() {
          width = canvas.width = window.innerWidth;
          height = canvas.height = window.innerHeight;
        });

        window.addEventListener('mousemove', function(e) {
          mouse.targetX = e.clientX;
          mouse.targetY = e.clientY;
          mouse.active = true;
        });

        document.addEventListener('mouseleave', function() {
          mouse.active = false;
        });

        function animate() {
          mouse.x += (mouse.targetX - mouse.x) * 0.1;
          mouse.y += (mouse.targetY - mouse.y) * 0.1;

          ctx.clearRect(0, 0, width, height);

          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              const dx = particles[i].x - particles[j].x;
              const dy = particles[i].y - particles[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 135) {
                const opacity = (1 - dist / 135) * 0.22;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = (particles[i].isBlue || particles[j].isBlue) 
                  ? `rgba(0, 82, 255, ${opacity * 1.5})` 
                  : `rgba(15, 23, 42, ${opacity * 0.6})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
              }
            }
          }

          particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            if (mouse.active) {
              const dx = mouse.x - p.x;
              const dy = mouse.y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 170) {
                const force = (170 - dist) / 170;
                p.x -= (dx / dist) * force * 3;
                p.y -= (dy / dist) * force * 3;
              }
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.isBlue ? 'rgba(0, 82, 255, 0.8)' : 'rgba(10, 10, 15, 0.25)';
            ctx.fill();
          });

          requestAnimationFrame(animate);
        }
        animate();
      })();

      // 5. Interactive Scope & Spec Calculator
      let selectedScaleMult = 1.6;
      let selectedScaleName = 'Full Production Build';

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
          btn.style.background = '#ffffff';
          btn.style.color = 'var(--text-primary)';
          btn.style.borderColor = 'var(--border-medium)';
        });
        el.classList.add('active');
        el.style.background = 'var(--text-primary)';
        el.style.color = '#ffffff';
        el.style.borderColor = 'var(--text-primary)';
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
        const weeks = Math.max(2, Math.round(activePills.length * 1.5));

        document.getElementById('scope-weeks').textContent = `${weeks} - ${weeks + 2}`;
        document.getElementById('scope-price').textContent = `$${Math.round(estTotal * 0.9).toLocaleString()} – $${Math.round(estTotal * 1.15).toLocaleString()}`;

        const squadContainer = document.getElementById('scope-founders');
        squadContainer.innerHTML = '';
        if (activeIds.includes('web') || activeIds.includes('database')) {
          squadContainer.innerHTML += '<span class="pill-tag">FOUNDER 01 (SYSTEMS)</span> ';
        }
        if (activeIds.includes('uiux') || activeIds.includes('graphic') || activeIds.includes('social')) {
          squadContainer.innerHTML += '<span class="pill-tag">FOUNDER 02 (CREATIVE)</span> ';
        }
        if (activeIds.includes('cloud') || activeIds.includes('gamedev') || activeIds.includes('social')) {
          squadContainer.innerHTML += '<span class="pill-tag">FOUNDER 03 (CLOUD & 3D)</span> ';
        }
      }

      function applyBriefToInquiry() {
        const activeNames = [];
        document.querySelectorAll('.scope-pill.active .font-display').forEach(d => activeNames.push(d.textContent.trim()));
        const weeks = document.getElementById('scope-weeks').textContent;
        const price = document.getElementById('scope-price').textContent;

        document.getElementById('form-services').value = activeNames.join(', ');
        document.getElementById('form-message').value = `Project Scope:\n- Complexity: ${selectedScaleName}\n- Timeline: ${weeks} Weeks\n- Ballpark: ${price}\n- Selected Domains: ${activeNames.join(', ')}\n\nLooking forward to speaking directly with the Byteform founders.`;

        scrollToSection('contact');
      }

      // 6. Copy Email
      function copyEmail(btn) {
        navigator.clipboard.writeText('team@byteform.agency');
        const span = btn.querySelector('span');
        span.textContent = 'COPIED!';
        btn.style.color = 'var(--accent-blue)';
        btn.style.borderColor = 'var(--accent-blue)';
        setTimeout(() => {
          span.textContent = 'COPY';
          btn.style.color = 'inherit';
          btn.style.borderColor = 'var(--border-medium)';
        }, 2200);
      }

      // 7. Form Submission
      function handleInquirySubmit(e) {
        e.preventDefault();
        document.getElementById('inquiry-form').style.display = 'none';
        document.getElementById('form-success').style.display = 'flex';
      }