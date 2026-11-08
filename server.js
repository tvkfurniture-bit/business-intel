import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================================================
// HIGH-SPEED GOOGLE SHEETS PROXY & CACHE ENGINE
// Eliminates cold starts, CORS drops, and multi-second delays by serving
// structured in-memory datasets instantly (<5ms) with background revalidation.
// ==========================================================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzivoqHKenF7UvmU1OxQ3MTx3DJJI7NDDpqQEqjGqa7c9nnIHgrc-2OXKgl8i1TmeqCrA/exec';
const CACHE_FILE = path.join(__dirname, '.data-cache.json');
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes freshness
const REQUEST_TIMEOUT_MS = 8000;

// In-memory cache stores
const cacheStore = {
  opportunities: null,
  cities: null,
  products: null,
  settings: null,
  details: {},
  lastSync: 0,
  syncing: false
};

// Load disk cache snapshot on boot
function initCacheFromDisk() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.opportunities)) cacheStore.opportunities = data.opportunities;
      if (Array.isArray(data.cities)) cacheStore.cities = data.cities;
      if (Array.isArray(data.products)) cacheStore.products = data.products;
      if (data.settings && typeof data.settings === 'object') cacheStore.settings = data.settings;
      if (data.details && typeof data.details === 'object') cacheStore.details = data.details;
      cacheStore.lastSync = data._timestamp || Date.now();
      console.log(`[Cache Engine] Initialized snapshot from disk (${cacheStore.opportunities?.length || 0} opps, ${cacheStore.products?.length || 0} products, ${cacheStore.cities?.length || 0} cities).`);
    }
  } catch (err) {
    console.warn('[Cache Engine] Disk cache load notice:', err.message);
  }
}

function persistCacheToDisk() {
  try {
    const payload = {
      opportunities: cacheStore.opportunities,
      cities: cacheStore.cities,
      products: cacheStore.products,
      settings: cacheStore.settings,
      details: cacheStore.details,
      _timestamp: cacheStore.lastSync
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Cache Engine] Failed writing disk snapshot:', err.message);
  }
}

