/* ============================================
   N3Rah – script.js
   3D Tilt | Estimator Calculator | Modals
   FAQ Accordion | Toast Alerts | Typed Text
   Particles Canvas | Theme Sync
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Custom Cursor ── */
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;

  if (cursorDot && cursorRing) {
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursorDot.style.left = mx + 'px';
      cursorDot.style.top = my + 'px';
    });

    (function animCursor() {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top = ry + 'px';
      requestAnimationFrame(animCursor);
    })();

    document.querySelectorAll('a, button, .service-card, .product-card, .testimonial-card, .est-pill, .faq-question').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorRing.style.width = '54px';
        cursorRing.style.height = '54px';
        cursorRing.style.borderColor = 'rgba(99,102,241,0.9)';
      });
      el.addEventListener('mouseleave', () => {
        cursorRing.style.width = '38px';
        cursorRing.style.height = '38px';
        cursorRing.style.borderColor = 'rgba(99,102,241,0.6)';
      });
    });
  }

  /* ── 3D Card Tilt Effect ── */
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  if (!isTouchDevice) {
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  /* ── Particles Canvas ── */
  const canvas = document.getElementById('particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.r = Math.random() * 1.6 + 0.4;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.alpha = Math.random() * 0.5 + 0.15;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${this.alpha})`;
        ctx.fill();
      }
    }

    const particleCount = window.innerWidth < 768 ? 28 : 60;
    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    function drawParticles() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.07 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  /* ── Navbar Scroll & Active Link ── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
    updateActiveNav();
  });

  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 220) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }

  /* ── Hamburger Menu (Card Dropdown) ── */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navContainer = document.querySelector('.nav-container');

  function closeMobileNav() {
    if (!navLinks) return;
    navLinks.classList.remove('open');
    if (navContainer) navContainer.classList.remove('open');
    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('nav-open');
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('open');
      if (navContainer) navContainer.classList.toggle('open', isOpen);
      hamburger.classList.toggle('open', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close mobile nav ONLY when clicking actual navigation anchor links
    navLinks.querySelectorAll('a').forEach(el => {
      el.addEventListener('click', (e) => {
        if (!el.closest('#themeToggle') && !el.classList.contains('theme-toggle')) {
          closeMobileNav();
        }
      });
    });

    document.addEventListener('click', (e) => {
      const isInsideCard = navContainer && navContainer.contains(e.target);
      const isThemeToggle = e.target.closest('#themeToggle') || e.target.classList.contains('theme-toggle');
      if (navLinks.classList.contains('open') && !isInsideCard && !isThemeToggle) {
        closeMobileNav();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && navLinks.classList.contains('open')) {
        closeMobileNav();
      }
    });
  }

  /* ── Typed Text Animation ── */
  const words = [
    'Custom Software.',
    'Mobile & Desktop Apps.',
    'Bespoke Websites.',
    'Enterprise SaaS.',
  ];
  let wordIdx = 0, charIdx = 0, isDeleting = false;
  const typedEl = document.getElementById('typedText');

  if (typedEl) {
    function type() {
      const word = words[wordIdx];
      if (!isDeleting) {
        typedEl.textContent = word.slice(0, ++charIdx);
        if (charIdx === word.length) { isDeleting = true; return setTimeout(type, 1900); }
      } else {
        typedEl.textContent = word.slice(0, --charIdx);
        if (charIdx === 0) { isDeleting = false; wordIdx = (wordIdx + 1) % words.length; }
      }
      setTimeout(type, isDeleting ? 45 : 85);
    }
    type();
  }

  /* ── Scroll Reveal Observer ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const parent = entry.target.parentElement;
        const siblings = Array.from(parent.querySelectorAll('.reveal'));
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, (idx >= 0 ? idx : 0) * 90);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ── Stats Counter ── */
  function countUp(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current);
      if (current >= target) clearInterval(timer);
    }, 16);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-num').forEach(countUp);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) statsObserver.observe(heroStats);

  /* ── Smooth Scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const tgt = document.getElementById(id);
      if (tgt) { e.preventDefault(); tgt.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ── Interactive Project Cost Estimator ── */
  const estTypePills = document.querySelectorAll('#estTypePills .est-pill');
  const estScopePills = document.querySelectorAll('#estScopePills .est-pill');
  const estAddonChecks = document.querySelectorAll('#estAddons input[type="checkbox"]');
  const resultPrice = document.getElementById('resultPrice');
  const resultSummary = document.getElementById('resultSummary');
  const applyEstimateBtn = document.getElementById('applyEstimateBtn');

  function calculateEstimate() {
    let basePrice = 1200;
    let typeName = 'High-End Website';
    let scopeMult = 1.0;
    let scopeName = 'Starter MVP';

    estTypePills.forEach(pill => {
      if (pill.classList.contains('active')) {
        basePrice = parseFloat(pill.dataset.base);
        typeName = pill.textContent.trim();
      }
    });

    estScopePills.forEach(pill => {
      if (pill.classList.contains('active')) {
        scopeMult = parseFloat(pill.dataset.mult);
        scopeName = pill.textContent.trim();
      }
    });

    let addonsTotal = 0;
    let selectedAddons = [];
    estAddonChecks.forEach(check => {
      if (check.checked) {
        addonsTotal += parseFloat(check.value);
        selectedAddons.push(check.dataset.addon);
      }
    });

    const calculatedBase = (basePrice * scopeMult) + addonsTotal;
    const minVal = Math.round(calculatedBase);
    const maxVal = Math.round(calculatedBase * 1.45);

    if (resultPrice) resultPrice.textContent = `₹${minVal.toLocaleString('en-IN')} – ₹${maxVal.toLocaleString('en-IN')}`;
    if (resultSummary) {
      const addonText = selectedAddons.length > 0 ? ` + [${selectedAddons.join(', ')}]` : '';
      resultSummary.textContent = `Selected: ${typeName} (${scopeName})${addonText}`;
    }
  }

  estTypePills.forEach(pill => {
    pill.addEventListener('click', () => {
      estTypePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      calculateEstimate();
    });
  });

  estScopePills.forEach(pill => {
    pill.addEventListener('click', () => {
      estScopePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      calculateEstimate();
    });
  });

  estAddonChecks.forEach(check => check.addEventListener('change', calculateEstimate));
  calculateEstimate();

  if (applyEstimateBtn) {
    applyEstimateBtn.addEventListener('click', () => {
      const messageField = document.getElementById('message');
      const contactSection = document.getElementById('contact');
      if (messageField && resultSummary && resultPrice) {
        messageField.value = `Hi N3Rah team!\nI ran your Cost Estimator tool with parameters:\n${resultSummary.textContent}\nEstimated Investment: ${resultPrice.textContent}\n\nI would like to request a formal technical proposal and proposal breakdown.`;
      }
      if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ── FAQ Accordion ── */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    btn && btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });

  /* ── Product Quick View Specs Modal ── */
  const productModal = document.getElementById('productModal');
  const modalClose = document.getElementById('modalClose');
  const modalBody = document.getElementById('modalBody');

  const productsData = {
    hrms: {
      title: 'HRMS Portal – Enterprise HR & Payroll Platform',
      category: 'Enterprise HR Management System',
      desc: 'A complete HR management software suite built to streamline employee lifecycle management, attendance tracking, leave approvals, role permissions, and automated payroll processing.',
      specs: [
        '✦ Automated Employee Onboarding & Exit Workflows',
        '✦ Real-Time Attendance & Leave Management',
        '✦ Automated Salary Slip & Tax Calculation Engine',
        '✦ Role-Based Multi-Tier Admin & Staff Portals',
        '✦ Exportable PDF/Excel Reports & Audit Logs'
      ]
    },
    inventory: {
      title: 'Inventory Management System (Web & Desktop)',
      category: 'Dual Web & Desktop Application',
      desc: 'An enterprise inventory control system available as a cross-platform desktop application (Electron) and web portal with offline data synchronization and barcode scanner integration.',
      specs: [
        '✦ Cross-Platform Desktop (Electron) & Web Architecture',
        '✦ Real-Time Multi-Warehouse Stock Tracking',
        '✦ Barcode & QR Code Scanner Integration',
        '✦ Low Stock Alerts & Automated Purchase Requisitions',
        '✦ Offline Data Syncing & High-Speed Local Caching'
      ]
    },
    rahulfoam: {
      title: 'Rahul Foam Company – Corporate Website',
      category: 'Bespoke Corporate & Product Catalog Site',
      desc: 'A bespoke corporate website built for Rahul Foam Company, showcasing high-density foam product lines, technical material specifications, instant quotation requests, and client testimonials.',
      specs: [
        '✦ Sub-500ms Lightning Fast Page Speed via Next.js',
        '✦ Interactive Industrial Foam Product Catalog',
        '✦ Dynamic Quote Request & WhatsApp Direct Inquiry',
        '✦ Technical Material Specification Downloads',
        '✦ 100% Mobile Responsive & Technical SEO Built-In'
      ]
    },
    n3bot: {
      title: 'N3Bot – Conversational AI Customer Assistant',
      category: 'AI Chatbot & Automation Suite',
      desc: 'N3Bot transforms customer support by resolving up to 80% of support queries automatically using vector database knowledge bases and OpenAI integration.',
      specs: [
        '✦ Fine-tuned on Your Technical Knowledge Base',
        '✦ Automated Lead Capture & CRM Routing',
        '✦ Seamless Human Support Escalation Trigger',
        '✦ Multi-language Natural Language Processing',
        '✦ Embeddable Widget script & Webhook System'
      ]
    }
  };

  document.querySelectorAll('.open-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.product;
      const data = productsData[key];
      if (data && modalBody && productModal) {
        modalBody.innerHTML = `
          <span class="modal-header-badge">${data.category}</span>
          <h3 class="modal-title">${data.title}</h3>
          <p class="modal-desc">${data.desc}</p>
          <div class="modal-specs-list">
            ${data.specs.map(s => `<div class="modal-spec-item"><span>✓</span> ${s}</div>`).join('')}
          </div>
          <a href="#contact" class="btn-primary btn-full" onclick="document.getElementById('productModal').classList.remove('open')">
            Request Custom Deployment →
          </a>
        `;
        productModal.classList.add('open');
        productModal.setAttribute('aria-hidden', 'false');
      }
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      if (productModal) {
        productModal.classList.remove('open');
        productModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  if (productModal) {
    productModal.addEventListener('click', e => {
      if (e.target === productModal) {
        productModal.classList.remove('open');
        productModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && productModal && productModal.classList.contains('open')) {
      productModal.classList.remove('open');
      productModal.setAttribute('aria-hidden', 'true');
    }
  });

  /* ── Cyber Security & Sanitization Suite ── */
  const formLoadTime = Date.now();
  const csrfTokenInput = document.getElementById('csrfToken');
  const generatedCsrf = 'csrf_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  if (csrfTokenInput) csrfTokenInput.value = generatedCsrf;

  function sanitizeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  function detectInjectionPayload(str) {
    if (!str) return false;
    const lower = str.toLowerCase();
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /onclick\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /<\?php/i,
      /exec\s*\(/i,
      /system\s*\(/i
    ];
    return maliciousPatterns.some(pattern => pattern.test(lower));
  }

  function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /* ── Toast Notification System ── */
  function showToast(message, isError = false) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) {
      toast.style.borderColor = '#ef4444';
      toast.style.background = 'rgba(24, 11, 15, 0.96)';
    }
    toast.innerHTML = `<span>${isError ? '🛡️' : '✅'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  /* ── Contact Form Cyber Security Handler ── */
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      // 1. Honeypot Bot Trap Check
      const hpVal = form._website_hp_check ? form._website_hp_check.value : '';
      if (hpVal) {
        // Silent rejection for automated spam bots
        showToast('Submission processed successfully.');
        form.reset();
        return;
      }

      // 2. Time-on-Page Bot Execution Check (< 1.8 seconds is bot behavior)
      const timeElapsed = Date.now() - formLoadTime;
      if (timeElapsed < 1800) {
        showToast('Security Violation: Automated bot submission detected.', true);
        return;
      }

      // 3. Client Rate Limiting (60 Seconds Cooldown)
      const lastSubmit = localStorage.getItem('n3rah_last_contact_submit');
      if (lastSubmit) {
        const timeSince = Date.now() - parseInt(lastSubmit, 10);
        if (timeSince < 60000) {
          const remainingSecs = Math.ceil((60000 - timeSince) / 1000);
          showToast(`Security Rate Limit: Please wait ${remainingSecs}s before submitting again.`, true);
          return;
        }
      }

      // 4. Raw Input Extraction
      const rawName = form.name.value.trim();
      const rawEmail = form.email.value.trim();
      const rawSubject = form.subject ? form.subject.value : 'General';
      const rawBudget = form.budget ? form.budget.value : 'Not specified';
      const rawMessage = form.message.value.trim();

      // 5. Empty Fields Check
      if (!rawName || !rawEmail || !rawMessage) {
        showToast('Please fill out all required fields.', true);
        return;
      }

      // 6. Email Format Validation
      if (!isValidEmail(rawEmail)) {
        showToast('Security Alert: Please provide a valid email address.', true);
        return;
      }

      // 7. Malicious Payload / Script Injection Detection
      if (detectInjectionPayload(rawName) || detectInjectionPayload(rawEmail) || detectInjectionPayload(rawMessage)) {
        showToast('Security Alert: Malicious code/script injection payload detected and blocked.', true);
        return;
      }

      // 8. Input Sanitization
      const cleanName = sanitizeHTML(rawName);
      const cleanEmail = sanitizeHTML(rawEmail);
      const cleanSubject = sanitizeHTML(rawSubject);
      const cleanBudget = sanitizeHTML(rawBudget);
      const cleanMessage = sanitizeHTML(rawMessage);

      // Disable button to prevent double-submit attacks
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Encrypting & Sending...';
      }

      // Store Rate Limit Timestamp
      localStorage.setItem('n3rah_last_contact_submit', Date.now().toString());

      // Secure API Request
      fetch('https://formsubmit.co/ajax/n3rah.tech3@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          category: cleanSubject || 'General Software / Web',
          budget: cleanBudget,
          message: cleanMessage,
          _subject: `Secured N3Rah Tech Inquiry from ${cleanName}`,
          _captcha: 'true',
          _template: 'table'
        })
      })
        .then(res => res.json())
        .then(data => {
          showToast('Proposal request encrypted & sent! We will email you back within 24h.');
          form.reset();
        })
        .catch(err => {
          const sub = encodeURIComponent(`N3Rah Project Inquiry: ${cleanSubject}`);
          const body = encodeURIComponent(`Name: ${cleanName}\nEmail: ${cleanEmail}\nCategory: ${cleanSubject}\n\nProject Details:\n${cleanMessage}`);
          window.location.href = `mailto:n3rah.tech3@gmail.com?subject=${sub}&body=${body}`;
          showToast('Opening secure mail app to complete inquiry...');
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Send Proposal Request';
          }
        });
    });
  }

  /* ── Theme Toggle ── */
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = themeToggle ? themeToggle.querySelector('.theme-toggle-label') : null;

  function applyTheme(isLight) {
    document.body.classList.toggle('light', isLight);
    if (themeLabel) themeLabel.textContent = isLight ? 'Light' : 'Dark';
    if (themeToggle) themeToggle.title = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    localStorage.setItem('n3rah-theme', isLight ? 'light' : 'dark');
  }

  const savedTheme = localStorage.getItem('n3rah-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const startLight = savedTheme ? savedTheme === 'light' : !prefersDark;
  applyTheme(startLight);

  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      applyTheme(!document.body.classList.contains('light'));
    });
  }

});
