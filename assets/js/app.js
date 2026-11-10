/**
 * Business Scope in Your City — Core Application Orchestrator
 * Controls homepage dynamic components, settings ingestion, featured database queries,
 * factual count aggregations, and search widget routing.
 */

const App = (function() {
  'use strict';

  /**
   * Main application entry point executed on DOM ready.
   */
  async function init() {
    try {
      // 1. Fetch site settings (Announcement bar, platform notices)
      await loadSiteSettings();

      // 2. Fetch and render featured public opportunities
      await loadFeaturedOpportunities();

      // 3. Populate factual category directory counts
      await loadCategoryCounts();

      // 4. Initialize Hero Search Widget Event Handlers
      initHeroSearchWidget();

      // 5. Initialize Homepage Instant "Where do you want to build?" City Search
      initHomeCitySearch();

      // 6. Initialize Hero Interactive Dossier Switcher
      initHeroDossierSwitcher();
    } catch (err) {
      console.error('App initialization error:', err);
    }
  }

  /**
   * Homepage Instant "Where do you want to build?" City Search.
   * Provides real-time typing autocomplete across all 88+ Indian cities
   * and routes straight to /pages/city/index.html?slug={city_slug}.
   */
  function initHomeCitySearch() {
    const input = document.getElementById('home-city-search-input');
    const dropdown = document.getElementById('home-city-suggestions');
    if (!input || !dropdown) return;

    let selectedIndex = -1;
    let currentMatches = [];

    function getCities() {
      return (typeof window !== 'undefined' && window.INDIA_CITIES_MASTER) ? window.INDIA_CITIES_MASTER : [];
    }

    function renderDropdown(matches) {
      currentMatches = matches;
      selectedIndex = -1;
      if (matches.length === 0) {
        dropdown.innerHTML = `
          <li style="padding: 12px 16px; color: var(--text-muted); font-size: 0.88rem; text-align: center;">
            No cities found matching "${escapeHtml(input.value.trim())}".
            <br><a href="pages/cities/index.html" style="color: var(--teal-dark); font-weight: 700; margin-top: 4px; display: inline-block;">Browse full directory &rarr;</a>
          </li>
        `;
        dropdown.hidden = false;
        return;
      }

      dropdown.innerHTML = matches.slice(0, 10).map((c, idx) => {
        const tier = c.tier || c.platform_city_tier || 'Tier 2';
        const oppCount = c.opportunity_count ? `${c.opportunity_count} Opportunities` : (c.coverage_status || 'Active');
        return `
          <li class="hero-city-suggestion-row" data-slug="${escapeHtml(c.slug)}" data-idx="${idx}">
            <div>
              <strong style="color: var(--navy); font-size: 0.95rem;">${escapeHtml(c.city_name)}</strong>
              <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 6px;">${escapeHtml(c.state)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; background: var(--bg-light); color: var(--text-muted); font-weight: 700;">${escapeHtml(tier)}</span>
              <span style="font-size: 0.76rem; color: var(--teal-dark); font-weight: 750;">${escapeHtml(oppCount)}</span>
            </div>
          </li>
        `;
      }).join('');

      dropdown.hidden = false;

      dropdown.querySelectorAll('.hero-city-suggestion-row').forEach(row => {
        row.addEventListener('click', () => {
          const slug = row.getAttribute('data-slug');
          if (slug) {
            const dest = `pages/city/index.html?slug=${encodeURIComponent(slug)}`;
            if (typeof window.navigateTo === 'function') {
              window.navigateTo(dest);
            } else {
              window.location.href = dest;
            }
          }
        });
      });
    }

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        dropdown.hidden = true;
        dropdown.innerHTML = '';
        currentMatches = [];
        return;
      }

      const cities = getCities();
      const matches = cities.filter(c => {
        const name = (c.city_name || '').toLowerCase();
        const state = (c.state || '').toLowerCase();
        const ind = (c.major_industries || '').toLowerCase();
        return name.includes(q) || state.includes(q) || ind.includes(q);
      });

      renderDropdown(matches);
    });

    input.addEventListener('keydown', (e) => {
      const rows = dropdown.querySelectorAll('.hero-city-suggestion-row');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (rows.length === 0) return;
        selectedIndex = (selectedIndex + 1) % rows.length;
        updateSelection(rows);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rows.length === 0) return;
        selectedIndex = (selectedIndex - 1 + rows.length) % rows.length;
        updateSelection(rows);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        window.navigateToSelectedCity();
      } else if (e.key === 'Escape') {
        dropdown.hidden = true;
      }
    });

    function updateSelection(rows) {
      rows.forEach((r, i) => {
        if (i === selectedIndex) {
          r.classList.add('is-active');
          r.scrollIntoView({ block: 'nearest' });
        } else {
          r.classList.remove('is-active');
        }
      });
    }

    window.navigateToSelectedCity = function() {
      const go = (url) => {
        if (typeof window.navigateTo === 'function') window.navigateTo(url);
        else window.location.href = url;
      };

      if (selectedIndex >= 0 && currentMatches[selectedIndex]) {
        go(`pages/city/index.html?slug=${encodeURIComponent(currentMatches[selectedIndex].slug)}`);
        return;
      }
      const q = input.value.trim().toLowerCase();
      if (!q) {
        go('pages/cities/index.html');
        return;
      }
      const cities = getCities();
      const match = cities.find(c => {
        const name = (c.city_name || '').toLowerCase();
        const slug = (c.slug || '').toLowerCase();
        return name === q || slug === q || name.startsWith(q);
      }) || currentMatches[0];

      if (match) {
        go(`pages/city/index.html?slug=${encodeURIComponent(match.slug)}`);
      } else {
        go(`pages/cities/index.html?search=${encodeURIComponent(q)}`);
      }
    };

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.hidden = true;
      }
    });
  }

  /**
   * Ingest and apply global site settings from the Settings worksheet.
   */
  async function loadSiteSettings() {
    const bar = document.getElementById('announcement-bar');
    const textEl = document.getElementById('announcement-text');
    if (!bar || !textEl) return;

    // Respect session dismissal flag
    if (sessionStorage.getItem('dismiss_announcement') === 'true') {
      bar.style.display = 'none';
      return;
    }

    try {
      const settings = await API.get('settings');
      if (settings && settings.ANNOUNCEMENT_TEXT && settings.ANNOUNCEMENT_TEXT.trim() !== '') {
        textEl.textContent = settings.ANNOUNCEMENT_TEXT;
        bar.style.display = 'block';
      } else {
        bar.style.display = 'none';
      }
    } catch (e) {
      bar.style.display = 'none';
    }
  }

  /**
   * Resolve photography image for an opportunity based on slug, category, or industry.
   */
  function getOpportunityVisualImage(o) {
    const slug = (o.slug || '').toLowerCase();
    const cat = (o.category || '').toLowerCase();
    const title = (o.title || '').toLowerCase();

    if (slug.includes('comply-grid') || slug.includes('compliance') || slug.includes('software') || cat.includes('software') || title.includes('copilot') || title.includes('compliance')) {
      return '/assets/images/industrial-compliance-software.jpg';
    }
    if (slug.includes('scrapbridge') || slug.includes('scrap') || slug.includes('recycling') || slug.includes('waste') || cat.includes('circular') || title.includes('debris') || title.includes('scrap')) {
      return '/assets/images/scrap-recycling-hub.jpg';
    }
    if (slug.includes('shelfgrid') || slug.includes('warehouse') || slug.includes('storage') || slug.includes('logistics') || slug.includes('coldlink') || slug.includes('railbridge') || cat.includes('logistics')) {
      return '/assets/images/warehouse-pallet-storage.jpg';
    }
    if (slug.includes('solar') || slug.includes('energy') || cat.includes('energy')) {
      return '/assets/images/rooftop-solar-industrial.jpg';
    }
    if (slug.includes('ev-') || slug.includes('charger') || slug.includes('fleet') || slug.includes('commute') || title.includes('ev ') || cat.includes('ev') || cat.includes('mobility')) {
      return '/assets/images/commercial-ev-fleet.jpg';
    }
    if (slug.includes('diaglink') || slug.includes('health') || slug.includes('elder') || slug.includes('pharma') || slug.includes('medical') || cat.includes('health')) {
      return '/assets/images/healthcare-diagnostics-service.jpg';
    }
    if (slug.includes('coffee') || slug.includes('food') || slug.includes('kitchen') || cat.includes('food') || cat.includes('beverage')) {
      return '/assets/images/specialty-coffee-roastery.jpg';
    }

    const fallbacks = [
      '/assets/images/industrial-compliance-software.jpg',
      '/assets/images/scrap-recycling-hub.jpg',
      '/assets/images/warehouse-pallet-storage.jpg',
      '/assets/images/rooftop-solar-industrial.jpg',
      '/assets/images/commercial-ev-fleet.jpg'
    ];
    let hash = 0;
    for (let i = 0; i < slug.length; i++) hash += slug.charCodeAt(i);
    return fallbacks[hash % fallbacks.length];
  }

  /**
   * Load published featured opportunities from the database into the homepage grid.
   */
  async function loadFeaturedOpportunities() {
    const grid = document.getElementById('featured-opportunities-grid');
    if (!grid) return;

    try {
      const opps = await API.get('opportunities');

      if (!Array.isArray(opps) || opps.length === 0 || opps.error) {
        grid.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
            <p style="color: var(--text-muted); font-size: 1.05rem;">No opportunities currently published in database. Check back soon as new audits are verified.</p>
            <a href="/opportunities/" class="btn btn-outline btn-sm" style="margin-top: 12px;">Browse Complete Directory</a>
          </div>
        `;
        return;
      }

      // Filter featured records; if none marked featured, take the 3 newest
      let featured = opps.filter(o => o.featured === true || o.featured === 'TRUE');
      if (featured.length === 0) {
        featured = opps.slice(0, 3);
      } else {
        featured = featured.slice(0, 3);
      }

      grid.innerHTML = featured.map(o => {
        const statusLabel = formatResearchStatus(o.research_status);
        const statusSlug = getEvidenceSlug(o.research_status);
        const conf = formatConfidence(o.confidence_level);
        const budgetRange = formatBudgetDisplay(o.budget_min, o.budget_max);
        const imgUrl = getOpportunityVisualImage(o);

        return `
        <article class="card opportunity-catalogue-card ${o.featured ? 'is-featured' : ''}">
          <div class="card-visual-media">
            <img src="${imgUrl}" alt="${escapeHtml(o.title)}" class="card-visual-img" loading="lazy" />
            <div class="card-visual-overlay"></div>
            <div class="card-visual-tags">
              <span class="card-visual-sector">${escapeHtml(o.category || 'General')}</span>
              <span class="card-visual-evidence evidence-tag-${statusSlug}">${escapeHtml(statusLabel)}</span>
            </div>
          </div>

          <div class="card-body-wrap">
            <h3 class="card-title">
              <a href="/opportunity/${encodeURIComponent(o.slug)}/">${escapeHtml(o.title)}</a>
            </h3>

            <p class="card-location">📍 Scope: <strong>${escapeHtml(o.state || 'India')}</strong> &bull; Model: <strong>${escapeHtml(o.business_model || 'Hybrid')}</strong></p>
            <p class="card-summary">${escapeHtml(o.short_summary || '')}</p>

            <div class="card-budget-box">
              <div class="budget-col">
                <span class="budget-label">Indicative Startup Capex</span>
                <strong class="budget-amount">${budgetRange}</strong>
                <small style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-sans); margin-top: 2px;">(₹${Number(o.budget_min || 0).toLocaleString('en-IN')} &ndash; ₹${Number(o.budget_max || 0).toLocaleString('en-IN')})</small>
              </div>
              <div class="confidence-col">
                <span class="confidence-badge confidence-${conf.classKey}">${escapeHtml(conf.label)}</span>
              </div>
            </div>

            <div class="card-action-footer" style="display: flex; gap: 8px; align-items: stretch;">
              <a href="/opportunity/${encodeURIComponent(o.slug)}/" class="btn btn-primary btn-sm btn-card-guide" style="flex: 1;">
                <span>Read Opportunity Guide</span>
                <svg class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </a>
              <button type="button" class="btn-quick-wa-share" data-title="${escapeHtml(o.title)}" data-slug="${escapeHtml(o.slug)}" data-capex="${escapeHtml(budgetRange)}" data-city="${escapeHtml(o.state || 'India')}" data-category="${escapeHtml(o.category || '')}" title="Share to WhatsApp" aria-label="Share this opportunity on WhatsApp" style="width: 48px; min-height: 48px; border-radius: var(--radius-md); background: #DCFCE7; border: 1px solid #86EFAC; color: #166534; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; flex-shrink: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.58 2.007.92 2.791.92 3.182 0 5.77-2.587 5.77-5.766.001-3.183-2.585-5.768-5.77-5.768zm0 10.375c-.752 0-1.748-.287-2.431-.722l-.174-.11-1.58.414.423-1.542-.119-.19c-.482-.767-.743-1.603-.742-2.459.001-2.463 2.005-4.468 4.623-4.468 2.463 0 4.47 2.005 4.47 4.469 0 2.462-2.007 4.468-4.47 4.468zm2.607-3.328c-.143-.072-.846-.417-.977-.465-.131-.048-.226-.072-.321.072-.095.143-.369.465-.452.56-.083.096-.167.108-.31.036-.143-.072-.604-.223-1.15-.71-.426-.38-.713-.85-.796-.993-.083-.143-.009-.22.063-.292.065-.064.143-.167.214-.25.071-.084.095-.143.143-.238.048-.096.024-.18-.012-.251-.036-.072-.321-.774-.44-1.06-.116-.279-.234-.241-.321-.246-.083-.004-.179-.005-.274-.005-.095 0-.25.036-.381.18-.131.143-.5.488-.5 1.19s.512 1.381.583 1.477c.071.096 1.008 1.539 2.442 2.158.341.147.607.235.815.301.343.109.655.094.902.057.275-.041.846-.346.965-.68.119-.333.119-.619.083-.679-.036-.06-.131-.096-.274-.168z"/>
                </svg>
              </button>
            </div>
          </div>
        </article>
      `;
      }).join('');

      // Wire quick WhatsApp share buttons
      grid.querySelectorAll('.btn-quick-wa-share').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const title = btn.getAttribute('data-title');
          const slug = btn.getAttribute('data-slug');
          const capex = btn.getAttribute('data-capex');
          const city = btn.getAttribute('data-city');
          const category = btn.getAttribute('data-category');
          const url = `${window.location.origin}/pages/opportunity/index.html?slug=${encodeURIComponent(slug)}`;

          if (window.ViralShare) {
            window.ViralShare.openShareModal({
              title,
              slug,
              capex,
              city,
              category,
              url
            });
          }
        });
      });
    } catch (err) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 30px;">
          <p style="color: #b91c1c;">Unable to connect to the research database. Please verify your connection.</p>
        </div>
      `;
    }
  }

  /**
   * Dynamically calculate and render factual opportunity counts across category directory cards.
   * Strictly adheres to the mandate: NEVER hardcode fake opportunity counts.
   */
  async function loadCategoryCounts() {
    const categoryChips = document.querySelectorAll('.category-count[data-category]');
    if (categoryChips.length === 0) return;

    try {
      const opps = await API.get('opportunities');
      if (!Array.isArray(opps)) return;

      // Group genuine counts
      const counts = {};
      opps.forEach(o => {
        if (o.category) {
          counts[o.category] = (counts[o.category] || 0) + 1;
        }
      });

      categoryChips.forEach(el => {
        const catName = el.getAttribute('data-category');
        const count = counts[catName] || 0;
        el.textContent = `${count} Published ${count === 1 ? 'Opportunity' : 'Opportunities'} →`;
      });
    } catch (e) {
      // Fail silently and keep default labels
    }
  }

  /**
   * Hero Section Interactive Dossier Showcase.
   * Switches live preview data, photography, unit economics, and deep link
   * when visitor toggles between flagship dossiers.
   */
  function initHeroDossierSwitcher() {
    const tabs = document.querySelectorAll('.hero-tab-btn');
    if (!tabs || tabs.length === 0) return;

    const dossiers = {
      complygrid: {
        img: '/assets/images/industrial-compliance-software.jpg',
        alt: 'ComplyGrid Industrial MSME Compliance Workspace',
        cat: 'Business Software · Compliance Automation',
        badge: 'Evidence Supported',
        scope: 'Scope: West Bengal & Pune MSME Belts',
        model: 'SaaS + Managed B2B Hybrid',
        title: 'ComplyGrid — Compliance Calendar & Filing Assistant for Industrial MSMEs',
        summary: 'Convert statutory factory deadlines (GST, e-way bill, PF/ESIC, pollution consents) into an automated subscription workflow for small factories and logistics hubs.',
        capex: '₹20,000 – ₹1.5L',
        margin: '55% – 70%',
        payback: '4 – 6 Months',
        risk: 'Low–Medium (3.4/10)',
        sprintTitle: '7-Day Falsification Test',
        sprintGate: 'Kill Gate: < 3 LOIs',
        sprint: 'Pitch 15 factory owners a ₹1,499/mo compliance monitoring pilot. Require minimum 3 signed LOIs before building automated tooling.',
        slug: 'comply-grid-msme-compliance-automation'
      },
      scrapbridge: {
        img: '/assets/images/scrap-recycling-hub.jpg',
        alt: 'Dankuni ScrapBridge Industrial Secondary Material Sorting Hub',
        cat: 'Circular Economy · B2B Marketplace',
        badge: 'Evidence Supported',
        scope: 'Scope: West Bengal & Howrah Foundry Belt',
        model: 'Managed B2B Marketplace (Take Rate)',
        title: 'Dankuni ScrapBridge — Industrial Secondary Material Marketplace',
        summary: 'Aggregate scrap metal, pallets, and industrial polybags directly from manufacturing units and sell in bulk to verified regional re-rollers with guaranteed pickup.',
        capex: '₹50,000 – ₹4.0L',
        margin: '12% – 18%',
        payback: '3 – 5 Months',
        risk: 'Medium (4.8/10)',
        sprintTitle: '7-Day Falsification Test',
        sprintGate: 'Kill Gate: < 2 Repeat Deals',
        sprint: 'Visit 10 metal fabrication shops, secure commitments for 5 tons of mixed scrap, and quote 2 certified recyclers with a ₹1.5/kg margin spread.',
        slug: 'dankuni-scrapbridge-business-blueprint'
      },
      shelfgrid: {
        img: '/assets/images/warehouse-pallet-storage.jpg',
        alt: 'Dankuni ShelfGrid Pallet Racks and Staging Storage Godown',
        cat: 'Logistics · Managed Storage Marketplace',
        badge: 'Evidence Supported',
        scope: 'Scope: Kolkata & Dankuni Logistics Corridor',
        model: 'Managed Capacity Take Rate (15–20%)',
        title: 'Dankuni ShelfGrid — Micro-Warehousing & Pallet Staging Network',
        summary: 'Monetize idle godown floor space by aggregating small 20–50 pallet lots for D2C brands, distributors, and seasonal FMCG merchants needing short-term staging.',
        capex: '₹60,000 – ₹2.5L',
        margin: '22% – 32%',
        payback: '5 – 7 Months',
        risk: 'Low–Medium (3.8/10)',
        sprintTitle: '7-Day Falsification Test',
        sprintGate: 'Kill Gate: < 60% Capacity in 30d',
        sprint: 'Contract 200 sq.ft of empty godown corner on revenue share, then sell 15 pallets of overflow storage to 3 local distributors at ₹220/pallet/month.',
        slug: 'dankuni-shelfgrid-business-blueprint'
      },
      roofgrid: {
        img: '/assets/images/rooftop-solar-industrial.jpg',
        alt: 'RoofGrid Industrial Warehouse Rooftop Solar Installation',
        cat: 'Clean Energy · Project Management & Lead-Gen',
        badge: 'Evidence Supported',
        scope: 'Scope: Maharashtra & Gujarat Industrial Parks',
        model: 'Commission & EPC Coordination Desk',
        title: 'RoofGrid — Industrial Rooftop Solar Aggregation Desk',
        summary: 'Audit flat concrete warehouse and factory roofs, aggregate 50kW–200kW rooftop solar demands, and broker EPC installations for 4–6% origination fees.',
        capex: '₹50,000 – ₹2.0L',
        margin: '65% – 80%',
        payback: '2 – 4 Months',
        risk: 'Low (2.8/10)',
        sprintTitle: '7-Day Falsification Test',
        sprintGate: 'Kill Gate: < 2 Bill Audits',
        sprint: 'Audit 8 warehouse electricity bills, perform shadow-free satellite roof assessments, and secure 2 signed EPC feasibility authorization letters.',
        slug: 'roofgrid-warehouse-rooftop-solar-aggregator'
      }
    };

    const imgEl = document.getElementById('hero-dossier-img');
    const catEl = document.getElementById('hero-dossier-cat');
    const badgeEl = document.getElementById('hero-dossier-badge');
    const scopeEl = document.getElementById('hero-dossier-scope');
    const modelEl = document.getElementById('hero-dossier-model');
    const titleEl = document.getElementById('hero-dossier-title');
    const summaryEl = document.getElementById('hero-dossier-summary');
    const capexEl = document.getElementById('hero-dossier-capex');
    const marginEl = document.getElementById('hero-dossier-margin');
    const paybackEl = document.getElementById('hero-dossier-payback');
    const riskEl = document.getElementById('hero-dossier-risk');
    const sprintEl = document.getElementById('hero-dossier-sprint');
    const linkEl = document.getElementById('hero-dossier-link');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-dossier');
        const data = dossiers[key];
        if (!data) return;

        tabs.forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        if (imgEl) {
          imgEl.style.opacity = '0.3';
          setTimeout(() => {
            imgEl.src = data.img;
            imgEl.alt = data.alt;
            imgEl.style.opacity = '1';
          }, 150);
        }
        if (catEl) catEl.textContent = data.cat;
        if (badgeEl) badgeEl.textContent = data.badge;
        if (scopeEl) scopeEl.textContent = data.scope;
        if (modelEl) modelEl.textContent = data.model;
        if (titleEl) titleEl.textContent = data.title;
        if (summaryEl) summaryEl.textContent = data.summary;
        if (capexEl) capexEl.textContent = data.capex;
        if (marginEl) marginEl.textContent = data.margin;
        if (paybackEl) paybackEl.textContent = data.payback;
        if (riskEl) riskEl.textContent = data.risk;
        if (sprintEl) sprintEl.textContent = data.sprint;
        if (linkEl) linkEl.href = `pages/opportunity/index.html?slug=${encodeURIComponent(data.slug)}`;
      });
    });
  }

  /**
   * Hero Section Search Widget Event Controller.
   * Captures selected city, budget, and category, and routes to /opportunities/ with clean URL parameters.
   */
  function initHeroSearchWidget() {
    const searchForm = document.getElementById('hero-search-form');
    if (!searchForm) return;

    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const citySelect = document.getElementById('hero-city-select');
      const budgetSelect = document.getElementById('hero-budget-select');
      const categorySelect = document.getElementById('hero-category-select');

      const params = new URLSearchParams();

      if (citySelect && citySelect.value) {
        params.set('city', citySelect.value);
      }
      if (budgetSelect && budgetSelect.value) {
        params.set('budget_max', budgetSelect.value);
      }
      if (categorySelect && categorySelect.value) {
        params.set('category', categorySelect.value);
      }
      if (window.I18N && window.I18N.getCurrentLanguage() !== 'en') {
        params.set('lang', window.I18N.getCurrentLanguage());
      }

      const queryString = params.toString();
      const targetUrl = `pages/opportunities/index.html${queryString ? '?' + queryString : ''}`;
      if (typeof window.navigateTo === 'function') {
        window.navigateTo(targetUrl);
      } else {
        window.location.href = targetUrl;
      }
    });
  }

  // Utilities
  function formatLakhs(amount) {
    if (!amount) return '0';
    const l = Number(amount) / 100000;
    return Number.isInteger(l) ? String(l) : l.toFixed(1);
  }

  function formatResearchStatus(status) {
    if (!status) return 'Evidence Supported';
    const s = String(status).trim();
    if (/public_research_complete_field_validation_pending/i.test(s) || /field_validation_pending/i.test(s)) {
      return 'Field Validation Pending';
    }
    if (/demand_validated/i.test(s)) {
      return 'Demand Validated';
    }
    if (/evidence_supported/i.test(s)) {
      return 'Evidence Supported';
    }
    if (s.includes('_')) {
      return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return s;
  }

  function getEvidenceSlug(status) {
    if (!status) return 'verified';
    const s = String(status).toLowerCase();
    if (s.includes('validated') || s.includes('demand')) return 'validated';
    if (s.includes('pending')) return 'pending';
    if (s.includes('supported') || s.includes('complete') || s.includes('verified')) return 'verified';
    return 'desk';
  }

  function formatConfidence(level) {
    if (!level) return { label: 'High Confidence', classKey: 'high' };
    const str = String(level).trim();
    const oppMatch = str.match(/opportunity\s*(\d+)\/100/i);
    if (/validate_first/i.test(str)) {
      return {
        label: oppMatch ? `Validate First (${oppMatch[1]}/100)` : 'Validate First',
        classKey: 'medium'
      };
    }
    const lower = str.toLowerCase();
    if (lower === 'high' || lower.includes('high')) {
      return { label: 'High Confidence', classKey: 'high' };
    }
    if (lower === 'medium' || lower.includes('medium')) {
      return { label: 'Medium Confidence', classKey: 'medium' };
    }
    if (lower === 'low' || lower.includes('low')) {
      return { label: 'Emerging', classKey: 'low' };
    }
    return {
      label: str.length > 22 ? str.slice(0, 20) + '...' : str,
      classKey: 'medium'
    };
  }

  function formatBudgetDisplay(min, max) {
    const numMin = Number(min || 0);
    const numMax = Number(max || 0);
    if (numMax < 100000 && numMin < 100000) {
      if (numMax === 0 && numMin === 0) return 'Micro / Zero Capex';
      const minStr = numMin >= 1000 ? `₹${Math.round(numMin / 1000)}k` : `₹${numMin}`;
      const maxStr = numMax >= 1000 ? `₹${Math.round(numMax / 1000)}k` : `₹${numMax}`;
      return `${minStr} &ndash; ${maxStr}`;
    }
    return `₹${formatLakhs(numMin)}L &ndash; ₹${formatLakhs(numMax)}L`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Public Interface
  return {
    init,
    loadFeaturedOpportunities,
    loadSiteSettings
  };
})();

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', App.init);
