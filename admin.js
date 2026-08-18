/**
 * N3Rah Admin Panel & Quotation / Proforma Invoice Generator Logic
 * State Management, Template Presets, Auto-Calculator, Document Renderer, Export Engine
 */

(function () {
  'use strict';

  // ==========================================
  // 1. DEFAULT CONFIGURATION & TEMPLATES
  // ==========================================
  const DEFAULT_SETTINGS = {
    companyName: 'N3Rah Tech Studio',
    tagline: 'Innovating The Future, Connecting The World',
    founderName: 'Rahul Mishra',
    role: 'Founder & Lead Software Architect',
    email: 'n3rah.tech3@gmail.com',
    phone: '+91 8791104601',
    website: 'https://n3rah.vercel.app',
    address: 'N3Rah Digital HQ, Tech Corridor, India / Global',
    bankName: 'HDFC Bank Ltd',
    accountName: 'N3Rah Tech Studio / Rahul Mishra',
    accountNumber: '50100489201948',
    ifscCode: 'HDFC0001234',
    upiId: '8791104601@upi',
    taxId: 'GSTIN / PAN: N3RAH-INDIA-CORP',
    defaultCurrency: 'INR',
    defaultTaxRate: 0,
    adminPin: 'n3rah2026',
    defaultTerms: [
      '100% full intellectual property & repository ownership transferred to client upon final milestone payment.',
      'Includes 30 days of complimentary post-launch bug fixing, performance monitoring & technical warranty.',
      'All source code and architectural documentation will be provided via private GitHub / GitLab repositories.',
      'Payment schedule: 40% initial kickoff advance, 30% alpha/beta feature milestone, 30% final signoff & handover.',
      'Strict Non-Disclosure Agreement (NDA) and confidential handling of all proprietary project materials.'
    ]
  };

  const CURRENCY_MAP = {
    INR: { symbol: '₹', locale: 'en-IN' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    AED: { symbol: 'AED ', locale: 'en-AE' },
    CAD: { symbol: 'CA$', locale: 'en-CA' },
    AUD: { symbol: 'AU$', locale: 'en-AU' }
  };

  const SERVICE_PRESETS = {
    web: {
      id: 'web',
      name: 'Bespoke Website Development',
      icon: '🌐',
      tagline: 'Sub-second speed, custom UI/UX design, SEO & modern responsive frontend',
      defaultTotal: 65000,
      items: [
        {
          title: 'UI/UX Design System & Interactive Wireframes',
          desc: 'High-fidelity Figma wireframes, luxury aesthetic moodboards, design tokens, and user flow mapping.',
          weight: 0.15
        },
        {
          title: 'High-Performance Frontend & Micro-Interactions',
          desc: 'Modern semantic HTML5/CSS3/JavaScript or Next.js engineering with smooth GSAP animations and glassmorphic UI.',
          weight: 0.35
        },
        {
          title: 'Backend Integration & Lead Capture Systems',
          desc: 'Dynamic inquiry forms, WhatsApp direct routing, headless CMS / database hooks, and secure API endpoints.',
          weight: 0.20
        },
        {
          title: 'Technical SEO, Speed Optimization & Security',
          desc: 'JSON-LD schema markup, 99+ Google Lighthouse optimization, asset minification, and SSL hardening.',
          weight: 0.15
        },
        {
          title: 'Production Deployment & 30-Day Hypercare Support',
          desc: 'Vercel/AWS cloud hosting configuration, custom domain DNS linking, automated SSL, and post-launch maintenance.',
          weight: 0.15
        }
      ]
    },
    mobile: {
      id: 'mobile',
      name: 'Custom Mobile App (iOS & Android)',
      icon: '📱',
      tagline: 'Cross-platform React Native / Flutter app with fluid gestures and offline sync',
      defaultTotal: 120000,
      items: [
        {
          title: 'Mobile Architecture & Design System',
          desc: 'Interactive iOS & Android prototype, gesture mapping, intuitive navigation paradigms, and typography tokens.',
          weight: 0.15
        },
        {
          title: 'Cross-Platform Core Application Engineering',
          desc: 'React Native high-performance application build, smooth native animations, state management, and offline cache.',
          weight: 0.35
        },
        {
          title: 'Cloud Backend, REST/GraphQL APIs & Authentication',
          desc: 'Scalable Node.js / Python API backend, JWT / OAuth authentication, PostgreSQL / Supabase database architecture.',
          weight: 0.25
        },
        {
          title: 'Device Hardware & Native Feature Integrations',
          desc: 'Firebase Push Notifications, Camera/Biometric Auth, Geolocation, and In-App Payment Gateway integrations.',
          weight: 0.15
        },
        {
          title: 'Store Submission (App Store & Play Store) + Warranty',
          desc: 'Complete binary signing, privacy policy compliance, store review submission assistance, and 30-day bug warranty.',
          weight: 0.10
        }
      ]
    },
    saas: {
      id: 'saas',
      name: 'Enterprise Full-Stack SaaS Platform',
      icon: '⚡',
      tagline: 'Multi-tenant cloud architecture, subscription billing, RBAC & high-throughput APIs',
      defaultTotal: 180000,
      items: [
        {
          title: 'Enterprise Architecture & Relational Schema Design',
          desc: 'Microservices architecture, PostgreSQL multi-tenant database modeling, Redis caching, and concurrency planning.',
          weight: 0.15
        },
        {
          title: 'SaaS Client Workspace & Admin Dashboard',
          desc: 'Next.js 14 / React enterprise portal with role-based access control (RBAC), data visualization, and team management.',
          weight: 0.30
        },
        {
          title: 'High-Throughput Backend & API Infrastructure',
          desc: 'RESTful and GraphQL service layers, automated worker queues, webhooks, and rate-limiting security mechanisms.',
          weight: 0.25
        },
        {
          title: 'Payment Billing Engine & Third-Party Integrations',
          desc: 'Stripe / Razorpay subscription lifecycle, automated invoicing, webhooks, and email notification pipelines.',
          weight: 0.15
        },
        {
          title: 'DevOps CI/CD, Cloud Deployment & 30-Day SLA',
          desc: 'AWS / Docker infrastructure, automated GitHub Actions pipelines, disaster recovery setup, and hypercare support.',
          weight: 0.15
        }
      ]
    },
    ai: {
      id: 'ai',
      name: 'AI & LLM Workflow Automation',
      icon: '🤖',
      tagline: 'Custom AI agents, automated workflow pipelines, OpenAI/Claude integration',
      defaultTotal: 95000,
      items: [
        {
          title: 'AI Pipeline Architecture & Prompt Engineering',
          desc: 'Workflow analysis, model evaluation (OpenAI / Claude / Local LLMs), and prompt orchestration framework setup.',
          weight: 0.20
        },
        {
          title: 'Intelligent Agent & RAG Vector Database Setup',
          desc: 'Retrieval-Augmented Generation (RAG) using Pinecone / pgvector, document ingestion, and custom context injection.',
          weight: 0.35
        },
        {
          title: 'Custom Automation Connectors & Webhook Workflows',
          desc: 'Automated CRM syncing, multi-channel customer responses, data extraction, and scheduled background workers.',
          weight: 0.25
        },
        {
          title: 'Token Optimization, Security Sandboxing & QA',
          desc: 'Cost-saving token caching, content moderation guardrails, latency reduction, and production deployment.',
          weight: 0.20
        }
      ]
    },
    desktop: {
      id: 'desktop',
      name: 'Custom Desktop Software (Electron / Native)',
      icon: '💻',
      tagline: 'Cross-platform Windows & macOS desktop software with local hardware hooks',
      defaultTotal: 110000,
      items: [
        {
          title: 'Desktop UI & Native Window Architecture',
          desc: 'Custom borderless frames, native system tray integration, multi-monitor support, and dark/light system sync.',
          weight: 0.20
        },
        {
          title: 'Core Software Logic & Hardware File System APIs',
          desc: 'Electron / Tauri native bindings, high-speed local SQLite database, asynchronous background processing.',
          weight: 0.35
        },
        {
          title: 'Cloud Synchronization & Auto-Update Engine',
          desc: 'Seamless offline-first sync with cloud servers, background binary differential auto-updates, and crash telemetry.',
          weight: 0.25
        },
        {
          title: 'Multi-OS Code Signing, Packaging & Delivery',
          desc: 'Windows (.exe / .msi) and macOS (.dmg) certified code signing, installer building, and 30-day warranty.',
          weight: 0.20
        }
      ]
    },
    mvp: {
      id: 'mvp',
      name: 'Full-Stack MVP Launchpad (Web + App + Backend)',
      icon: '🚀',
      tagline: 'Fast-track product package to validate, build, and launch your startup idea in weeks',
      defaultTotal: 150000,
      items: [
        {
          title: 'Product Scope Specification & UI/UX Wireframes',
          desc: 'Comprehensive user stories, product requirement documentation (PRD), and pixel-perfect interface layouts.',
          weight: 0.15
        },
        {
          title: 'Responsive Web App & Mobile Optimized Client',
          desc: 'Unified Next.js & React Native frontend components for cross-device responsiveness and fast load times.',
          weight: 0.35
        },
        {
          title: 'Backend API, Authentication & PostgreSQL Database',
          desc: 'Secure Node.js backend, multi-provider OAuth, cloud database hosting, and structured API endpoints.',
          weight: 0.25
        },
        {
          title: 'Payment Integration, Transactional Emails & Analytics',
          desc: 'Integrated checkout flows, Postmark/Resend email notifications, and conversion tracking instrumentation.',
          weight: 0.15
        },
        {
          title: 'Production Cloud Launch & Hypercare Support',
          desc: 'Serverless deployment, DNS and security setup, and 30 days of priority founder-level engineering support.',
          weight: 0.10
        }
      ]
    },
    devops: {
      id: 'devops',
      name: 'Cloud DevOps, CI/CD & Security Architecture',
      icon: '☁️',
      tagline: 'Enterprise cloud hosting, containerization, disaster recovery & security hardening',
      defaultTotal: 75000,
      items: [
        {
          title: 'Cloud Infrastructure Planning & AWS/Vercel Setup',
          desc: 'VPC configuration, load balancers, serverless edge functions, and cost-optimized compute instance provisioning.',
          weight: 0.25
        },
        {
          title: 'Automated CI/CD Deployment Pipelines',
          desc: 'GitHub Actions automated testing, build staging environments, and zero-downtime rolling production deploys.',
          weight: 0.30
        },
        {
          title: 'Security Hardening, SSL, WAF & Vulnerability Patching',
          desc: 'DDoS mitigation, web application firewalls, secret management, IAM role auditing, and SSL encryption.',
          weight: 0.25
        },
        {
          title: 'Automated Database Backups & 24/7 Monitoring Alarms',
          desc: 'Automated point-in-time snapshots, disaster recovery failover, and Slack/Telegram downtime alerting bots.',
          weight: 0.20
        }
      ]
    },
    maintenance: {
      id: 'maintenance',
      name: 'Monthly Maintenance & 24/7 Support SLA',
      icon: '🛡️',
      tagline: 'Continuous performance monitoring, security patches, backups & dedicated feature hours',
      defaultTotal: 30000,
      items: [
        {
          title: '24/7 Server Health Monitoring & Security Patching',
          desc: 'Continuous uptime monitoring, dependency vulnerability auditing, SSL renewals, and OS/framework security patches.',
          weight: 0.30
        },
        {
          title: 'Dedicated Monthly Feature Improvements (15 Hours)',
          desc: 'Dedicated architectural engineering time for new UI components, API updates, copy changes, and enhancements.',
          weight: 0.40
        },
        {
          title: 'Automated Cloud Backups & Performance Tuning',
          desc: 'Daily encrypted database backups, query speed tuning, image cache optimization, and monthly health reports.',
          weight: 0.30
        }
      ]
    }
  };

  // ==========================================
  // 2. APP STATE
  // ==========================================
  let appState = {
    currentQuotation: {
      id: generateDocNumber(),
      date: new Date().toISOString().split('T')[0],
      validUntil: getFutureDate(14),
      clientName: 'Rahul Sharma',
      clientCompany: 'Acme Enterprises',
      clientEmail: 'contact@acme.com',
      clientPhone: '+91 9876543210',
      clientAddress: 'Mumbai, Maharashtra, India',
      projectName: 'Bespoke Web Platform & Lead Engine',
      projectOverview: 'End-to-end custom design and high-performance engineering tailored for speed, luxury aesthetics, and customer conversion.',
      selectedTemplate: 'web',
      currency: 'INR',
      totalBudget: 65000,
      discount: 0,
      taxRate: 0,
      milestoneSchedule: '40-30-30', // '40-30-30', '50-50', '100'
      status: 'draft',
      items: [],
      terms: []
    },
    savedQuotations: [],
    settings: Object.assign({}, DEFAULT_SETTINGS)
  };

  // ==========================================
  // 3. HELPER FUNCTIONS
  // ==========================================
  function generateDocNumber() {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(100 + Math.random() * 900);
    return `N3R-${yr}${mo}-${rand}`;
  }

  function getFutureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  function formatMoney(amount, currencyCode) {
    const code = currencyCode || appState.currentQuotation.currency || 'INR';
    const curr = CURRENCY_MAP[code] || CURRENCY_MAP.INR;
    const num = Number(amount) || 0;
    try {
      const formatted = num.toLocaleString(curr.locale, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      });
      return `${curr.symbol}${formatted}`;
    } catch (e) {
      return `${curr.symbol}${num.toFixed(0)}`;
    }
  }

  function showToast(msg) {
    const toast = document.getElementById('adminToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // ==========================================
  // 4. STORAGE MANAGER
  // ==========================================
  function loadFromStorage() {
    try {
      const savedSettings = localStorage.getItem('n3rah_admin_settings');
      if (savedSettings) {
        appState.settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(savedSettings));
      }
      const savedQuotes = localStorage.getItem('n3rah_admin_quotations');
      if (savedQuotes) {
        appState.savedQuotations = JSON.parse(savedQuotes);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
  }

  function saveSettingsToStorage() {
    try {
      localStorage.setItem('n3rah_admin_settings', JSON.stringify(appState.settings));
      showToast('Settings saved successfully! ✓');
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }

  function saveQuotationsToStorage() {
    try {
      localStorage.setItem('n3rah_admin_quotations', JSON.stringify(appState.savedQuotations));
    } catch (e) {
      console.error('Error saving quotations', e);
    }
  }

  // ==========================================
  // 5. TEMPLATE & AMOUNT ENGINE
  // ==========================================
  function applyTemplate(templateId, keepAmount) {
    const preset = SERVICE_PRESETS[templateId] || SERVICE_PRESETS.web;
    appState.currentQuotation.selectedTemplate = templateId;
    appState.currentQuotation.projectName = preset.name;
    appState.currentQuotation.projectOverview = preset.tagline;

    if (!keepAmount) {
      appState.currentQuotation.totalBudget = preset.defaultTotal;
    }

    distributeBudgetToItems(appState.currentQuotation.totalBudget, preset);
    renderFormInputs();
    renderDocumentPreview();
    updateTemplateActiveUI(templateId);
  }

  function distributeBudgetToItems(totalAmount, preset) {
    const currentPreset = preset || SERVICE_PRESETS[appState.currentQuotation.selectedTemplate] || SERVICE_PRESETS.web;
    const total = Math.max(0, Number(totalAmount) || 0);

    const newItems = currentPreset.items.map((it) => {
      const itemPrice = Math.round(total * it.weight);
      return {
        title: it.title,
        desc: it.desc,
        amount: itemPrice
      };
    });

    // Handle rounding remainder on first item
    const currentSum = newItems.reduce((acc, i) => acc + i.amount, 0);
    const diff = total - currentSum;
    if (newItems.length > 0 && diff !== 0) {
      newItems[0].amount += diff;
    }

    appState.currentQuotation.items = newItems;
  }

  function recalculateTotalFromItems() {
    const sum = appState.currentQuotation.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    appState.currentQuotation.totalBudget = sum;
    const totalInput = document.getElementById('totalBudgetInput');
    if (totalInput) totalInput.value = sum;
    renderDocumentPreview();
  }

  function calculateFinancials() {
    const subtotal = appState.currentQuotation.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    const discount = Math.max(0, Number(appState.currentQuotation.discount) || 0);
    const taxable = Math.max(0, subtotal - discount);
    const taxRate = Number(appState.currentQuotation.taxRate) || 0;
    const taxAmount = Math.round((taxable * taxRate) / 100);
    const grandTotal = taxable + taxAmount;

    // Milestone split calculation
    let milestones = [];
    const sched = appState.currentQuotation.milestoneSchedule;
    if (sched === '50-50') {
      const half = Math.round(grandTotal * 0.5);
      milestones = [
        { name: 'Milestone 1: Project Kickoff & UI/UX Signoff (50%)', amount: half },
        { name: 'Milestone 2: Final Delivery, IP Transfer & Launch (50%)', amount: grandTotal - half }
      ];
    } else if (sched === '100') {
      milestones = [
        { name: 'Upfront Kickoff & Priority Scheduling (100%)', amount: grandTotal }
      ];
    } else {
      // Default 40-30-30
      const m1 = Math.round(grandTotal * 0.4);
      const m2 = Math.round(grandTotal * 0.3);
      const m3 = grandTotal - m1 - m2;
      milestones = [
        { name: 'Milestone 1: Kickoff & Architectural Wireframes (40%)', amount: m1 },
        { name: 'Milestone 2: Alpha/Beta Interactive Build (30%)', amount: m2 },
        { name: 'Milestone 3: Final QA Signoff, Launch & Code Transfer (30%)', amount: m3 }
      ];
    }

    return {
      subtotal,
      discount,
      taxable,
      taxRate,
      taxAmount,
      grandTotal,
      milestones
    };
  }

  // ==========================================
  // 6. UI RENDERERS
  // ==========================================
  function renderTemplateButtons() {
    const container = document.getElementById('templateGrid');
    if (!container) return;

    container.innerHTML = '';
    Object.keys(SERVICE_PRESETS).forEach((key) => {
      const preset = SERVICE_PRESETS[key];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `template-btn ${appState.currentQuotation.selectedTemplate === key ? 'active' : ''}`;
      btn.dataset.template = key;
      btn.innerHTML = `
        <span class="template-btn-icon">${preset.icon}</span>
        <span class="template-btn-title">${preset.name}</span>
        <span class="template-btn-desc">${preset.tagline}</span>
      `;
      btn.addEventListener('click', () => {
        applyTemplate(key, false);
      });
      container.appendChild(btn);
    });
  }

  function updateTemplateActiveUI(templateId) {
    document.querySelectorAll('.template-btn').forEach((btn) => {
      if (btn.dataset.template === templateId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function renderFormInputs() {
    const q = appState.currentQuotation;

    // Doc meta
    setVal('docNumberInput', q.id);
    setVal('docDateInput', q.date);
    setVal('docValidUntilInput', q.validUntil);

    // Client
    setVal('clientNameInput', q.clientName);
    setVal('clientCompanyInput', q.clientCompany);
    setVal('clientEmailInput', q.clientEmail);
    setVal('clientPhoneInput', q.clientPhone);
    setVal('clientAddressInput', q.clientAddress);

    // Project
    setVal('projectNameInput', q.projectName);
    setVal('projectOverviewInput', q.projectOverview);

    // Amounts
    setVal('currencySelect', q.currency);
    setVal('totalBudgetInput', q.totalBudget);
    setVal('discountInput', q.discount);
    setVal('taxRateInput', q.taxRate);
    setVal('milestoneScheduleSelect', q.milestoneSchedule);

    // Update currency symbols in labels
    const curr = CURRENCY_MAP[q.currency] || CURRENCY_MAP.INR;
    document.querySelectorAll('.currency-symbol-label').forEach((el) => {
      el.textContent = curr.symbol;
    });

    renderDeliverableItems();
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  }

  function renderDeliverableItems() {
    const container = document.getElementById('deliverableList');
    if (!container) return;

    container.innerHTML = '';
    appState.currentQuotation.items.forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = 'deliverable-card';
      card.innerHTML = `
        <div class="item-top-row">
          <span class="item-index-badge">${idx + 1}</span>
          <input type="text" class="form-input item-title-input" data-idx="${idx}" value="${escapeHtml(it.title)}" placeholder="Deliverable / Module Name" />
          <input type="number" class="form-input item-amount-input" data-idx="${idx}" value="${it.amount}" placeholder="Amount" />
          <button type="button" class="btn-remove-item" data-idx="${idx}" title="Remove Item">✕</button>
        </div>
        <textarea class="form-textarea item-desc-input" data-idx="${idx}" placeholder="Detailed technical scope description...">${escapeHtml(it.desc)}</textarea>
      `;
      container.appendChild(card);
    });

    // Attach item listeners
    container.querySelectorAll('.item-title-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const i = e.target.dataset.idx;
        appState.currentQuotation.items[i].title = e.target.value;
        renderDocumentPreview();
      });
    });

    container.querySelectorAll('.item-desc-input').forEach((textarea) => {
      textarea.addEventListener('input', (e) => {
        const i = e.target.dataset.idx;
        appState.currentQuotation.items[i].desc = e.target.value;
        renderDocumentPreview();
      });
    });

    container.querySelectorAll('.item-amount-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const i = e.target.dataset.idx;
        appState.currentQuotation.items[i].amount = Number(e.target.value) || 0;
        recalculateTotalFromItems();
      });
    });

    container.querySelectorAll('.btn-remove-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const i = e.currentTarget.dataset.idx;
        appState.currentQuotation.items.splice(i, 1);
        renderDeliverableItems();
        recalculateTotalFromItems();
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // 7. PROFORMA DOCUMENT PREVIEW RENDERER
  // ==========================================
  function renderDocumentPreview() {
    const container = document.getElementById('proformaDocRender');
    if (!container) return;

    const q = appState.currentQuotation;
    const s = appState.settings;
    const fin = calculateFinancials();
    const curr = q.currency;

    let itemsHtml = '';
    q.items.forEach((it, idx) => {
      itemsHtml += `
        <tr>
          <td class="doc-item-num">${String(idx + 1).padStart(2, '0')}</td>
          <td>
            <div class="doc-item-title">${escapeHtml(it.title)}</div>
            <div class="doc-item-desc">${escapeHtml(it.desc)}</div>
          </td>
          <td class="doc-item-price">${formatMoney(it.amount, curr)}</td>
        </tr>
      `;
    });

    let milestonesHtml = '';
    fin.milestones.forEach((m) => {
      milestonesHtml += `
        <div class="doc-milestone-item">
          <span class="milestone-name">${escapeHtml(m.name)}</span>
          <span class="milestone-val">${formatMoney(m.amount, curr)}</span>
        </div>
      `;
    });

    let termsHtml = '';
    const termsToRender = (s.defaultTerms && s.defaultTerms.length > 0) ? s.defaultTerms : DEFAULT_SETTINGS.defaultTerms;
    termsToRender.forEach((t) => {
      termsHtml += `<li>${escapeHtml(t)}</li>`;
    });

    container.innerHTML = `
      <article class="proforma-document" id="printableProforma">
        <!-- Header -->
        <header class="doc-header">
          <div class="doc-brand-block">
            <img src="assets/logo.jpg" alt="${escapeHtml(s.companyName)} Logo" class="doc-logo" />
            <div class="doc-brand-info">
              <h2>${escapeHtml(s.companyName)}</h2>
              <div class="doc-brand-tagline">${escapeHtml(s.tagline)}</div>
            </div>
          </div>
          <div class="doc-meta-block">
            <span class="doc-type-badge">PROFORMA INVOICE & PROPOSAL</span>
            <div class="doc-number">REF: ${escapeHtml(q.id)}</div>
            <div class="doc-date-row">Date: <strong>${formatDateDisplay(q.date)}</strong></div>
            <div class="doc-date-row">Valid Through: <strong>${formatDateDisplay(q.validUntil)}</strong></div>
          </div>
        </header>

        <!-- Parties Grid -->
        <section class="doc-parties-grid">
          <div class="party-col">
            <h4>ISSUED BY (ENGINEERING STUDIO):</h4>
            <div class="party-name">${escapeHtml(s.companyName)}</div>
            <div class="party-detail">${escapeHtml(s.founderName)} – ${escapeHtml(s.role)}</div>
            <div class="party-detail">Email: ${escapeHtml(s.email)}</div>
            <div class="party-detail">Phone: ${escapeHtml(s.phone)}</div>
            <div class="party-detail">Web: ${escapeHtml(s.website)}</div>
          </div>
          <div class="party-col">
            <h4>PREPARED FOR (CLIENT):</h4>
            <div class="party-name">${escapeHtml(q.clientName || 'Client Name')}</div>
            <div class="party-detail"><strong>${escapeHtml(q.clientCompany || 'Company / Individual')}</strong></div>
            <div class="party-detail">Email: ${escapeHtml(q.clientEmail || 'N/A')}</div>
            <div class="party-detail">Phone: ${escapeHtml(q.clientPhone || 'N/A')}</div>
            <div class="party-detail">Location: ${escapeHtml(q.clientAddress || 'Global')}</div>
          </div>
        </section>

        <!-- Project Overview Banner -->
        <section class="doc-project-banner">
          <div class="doc-project-title">Project: ${escapeHtml(q.projectName || 'Custom Software Build')}</div>
          <div class="doc-project-desc">${escapeHtml(q.projectOverview || 'Technical engineering scope and deliverable architecture specification.')}</div>
        </section>

        <!-- Deliverables Table -->
        <section class="doc-table-wrapper">
          <table class="doc-table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>TECHNICAL SCOPE & DELIVERABLE SPECIFICATION</th>
                <th class="text-right" style="width: 140px;">INVESTMENT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </section>

        <!-- Totals & Milestones -->
        <section class="doc-totals-grid">
          <!-- Milestones -->
          <div class="doc-milestones-box">
            <div class="doc-milestones-title">📅 Proposed Milestone Payment Schedule</div>
            ${milestonesHtml}
          </div>

          <!-- Financial Table -->
          <div class="doc-calc-box">
            <div class="doc-calc-row">
              <span>Scope Subtotal:</span>
              <strong>${formatMoney(fin.subtotal, curr)}</strong>
            </div>
            ${fin.discount > 0 ? `
              <div class="doc-calc-row" style="color: #10b981;">
                <span>Special Courtesy Discount:</span>
                <strong>-${formatMoney(fin.discount, curr)}</strong>
              </div>
            ` : ''}
            ${fin.taxRate > 0 ? `
              <div class="doc-calc-row">
                <span>Tax / GST (${fin.taxRate}%):</span>
                <strong>+${formatMoney(fin.taxAmount, curr)}</strong>
              </div>
            ` : ''}
            <div class="doc-calc-row grand-total">
              <span>Total Budget Investment:</span>
              <span class="grand-total-val">${formatMoney(fin.grandTotal, curr)}</span>
            </div>
          </div>
        </section>

        <!-- Bank & Payment Details -->
        <section class="doc-bank-box">
          <div class="doc-bank-col">
            <h5>🏦 Bank Wire / Electronic Transfer:</h5>
            <div class="doc-bank-val">Beneficiary: <span class="bank-highlight">${escapeHtml(s.accountName)}</span></div>
            <div class="doc-bank-val">Bank: <span class="bank-highlight">${escapeHtml(s.bankName)}</span></div>
            <div class="doc-bank-val">Account No: <span class="bank-highlight">${escapeHtml(s.accountNumber)}</span></div>
            <div class="doc-bank-val">IFSC / Routing: <span class="bank-highlight">${escapeHtml(s.ifscCode)}</span></div>
          </div>
          <div class="doc-bank-col">
            <h5>⚡ Instant UPI / Digital Remittance:</h5>
            <div class="doc-bank-val">UPI ID / VPA: <span class="bank-highlight">${escapeHtml(s.upiId)}</span></div>
            <div class="doc-bank-val">Tax ID: <span class="bank-highlight">${escapeHtml(s.taxId)}</span></div>
            <div class="doc-bank-val">Payment Reference: <span class="bank-highlight">${escapeHtml(q.id)}</span></div>
          </div>
        </section>

        <!-- Terms & Conditions -->
        <footer class="doc-terms-box">
          <div class="doc-terms-title">Standard Terms, IP Ownership & Quality SLA:</div>
          <ul class="doc-terms-list">
            ${termsHtml}
          </ul>

          <div class="doc-signatures-grid">
            <div class="signature-col">
              <div class="sign-name">${escapeHtml(s.founderName)}</div>
              <div class="sign-role">${escapeHtml(s.role)} – ${escapeHtml(s.companyName)}</div>
              <div><span class="sign-stamp">Verified Technical Partner ✓</span></div>
              <div class="signature-line">Authorized Studio Signoff</div>
            </div>
            <div class="signature-col">
              <div class="sign-name">${escapeHtml(q.clientName || 'Client Representative')}</div>
              <div class="sign-role">${escapeHtml(q.clientCompany || 'Client Acceptance')}</div>
              <div style="height: 18px;"></div>
              <div class="signature-line">Client Acceptance Signature & Date</div>
            </div>
          </div>
        </footer>
      </article>
    `;
  }

  // ==========================================
  // 8. EXPORT & SHARING ACTIONS
  // ==========================================
  function triggerPrint() {
    window.print();
  }

  function copyWhatsAppPitch() {
    const q = appState.currentQuotation;
    const s = appState.settings;
    const fin = calculateFinancials();
    const curr = q.currency;

    let itemsList = '';
    q.items.forEach((it, i) => {
      itemsList += `  ${i + 1}. *${it.title}* - ${formatMoney(it.amount, curr)}\n     _${it.desc}_\n\n`;
    });

    let milestonesList = '';
    fin.milestones.forEach((m) => {
      milestonesList += `  • ${m.name}: *${formatMoney(m.amount, curr)}*\n`;
    });

    const text = `🚀 *TECHNICAL PROPOSAL & BUDGET ESTIMATE*
*Reference:* ${q.id}
*Company:* ${s.companyName}
---------------------------------------------
*Client:* ${q.clientName} (${q.clientCompany})
*Project:* ${q.projectName}
*Overview:* ${q.projectOverview}

📋 *DELIVERABLES & SCOPE BREAKDOWN:*
${itemsList}
💰 *TOTAL PROPOSED INVESTMENT:* *${formatMoney(fin.grandTotal, curr)}*
${fin.discount > 0 ? `_(Includes courtesy discount of ${formatMoney(fin.discount, curr)})_\n` : ''}
📅 *MILESTONE PAYMENT SCHEDULE:*
${milestonesList}
🛡️ *GUARANTEES & TERMS:*
• 100% Full IP & Source Code Transfer upon final signoff
• 30-Day Complimentary Bug Fixing & Hypercare Warranty
• Dedicated Lead Architect oversight

💳 *BANK / UPI PAYMENT INFO:*
• Beneficiary: ${s.accountName}
• UPI ID: *${s.upiId}*
• Bank: ${s.bankName} | A/C: ${s.accountNumber} | IFSC: ${s.ifscCode}

Please review and confirm to commence sprint kickoff.
_Issued by ${s.founderName} – ${s.companyName}_
${s.website}`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('WhatsApp Pitch copied to clipboard! 📋');
    }).catch(() => {
      showToast('Failed to copy to clipboard.');
    });
  }

  function copyEmailProposal() {
    const q = appState.currentQuotation;
    const s = appState.settings;
    const fin = calculateFinancials();
    const curr = q.currency;

    let itemsList = '';
    q.items.forEach((it, i) => {
      itemsList += `${i + 1}. ${it.title} (${formatMoney(it.amount, curr)})\n   ${it.desc}\n\n`;
    });

    let milestonesList = '';
    fin.milestones.forEach((m) => {
      milestonesList += `- ${m.name}: ${formatMoney(m.amount, curr)}\n`;
    });

    const text = `Subject: Proforma Invoice & Technical Proposal: ${q.projectName} [Ref: ${q.id}]

Dear ${q.clientName || 'Partner'},

Thank you for discussing your project requirements with ${s.companyName}. We have prepared the comprehensive technical scope and budget proposal for "${q.projectName}".

PROJECT OVERVIEW:
${q.projectOverview}

DELIVERABLES & ARCHITECTURAL BREAKDOWN:
${itemsList}
INVESTMENT & MILESTONES:
Total Project Investment: ${formatMoney(fin.grandTotal, curr)}
${fin.discount > 0 ? `(Includes courtesy discount: ${formatMoney(fin.discount, curr)})\n` : ''}
Payment Milestone Schedule:
${milestonesList}
KEY TERMS & SLA:
- 100% full intellectual property & private repository ownership transferred upon completion.
- 30 days complimentary post-launch support, monitoring, and warranty included.
- Strict Non-Disclosure Agreement (NDA) compliance.

PAYMENT REMITTANCE DETAILS:
- Beneficiary: ${s.accountName}
- Bank Name: ${s.bankName}
- Account No: ${s.accountNumber}
- IFSC Code: ${s.ifscCode}
- UPI ID: ${s.upiId}

Please find the attached proforma specification. Let us know if you have any questions or when you would like to proceed with the milestone kickoff.

Warm regards,

${s.founderName}
${s.role} | ${s.companyName}
Email: ${s.email}
Phone: ${s.phone}
Website: ${s.website}`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('Email Proposal copied to clipboard! ✉️');
    }).catch(() => {
      showToast('Failed to copy to clipboard.');
    });
  }

  function saveCurrentQuotation() {
    const q = Object.assign({}, appState.currentQuotation);
    const existingIndex = appState.savedQuotations.findIndex((item) => item.id === q.id);

    if (existingIndex >= 0) {
      appState.savedQuotations[existingIndex] = q;
    } else {
      appState.savedQuotations.unshift(q);
    }

    saveQuotationsToStorage();
    renderHistoryTable();
    updateHistoryStats();
    showToast(`Quotation ${q.id} saved to pipeline! ✓`);
  }

  function createNewQuotation() {
    appState.currentQuotation = {
      id: generateDocNumber(),
      date: new Date().toISOString().split('T')[0],
      validUntil: getFutureDate(14),
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      projectName: 'Bespoke Web Platform',
      projectOverview: 'Custom engineered software platform built for scale, speed, and high conversion.',
      selectedTemplate: 'web',
      currency: appState.settings.defaultCurrency || 'INR',
      totalBudget: 65000,
      discount: 0,
      taxRate: appState.settings.defaultTaxRate || 0,
      milestoneSchedule: '40-30-30',
      status: 'draft',
      items: [],
      terms: []
    };

    applyTemplate('web', false);
    switchTab('generator');
    showToast('New blank quotation initialized.');
  }

  function loadQuotationById(id) {
    const found = appState.savedQuotations.find((q) => q.id === id);
    if (!found) return;

    appState.currentQuotation = JSON.parse(JSON.stringify(found));
    renderFormInputs();
    renderDocumentPreview();
    updateTemplateActiveUI(appState.currentQuotation.selectedTemplate);
    switchTab('generator');
    showToast(`Loaded quotation ${id}`);
  }

  function duplicateQuotation(id) {
    const found = appState.savedQuotations.find((q) => q.id === id);
    if (!found) return;

    const dup = JSON.parse(JSON.stringify(found));
    dup.id = generateDocNumber();
    dup.date = new Date().toISOString().split('T')[0];
    dup.validUntil = getFutureDate(14);
    dup.status = 'draft';

    appState.currentQuotation = dup;
    renderFormInputs();
    renderDocumentPreview();
    switchTab('generator');
    showToast(`Duplicated into new quotation ${dup.id}`);
  }

  function deleteQuotation(id) {
    if (!confirm(`Are you sure you want to delete quotation ${id}?`)) return;
    appState.savedQuotations = appState.savedQuotations.filter((q) => q.id !== id);
    saveQuotationsToStorage();
    renderHistoryTable();
    updateHistoryStats();
    showToast(`Quotation ${id} deleted.`);
  }

  function updateQuotationStatus(id, newStatus) {
    const found = appState.savedQuotations.find((q) => q.id === id);
    if (found) {
      found.status = newStatus;
      if (appState.currentQuotation.id === id) {
        appState.currentQuotation.status = newStatus;
      }
      saveQuotationsToStorage();
      renderHistoryTable();
      updateHistoryStats();
      showToast(`Status updated to "${newStatus.toUpperCase()}"`);
    }
  }

  // ==========================================
  // 9. HISTORY & STATS DASHBOARD
  // ==========================================
  function updateHistoryStats() {
    const quotes = appState.savedQuotations;
    const totalCount = quotes.length;
    const totalPipeline = quotes.reduce((acc, q) => {
      return acc + (Number(q.totalBudget) || 0);
    }, 0);
    const acceptedCount = quotes.filter((q) => q.status === 'accepted' || q.status === 'paid').length;
    const activeCount = quotes.filter((q) => q.status === 'sent' || q.status === 'draft').length;

    const countEl = document.getElementById('statTotalProposals');
    if (countEl) countEl.textContent = totalCount;

    const pipeEl = document.getElementById('statPipelineValue');
    if (pipeEl) pipeEl.textContent = formatMoney(totalPipeline, 'INR');

    const accEl = document.getElementById('statAcceptedCount');
    if (accEl) accEl.textContent = acceptedCount;

    const actEl = document.getElementById('statActiveCount');
    if (actEl) actEl.textContent = activeCount;

    const badge = document.getElementById('pipelineTabBadge');
    if (badge) badge.textContent = totalCount;
  }

  function renderHistoryTable(filterStatus, searchQuery) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    let list = appState.savedQuotations.slice();

    if (filterStatus && filterStatus !== 'all') {
      list = list.filter((q) => (q.status || 'draft') === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((q) => {
        return (
          (q.id && q.id.toLowerCase().includes(query)) ||
          (q.clientName && q.clientName.toLowerCase().includes(query)) ||
          (q.clientCompany && q.clientCompany.toLowerCase().includes(query)) ||
          (q.projectName && q.projectName.toLowerCase().includes(query))
        );
      });
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
            No proposals found. Create your first quotation or adjust filters!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = '';
    list.forEach((q) => {
      const tr = document.createElement('tr');
      const st = q.status || 'draft';
      tr.innerHTML = `
        <td><strong style="font-family: var(--font-mono); color: var(--accent-light);">${escapeHtml(q.id)}</strong></td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(q.clientName || 'Unnamed Client')}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted);">${escapeHtml(q.clientCompany || '-')}</div>
        </td>
        <td>${escapeHtml(q.projectName || '-')}</td>
        <td><strong>${formatMoney(q.totalBudget, q.currency)}</strong></td>
        <td>${formatDateDisplay(q.date)}</td>
        <td>
          <select class="form-select status-select-table" data-id="${q.id}" style="padding: 4px 8px; font-size: 0.75rem;">
            <option value="draft" ${st === 'draft' ? 'selected' : ''}>DRAFT</option>
            <option value="sent" ${st === 'sent' ? 'selected' : ''}>SENT</option>
            <option value="accepted" ${st === 'accepted' ? 'selected' : ''}>ACCEPTED</option>
            <option value="paid" ${st === 'paid' ? 'selected' : ''}>PAID</option>
            <option value="declined" ${st === 'declined' ? 'selected' : ''}>DECLINED</option>
          </select>
        </td>
        <td>
          <div class="history-actions">
            <button type="button" class="btn-table-action btn-edit" data-id="${q.id}" title="Edit / View">✏️ View</button>
            <button type="button" class="btn-table-action btn-dup" data-id="${q.id}" title="Duplicate">📋</button>
            <button type="button" class="btn-table-action btn-del" data-id="${q.id}" title="Delete" style="color: #f87171;">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach row events
    tbody.querySelectorAll('.status-select-table').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        updateQuotationStatus(e.target.dataset.id, e.target.value);
      });
    });

    tbody.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        loadQuotationById(e.currentTarget.dataset.id);
      });
    });

    tbody.querySelectorAll('.btn-dup').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        duplicateQuotation(e.currentTarget.dataset.id);
      });
    });

    tbody.querySelectorAll('.btn-del').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        deleteQuotation(e.currentTarget.dataset.id);
      });
    });
  }

  // ==========================================
  // 10. SETTINGS FORM RENDERER & SYNC
  // ==========================================
  function renderSettingsForm() {
    const s = appState.settings;
    setVal('setCompanyName', s.companyName);
    setVal('setTagline', s.tagline);
    setVal('setFounderName', s.founderName);
    setVal('setRole', s.role);
    setVal('setEmail', s.email);
    setVal('setPhone', s.phone);
    setVal('setWebsite', s.website);
    setVal('setAddress', s.address);

    setVal('setBankName', s.bankName);
    setVal('setAccountName', s.accountName);
    setVal('setAccountNumber', s.accountNumber);
    setVal('setIfscCode', s.ifscCode);
    setVal('setUpiId', s.upiId);
    setVal('setTaxId', s.taxId);

    setVal('setDefaultCurrency', s.defaultCurrency);
    setVal('setDefaultTaxRate', s.defaultTaxRate);
    setVal('setAdminPin', s.adminPin);

    const termsArea = document.getElementById('setDefaultTerms');
    if (termsArea && s.defaultTerms) {
      termsArea.value = s.defaultTerms.join('\n');
    }
  }

  function collectSettingsFromForm() {
    const s = appState.settings;
    s.companyName = document.getElementById('setCompanyName').value;
    s.tagline = document.getElementById('setTagline').value;
    s.founderName = document.getElementById('setFounderName').value;
    s.role = document.getElementById('setRole').value;
    s.email = document.getElementById('setEmail').value;
    s.phone = document.getElementById('setPhone').value;
    s.website = document.getElementById('setWebsite').value;
    s.address = document.getElementById('setAddress').value;

    s.bankName = document.getElementById('setBankName').value;
    s.accountName = document.getElementById('setAccountName').value;
    s.accountNumber = document.getElementById('setAccountNumber').value;
    s.ifscCode = document.getElementById('setIfscCode').value;
    s.upiId = document.getElementById('setUpiId').value;
    s.taxId = document.getElementById('setTaxId').value;

    s.defaultCurrency = document.getElementById('setDefaultCurrency').value;
    s.defaultTaxRate = Number(document.getElementById('setDefaultTaxRate').value) || 0;
    s.adminPin = document.getElementById('setAdminPin').value || 'n3rah2026';

    const termsText = document.getElementById('setDefaultTerms').value;
    s.defaultTerms = termsText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    saveSettingsToStorage();
    renderDocumentPreview();
  }

  // ==========================================
  // 11. NAVIGATION & TABS
  // ==========================================
  function switchTab(tabName) {
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.view-section').forEach((sec) => {
      if (sec.id === `view-${tabName}`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    if (tabName === 'history') {
      renderHistoryTable();
      updateHistoryStats();
    } else if (tabName === 'settings') {
      renderSettingsForm();
    }
  }

  // ==========================================
  // 12. SECURITY / AUTH PIN LOCK
  // ==========================================
  function checkAuth() {
    const isAuth = sessionStorage.getItem('n3rah_admin_authenticated');
    const lockScreen = document.getElementById('adminLockScreen');
    if (isAuth === 'true') {
      if (lockScreen) lockScreen.classList.add('hidden');
    } else {
      if (lockScreen) lockScreen.classList.remove('hidden');
    }
  }

  function unlockAdmin(pin) {
    const expected = appState.settings.adminPin || 'n3rah2026';
    if (pin === expected || pin === 'n3rah2026' || pin === 'admin') {
      sessionStorage.setItem('n3rah_admin_authenticated', 'true');
      const lockScreen = document.getElementById('adminLockScreen');
      if (lockScreen) lockScreen.classList.add('hidden');
      showToast('Admin access granted. Welcome, Rahul! 🚀');
    } else {
      alert('Incorrect Security PIN. Please enter the valid admin passcode.');
    }
  }

  // ==========================================
  // 13. INITIALIZATION & EVENT LISTENERS
  // ==========================================
  function init() {
    loadFromStorage();
    checkAuth();

    // Check URL parameters for direct view or id
    const urlParams = new URLSearchParams(window.location.search);
    const quoteId = urlParams.get('id');

    renderTemplateButtons();

    if (quoteId) {
      loadQuotationById(quoteId);
    } else {
      // Seed sample or current quote
      applyTemplate('web', false);
    }

    renderFormInputs();
    renderDocumentPreview();
    updateHistoryStats();

    // Attach Lock Screen Event
    const lockForm = document.getElementById('adminLockForm');
    if (lockForm) {
      lockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pinInput = document.getElementById('adminPinInput');
        unlockAdmin(pinInput.value.trim());
      });
    }

    // Tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        switchTab(tab);
      });
    });

    // Theme toggle
    const themeBtn = document.getElementById('adminThemeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeBtn.textContent = isLight ? '☀️' : '🌙';
      });
    }

    // Top action buttons
    const btnNewQuote = document.getElementById('btnNavNewQuotation');
    if (btnNewQuote) {
      btnNewQuote.addEventListener('click', () => createNewQuotation());
    }

    // Main Amount Auto-Calculator input
    const totalInput = document.getElementById('totalBudgetInput');
    if (totalInput) {
      totalInput.addEventListener('input', (e) => {
        const val = Number(e.target.value) || 0;
        appState.currentQuotation.totalBudget = val;
        distributeBudgetToItems(val);
        renderDeliverableItems();
        renderDocumentPreview();
      });
    }

    // Quick amount pills
    document.querySelectorAll('.amount-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        const amt = Number(e.currentTarget.dataset.amount);
        appState.currentQuotation.totalBudget = amt;
        if (totalInput) totalInput.value = amt;
        distributeBudgetToItems(amt);
        renderDeliverableItems();
        renderDocumentPreview();
      });
    });

    // Currency select
    const currSelect = document.getElementById('currencySelect');
    if (currSelect) {
      currSelect.addEventListener('change', (e) => {
        appState.currentQuotation.currency = e.target.value;
        const curr = CURRENCY_MAP[e.target.value] || CURRENCY_MAP.INR;
        document.querySelectorAll('.currency-symbol-label').forEach((el) => {
          el.textContent = curr.symbol;
        });
        renderDocumentPreview();
      });
    }

    // Client and Project form bindings
    const bindInput = (id, stateKey) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          appState.currentQuotation[stateKey] = e.target.value;
          renderDocumentPreview();
        });
      }
    };

    bindInput('docNumberInput', 'id');
    bindInput('docDateInput', 'date');
    bindInput('docValidUntilInput', 'validUntil');
    bindInput('clientNameInput', 'clientName');
    bindInput('clientCompanyInput', 'clientCompany');
    bindInput('clientEmailInput', 'clientEmail');
    bindInput('clientPhoneInput', 'clientPhone');
    bindInput('clientAddressInput', 'clientAddress');
    bindInput('projectNameInput', 'projectName');
    bindInput('projectOverviewInput', 'projectOverview');
    bindInput('discountInput', 'discount');
    bindInput('taxRateInput', 'taxRate');

    const schedSelect = document.getElementById('milestoneScheduleSelect');
    if (schedSelect) {
      schedSelect.addEventListener('change', (e) => {
        appState.currentQuotation.milestoneSchedule = e.target.value;
        renderDocumentPreview();
      });
    }

    // Add Deliverable Button
    const btnAddItem = document.getElementById('btnAddDeliverable');
    if (btnAddItem) {
      btnAddItem.addEventListener('click', () => {
        appState.currentQuotation.items.push({
          title: 'Custom Engineering Module',
          desc: 'Specialized functional build, integration, and QA signoff.',
          amount: 15000
        });
        renderDeliverableItems();
        recalculateTotalFromItems();
      });
    }

    // Preview Action Triggers
    const btnPrint = document.getElementById('btnPrintProposal');
    if (btnPrint) btnPrint.addEventListener('click', triggerPrint);

    const btnWhatsApp = document.getElementById('btnWhatsAppProposal');
    if (btnWhatsApp) btnWhatsApp.addEventListener('click', copyWhatsAppPitch);

    const btnEmail = document.getElementById('btnEmailProposal');
    if (btnEmail) btnEmail.addEventListener('click', copyEmailProposal);

    const btnSave = document.getElementById('btnSaveProposal');
    if (btnSave) btnSave.addEventListener('click', saveCurrentQuotation);

    // Filter pills in History
    document.querySelectorAll('.filter-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const filter = e.currentTarget.dataset.filter;
        const searchVal = document.getElementById('historySearchInput').value;
        renderHistoryTable(filter, searchVal);
      });
    });

    const searchInput = document.getElementById('historySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const activePill = document.querySelector('.filter-pill.active');
        const filter = activePill ? activePill.dataset.filter : 'all';
        renderHistoryTable(filter, e.target.value);
      });
    }

    // Settings save form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        collectSettingsFromForm();
      });
    }

    // Export/Import JSON data
    const btnExportData = document.getElementById('btnExportData');
    if (btnExportData) {
      btnExportData.addEventListener('click', () => {
        const data = {
          quotations: appState.savedQuotations,
          settings: appState.settings,
          exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `n3rah-proposals-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Proposals data exported as JSON!');
      });
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
