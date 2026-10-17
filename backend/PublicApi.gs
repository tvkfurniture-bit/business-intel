/**
 * Business Scope in Your City — Public Data API
 * Strict output projection allowlists ensure sensitive internal data
 * (e.g. protected_drive_file_id, cost prices, reviewer notes, private rows)
 * are NEVER exposed over public endpoints.
 */

const PublicApi = (function() {
  'use strict';

  // Comprehensive allowlist for Cities covering all tiers and market characteristics
  const PUBLIC_CITY_FIELDS = [
    'city_id', 'city_name', 'slug', 'city_slug', 'state', 'state_code', 'region',
    'tier', 'platform_city_tier', 'population_band', 'economic_profile', 'major_industries',
    'business_density', 'entrepreneur_density', 'consumer_market_strength', 'infrastructure_level',
    'research_priority', 'coverage_status', 'opportunity_count', 'featured',
    'seo_title', 'seo_description', 'status', 'introduction', 'research_coverage'
  ];

  // Strict allowlist for Opportunities list
  const PUBLIC_OPPORTUNITY_FIELDS = [
    'opportunity_id', 'city_id', 'city_name', 'state', 'title', 'slug',
    'category', 'business_model', 'budget_min', 'budget_max', 'research_status',
    'confidence_level', 'short_summary', 'customer_problem', 'required_skills_json',
    'risk_level', 'featured', 'published_at'
  ];

  // Strict allowlist for Opportunity detailed guide
  const PUBLIC_OPPORTUNITY_DETAIL_FIELDS = [
    'opportunity_id', 'city_id', 'city_name', 'state', 'title', 'slug',
    'category', 'business_model', 'budget_min', 'budget_max', 'research_status',
    'confidence_level', 'short_summary', 'customer_problem', 'target_customers',
    'proposed_solution', 'differentiation', 'capex_breakdown_json', 'opex_monthly_json',
    'unit_economics_json', 'required_skills_json', 'statutory_licenses_json',
    'failure_modes_json', 'validation_experiment_json', 'citations_json',
    'risk_level', 'featured', 'published_at', 'seo_title', 'seo_description'
  ];

  // Strict allowlist for Digital Products / Blueprints catalogue
  const PUBLIC_PRODUCT_FIELDS = [
    'product_id', 'slug', 'title', 'product_type', 'city_id', 'category',
    'short_description', 'price_inr', 'inclusions_summary', 'format_deliverables',
    'delivery_method', 'status'
  ];

  /**
   * Project an array of records against a strict allowlist.
   * Strips internal metadata properties like _rowNumber, admin_notes, and protected_drive_file_id.
   * @param {Array<Object>} records
   * @param {Array<string>} allowlist
   * @returns {Array<Object>}
   */
  function projectAllowlist_(records, allowlist) {
    return records.map(rec => {
      const projected = {};
      allowlist.forEach(key => {
        if (rec[key] !== undefined) {
          projected[key] = rec[key];
        }
      });
      // Standardize slug and city_slug
      if (projected.slug && !projected.city_slug) projected.city_slug = projected.slug;
      if (projected.city_slug && !projected.slug) projected.slug = projected.city_slug;
      if (projected.tier && !projected.platform_city_tier) projected.platform_city_tier = projected.tier;
      if (projected.platform_city_tier && !projected.tier) projected.tier = projected.platform_city_tier;
      return projected;
    });
  }

  /**
   * Helper: Calculate live opportunity count map by city_id from Opportunities sheet.
   * @returns {Object} { [city_id]: count }
   */
  function getOpportunityCountMap_() {
    const opps = Database.readAllRecords(Database.SHEETS.OPPORTUNITIES);
    const countMap = {};
    opps.forEach(o => {
      if ((o.status || 'published').toLowerCase() === 'published') {
        const id = String(o.city_id || '').trim();
        if (id) {
          countMap[id] = (countMap[id] || 0) + 1;
        }
      }
    });
    return countMap;
  }

  /**
   * Fetch all published or active cities with dynamic opportunity counts.
   * @returns {Array<Object>}
   */
  function getCities() {
    const all = Database.readAllRecords(Database.SHEETS.CITIES);
    // Include all active records unless explicitly marked draft or archived
    const active = all.filter(c => {
      const st = String(c.status || '').toLowerCase();
      return st !== 'draft' && st !== 'archived';
    });

    const countMap = getOpportunityCountMap_();
    active.forEach(c => {
      const id = String(c.city_id || '').trim();
      const legacyId = String(c.legacy_id || '').trim();
      c.opportunity_count = (countMap[id] || 0) + (legacyId ? (countMap[legacyId] || 0) : 0);
    });

    return projectAllowlist_(active, PUBLIC_CITY_FIELDS);
  }

  /**
   * Fetch a single city profile by slug or city_id.
   * @param {string} slug
   * @returns {Object|null}
   */
  function getCityBySlug(slug) {
    if (!slug) return null;
    const clean = String(slug).trim().toLowerCase();
    const cities = getCities();
    return cities.find(c => {
      const s = String(c.slug || c.city_slug || '').toLowerCase();
      const id = String(c.city_id || '').toLowerCase();
      return s === clean || id === clean;
    }) || null;
  }

  /**
   * Fetch cities filtered by market tier (e.g. 'Tier 1', 'Tier 2').
   * @param {string} tier
   * @returns {Array<Object>}
   */
  function getCitiesByTier(tier) {
    if (!tier) return getCities();
    const clean = String(tier).trim().toLowerCase();
    return getCities().filter(c => String(c.tier || c.platform_city_tier || '').toLowerCase() === clean);
  }

  /**
   * Fetch cities filtered by State (e.g. 'Maharashtra', 'Karnataka').
   * @param {string} state
   * @returns {Array<Object>}
   */
  function getCitiesByState(state) {
    if (!state) return getCities();
    const clean = String(state).trim().toLowerCase();
    return getCities().filter(c => {
      return String(c.state || '').toLowerCase() === clean || String(c.state_code || '').toLowerCase() === clean;
    });
  }

  /**
   * Fetch cities filtered by Region (e.g. 'North India', 'South India').
   * @param {string} region
   * @returns {Array<Object>}
   */
  function getCitiesByRegion(region) {
    if (!region) return getCities();
    const clean = String(region).trim().toLowerCase();
    return getCities().filter(c => String(c.region || '').toLowerCase() === clean);
  }

  /**
   * Fetch featured cities for homepage and highlights.
   * @returns {Array<Object>}
   */
  function getFeaturedCities() {
    const cities = getCities();
    const featured = cities.filter(c => c.featured === true || String(c.featured).toLowerCase() === 'true');
    return featured.length > 0 ? featured : cities.slice(0, 8);
  }

  /**
   * Fetch live opportunity count for a specific city_id.
   * @param {string} cityId
   * @returns {number}
   */
  function getCityOpportunityCount(cityId) {
    if (!cityId) return 0;
    const countMap = getOpportunityCountMap_();
    return countMap[String(cityId).trim()] || 0;
  }

  /**
   * Fetch all published opportunities.
   * @returns {Array<Object>}
   */
  function getOpportunities() {
    const all = Database.readAllRecords(Database.SHEETS.OPPORTUNITIES);
    const published = all.filter(o => (o.status || '').toLowerCase() === 'published');
    return projectAllowlist_(published, PUBLIC_OPPORTUNITY_FIELDS);
  }

  /**
   * Fetch single opportunity report by slug.
   * @param {string} slug
   * @returns {Object|null}
   */
  function getOpportunityDetail(slug) {
    if (!slug) return null;
    const cleanSlug = Validation.sanitizeText(slug, 120);
    const opp = Database.findRecord(Database.SHEETS.OPPORTUNITIES, 'slug', cleanSlug);

    if (!opp || (opp.status || '').toLowerCase() !== 'published') {
      return null;
    }

    const projected = {};
    PUBLIC_OPPORTUNITY_DETAIL_FIELDS.forEach(f => {
      if (opp[f] !== undefined) {
        projected[f] = opp[f];
      }
    });

    return projected;
  }

  /**
   * Fetch digital products / business blueprints.
   * @returns {Array<Object>}
   */
  function getProducts() {
    const all = Database.readAllRecords(Database.SHEETS.BLUEPRINTS);
    const published = all.filter(p => (p.status || '').toLowerCase() === 'published');
    return projectAllowlist_(published, PUBLIC_PRODUCT_FIELDS);
  }

  /**
   * Fetch public site configuration settings.
   * @returns {Object}
   */
  function getSettings() {
    const all = Database.readAllRecords(Database.SHEETS.SETTINGS);
    const publicSettings = {};

    all.forEach(s => {
      const key = String(s.setting_key || s.key || '').trim().toUpperCase();
      const val = s.setting_value !== undefined ? s.setting_value : s.value;
      // Only permit safe UI settings
      if (['ANNOUNCEMENT_TEXT', 'DEFAULT_CURRENCY', 'MAINTENANCE_MODE'].includes(key)) {
        publicSettings[key] = String(val);
      }
    });

    return publicSettings;
  }

  return {
    getCities: getCities,
    getCityBySlug: getCityBySlug,
    getCitiesByTier: getCitiesByTier,
    getCitiesByState: getCitiesByState,
    getCitiesByRegion: getCitiesByRegion,
    getFeaturedCities: getFeaturedCities,
    getCityOpportunityCount: getCityOpportunityCount,
    getOpportunities: getOpportunities,
    getOpportunityDetail: getOpportunityDetail,
    getProducts: getProducts,
    getSettings: getSettings
  };
})();
