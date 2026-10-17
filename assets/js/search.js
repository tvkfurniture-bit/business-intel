/**
 * Business Scope in Your City — Search & Filter Engine
 * Full-text querying, multi-criteria filtering, state serialization, and sorting.
 */

const SearchEngine = (function() {
  'use strict';

  /**
   * Utility debounce function to limit DOM thrashing during rapid user typing.
   * @param {Function} func Function to execute
   * @param {number} wait Milliseconds to wait
   */
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait || 250);
    };
  }

  /**
   * Safe HTML escaping to prevent XSS during search string injection.
   * @param {string} str Raw input string
   * @returns {string} Escaped string
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Execute full-text search and multi-parameter filtering on an array of opportunity objects.
   * @param {Array<Object>} records All published opportunity records
   * @param {Object} filters Filter parameters
   * @returns {Array<Object>} Filtered array of records
   */
  function filterOpportunities(records, filters) {
    if (!Array.isArray(records)) return [];

    return records.filter(item => {
      // 1. Full-Text Search across Public Fields
      if (filters.keyword && filters.keyword.trim() !== '') {
        const query = filters.keyword.toLowerCase().trim();
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const summaryMatch = (item.short_summary || '').toLowerCase().includes(query);
        const categoryMatch = (item.category || '').toLowerCase().includes(query);
        const problemMatch = (item.customer_problem || '').toLowerCase().includes(query);
        const modelMatch = (item.business_model || '').toLowerCase().includes(query);

        if (!titleMatch && !summaryMatch && !categoryMatch && !problemMatch && !modelMatch) {
          return false;
        }
      }

      // 2. City Filter (matches city_id or city name)
      if (filters.city && filters.city !== '') {
        if (item.city_id !== filters.city && (item.city_name || '').toLowerCase() !== filters.city.toLowerCase()) {
          return false;
        }
      }

      // 3. State Filter
      if (filters.state && filters.state !== '') {
        if ((item.state || '').toLowerCase() !== filters.state.toLowerCase()) {
          return false;
        }
      }

      // 4. Category Filter
      if (filters.category && filters.category !== '') {
        if ((item.category || '').toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
      }

      // 5. Budget Minimum Filter
      if (filters.budget_min !== undefined && filters.budget_min !== '' && !isNaN(Number(filters.budget_min))) {
        const minFilter = Number(filters.budget_min);
        const itemMax = Number(item.budget_max) || Number(item.budget_min) || 0;
        if (itemMax < minFilter) {
          return false;
        }
      }

      // 6. Budget Maximum Filter
      if (filters.budget_max !== undefined && filters.budget_max !== '' && !isNaN(Number(filters.budget_max))) {
        const maxFilter = Number(filters.budget_max);
        const itemMin = Number(item.budget_min) || 0;
        if (itemMin > maxFilter) {
          return false;
        }
      }

      // 7. Business Model Filter (Offline, Hybrid, Online)
      if (Array.isArray(filters.models) && filters.models.length > 0) {
        if (!filters.models.includes(item.business_model)) {
          return false;
        }
      }

      // 8. Required Skills Filter
      if (filters.skill && filters.skill !== '') {
        let skillsArray = [];
        if (Array.isArray(item.required_skills_json)) {
          skillsArray = item.required_skills_json;
        } else if (typeof item.required_skills_json === 'string') {
          try {
            skillsArray = JSON.parse(item.required_skills_json);
          } catch (e) {
            skillsArray = [item.required_skills_json];
          }
        }
        const hasSkill = skillsArray.some(s => s.toLowerCase().includes(filters.skill.toLowerCase()));
        if (!hasSkill) {
          return false;
        }
      }

      // 9. Research Status Filter
      if (Array.isArray(filters.research_statuses) && filters.research_statuses.length > 0) {
        if (!filters.research_statuses.includes(item.research_status)) {
          return false;
        }
      }

      // 10. Assessed Risk Level Filter
      if (Array.isArray(filters.risk_levels) && filters.risk_levels.length > 0) {
        if (item.risk_level && !filters.risk_levels.includes(item.risk_level)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort array of filtered records based on selected criteria.
   * @param {Array<Object>} records Filtered records
   * @param {string} sortBy Sort order string ('featured', 'newest', 'budget_asc', 'budget_desc')
   * @returns {Array<Object>} Sorted records
   */
  function sortOpportunities(records, sortBy) {
    if (!Array.isArray(records)) return [];

    const sorted = [...records];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

      case 'budget_asc':
        return sorted.sort((a, b) => (Number(a.budget_min) || 0) - (Number(b.budget_min) || 0));

      case 'budget_desc':
        return sorted.sort((a, b) => (Number(b.budget_min) || 0) - (Number(a.budget_min) || 0));

      case 'featured':
      default:
        return sorted.sort((a, b) => {
          // Prioritize featured records first, then newest
          if (b.featured && !a.featured) return 1;
          if (!b.featured && a.featured) return -1;
          return new Date(b.published_at || 0) - new Date(a.published_at || 0);
        });
    }
  }

  /**
   * Extract state object from the current window.location.search URL query parameters.
   * @returns {Object} Deserialized filter state
   */
  function getUrlState() {
    const params = new URLSearchParams(window.location.search);
    return {
      keyword: params.get('keyword') || '',
      city: params.get('city') || '',
      state: params.get('state') || '',
      budget_min: params.get('budget_min') || '',
      budget_max: params.get('budget_max') || '',
      category: params.get('category') || '',
      skill: params.get('skill') || '',
      sort: params.get('sort') || 'featured',
      models: params.get('model') ? params.get('model').split(',') : [],
      research_statuses: params.get('research_status') ? params.get('research_status').split(',') : [],
      risk_levels: params.get('risk_level') ? params.get('risk_level').split(',') : []
    };
  }

  /**
   * Update window.history without full page reload to reflect state in the URL.
   * @param {Object} state Filter parameters
   */
  function updateUrlState(state) {
    const params = new URLSearchParams();

    if (state.keyword) params.set('keyword', state.keyword.trim());
    if (state.city) params.set('city', state.city);
    if (state.state) params.set('state', state.state);
    if (state.budget_min) params.set('budget_min', state.budget_min);
    if (state.budget_max) params.set('budget_max', state.budget_max);
    if (state.category) params.set('category', state.category);
    if (state.skill) params.set('skill', state.skill);
    if (state.sort && state.sort !== 'featured') params.set('sort', state.sort);

    if (Array.isArray(state.models) && state.models.length > 0) {
      params.set('model', state.models.join(','));
    }
    if (Array.isArray(state.research_statuses) && state.research_statuses.length > 0) {
      params.set('research_status', state.research_statuses.join(','));
    }
    if (Array.isArray(state.risk_levels) && state.risk_levels.length > 0) {
      params.set('risk_level', state.risk_levels.join(','));
    }
    if (window.I18N && window.I18N.getCurrentLanguage() !== 'en') {
      params.set('lang', window.I18N.getCurrentLanguage());
    }

    const query = params.toString();
    const newUrl = window.location.pathname + (query ? '?' + query : '');
    window.history.replaceState({ filters: state }, '', newUrl);
  }

  /**
   * Generate active filter chip objects for rendering in the UI.
   * @param {Object} state Filter parameters
   * @returns {Array<Object>} List of chips with display labels and clear keys
   */
  function generateActiveChips(state) {
    const chips = [];

    if (state.keyword) {
      chips.push({ key: 'keyword', label: `Search: "${state.keyword}"` });
    }
    if (state.city) {
      chips.push({ key: 'city', label: `City: ${state.city}` });
    }
    if (state.state) {
      chips.push({ key: 'state', label: `State: ${state.state}` });
    }
    if (state.category) {
      chips.push({ key: 'category', label: `Sector: ${state.category}` });
    }
    if (state.budget_min && state.budget_max) {
      chips.push({ key: 'budget', label: `Capex: ₹${Number(state.budget_min).toLocaleString('en-IN')} – ₹${Number(state.budget_max).toLocaleString('en-IN')}` });
    } else if (state.budget_max) {
      chips.push({ key: 'budget_max', label: `Max Capex: ₹${Number(state.budget_max).toLocaleString('en-IN')}` });
    } else if (state.budget_min) {
      chips.push({ key: 'budget_min', label: `Min Capex: ₹${Number(state.budget_min).toLocaleString('en-IN')}` });
    }

    if (Array.isArray(state.models)) {
      state.models.forEach(m => chips.push({ key: 'model', value: m, label: `Model: ${m}` }));
    }
    if (Array.isArray(state.research_statuses)) {
      state.research_statuses.forEach(rs => chips.push({ key: 'research_status', value: rs, label: rs }));
    }
    if (Array.isArray(state.risk_levels)) {
      state.risk_levels.forEach(rl => chips.push({ key: 'risk_level', value: rl, label: `Risk: ${rl}` }));
    }
    if (state.skill) {
      chips.push({ key: 'skill', label: `Skill: ${state.skill}` });
    }

    return chips;
  }

  /**
   * Derive factual opportunity counts grouped by city or category.
   * Prevents hardcoded or simulated statistics across directory landing pages.
   * @param {Array<Object>} records Published opportunities
   * @param {string} groupKey Key to aggregate ('city_id' or 'category')
   * @returns {Object} Map of ID to record counts
   */
  function aggregateCounts(records, groupKey) {
    if (!Array.isArray(records)) return {};

    return records.reduce((acc, curr) => {
      const key = curr[groupKey];
      if (key) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {});
  }

  // Public Interface
  return {
    debounce,
    escapeHtml,
    filterOpportunities,
    sortOpportunities,
    getUrlState,
    updateUrlState,
    generateActiveChips,
    aggregateCounts
  };
})();
