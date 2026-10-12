/**
 * Business Scope in Your City — Public Data API
 * Strict output projection allowlists ensure sensitive internal data
 * (e.g. protected_drive_file_id, cost prices, reviewer notes, private rows)
 * are NEVER exposed over public endpoints.
 */

const PublicApi = (function() {
  'use strict';

  // Strict allowlist for Cities
  const PUBLIC_CITY_FIELDS = [
    'city_id', 'city_name', 'city_slug', 'state', 'region',
    'research_coverage', 'introduction', 'seo_title', 'seo_description', 'status'
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
      return projected;
    });
  }

  /**
   * Fetch all published cities.
   * @returns {Array<Object>}
   */
  function getCities() {
    const all = Database.readAllRecords(Database.SHEETS.CITIES);
    const published = all.filter(c => (c.status || '').toLowerCase() === 'published');
    return projectAllowlist_(published, PUBLIC_CITY_FIELDS);
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
    getOpportunities: getOpportunities,
    getOpportunityDetail: getOpportunityDetail,
    getProducts: getProducts,
    getSettings: getSettings
  };
})();
