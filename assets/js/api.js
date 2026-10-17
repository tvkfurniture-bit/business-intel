/**
 * Business Scope in Your City — Secure Backend Communication Layer
 * Handles cross-origin requests, JSONP fallback for Google Apps Script 302 redirects,
 * POST preflight mitigation, client-side caching, and structured error reporting.
 */

const API = (function() {
  'use strict';

  // Request timeout duration in milliseconds
  const REQUEST_TIMEOUT_MS = 12000;

  // In-memory / sessionStorage cache expiry (5 minutes)
  const CACHE_TTL_MS = 5 * 60 * 1000;

  /**
   * Check if a valid cached response exists in sessionStorage.
   * @param {string} cacheKey
   * @returns {Object|null}
   */
  function getCachedResponse(cacheKey) {
    try {
      const cached = sessionStorage.getItem(`bsc_cache_${cacheKey}`);
      if (!cached) return null;

      const record = JSON.parse(cached);
      if (Date.now() - record.timestamp < CACHE_TTL_MS) {
        return record.data;
      }
      sessionStorage.removeItem(`bsc_cache_${cacheKey}`);
    } catch (e) {
      // Ignore cache retrieval errors
    }
    return null;
  }

  /**
   * Save successful GET response to sessionStorage cache.
   * @param {string} cacheKey
   * @param {Object} data
   */
  function setCachedResponse(cacheKey, data) {
    try {
      const record = {
        timestamp: Date.now(),
        data: data
      };
      sessionStorage.setItem(`bsc_cache_${cacheKey}`, JSON.stringify(record));
    } catch (e) {
      // Storage quota full or unavailable; ignore safely
    }
  }

  /**
   * Execute a JSONP request as a reliable cross-origin fallback for GET queries.
   * Used when Google Apps Script 302 redirects encounter restrictive browser CORS policies.
   * @param {string} url Base URL with query params
   * @returns {Promise<Object>}
   */
  function fetchJsonp(url) {
    return new Promise((resolve, reject) => {
      const callbackName = 'bsc_cb_' + Math.round(100000 * Math.random());
      const script = document.createElement('script');

      // Append callback parameter
      const delim = url.includes('?') ? '&' : '?';
      script.src = `${url}${delim}callback=${callbackName}`;
      script.async = true;

      // Timeout safety
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP communication timed out after ' + (REQUEST_TIMEOUT_MS / 1000) + ' seconds.'));
      }, REQUEST_TIMEOUT_MS);

      function cleanup() {
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
        clearTimeout(timeoutId);
        // Replace with inert dummy handler to prevent "Uncaught TypeError: window[callbackName] is not a function"
        // in the global scope if late HTTP responses arrive after timeout or network error rejection.
        window[callbackName] = function() {
          try { delete window[callbackName]; } catch (e) {}
        };
        setTimeout(() => {
          try { delete window[callbackName]; } catch (e) {}
        }, 60000);
      }

      window[callbackName] = function(data) {
        cleanup();
        resolve(data);
      };

      script.onerror = function() {
        cleanup();
        reject(new Error('Script load failure during cross-origin JSONP communication.'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Public GET request wrapper.
   * Fetches public records (cities, opportunities, products, articles, settings).
   * Attempts standard fetch with CORS; falls back to JSONP on failure.
   * @param {string} endpoint Public endpoint name
   * @param {Object} params Optional query key-value pairs
   * @param {boolean} useCache Whether to check sessionStorage cache (default: true)
   * @returns {Promise<Object>}
   */
  async function get(endpoint, params = {}, useCache = true) {
    if (!CONFIG.APPS_SCRIPT_WEB_APP_URL || CONFIG.APPS_SCRIPT_WEB_APP_URL.includes('SAMPLE_DEPLOYMENT_ID')) {
      if (endpoint === 'cities') {
        return normalizeCitiesResponse_([]);
      }
      console.warn('Backend API URL is unconfigured. Returning empty dataset.');
      return [];
    }

    const queryParams = new URLSearchParams();
    queryParams.append('path', 'api');
    queryParams.append('endpoint', endpoint);

    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    }

    const queryString = queryParams.toString();
    const cacheKey = `${endpoint}_${queryString}`;

    // 1. Check client cache
    if (useCache) {
      const cached = getCachedResponse(cacheKey);
      if (cached) return cached;
    }

    const requestUrl = `${CONFIG.APPS_SCRIPT_WEB_APP_URL}?${queryString}`;

    // 2. Attempt standard fetch with AbortController timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP network error: status ${response.status}`);
      }

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error('Invalid JSON payload returned by API.');
      }

      if (endpoint === 'cities') {
        data = normalizeCitiesResponse_(data);
      }

      if (useCache && !data.error) {
        setCachedResponse(cacheKey, data);
      }

      return data;
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      // If fetch fails due to CORS / redirect isolation, fall back to JSONP
      try {
        let jsonpData = await fetchJsonp(requestUrl);
        if (endpoint === 'cities') {
          jsonpData = normalizeCitiesResponse_(jsonpData);
        }
        if (useCache && !jsonpData.error) {
          setCachedResponse(cacheKey, jsonpData);
        }
        return jsonpData;
      } catch (jsonpErr) {
        console.error(`API GET Failure on [${endpoint}]:`, fetchErr.message || jsonpErr.message);
        if (endpoint === 'cities') {
          return normalizeCitiesResponse_([]);
        }
        return { error: 'Unable to synchronize with backend database. Please check your network connection.' };
      }
    }
  }

  /**
   * Normalize and hydrate city records from Google Sheets with nationwide tier data.
   * @param {Array<Object>} data Raw sheet records
   * @returns {Array<Object>}
   */
  function normalizeCitiesResponse_(data) {
    const master = (typeof window !== 'undefined' && window.INDIA_CITIES_MASTER) || (typeof globalThis !== 'undefined' && globalThis.INDIA_CITIES_MASTER) || [];
    if (!Array.isArray(data) || data.length === 0) {
      return master;
    }
    const existingSlugs = new Set();
    const existingIds = new Set();
    const normalized = data.map(c => {
      const slug = c.slug || c.city_slug || (c.city_name ? c.city_name.toLowerCase().replace(/[\s-]+/g, '-') : '');
      const tier = c.tier || c.platform_city_tier || 'Tier 2';
      const city_id = c.city_id || ('IN-' + (c.state_code || 'IND') + '-' + slug.toUpperCase().slice(0, 3));
      existingSlugs.add(slug.toLowerCase());
      existingIds.add(city_id.toLowerCase());
      return {
        ...c,
        slug: slug,
        city_slug: slug,
        tier: tier,
        platform_city_tier: tier,
        city_id: city_id
      };
    });

    master.forEach(m => {
      const s = (m.slug || m.city_slug || '').toLowerCase();
      const id = (m.city_id || '').toLowerCase();
      if (!existingSlugs.has(s) && !existingIds.has(id)) {
        normalized.push(m);
      }
    });

    return normalized;
  }

  /**
   * Public POST request wrapper.
   * State-changing operations: submit_enquiry, subscribe_newsletter, create_order.
   * Uses text/plain to avoid CORS OPTIONS preflights not handled by Apps Script.
   * @param {string} action Action identifier
   * @param {Object} payload Request data
   * @returns {Promise<Object>}
   */
  async function post(action, payload = {}) {
    if (!CONFIG.APPS_SCRIPT_WEB_APP_URL || CONFIG.APPS_SCRIPT_WEB_APP_URL.includes('SAMPLE_DEPLOYMENT_ID')) {
      return { status: 'error', message: 'Backend URL unconfigured in config.js.' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Generate client-side transaction idempotency token
      const idempotencyToken = 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

      const requestBody = JSON.stringify({
        action: action,
        client_timestamp: new Date().toISOString(),
        idempotency_token: idempotencyToken,
        ...payload
      });

      // text/plain avoids CORS preflight (OPTIONS) which Apps Script web apps do not support
      const response = await fetch(CONFIG.APPS_SCRIPT_WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: requestBody,
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const rawText = await response.text();
      let result;
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error('Malformed server response returned by Apps Script.');
      }
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(`API POST Failure on [${action}]:`, err);
      return {
        status: 'error',
        message: err.name === 'AbortError'
          ? 'Transaction timed out after 12 seconds. Please check your connection and retry.'
          : (err.message || 'Network communication failure.')
      };
    }
  }

  /**
   * Invalidate local cache for a specific endpoint or clear all cache.
   * @param {string} [endpoint] Optional specific endpoint to clear
   */
  function clearCache(endpoint) {
    try {
      if (!endpoint) {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('bsc_cache_')) sessionStorage.removeItem(key);
        });
      } else {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith(`bsc_cache_${endpoint}`)) sessionStorage.removeItem(key);
        });
      }
    } catch (e) {
      // Storage unavailable
    }
  }

  // Public Interface
  return {
    get,
    post,
    clearCache
  };
})();
