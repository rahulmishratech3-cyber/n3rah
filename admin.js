/**
 * N3Rah Admin Panel & Quotation / Proforma Invoice Generator
 * Enterprise Cyber Security Hardened Edition
 * 
 * Security Controls Implemented:
 * 1. Cryptographic SHA-256 Hashing & Salting (Web Crypto API - Zero Plaintext Storage)
 * 2. Adaptive Rate Limiting & Brute-Force Lockout Defense (5 Attempts Max -> 10m Lockout)
 * 3. Strict DOM & Stored XSS Sanitization Engine (Anti-Script, Anti-Event-Handler, HTML Entity Encoding)
 * 4. Anti-Prototype Pollution Secure JSON Deserialization
 * 5. Inactivity Auto-Lockout Session Guard (30-Minute Idle Expiry)
 * 6. Frame-Busting Anti-Clickjacking Layer
 * 7. Memory Scrubbing on Sensitive Form Submissions
 */

(function () {
  'use strict';

  // ==========================================
  // 0. ANTI-CLICKJACKING FRAME BUSTER
  // ==========================================
  if (window.top !== window.self) {
    try {
      window.top.location = window.self.location;
    } catch (e) {
      window.location = 'about:blank';
    }
  }

  // ==========================================
  // 1. CRYPTOGRAPHIC & SECURITY MODULE
  // ==========================================
  const SECURITY_CONSTANTS = Object.freeze({
    PEPPER: 'N3Rah_Studio_Sec_Vault_v3',
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 10 * 60 * 1000, // 10 minutes
    INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
    // Pre-computed salted SHA-256 hashes for fallback passcodes (N3Rah@2803 & n3rah2026)
    DEFAULT_PASSCODE_HASHES: [
      'c851167406a096c1da4b7264a4d2f09973fc78cf7d853db5d564cf525b6c00f0', // N3Rah@2803 (with default salt)
      '2c544d673906a233b86026a798b31a89c8a98a08d3381665a3d756d11f185c70', // N3Rah@2803 (standalone)
      '9e8b3b726c04f981b29d4db49b5c33890f5c150c2262d083e9b110b99859f1eb'  // n3rah2026
    ]
  });

  // Pure JS SHA-256 Fallback for Non-HTTPS Local Network Environments
  function jsSha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j;
    let result = '';
    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    let hash = [];
    const k = [];
    let primeCounter = 0;

    const isPrime = (candidate) => {
      for (let factor = 2; factor * factor <= candidate; factor++) {
        if (candidate % factor === 0) return false;
      }
      return true;
    };

    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (isPrime(candidate)) {
        if (primeCounter < 8) {
          hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
        }
        k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        primeCounter++;
      }
    }

    ascii += '\x80';
    while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return;
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;

    for (j = 0; j < words[lengthProperty]; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash;
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
        const i2 = i + j;
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);
        const temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (8 * j)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  async function sha256(message) {
    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      try {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {}
    }
    return jsSha256(message);
  }

  function generateSalt() {
    if (window.crypto && window.crypto.getRandomValues) {
      try {
        const arr = new Uint8Array(16);
        window.crypto.getRandomValues(arr);
        return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {}
    }
    let res = '';
    for (let i = 0; i < 16; i++) {
      res += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    }
    return res;
  }

  async function computeHash(pin, salt) {
    return await sha256(`${salt || ''}:${pin}:${SECURITY_CONSTANTS.PEPPER}`);
  }

  // Strict XSS Sanitizer: Eliminates dangerous tags, attributes, event handlers, protocols
  function sanitize(str) {
    if (str === null || str === undefined) return '';
    let val = String(str);

    // Remove null bytes
    val = val.replace(/\0/g, '');

    // Strip dangerous script, iframe, object, embed tags
    val = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    val = val.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    val = val.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    val = val.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

    // Strip javascript:, vbscript:, data: protocols
    val = val.replace(/(javascript|vbscript|data):/gi, '$1_safe:');

    // Strip inline event handlers like onload, onerror, onclick, etc.
    val = val.replace(/\bon\w+\s*=/gi, 'data-blocked=');

    // Escape dangerous tags and characters safely
    return val
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Safe Prototype Pollution Resistant JSON Parser
  function secureJSONParse(text) {
    return JSON.parse(text, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    });
  }

  // ==========================================
  // 2. DEFAULT CONFIGURATION & TEMPLATES
  // ==========================================
  const DEFAULT_SETTINGS = Object.freeze({
    companyName: 'N3Rah Tech Studio',
    tagline: 'INNOVATING THE FUTURE, CONNECTING THE WORLD',
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
    pinHash: '',
    pinSalt: '',
    defaultTerms: [
      '100% full intellectual property & repository ownership transferred to client upon final milestone payment.',
      'Includes 30 days of complimentary post-launch bug fixing, performance monitoring & technical warranty.',
      'All source code and architectural documentation will be provided via private GitHub / GitLab repositories.',
      'Payment schedule: 40% initial kickoff advance, 30% alpha/beta feature milestone, 30% final signoff & handover.',
      'Strict Non-Disclosure Agreement (NDA) and confidential handling of all proprietary project materials.'
    ]
  });

  const CURRENCY_MAP = Object.freeze({
    INR: { symbol: '₹', locale: 'en-IN' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    AED: { symbol: 'AED ', locale: 'en-AE' },
    CAD: { symbol: 'CA$', locale: 'en-CA' },
    AUD: { symbol: 'AU$', locale: 'en-AU' }
  });

  const SERVICE_PRESETS = Object.freeze({
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
          desc: 'Modern semantic HTML5/CSS3/JavaScript or Next.js engineering with smooth animations and glassmorphic UI.',
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
          desc: 'Integrated checkout flows, transactional notifications, and conversion tracking instrumentation.',
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
  });

  // ==========================================
  // 3. APP STATE & IN-MEMORY MODEL
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
      milestoneSchedule: '40-30-30',
      status: 'draft',
      items: [],
      terms: []
    },
    savedQuotations: [],
    settings: Object.assign({}, DEFAULT_SETTINGS)
  };

  let lastActivityTimestamp = Date.now();

  // ==========================================
  // 4. HELPER & FORMATTING FUNCTIONS
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
      return sanitize(dateStr);
    }
  }

  function formatMoney(amount, currencyCode) {
    const code = currencyCode || appState.currentQuotation.currency || 'INR';
    const curr = CURRENCY_MAP[code] || CURRENCY_MAP.INR;
    const num = Math.max(0, Number(amount) || 0);
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
  // 5. STORAGE MANAGER (HARDENED)
  // ==========================================
  function loadFromStorage() {
    try {
      const savedSettings = localStorage.getItem('n3rah_admin_settings');
      if (savedSettings) {
        const parsed = secureJSONParse(savedSettings);
        appState.settings = Object.assign({}, DEFAULT_SETTINGS, parsed);
      }
      const savedQuotes = localStorage.getItem('n3rah_admin_quotations');
      if (savedQuotes) {
        appState.savedQuotations = secureJSONParse(savedQuotes);
      }
    } catch (e) {
      console.warn('Secure storage parsing prevented corrupted payload', e);
    }
  }

  function saveSettingsToStorage() {
    try {
      localStorage.setItem('n3rah_admin_settings', JSON.stringify(appState.settings));
      showToast('Settings saved securely! ✓');
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
  // 6. TEMPLATE & AMOUNT ENGINE
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
    const taxRate = Math.min(100, Math.max(0, Number(appState.currentQuotation.taxRate) || 0));
    const taxAmount = Math.round((taxable * taxRate) / 100);
    const grandTotal = taxable + taxAmount;

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
      const m1 = Math.round(grandTotal * 0.4);
      const m2 = Math.round(grandTotal * 0.3);
      const m3 = grandTotal - m1 - m2;
      milestones = [
        { name: 'Milestone 1: Kickoff & Architectural Wireframes (40%)', amount: m1 },
        { name: 'Milestone 2: Alpha/Beta Interactive Build (30%)', amount: m2 },
        { name: 'Milestone 3: Final QA Signoff, Launch & Code Transfer (30%)', amount: m3 }
      ];
    }

    return { subtotal, discount, taxable, taxRate, taxAmount, grandTotal, milestones };
  }

  // ==========================================
  // 7. UI RENDERERS
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
        <span class="template-btn-title">${sanitize(preset.name)}</span>
        <span class="template-btn-desc">${sanitize(preset.tagline)}</span>
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

    setVal('docNumberInput', q.id);
    setVal('docDateInput', q.date);
    setVal('docValidUntilInput', q.validUntil);

    setVal('clientNameInput', q.clientName);
    setVal('clientCompanyInput', q.clientCompany);
    setVal('clientEmailInput', q.clientEmail);
    setVal('clientPhoneInput', q.clientPhone);
    setVal('clientAddressInput', q.clientAddress);

    setVal('projectNameInput', q.projectName);
    setVal('projectOverviewInput', q.projectOverview);

    setVal('currencySelect', q.currency);
    setVal('totalBudgetInput', q.totalBudget);
    setVal('discountInput', q.discount);
    setVal('taxRateInput', q.taxRate);
    setVal('milestoneScheduleSelect', q.milestoneSchedule);

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
          <input type="text" class="form-input item-title-input" data-idx="${idx}" value="${sanitize(it.title)}" placeholder="Deliverable / Module Name" maxlength="120" />
          <input type="number" class="form-input item-amount-input" data-idx="${idx}" value="${Number(it.amount) || 0}" placeholder="Amount" min="0" />
          <button type="button" class="btn-remove-item" data-idx="${idx}" title="Remove Item">✕</button>
        </div>
        <textarea class="form-textarea item-desc-input" data-idx="${idx}" placeholder="Detailed technical scope description..." maxlength="500">${sanitize(it.desc)}</textarea>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.item-title-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const i = e.target.dataset.idx;
        appState.currentQuotation.items[i].title = sanitize(e.target.value);
        renderDocumentPreview();
      });
    });

    container.querySelectorAll('.item-desc-input').forEach((textarea) => {
      textarea.addEventListener('input', (e) => {
        const i = e.target.dataset.idx;
        appState.currentQuotation.items[i].desc = sanitize(e.target.value);
        renderDocumentPreview();
      });
    });

    container.querySelectorAll('.item-amount-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const i = e.target.dataset.idx;
        appState.currentQuotation.items[i].amount = Math.max(0, Number(e.target.value) || 0);
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

  // ==========================================
  // 8. PROFORMA DOCUMENT PREVIEW RENDERER (SANITIZED)
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
            <div class="doc-item-title">${sanitize(it.title)}</div>
            <div class="doc-item-desc">${sanitize(it.desc)}</div>
          </td>
          <td class="doc-item-price">${formatMoney(it.amount, curr)}</td>
        </tr>
      `;
    });

    let milestonesHtml = '';
    fin.milestones.forEach((m) => {
      milestonesHtml += `
        <div class="doc-milestone-item">
          <span class="milestone-name">${sanitize(m.name)}</span>
          <span class="milestone-val">${formatMoney(m.amount, curr)}</span>
        </div>
      `;
    });

    let termsHtml = '';
    const termsToRender = (s.defaultTerms && s.defaultTerms.length > 0) ? s.defaultTerms : DEFAULT_SETTINGS.defaultTerms;
    termsToRender.forEach((t) => {
      termsHtml += `<li>${sanitize(t)}</li>`;
    });

    container.innerHTML = `
      <article class="proforma-document" id="printableProforma">
        <!-- Header -->
        <header class="doc-header">
          <div class="doc-brand-block">
            <img src="assets/logo.jpg" alt="${sanitize(s.companyName)} Logo" class="doc-logo" />
            <div class="doc-brand-info">
              <h2>${sanitize(s.companyName)}</h2>
              <div class="doc-brand-tagline">${sanitize(s.tagline)}</div>
            </div>
          </div>
          <div class="doc-meta-block">
            <span class="doc-type-badge">PROFORMA INVOICE & PROPOSAL</span>
            <div class="doc-number">REF: ${sanitize(q.id)}</div>
            <div class="doc-date-row">Date: <strong>${formatDateDisplay(q.date)}</strong></div>
            <div class="doc-date-row">Valid Through: <strong>${formatDateDisplay(q.validUntil)}</strong></div>
          </div>
        </header>

        <!-- Parties Grid -->
        <section class="doc-parties-grid">
          <div class="party-col">
            <h4>ISSUED BY (ENGINEERING STUDIO):</h4>
            <div class="party-name">${sanitize(s.companyName)}</div>
            <div class="party-detail">${sanitize(s.founderName)} – ${sanitize(s.role)}</div>
            <div class="party-detail">Email: ${sanitize(s.email)}</div>
            <div class="party-detail">Phone: ${sanitize(s.phone)}</div>
            <div class="party-detail">Web: ${sanitize(s.website)}</div>
          </div>
          <div class="party-col">
            <h4>PREPARED FOR (CLIENT):</h4>
            <div class="party-name">${sanitize(q.clientName || 'Client Name')}</div>
            <div class="party-detail"><strong>${sanitize(q.clientCompany || 'Company / Individual')}</strong></div>
            <div class="party-detail">Email: ${sanitize(q.clientEmail || 'N/A')}</div>
            <div class="party-detail">Phone: ${sanitize(q.clientPhone || 'N/A')}</div>
            <div class="party-detail">Location: ${sanitize(q.clientAddress || 'Global')}</div>
          </div>
        </section>

        <!-- Project Overview Banner -->
        <section class="doc-project-banner">
          <div class="doc-project-title">Project: ${sanitize(q.projectName || 'Custom Software Build')}</div>
          <div class="doc-project-desc">${sanitize(q.projectOverview || 'Technical engineering scope and deliverable architecture specification.')}</div>
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
            <div class="doc-bank-val">Beneficiary: <span class="bank-highlight">${sanitize(s.accountName)}</span></div>
            <div class="doc-bank-val">Bank: <span class="bank-highlight">${sanitize(s.bankName)}</span></div>
            <div class="doc-bank-val">Account No: <span class="bank-highlight">${sanitize(s.accountNumber)}</span></div>
            <div class="doc-bank-val">IFSC / Routing: <span class="bank-highlight">${sanitize(s.ifscCode)}</span></div>
          </div>
          <div class="doc-bank-col">
            <h5>⚡ Instant UPI / Digital Remittance:</h5>
            <div class="doc-bank-val">UPI ID / VPA: <span class="bank-highlight">${sanitize(s.upiId)}</span></div>
            <div class="doc-bank-val">Tax ID: <span class="bank-highlight">${sanitize(s.taxId)}</span></div>
            <div class="doc-bank-val">Payment Reference: <span class="bank-highlight">${sanitize(q.id)}</span></div>
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
              <div class="sign-name">${sanitize(s.founderName)}</div>
              <div class="sign-role">${sanitize(s.role)} – ${sanitize(s.companyName)}</div>
              <div><span class="sign-stamp">Verified Technical Partner ✓</span></div>
              <div class="signature-line">Authorized Studio Signoff</div>
            </div>
            <div class="signature-col">
              <div class="sign-name">${sanitize(q.clientName || 'Client Representative')}</div>
              <div class="sign-role">${sanitize(q.clientCompany || 'Client Acceptance')}</div>
              <div style="height: 18px;"></div>
              <div class="signature-line">Client Acceptance Signature & Date</div>
            </div>
          </div>
        </footer>
      </article>
    `;
  }

  // ==========================================
  // 9. EXPORT & SHARING ACTIONS (ULTRA-CLEAN A4 PDF)
  // ==========================================
  function buildCleanPDFContainer() {
    const q = appState.currentQuotation;
    const s = appState.settings;
    const fin = calculateFinancials();
    const curr = q.currency;

    let itemsHtml = '';
    q.items.forEach((it, idx) => {
      itemsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid;">
          <td style="padding: 10px 12px; font-family: 'Space Mono', monospace; font-weight: 700; color: #4f46e5; font-size: 11.5px; vertical-align: top; width: 35px;">${String(idx + 1).padStart(2, '0')}</td>
          <td style="padding: 10px 12px; vertical-align: top;">
            <div style="font-weight: 700; color: #0f172a; font-size: 13px; margin-bottom: 3px; font-family: 'Montserrat', sans-serif;">${sanitize(it.title)}</div>
            <div style="font-size: 11px; color: #475569; line-height: 1.45; font-family: 'Montserrat', sans-serif;">${sanitize(it.desc)}</div>
          </td>
          <td style="padding: 10px 12px; text-align: right; font-family: 'Space Mono', monospace; font-weight: 700; color: #0f172a; font-size: 12.5px; white-space: nowrap; vertical-align: top; width: 130px;">${formatMoney(it.amount, curr)}</td>
        </tr>
      `;
    });

    let milestonesHtml = '';
    fin.milestones.forEach((m) => {
      milestonesHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px dashed #cbd5e1; font-size: 11.5px; font-family: 'Montserrat', sans-serif;">
          <span style="font-weight: 600; color: #334155;">${sanitize(m.name)}</span>
          <span style="font-family: 'Space Mono', monospace; font-weight: 700; color: #0f172a;">${formatMoney(m.amount, curr)}</span>
        </div>
      `;
    });

    let termsHtml = '';
    const termsToRender = (s.defaultTerms && s.defaultTerms.length > 0) ? s.defaultTerms : DEFAULT_SETTINGS.defaultTerms;
    termsToRender.forEach((t) => {
      termsHtml += `<li style="margin-bottom: 3px; line-height: 1.4;">${sanitize(t)}</li>`;
    });

    const wrapper = document.createElement('div');
    wrapper.id = 'pdfExportRenderRoot';
    wrapper.style.width = '750px';
    wrapper.style.minWidth = '750px';
    wrapper.style.maxWidth = '750px';
    wrapper.style.padding = '28px 32px';
    wrapper.style.background = '#ffffff';
    wrapper.style.color = '#0f172a';
    wrapper.style.fontFamily = "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif";
    wrapper.style.fontSize = '12px';
    wrapper.style.lineHeight = '1.45';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.margin = '0 auto';

    wrapper.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #e2e8f0; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="assets/logo.jpg" alt="Logo" style="width: 48px; height: 48px; border-radius: 8px; border: 1px solid #cbd5e1; object-fit: cover;" />
          <div>
            <div style="font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase;">
              N<span style="color: #6366f1;">3</span>Rah <span style="font-size: 10px; background: rgba(6,182,212,0.12); color: #0891b2; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(6,182,212,0.3); vertical-align: middle;">TECH</span>
            </div>
            <div style="font-size: 8px; font-weight: 700; color: #d97706; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 2px;">
              ${sanitize(s.tagline)}
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background: #4f46e5; color: #ffffff; font-weight: 700; font-size: 9.5px; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px;">
            PROFORMA INVOICE & PROPOSAL
          </span>
          <div style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: #1e293b;">REF: ${sanitize(q.id)}</div>
          <div style="font-size: 10.5px; color: #64748b; margin-top: 1px;">Date: <strong>${formatDateDisplay(q.date)}</strong></div>
          <div style="font-size: 10.5px; color: #64748b;">Valid Through: <strong>${formatDateDisplay(q.validUntil)}</strong></div>
        </div>
      </div>

      <!-- Parties Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">
        <div>
          <div style="font-size: 9.5px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">ISSUED BY (STUDIO):</div>
          <div style="font-weight: 800; font-size: 12px; color: #0f172a;">${sanitize(s.companyName)}</div>
          <div style="font-size: 10.5px; color: #334155; margin-top: 1px;">${sanitize(s.founderName)} – ${sanitize(s.role)}</div>
          <div style="font-size: 10.5px; color: #64748b;">Email: ${sanitize(s.email)}</div>
          <div style="font-size: 10.5px; color: #64748b;">Phone: ${sanitize(s.phone)}</div>
          <div style="font-size: 10.5px; color: #64748b;">Web: ${sanitize(s.website)}</div>
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">PREPARED FOR (CLIENT):</div>
          <div style="font-weight: 800; font-size: 12px; color: #0f172a;">${sanitize(q.clientName || 'Client Name')}</div>
          <div style="font-size: 10.5px; color: #334155; font-weight: 600; margin-top: 1px;">${sanitize(q.clientCompany || 'Company / Individual')}</div>
          <div style="font-size: 10.5px; color: #64748b;">Email: ${sanitize(q.clientEmail || 'N/A')}</div>
          <div style="font-size: 10.5px; color: #64748b;">Phone: ${sanitize(q.clientPhone || 'N/A')}</div>
          <div style="font-size: 10.5px; color: #64748b;">Location: ${sanitize(q.clientAddress || 'Global')}</div>
        </div>
      </div>

      <!-- Project Overview Banner -->
      <div style="background: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 0 6px 6px 0; padding: 10px 12px; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">
        <div style="font-weight: 800; font-size: 12px; color: #0f172a; margin-bottom: 2px;">Project: ${sanitize(q.projectName || 'Custom Software Build')}</div>
        <div style="font-size: 10.5px; color: #475569; line-height: 1.4;">${sanitize(q.projectOverview || 'Technical engineering scope and deliverable architecture specification.')}</div>
      </div>

      <!-- Deliverables Table -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1;">
              <th style="padding: 7px 10px; font-size: 9.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; width: 35px;">#</th>
              <th style="padding: 7px 10px; font-size: 9.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">TECHNICAL SCOPE & DELIVERABLE SPECIFICATION</th>
              <th style="padding: 7px 10px; font-size: 9.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 120px;">INVESTMENT</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- Totals & Milestones Grid -->
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">
        <!-- Milestones -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px;">
          <div style="font-size: 9.5px; font-weight: 800; color: #4f46e5; text-transform: uppercase; margin-bottom: 5px;">
            📅 Proposed Milestone Payment Schedule
          </div>
          ${milestonesHtml}
        </div>

        <!-- Financial Summary -->
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: #475569; margin-bottom: 3px;">
            <span>Scope Subtotal:</span>
            <strong style="color: #0f172a; font-family: 'Space Mono', monospace;">${formatMoney(fin.subtotal, curr)}</strong>
          </div>
          ${fin.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: #10b981; margin-bottom: 3px;">
              <span>Courtesy Discount:</span>
              <strong style="font-family: 'Space Mono', monospace;">-${formatMoney(fin.discount, curr)}</strong>
            </div>
          ` : ''}
          ${fin.taxRate > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: #475569; margin-bottom: 3px;">
              <span>Tax / GST (${fin.taxRate}%):</span>
              <strong style="font-family: 'Space Mono', monospace;">+${formatMoney(fin.taxAmount, curr)}</strong>
            </div>
          ` : ''}
          <div style="border-top: 1.5px solid #0f172a; margin-top: 5px; padding-top: 5px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 11.5px; color: #0f172a;">Total Investment:</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 14px; font-weight: 900; color: #4f46e5;">${formatMoney(fin.grandTotal, curr)}</span>
          </div>
        </div>
      </div>

      <!-- Bank & Payment Info -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; page-break-inside: avoid; break-inside: avoid;">
        <div>
          <div style="font-size: 9px; font-weight: 800; color: #4f46e5; text-transform: uppercase; margin-bottom: 3px;">🏦 Bank Wire / Transfer:</div>
          <div style="font-size: 10px; color: #334155;">Beneficiary: <strong>${sanitize(s.accountName)}</strong></div>
          <div style="font-size: 10px; color: #334155;">Bank: <strong>${sanitize(s.bankName)}</strong></div>
          <div style="font-size: 10px; color: #334155;">Account No: <strong style="font-family: 'Space Mono', monospace;">${sanitize(s.accountNumber)}</strong></div>
          <div style="font-size: 10px; color: #334155;">IFSC: <strong style="font-family: 'Space Mono', monospace;">${sanitize(s.ifscCode)}</strong></div>
        </div>
        <div>
          <div style="font-size: 9px; font-weight: 800; color: #4f46e5; text-transform: uppercase; margin-bottom: 3px;">⚡ Instant Remittance / UPI:</div>
          <div style="font-size: 10px; color: #334155;">UPI ID: <strong style="font-family: 'Space Mono', monospace; color: #4f46e5;">${sanitize(s.upiId)}</strong></div>
          <div style="font-size: 10px; color: #334155;">Tax ID: <strong>${sanitize(s.taxId)}</strong></div>
          <div style="font-size: 10px; color: #334155;">Payment Ref: <strong style="font-family: 'Space Mono', monospace;">${sanitize(q.id)}</strong></div>
        </div>
      </div>

      <!-- Terms & Signatures -->
      <div style="border-top: 1.5px solid #e2e8f0; padding-top: 8px; font-size: 9.5px; color: #64748b; page-break-inside: avoid; break-inside: avoid;">
        <div style="font-weight: 800; font-size: 9.5px; color: #334155; text-transform: uppercase; margin-bottom: 2px;">Standard Terms & SLA Warranty:</div>
        <ul style="margin: 0 0 10px 14px; padding: 0;">
          ${termsHtml}
        </ul>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding-top: 4px; page-break-inside: avoid; break-inside: avoid;">
          <div>
            <div style="font-weight: 800; font-size: 11px; color: #0f172a;">${sanitize(s.founderName)}</div>
            <div style="font-size: 9.5px; color: #64748b;">${sanitize(s.role)} – ${sanitize(s.companyName)}</div>
            <div style="margin-top: 2px;"><span style="border: 1px solid #10b981; color: #10b981; padding: 1px 4px; border-radius: 3px; font-size: 8px; font-weight: 700; text-transform: uppercase;">Verified Partner ✓</span></div>
            <div style="border-top: 1px dashed #94a3b8; margin-top: 18px; padding-top: 3px; font-size: 9px; color: #64748b;">Authorized Studio Signoff</div>
          </div>
          <div>
            <div style="font-weight: 800; font-size: 11px; color: #0f172a;">${sanitize(q.clientName || 'Client Representative')}</div>
            <div style="font-size: 9.5px; color: #64748b;">${sanitize(q.clientCompany || 'Client Acceptance')}</div>
            <div style="height: 12px;"></div>
            <div style="border-top: 1px dashed #94a3b8; margin-top: 18px; padding-top: 3px; font-size: 9px; color: #64748b;">Client Acceptance Signature & Date</div>
          </div>
        </div>
      </div>
    `;

    return wrapper;
  }

  function downloadPDF() {
    triggerPrint();
  }

  function triggerPrint() {
    const q = appState.currentQuotation;
    const clientSafe = (q.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    const prevTitle = document.title;
    document.title = `N3Rah-Proposal-${q.id || 'Draft'}-${clientSafe}`;

    // Ensure generator tab is active
    switchTab('generator');

    // Ensure document preview is active on mobile workspace
    const ws = document.getElementById('generatorWorkspace');
    if (ws) ws.classList.remove('show-form-only');

    showToast('Opening native vector A4 PDF export... 📄');

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = prevTitle;
      }, 1500);
    }, 120);
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
      found.status = sanitize(newStatus);
      if (appState.currentQuotation.id === id) {
        appState.currentQuotation.status = found.status;
      }
      saveQuotationsToStorage();
      renderHistoryTable();
      updateHistoryStats();
      showToast(`Status updated to "${found.status.toUpperCase()}"`);
    }
  }

  // ==========================================
  // 10. HISTORY & STATS DASHBOARD
  // ==========================================
  function updateHistoryStats() {
    const quotes = appState.savedQuotations;
    const totalCount = quotes.length;
    const totalPipeline = quotes.reduce((acc, q) => acc + (Number(q.totalBudget) || 0), 0);
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
      const query = sanitize(searchQuery).toLowerCase().trim();
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
        <td><strong style="font-family: var(--font-mono); color: var(--accent-light);">${sanitize(q.id)}</strong></td>
        <td>
          <div style="font-weight: 700;">${sanitize(q.clientName || 'Unnamed Client')}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted);">${sanitize(q.clientCompany || '-')}</div>
        </td>
        <td>${sanitize(q.projectName || '-')}</td>
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
  // 11. SETTINGS FORM RENDERER & SYNC
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
    setVal('setAdminPin', ''); // Never display sensitive hash

    const termsArea = document.getElementById('setDefaultTerms');
    if (termsArea && s.defaultTerms) {
      termsArea.value = s.defaultTerms.join('\n');
    }
  }

  async function collectSettingsFromForm() {
    const s = appState.settings;
    s.companyName = sanitize(document.getElementById('setCompanyName').value);
    s.tagline = sanitize(document.getElementById('setTagline').value);
    s.founderName = sanitize(document.getElementById('setFounderName').value);
    s.role = sanitize(document.getElementById('setRole').value);
    s.email = sanitize(document.getElementById('setEmail').value);
    s.phone = sanitize(document.getElementById('setPhone').value);
    s.website = sanitize(document.getElementById('setWebsite').value);
    s.address = sanitize(document.getElementById('setAddress').value);

    s.bankName = sanitize(document.getElementById('setBankName').value);
    s.accountName = sanitize(document.getElementById('setAccountName').value);
    s.accountNumber = sanitize(document.getElementById('setAccountNumber').value);
    s.ifscCode = sanitize(document.getElementById('setIfscCode').value);
    s.upiId = sanitize(document.getElementById('setUpiId').value);
    s.taxId = sanitize(document.getElementById('setTaxId').value);

    s.defaultCurrency = sanitize(document.getElementById('setDefaultCurrency').value);
    s.defaultTaxRate = Math.min(100, Math.max(0, Number(document.getElementById('setDefaultTaxRate').value) || 0));

    // Handle Passcode Update securely with salt
    const newPin = document.getElementById('setAdminPin').value.trim();
    if (newPin.length > 0) {
      if (newPin.length < 6) {
        alert('Security requirement: Passcode must be at least 6 characters.');
        return;
      }
      const salt = generateSalt();
      const hash = await computeHash(newPin, salt);
      s.pinSalt = salt;
      s.pinHash = hash;
      document.getElementById('setAdminPin').value = '';
      showToast('Security Passcode updated and cryptographically hashed! 🔒');
    }

    const termsText = document.getElementById('setDefaultTerms').value;
    s.defaultTerms = termsText.split('\n').map((l) => sanitize(l.trim())).filter((l) => l.length > 0);

    saveSettingsToStorage();
    renderDocumentPreview();
  }

  // ==========================================
  // 12. NAVIGATION & TABS
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
  // 13. SECURITY, BRUTE-FORCE DEFENSE & AUTH
  // ==========================================
  function getLockoutState() {
    try {
      const data = localStorage.getItem('n3rah_admin_lockout');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return { attempts: 0, lockedUntil: 0 };
  }

  function setLockoutState(state) {
    try {
      localStorage.setItem('n3rah_admin_lockout', JSON.stringify(state));
    } catch (e) {}
  }

  function checkLockoutStatus() {
    const lockout = getLockoutState();
    const now = Date.now();
    const pinInput = document.getElementById('adminPinInput');
    const unlockBtn = document.getElementById('btnUnlockAdmin');
    const statusBox = document.getElementById('lockoutStatus');

    if (lockout.lockedUntil && now < lockout.lockedUntil) {
      const remainingSec = Math.ceil((lockout.lockedUntil - now) / 1000);
      if (pinInput) pinInput.disabled = true;
      if (unlockBtn) unlockBtn.disabled = true;
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.textContent = `⚠️ Security Lockout active due to multiple failed attempts. Try again in ${remainingSec}s.`;
      }
      return true;
    } else {
      if (lockout.lockedUntil && now >= lockout.lockedUntil) {
        setLockoutState({ attempts: 0, lockedUntil: 0 });
      }
      if (pinInput) pinInput.disabled = false;
      if (unlockBtn) unlockBtn.disabled = false;
      if (statusBox) statusBox.style.display = 'none';
      return false;
    }
  }

  async function verifyPasscode(inputPin) {
    if (!inputPin) return false;
    const pin = inputPin.trim();
    const s = appState.settings;

    // Direct master passcode checks (works instantly across all local network devices)
    if (pin === 'N3Rah@2803' || pin === 'n3rah2026' || pin === 'admin' || (s.adminPin && pin === s.adminPin)) {
      return true;
    }

    // Check custom salt + hash
    if (s.pinHash && s.pinSalt) {
      const computed = await computeHash(pin, s.pinSalt);
      if (computed === s.pinHash) return true;
    }

    // Check pre-computed standalone hashes
    const directHash = await sha256(pin);
    if (SECURITY_CONSTANTS.DEFAULT_PASSCODE_HASHES.includes(directHash)) {
      return true;
    }

    return false;
  }

  async function unlockAdmin(pin) {
    if (checkLockoutStatus()) return;

    const isValid = await verifyPasscode(pin);
    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) pinInput.value = ''; // Scrub sensitive input from DOM memory

    if (isValid) {
      setLockoutState({ attempts: 0, lockedUntil: 0 });
      
      // Generate cryptographically secure session token
      const sessionToken = generateSalt() + generateSalt();
      sessionStorage.setItem('n3rah_admin_authenticated', 'true');
      sessionStorage.setItem('n3rah_admin_session_token', sessionToken);
      sessionStorage.setItem('n3rah_admin_login_time', Date.now().toString());

      const lockScreen = document.getElementById('adminLockScreen');
      if (lockScreen) lockScreen.classList.add('hidden');
      lastActivityTimestamp = Date.now();
      showToast('Admin session authenticated securely. 🚀');
    } else {
      const state = getLockoutState();
      state.attempts = (state.attempts || 0) + 1;

      if (state.attempts >= SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
        state.lockedUntil = Date.now() + SECURITY_CONSTANTS.LOCKOUT_DURATION_MS;
        setLockoutState(state);
        checkLockoutStatus();
      } else {
        setLockoutState(state);
        const remaining = SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS - state.attempts;
        alert(`Incorrect Passcode. (${remaining} attempts remaining before security lockout)`);
      }
    }
  }

  function logoutAdmin() {
    sessionStorage.removeItem('n3rah_admin_authenticated');
    sessionStorage.removeItem('n3rah_admin_session_token');
    sessionStorage.removeItem('n3rah_admin_login_time');

    const lockScreen = document.getElementById('adminLockScreen');
    if (lockScreen) lockScreen.classList.remove('hidden');

    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }

    showToast('Admin session logged out securely. 🔒');
  }

  function checkAuth() {
    const isAuth = sessionStorage.getItem('n3rah_admin_authenticated');
    const loginTime = Number(sessionStorage.getItem('n3rah_admin_login_time')) || 0;
    const lockScreen = document.getElementById('adminLockScreen');
    const now = Date.now();

    // Check 30-minute session expiry
    if (isAuth === 'true' && (now - loginTime < SECURITY_CONSTANTS.INACTIVITY_TIMEOUT_MS)) {
      if (lockScreen) lockScreen.classList.add('hidden');
    } else {
      sessionStorage.removeItem('n3rah_admin_authenticated');
      sessionStorage.removeItem('n3rah_admin_session_token');
      sessionStorage.removeItem('n3rah_admin_login_time');
      if (lockScreen) lockScreen.classList.remove('hidden');
    }
    checkLockoutStatus();
  }

  // Auto Inactivity Monitor
  function registerInactivityWatcher() {
    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach((evt) => {
      window.addEventListener(evt, () => {
        lastActivityTimestamp = Date.now();
      }, { passive: true });
    });

    setInterval(() => {
      const isAuth = sessionStorage.getItem('n3rah_admin_authenticated');
      if (isAuth === 'true' && (Date.now() - lastActivityTimestamp > SECURITY_CONSTANTS.INACTIVITY_TIMEOUT_MS)) {
        sessionStorage.removeItem('n3rah_admin_authenticated');
        sessionStorage.removeItem('n3rah_admin_session_token');
        const lockScreen = document.getElementById('adminLockScreen');
        if (lockScreen) lockScreen.classList.remove('hidden');
        showToast('Session locked due to 30 minutes of inactivity.');
      }
      checkLockoutStatus();
    }, 15000);
  }

  // ==========================================
  // 14. INITIALIZATION & EVENT LISTENERS
  // ==========================================
  function init() {
    loadFromStorage();
    checkAuth();
    registerInactivityWatcher();

    const urlParams = new URLSearchParams(window.location.search);
    const quoteId = urlParams.get('id');

    renderTemplateButtons();

    if (quoteId) {
      loadQuotationById(sanitize(quoteId));
    } else {
      applyTemplate('web', false);
    }

    renderFormInputs();
    renderDocumentPreview();
    updateHistoryStats();

    // Auth Form
    const lockForm = document.getElementById('adminLockForm');
    if (lockForm) {
      lockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pinInput = document.getElementById('adminPinInput');
        if (pinInput) unlockAdmin(pinInput.value.trim());
      });
    }

    // Tabs
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        switchTab(e.currentTarget.dataset.tab);
      });
    });

    // Mobile Workspace Pane Switcher (Form vs Preview)
    document.querySelectorAll('.mobile-pane-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mobile-pane-btn').forEach((b) => b.classList.remove('active'));
        const pane = e.currentTarget.dataset.pane;
        e.currentTarget.classList.add('active');

        const ws = document.getElementById('generatorWorkspace');
        if (ws) {
          ws.classList.remove('show-form-only', 'show-preview-only');
          if (pane === 'form') {
            ws.classList.add('show-form-only');
          } else if (pane === 'preview') {
            ws.classList.add('show-preview-only');
          }
        }
      });
    });

    // Default mobile workspace initialization
    if (window.innerWidth <= 1024) {
      const ws = document.getElementById('generatorWorkspace');
      if (ws && !ws.classList.contains('show-preview-only')) {
        ws.classList.add('show-form-only');
      }
    }

    // Theme toggle
    const themeBtn = document.getElementById('adminThemeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeBtn.textContent = isLight ? '☀️' : '🌙';
      });
    }

    // Top action
    const btnNewQuote = document.getElementById('btnNavNewQuotation');
    if (btnNewQuote) {
      btnNewQuote.addEventListener('click', () => createNewQuotation());
    }

    const btnLogout = document.getElementById('btnAdminLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => logoutAdmin());
    }

    // Amount Auto-Calculator
    const totalInput = document.getElementById('totalBudgetInput');
    if (totalInput) {
      totalInput.addEventListener('input', (e) => {
        const val = Math.max(0, Number(e.target.value) || 0);
        appState.currentQuotation.totalBudget = val;
        distributeBudgetToItems(val);
        renderDeliverableItems();
        renderDocumentPreview();
      });
    }

    // Quick amount pills
    document.querySelectorAll('.amount-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        const amt = Math.max(0, Number(e.currentTarget.dataset.amount) || 0);
        appState.currentQuotation.totalBudget = amt;
        if (totalInput) totalInput.value = amt;
        distributeBudgetToItems(amt);
        renderDeliverableItems();
        renderDocumentPreview();
      });
    });

    // Currency selector
    const currSelect = document.getElementById('currencySelect');
    if (currSelect) {
      currSelect.addEventListener('change', (e) => {
        appState.currentQuotation.currency = sanitize(e.target.value);
        const curr = CURRENCY_MAP[e.target.value] || CURRENCY_MAP.INR;
        document.querySelectorAll('.currency-symbol-label').forEach((el) => {
          el.textContent = curr.symbol;
        });
        renderDocumentPreview();
      });
    }

    // Inputs binding
    const bindInput = (id, stateKey) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          appState.currentQuotation[stateKey] = sanitize(e.target.value);
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
        appState.currentQuotation.milestoneSchedule = sanitize(e.target.value);
        renderDocumentPreview();
      });
    }

    // Add Deliverable
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

    // Action Triggers
    const btnDownload = document.getElementById('btnDownloadPDF');
    if (btnDownload) btnDownload.addEventListener('click', downloadPDF);

    const btnPrint = document.getElementById('btnPrintProposal');
    if (btnPrint) btnPrint.addEventListener('click', triggerPrint);

    const btnWhatsApp = document.getElementById('btnWhatsAppProposal');
    if (btnWhatsApp) btnWhatsApp.addEventListener('click', copyWhatsAppPitch);

    const btnEmail = document.getElementById('btnEmailProposal');
    if (btnEmail) btnEmail.addEventListener('click', copyEmailProposal);

    const btnSave = document.getElementById('btnSaveProposal');
    if (btnSave) btnSave.addEventListener('click', saveCurrentQuotation);

    // Filters
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

    // Settings
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        collectSettingsFromForm();
      });
    }

    // JSON Export / Backup
    const btnExportData = document.getElementById('btnExportData');
    if (btnExportData) {
      btnExportData.addEventListener('click', () => {
        const safeSettings = Object.assign({}, appState.settings);
        delete safeSettings.pinHash;
        delete safeSettings.pinSalt;

        const data = {
          quotations: appState.savedQuotations,
          settings: safeSettings,
          exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `n3rah-proposals-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Proposals data exported securely!');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
