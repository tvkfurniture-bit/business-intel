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
        if (script.parentNode) script.parentNode.removeChild(script);
        delete window[callbackName];
        clearTimeout(timeoutId);
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
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP network error: status ${response.status}`);
      }

      const data = await response.json();

      if (useCache && !data.error) {
        setCachedResponse(cacheKey, data);
      }

      return data;
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      // If fetch fails due to CORS / redirect isolation, fall back to JSONP
      try {
        const jsonpData = await fetchJsonp(requestUrl);
        if (useCache && !jsonpData.error) {
          setCachedResponse(cacheKey, jsonpData);
        }
        return jsonpData;
      } catch (jsonpErr) {
        console.error(`API GET Failure on [${endpoint}]:`, fetchErr.message || jsonpErr.message);
        return { error: 'Unable to synchronize with backend database. Please check your network connection.' };
      }
    }
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
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const result = await response.json();
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