// Fetch single endpoint from Google Apps Script with timeout
async function fetchEndpoint(endpoint, params = {}) {
  const queryParams = new URLSearchParams();
  queryParams.append('path', 'api');
  queryParams.append('endpoint', endpoint);
  for (const k in params) {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
      queryParams.append(k, params[k]);
    }
  }

  const url = `${APPS_SCRIPT_URL}?${queryParams.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    return json;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Background sync of all core datasets
async function syncCoreDatasets() {
  if (cacheStore.syncing) return;
  cacheStore.syncing = true;
  const t0 = Date.now();

  try {
    const endpoints = ['opportunities', 'cities', 'products', 'settings'];
    const results = await Promise.allSettled(endpoints.map(ep => fetchEndpoint(ep)));

    let updated = false;
    endpoints.forEach((ep, idx) => {
      const res = results[idx];
      if (res.status === 'fulfilled' && res.value && !res.value.error) {
        if (Array.isArray(res.value) && res.value.length > 0) {
          cacheStore[ep] = res.value;
          updated = true;
        } else if (typeof res.value === 'object' && !Array.isArray(res.value)) {
          cacheStore[ep] = res.value;
          updated = true;
        }
      }
    });

    if (updated) {
      cacheStore.lastSync = Date.now();
      persistCacheToDisk();
      console.log(`[Cache Engine] Core datasets refreshed from Google Sheets in ${Date.now() - t0}ms.`);
    }
  } catch (err) {
    console.warn('[Cache Engine] Background sync error:', err.message);
  } finally {
    cacheStore.syncing = false;
  }
}

// Initialize cache and start background refresher
initCacheFromDisk();
// Immediate background sync after startup
setTimeout(syncCoreDatasets, 1000);
// Periodic background refresh every 5 minutes
setInterval(syncCoreDatasets, 5 * 60 * 1000);

// --------------------------------------------------------------------------
// PROXY ROUTES (Served before static files)
// --------------------------------------------------------------------------

// 1. Single-request bundle for lightning page loads
app.get('/api/bundle', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=600');
  res.setHeader('X-Cache-Status', cacheStore.opportunities ? 'HIT' : 'MISS');
  
  // Trigger background refresh if stale
  if (Date.now() - cacheStore.lastSync > CACHE_TTL_MS) {
    syncCoreDatasets();
  }

  res.json({
    opportunities: cacheStore.opportunities || [],
    cities: cacheStore.cities || [],
    products: cacheStore.products || [],
    settings: cacheStore.settings || {},
    _last_sync: cacheStore.lastSync
  });
});

// 2. Standard GET proxy for any endpoint
app.get('/api/get', async (req, res) => {
  const endpoint = (req.query.endpoint || '').trim().toLowerCase();
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint parameter required.' });
  }

  res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=600');

  // Fast-path: core in-memory endpoints
  if (['opportunities', 'cities', 'products', 'settings'].includes(endpoint)) {
    if (cacheStore[endpoint]) {
      res.setHeader('X-Cache-Status', 'HIT');
      if (Date.now() - cacheStore.lastSync > CACHE_TTL_MS) {
        syncCoreDatasets();
      }
      return res.json(cacheStore[endpoint]);
    }
  }

  // Opportunity Detail Fast-Path
  if (endpoint === 'opportunity_detail' && req.query.slug) {
    const slug = String(req.query.slug).trim();
    if (cacheStore.details && cacheStore.details[slug]) {
      res.setHeader('X-Cache-Status', 'HIT');
      return res.json(cacheStore.details[slug]);
    }

    try {
      res.setHeader('X-Cache-Status', 'MISS');
      const detail = await fetchEndpoint('opportunity_detail', { slug });
      if (detail && !detail.error) {
        if (!cacheStore.details) cacheStore.details = {};
        cacheStore.details[slug] = detail;
        persistCacheToDisk();
      }
      return res.json(detail);
    } catch (err) {
      console.warn(`[Proxy] Detail fetch failed for slug "${slug}":`, err.message);
      // If we have an opportunity in list, construct fallback detail
      const fallbackOpp = (cacheStore.opportunities || []).find(o => o.slug === slug);
      if (fallbackOpp) {
        return res.json({
          ...fallbackOpp,
          proposed_solution: fallbackOpp.short_summary,
          customer_problem: fallbackOpp.customer_problem || fallbackOpp.short_summary,
          target_customers: 'Local business operators and regional service purchasers.',
          _fallback: true
        });
      }
      return res.status(502).json({ error: 'Unable to reach backend Google Sheets.' });
    }
  }

  // Generic Pass-through proxy with fetch
  try {
    const params = { ...req.query };
    delete params.endpoint;
    const data = await fetchEndpoint(endpoint, params);
    res.setHeader('X-Cache-Status', 'LIVE');
    return res.json(data);
  } catch (err) {
    console.warn(`[Proxy] Pass-through error for endpoint "${endpoint}":`, err.message);
    // Return cached core data if available as fallback
    if (cacheStore[endpoint]) {
      res.setHeader('X-Cache-Status', 'FALLBACK');
      return res.json(cacheStore[endpoint]);
    }
    return res.status(502).json({ error: 'Unable to reach backend Google Sheets.' });
  }
});

// 3. POST proxy for enquiry, order, newsletter transactions
app.post('/api/post', async (req, res) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const bodyStr = JSON.stringify(req.body || {});
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyStr,
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timer);

    const text = await resp.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      json = { status: 'success', raw: text };
    }
    return res.json(json);
  } catch (err) {
    clearTimeout(timer);
    console.error('[Proxy POST Error]:', err.message);
    return res.status(502).json({
      status: 'error',
      message: err.name === 'AbortError' ? 'Transaction timed out.' : 'Failed communicating with Google Sheets.'
    });
  }
});

// 4. Cache diagnostic status endpoint
app.get('/api/cache-status', (req, res) => {
  res.json({
    status: 'ok',
    last_sync: new Date(cacheStore.lastSync).toISOString(),
    age_seconds: Math.round((Date.now() - cacheStore.lastSync) / 1000),
    is_fresh: Date.now() - cacheStore.lastSync < CACHE_TTL_MS,
    counts: {
      opportunities: cacheStore.opportunities?.length || 0,
      cities: cacheStore.cities?.length || 0,
      products: cacheStore.products?.length || 0,
      cached_details: Object.keys(cacheStore.details || {}).length,
      settings_loaded: !!cacheStore.settings
    }
  });
});

// 5. Force cache refresh trigger
app.post('/api/cache-refresh', async (req, res) => {
  await syncCoreDatasets();
  res.json({ status: 'refreshed', last_sync: cacheStore.lastSync });
});

// Serve static assets from root directory
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: false // Handled manually
}));

// Route root /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Friendly aliases for specific policy pages pointing to legal
const legalAliases = ['privacy', 'terms', 'refund-policy', 'disclaimer', 'research-policy'];
legalAliases.forEach(alias => {
  app.get([`/${alias}`, `/${alias}/`], (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'legal', 'index.html'));
  });
});

// Dynamic routing for pages directory
// Matches e.g. /opportunities, /opportunities/, /city/mumbai, /opportunity/specialty-coffee-roastery-mumbai
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  // Strip leading and trailing slashes and split path
  const cleanPath = req.path.replace(/^\/+|\/+$/g, '');
  if (!cleanPath) return next();

  const segments = cleanPath.split('/');
  const topSection = segments[0];

  // 1. Direct page folder match: /<section> or /<section>/...
  const targetIndexPath = path.join(__dirname, 'pages', topSection, 'index.html');
  if (fs.existsSync(targetIndexPath)) {
    // If accessed as /<section> without trailing slash, redirect to canonical /<section>/
    if (segments.length === 1 && !req.path.endsWith('/')) {
      const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      return res.redirect(301, `/${topSection}/${queryString}`);
    }
    return res.sendFile(targetIndexPath);
  }

  // 2. Direct HTML file match in pages: /pages/<section>/index.html
  if (topSection === 'pages' && segments[1]) {
    const pageSubIndex = path.join(__dirname, 'pages', segments[1], 'index.html');
    if (fs.existsSync(pageSubIndex)) {
      return res.sendFile(pageSubIndex);
    }
  }

  next();
});

// 404 Handler
app.use((req, res) => {
  const notFoundPath = path.join(__dirname, '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath);
  } else {
    res.status(404).send('Page not found');
  }
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
