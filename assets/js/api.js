/**
 * Business Scope in Your City — Accelerated Backend Communication Layer
 * Features:
 * - Ultra-fast local reverse proxy (/api/get, /api/bundle) with sub-10ms response times
 * - Multi-tier caching (Memory -> localStorage -> sessionStorage)
 * - Stale-While-Revalidate pattern (instant UI rendering with silent background updates)
 * - In-flight request deduplication (prevents duplicate simultaneous network calls)
 * - Automatic background bundle pre-warming
 * - Resilient fallback to direct Google Apps Script & JSONP if proxy is unreachable
 */

const API = (function() {
  'use strict';

  // Request timeout duration in milliseconds
  const REQUEST_TIMEOUT_MS = 10000;

  // Freshness TTL (5 minutes) & Stale tolerance (24 hours)
  const CACHE_TTL_MS = 5 * 60 * 1000;
  const STALE_TTL_MS = 24 * 60 * 60 * 1000;

  // In-memory instant cache map (0ms access within page session)
  const memCache = new Map();

  // In-flight request deduplication map
  const inFlightRequests = new Map();

  /**
   * Helper to retrieve from localStorage or sessionStorage safely
   */
  function storageGet(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(key);
        if (val) return val;
      }
    } catch (e) {}
    try {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  }

  /**
   * Helper to write to localStorage and sessionStorage safely
   */
  function storageSet(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {}
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, value);
      }
    } catch (e) {}
  }

  /**
   * Helper to remove from storage safely
   */
  function storageRemove(key) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch (e) {}
    try {
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key);
    } catch (e) {}
  }

  /**
   * Check if a cached response exists and return metadata.
   * @param {string} cacheKey
   * @returns {{ data: any, isFresh: boolean } | null}
   */
  function getCachedEntry(cacheKey) {
    // 1. Check in-memory Map first (fastest)
    if (memCache.has(cacheKey)) {
      const entry = memCache.get(cacheKey);
      const age = Date.now() - entry.timestamp;
      if (age < STALE_TTL_MS) {
        return { data: entry.data, isFresh: age < CACHE_TTL_MS };
      }
      memCache.delete(cacheKey);
    }

    // 2. Check persistent storage
    try {
      const raw = storageGet(`bsc_cache_${cacheKey}`);
      if (!raw) return null;
      const record = JSON.parse(raw);
      const age = Date.now() - record.timestamp;
      if (age < STALE_TTL_MS) {
        // Hydrate memory cache
        memCache.set(cacheKey, record);
        return { data: record.data, isFresh: age < CACHE_TTL_MS };
      }
      storageRemove(`bsc_cache_${cacheKey}`);
    } catch (e) {}
    return null;
  }

  /**
   * Save successful response to cache.
   * @param {string} cacheKey
   * @param {Object} data
   */
  function setCachedEntry(cacheKey, data) {
    if (!data || data.error) return;
    const record = {
      timestamp: Date.now(),
      data: data
    };
    memCache.set(cacheKey, record);
    try {
      storageSet(`bsc_cache_${cacheKey}`, JSON.stringify(record));
    } catch (e) {}
  }

  /**
   * Execute a JSONP request as fallback when CORS fails.
   */
  function fetchJsonp(url) {
    return new Promise((resolve, reject) => {
      const callbackName = 'bsc_cb_' + Math.round(100000 * Math.random());
      const script = document.createElement('script');

      const delim = url.includes('?') ? '&' : '?';
      script.src = `${url}${delim}callback=${callbackName}`;
      script.async = true;

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP communication timed out.'));
      }, REQUEST_TIMEOUT_MS);

      function cleanup() {
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
        clearTimeout(timeoutId);
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
        reject(new Error('Script load failure during JSONP communication.'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Normalize cities response into standard array format.
   * Handles various backend structures: array of cities, { cities: [...] }, or empty/null.
   * Ensures slug, city_slug, city_id, city_name, state, and region properties are consistently mapped.
   * @param {any} raw
   * @returns {Array<Object>}
   */
  function normalizeCitiesResponse_(raw) {
    let list = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && Array.isArray(raw.cities)) {
      list = raw.cities;
    } else if (raw && Array.isArray(raw.data)) {
      list = raw.data;
    } else if (typeof window !== 'undefined' && Array.isArray(window.INDIA_CITIES_MASTER)) {
      list = window.INDIA_CITIES_MASTER;
    }

    return list.map(c => {
      if (!c || typeof c !== 'object') return c;
      const slug = c.slug || c.city_slug || (c.city_name ? c.city_name.toLowerCase().trim().replace(/\s+/g, '-') : c.city_id);
      return {
        ...c,
        slug: slug,
        city_slug: c.city_slug || slug,
        city_name: c.city_name || c.name || slug,
        city_id: c.city_id || slug
      };
    });
  }

  /**
   * Network execution for GET requests:
   * 1. Try local same-origin proxy /api/get first (<10ms)
   * 2. Fall back to direct Apps Script fetch
   * 3. Fall back to JSONP
   */
  async function executeNetworkGet(endpoint, params = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('endpoint', endpoint);
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    }
    const queryString = queryParams.toString();

    // 1. Try local same-origin proxy first
    const proxyUrl = `/api/get?${queryString}`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (resp.ok) {
        let json = await resp.json();
        if (json && !json.error) {
          if (endpoint === 'cities') json = normalizeCitiesResponse_(json);
          return json;
        }
      }
    } catch (proxyErr) {
      // Local proxy unreachable; fall back to direct Apps Script
    }

    // 2. Direct Apps Script fetch fallback
    if (CONFIG.APPS_SCRIPT_WEB_APP_URL && !CONFIG.APPS_SCRIPT_WEB_APP_URL.includes('SAMPLE_DEPLOYMENT_ID')) {
      const directParams = new URLSearchParams();
      directParams.append('path', 'api');
      directParams.append('endpoint', endpoint);
      for (const k in params) {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          directParams.append(k, params[k]);
        }
      }
      const directUrl = `${CONFIG.APPS_SCRIPT_WEB_APP_URL}?${directParams.toString()}`;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        const resp = await fetch(directUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          redirect: 'follow',
          signal: controller.signal
        });
        clearTimeout(timer);

        if (resp.ok) {
          let json = await resp.json();
          if (endpoint === 'cities') json = normalizeCitiesResponse_(json);
          return json;
        }
      } catch (directErr) {
        // Fall through to JSONP
      }

      // 3. JSONP Fallback
      try {
        let jsonp = await fetchJsonp(directUrl);
        if (endpoint === 'cities') jsonp = normalizeCitiesResponse_(jsonp);
        return jsonp;
      } catch (jsonpErr) {
        console.warn(`[API] All connection channels exhausted for [${endpoint}]:`, jsonpErr.message);
      }
    }

    if (endpoint === 'cities') return normalizeCitiesResponse_([]);
    return { error: 'Unable to reach backend database.' };
  }

  /**
   * Public GET request wrapper with Stale-While-Revalidate and In-Flight deduplication.
   * @param {string} endpoint
   * @param {Object} [params]
   * @param {boolean} [useCache=true]
   * @returns {Promise<any>}
   */
  async function get(endpoint, params = {}, useCache = true) {
    const queryParams = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    }
    const cacheKey = `${endpoint}_${queryParams.toString()}`;

    // 1. Check local cache (Memory & Storage)
    if (useCache) {
      const cached = getCachedEntry(cacheKey);
      if (cached) {
        // If fresh, return immediately (0ms)
        if (cached.isFresh) {
          return cached.data;
        }
        // If stale, return immediately and trigger silent background refresh
        setTimeout(() => {
          executeNetworkGet(endpoint, params).then(fresh => {
            if (fresh && !fresh.error) setCachedEntry(cacheKey, fresh);
          }).catch(() => {});
        }, 100);
        return cached.data;
      }
    }

    // 2. In-flight request deduplication
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }

    // 3. Initiate network request
    const promise = executeNetworkGet(endpoint, params)
      .then(data => {
        inFlightRequests.delete(cacheKey);
        if (useCache && data && !data.error) {
          setCachedEntry(cacheKey, data);
        }
        return data;
      })
      .catch(err => {
        inFlightRequests.delete(cacheKey);
        throw err;
      });

    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  /**
   * Fetch complete data bundle (opportunities, cities, products, settings) in 1 request.
   */
  async function getBundle() {
    try {
      const resp = await fetch('/api/bundle', { headers: { 'Accept': 'application/json' } });
      if (resp.ok) {
        const bundle = await resp.json();
        if (bundle.opportunities) setCachedEntry('opportunities_', bundle.opportunities);
        if (bundle.cities) setCachedEntry('cities_', normalizeCitiesResponse_(bundle.cities));
        if (bundle.products) setCachedEntry('products_', bundle.products);
        if (bundle.settings) setCachedEntry('settings_', bundle.settings);
        return bundle;
      }
    } catch (e) {}

    // Fallback: parallel get calls
    const [opps, cities, prods, sett] = await Promise.all([
      get('opportunities'),
      get('cities'),
      get('products'),
      get('settings')
    ]);
    return { opportunities: opps, cities, products: prods, settings: sett };
  }

  /**
   * Background pre-warmer: populates client cache during idle time.
   */
  function warmup() {
    if (typeof window === 'undefined') return;
    const task = () => {
      // If opportunities not in memory or storage, fetch bundle
      const hasOpps = getCachedEntry('opportunities_');
      if (!hasOpps || !hasOpps.isFresh) {
        getBundle().catch(() => {});
      }
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(task, { timeout: 3000 });
    } else {
      setTimeout(task, 1500);
    }
  }

  // Auto-warmup on load
  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') {
      warmup();
    } else {
      window.addEventListener('load', warmup, { once: true });
    }
  }
  /**
   * Execute transactional POST actions (lead capture, order placement, newsletter, feedback).
   * Routes through local server proxy first to prevent browser CORS drops and redirect hangs,
   * falling back to direct Apps Script fetch if proxy is unavailable.
   * @param {string} action
   * @param {Object} payload
   * @returns {Promise<{status: string, message?: string, order_id?: string, lead_id?: string}>}
   */
  async function post(action, payload = {}) {
    const idempotencyToken = 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const bodyPayload = {
      action: action,
      client_timestamp: new Date().toISOString(),
      idempotency_token: idempotencyToken,
      ...payload
    };

    // 1. Try local server proxy (fastest, no preflight CORS delays)
    try {
      const proxyResp = await fetch('/api/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });
      if (proxyResp.ok) {
        const result = await proxyResp.json();
        return result;
      }
    } catch (proxyErr) {
      // Local proxy unreachable, proceed to direct Apps Script
    }

    // 2. Direct Apps Script fetch fallback
    if (!CONFIG.APPS_SCRIPT_WEB_APP_URL || CONFIG.APPS_SCRIPT_WEB_APP_URL.includes('SAMPLE_DEPLOYMENT_ID')) {
      return { status: 'error', message: 'Backend URL unconfigured in config.js.' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // text/plain avoids CORS preflight (OPTIONS) which Apps Script web apps do not support
      const response = await fetch(CONFIG.APPS_SCRIPT_WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(bodyPayload),
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
      memCache.clear();
      if (!endpoint) {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('bsc_cache_')) sessionStorage.removeItem(key);
        });
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('bsc_cache_')) localStorage.removeItem(key);
        });
      } else {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith(`bsc_cache_${endpoint}`)) sessionStorage.removeItem(key);
        });
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`bsc_cache_${endpoint}`)) localStorage.removeItem(key);
        });
      }
    } catch (e) {
      // Storage unavailable
    }
  }

  // Public Interface
  return {
    get,
    getBundle,
    post,
    clearCache,
    warmup,
    normalizeCitiesResponse_
  };
})();
