/**
 * Business Scope in Your City — Google Apps Script Web App Main Gateway
 * Entry points doGet and doPost handle cross-origin GET queries (with JSONP fallback),
 * preflight-free text/plain POST transactions, and security routing.
 */

function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const endpoint = (params.endpoint || '').trim().toLowerCase();
    const callback = (params.callback || '').trim();

    let result;

    switch (endpoint) {
      case 'cities':
        result = PublicApi.getCities();
        break;

      case 'city':
      case 'city_by_slug':
        result = PublicApi.getCityBySlug(params.slug || params.city_id);
        break;

      case 'cities_by_tier':
        result = PublicApi.getCitiesByTier(params.tier);
        break;

      case 'cities_by_state':
        result = PublicApi.getCitiesByState(params.state);
        break;

      case 'cities_by_region':
        result = PublicApi.getCitiesByRegion(params.region);
        break;

      case 'featured_cities':
        result = PublicApi.getFeaturedCities();
        break;

      case 'city_opportunity_count':
        result = { city_id: params.city_id, opportunity_count: PublicApi.getCityOpportunityCount(params.city_id) };
        break;

      case 'opportunities':
        result = PublicApi.getOpportunities();
        break;

      case 'opportunity_detail':
        result = PublicApi.getOpportunityDetail(params.slug);
        break;

      case 'products':
      case 'blueprints':
        result = PublicApi.getProducts();
        break;

      case 'settings':
        result = PublicApi.getSettings();
        break;

      default:
        result = { error: 'Unknown or unspecified endpoint requested.' };
        break;
    }

    const jsonString = JSON.stringify(result);

    // If client requested JSONP callback fallback (e.g. for restrictive browser CORS policies)
    if (callback) {
      // Sanitize callback name to alphanumeric and underscore only
      const safeCallback = callback.replace(/[^a-zA-Z0-9_]/g, '');
      const jsonpOutput = `${safeCallback}(${jsonString});`;
      return ContentService.createTextOutput(jsonpOutput)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    const errObj = { error: err.message || 'Internal server execution error.' };
    return ContentService.createTextOutput(JSON.stringify(errObj))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse_({ status: 'error', message: 'No payload received in request.' });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse_({ status: 'error', message: 'Payload must be valid JSON text.' });
    }

    const action = String(payload.action || '').trim().toLowerCase();
    let response;

    switch (action) {
      case 'submit_enquiry':
        response = handleEnquirySubmission_(payload);
        break;

      case 'subscribe_newsletter':
        response = handleNewsletterSubscription_(payload);
        break;

      case 'create_order':
        response = Orders.createOrder(payload);
        break;

      case 'verify_order':
        response = Orders.handleOrderAccessVerification(payload.order_id, payload.customer_email);
        break;

      case 'admin_reconcile_order':
        response = AdminApi.reconcileOrderPayment(payload.order_id, payload.payment_status, payload.notes);
        break;

      case 'admin_set_opportunity_status':
        response = AdminApi.setOpportunityStatus(payload.opportunity_id, payload.target_status);
        break;

      default:
        response = { status: 'error', message: `Unrecognized action: ${action}` };
        break;
    }

    return createJsonResponse_(response);

  } catch (err) {
    return createJsonResponse_({
      status: 'error',
      message: err.message || 'Unexpected server processing exception.'
    });
  }
}

/**
 * Handle public contact inquiry or custom research scoping submission.
 * @param {Object} payload
 * @returns {Object}
 */
function handleEnquirySubmission_(payload) {
  const email = String(payload.customer_email || '').trim().toLowerCase();
  const name = Validation.sanitizeText(payload.customer_name, 100);
  const city = Validation.sanitizeText(payload.city, 80);
  const state = Validation.sanitizeText(payload.state, 80);
  const enquiryType = Validation.sanitizeText(payload.enquiry_type || 'General Inquiry', 100);
  const message = Validation.sanitizeText(payload.message, 2500);

  if (!Validation.isValidEmail(email)) {
    return { status: 'error', message: 'A valid email address is required.' };
  }

  if (!name || !message) {
    return { status: 'error', message: 'Name and message details are required.' };
  }

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randSuffix = '';
  for (let i = 0; i < 5; i++) randSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  const enquiryId = `ENQ-${randSuffix}`;

  const enquiryRecord = {
    enquiry_id: enquiryId,
    created_at: new Date().toISOString(),
    enquiry_type: enquiryType,
    customer_name: name,
    customer_email: email,
    city: city,
    state: state,
    budget_range: Validation.sanitizeText(payload.budget_range || 'N/A', 50),
    business_interest: Validation.sanitizeText(payload.business_interest || 'N/A', 100),
    requested_deliverable: Validation.sanitizeText(payload.requested_deliverable || 'General Inquiry', 100),
    message: message,
    consent_status: payload.consent_status ? 'Consented' : 'Unspecified'
  };

  Database.appendRecord(Database.SHEETS.ENQUIRIES, enquiryRecord);
  Database.logAudit('SUBMIT_ENQUIRY', email, enquiryId);

  // Send email acknowledgment
  Notifications.sendEnquiryAcknowledgement(enquiryRecord);

  return {
    status: 'success',
    enquiry_id: enquiryId,
    message: 'Inquiry logged successfully with the research desk.'
  };
}

/**
 * Handle newsletter subscription with idempotency.
 * @param {Object} payload
 * @returns {Object}
 */
function handleNewsletterSubscription_(payload) {
  const email = String(payload.email || '').trim().toLowerCase();

  if (!Validation.isValidEmail(email)) {
    return { status: 'error', message: 'Please provide a valid email address.' };
  }

  // Check if subscriber already exists
  const existing = Database.findRecord(Database.SHEETS.NEWSLETTER, 'email', email);
  if (!existing) {
    Database.appendRecord(Database.SHEETS.NEWSLETTER, {
      email: email,
      subscribed_at: new Date().toISOString(),
      source: 'web_form',
      status: 'Active'
    });
    Database.logAudit('NEWSLETTER_SUBSCRIBE', email, 'Newsletter');
  }

  return {
    status: 'success',
    message: 'Subscribed to weekly market intelligence.'
  };
}

/**
 * Helper to generate JSON text response.
 * @param {Object} obj
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function createJsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
