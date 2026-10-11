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
    } catch (err) {
      console.error('App initialization error:', err);
    }
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

      grid.innerHTML = featured.map(o => `
        <article class="card opportunity-catalogue-card">
          <div class="card-meta-top">
            <span class="badge badge-teal">${escapeHtml(o.category || 'General')}</span>
            <span class="evidence-tag evidence-tag-${getEvidenceSlug(o.research_status)}">${escapeHtml(o.research_status || 'Evidence Supported')}</span>
          </div>

          <h3 class="card-title">
            <a href="/opportunity/${encodeURIComponent(o.slug)}/">${escapeHtml(o.title)}</a>
          </h3>

          <p class="card-location">📍 Scope: <strong>${escapeHtml(o.state || 'India')}</strong> &bull; Model: <strong>${escapeHtml(o.business_model || 'Hybrid')}</strong></p>
          <p class="card-summary">${escapeHtml(o.short_summary || '')}</p>

          <div class="card-budget-box">
            <div class="budget-col">
              <span class="budget-label">Indicative Startup Capex</span>
              <strong class="budget-amount">₹${Number(o.budget_min || 0).toLocaleString('en-IN')} – ₹${Number(o.budget_max || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div class="confidence-col">
              <span class="confidence-badge confidence-${(o.confidence_level || 'Medium').toLowerCase()}">${escapeHtml(o.confidence_level || 'Medium')} Confidence</span>
            </div>
          </div>

          <div class="card-action-footer">
            <a href="/opportunity/${encodeURIComponent(o.slug)}/" class="btn btn-outline btn-sm btn-full">Read Opportunity Guide &rarr;</a>
          </div>
        </article>
      `).join('');
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

      const queryString = params.toString();
      window.location.href = `/opportunities/${queryString ? '?' + queryString : ''}`;
    });
  }

  // Utilities
  function getEvidenceSlug(status) {
    if (!status) return 'desk';
    if (status.includes('Validated')) return 'validated';
    if (status.includes('Supported')) return 'verified';
    return 'desk';
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
