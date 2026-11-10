/**
 * Business Scope in Your City — City vs City Arbitrage & Comparison Engine
 * Compares industrial benchmarks, commercial godown rates, capex runway, and live opportunity blueprints.
 */
(function() {
  'use strict';

  // City benchmark profiles database (Empirical MSME averages across India)
  const BENCHMARKS = {
    'mumbai': {
      godownRent: '₹24 – ₹36 / sq.ft',
      powerTariff: '₹8.40 / kWh',
      dailyWage: '₹580 – ₹720',
      runwayPer10L: '3.8 Months',
      runwayMonthsNum: 3.8,
      keyCluster: 'Finance, Maritime, Media, Pharmaceuticals',
      strengths: 'Deepest venture and corporate buyer concentration in South Asia.',
      bottleneck: 'Excessive godown lease costs (Bhiwandi transit friction) and commercial overheads.'
    },
    'delhi-ncr': {
      godownRent: '₹22 – ₹32 / sq.ft',
      powerTariff: '₹8.80 / kWh',
      dailyWage: '₹560 – ₹680',
      runwayPer10L: '4.2 Months',
      runwayMonthsNum: 4.2,
      keyCluster: 'E-commerce logistics, FMCG, Auto ancillary (Faridabad/Gurugram)',
      strengths: 'Vast northern consumption hinterland and multimodal road/rail connectivity.',
      bottleneck: 'Seasonal pollution regulatory shut-downs and multi-state toll bottlenecks.'
    },
    'bengaluru': {
      godownRent: '₹20 – ₹29 / sq.ft',
      powerTariff: '₹7.80 / kWh',
      dailyWage: '₹520 – ₹650',
      runwayPer10L: '4.8 Months',
      runwayMonthsNum: 4.8,
      keyCluster: 'Aerospace, Defense, IT/Hardware, Deeptech & Electronics',
      strengths: 'Unmatched technical and product engineering talent pool.',
      bottleneck: 'Urban road congestion and high white-collar customer acquisition costs.'
    },
    'pune': {
      godownRent: '₹15 – ₹22 / sq.ft',
      powerTariff: '₹8.20 / kWh',
      dailyWage: '₹480 – ₹600',
      runwayPer10L: '6.2 Months',
      runwayMonthsNum: 6.2,
      keyCluster: 'Automotive, Precision Tooling, Heavy Fabrication, Agri-tech',
      strengths: 'World-class Tier-1/Tier-2 vendor ecosystem (Chakan, Bhosari, Talegaon).',
      bottleneck: 'Relatively high industrial power tariff compared to Gujarat.'
    },
    'ahmedabad': {
      godownRent: '₹11 – ₹16 / sq.ft',
      powerTariff: '₹5.90 / kWh',
      dailyWage: '₹420 – ₹520',
      runwayPer10L: '8.8 Months',
      runwayMonthsNum: 8.8,
      keyCluster: 'Chemicals, Dyes, Polymers, Textiles, Auto (Sanand)',
      strengths: 'Low power tariffs, business-friendly municipal compliance, low rental burn.',
      bottleneck: 'More conservative local buyer payment terms (longer trade credit cycles).'
    },
    'indore': {
      godownRent: '₹9 – ₹14 / sq.ft',
      powerTariff: '₹6.40 / kWh',
      dailyWage: '₹380 – ₹480',
      runwayPer10L: '10.5 Months',
      runwayMonthsNum: 10.5,
      keyCluster: 'Pharma Formulation (Pithampur), Food Processing, Logistics',
      strengths: 'Central geographic pivot point for pan-India freight with low land burn.',
      bottleneck: 'Smaller specialized technical engineering pool compared to Pune/Bengaluru.'
    },
    'jaipur': {
      godownRent: '₹10 – ₹15 / sq.ft',
      powerTariff: '₹7.40 / kWh',
      dailyWage: '₹400 – ₹500',
      runwayPer10L: '9.4 Months',
      runwayMonthsNum: 9.4,
      keyCluster: 'Handicrafts, Gems/Jewelry, Auto Components (Sitapura/Bhiwadi), Textiles',
      strengths: 'Direct proximity to Delhi NCR without Delhi operational expense burn.',
      bottleneck: 'Water supply constraints in specific industrial pockets.'
    },
    'kolkata': {
      godownRent: '₹12 – ₹18 / sq.ft',
      powerTariff: '₹7.10 / kWh',
      dailyWage: '₹390 – ₹490',
      runwayPer10L: '9.0 Months',
      runwayMonthsNum: 9.0,
      keyCluster: 'Heavy Foundry, Jute, Riverine Freight (Dankuni), Scrap & Metals',
      strengths: 'Gateway to Eastern India, Bangladesh, and Northeast with cheap labor base.',
      bottleneck: 'Fragmented municipal logistics bylaws and older godown infrastructure.'
    },
    'surat': {
      godownRent: '₹11 – ₹15 / sq.ft',
      powerTariff: '₹6.00 / kWh',
      dailyWage: '₹420 – ₹510',
      runwayPer10L: '8.9 Months',
      runwayMonthsNum: 8.9,
      keyCluster: 'Synthetic Textiles, Diamond Processing, Petrochemicals (Hazira)',
      strengths: 'World-leading synthetic fabric supplier network and rapid turnover trade velocity.',
      bottleneck: 'Hyper-specialized focus on textiles limits cross-sector tooling.'
    },
    'hyderabad': {
      godownRent: '₹16 – ₹24 / sq.ft',
      powerTariff: '₹7.60 / kWh',
      dailyWage: '₹480 – ₹590',
      runwayPer10L: '6.5 Months',
      runwayMonthsNum: 6.5,
      keyCluster: 'Bulk Drugs/API, Biotech (Genome Valley), IT Hardware, Aerospace',
      strengths: 'Proactive industrial land allocation and world-class bulk chemical infra.',
      bottleneck: 'Rapidly escalating commercial land rents around outer ring road.'
    },
    'coimbatore': {
      godownRent: '₹10 – ₹15 / sq.ft',
      powerTariff: '₹6.80 / kWh',
      dailyWage: '₹440 – ₹540',
      runwayPer10L: '9.1 Months',
      runwayMonthsNum: 9.1,
      keyCluster: 'Pumps & Motors, Precision Castings, Textiles, Wet Grinders',
      strengths: 'Highly disciplined engineering culture and deep subcontracting networks.',
      bottleneck: 'Geographic distance from large Northern/Western consumer metros.'
    }
  };

  // Default fallback for any unlisted Tier-2/Tier-3 city
  const DEFAULT_BENCHMARK = {
    godownRent: '₹10 – ₹16 / sq.ft',
    powerTariff: '₹7.00 / kWh',
    dailyWage: '₹400 – ₹500',
    runwayPer10L: '8.5 Months',
    runwayMonthsNum: 8.5,
    keyCluster: 'Regional MSME, Agro-Processing & Trade',
    strengths: 'Low operational burn rate, strong local retail relationships.',
    bottleneck: 'Lower specialized supplier depth compared to Tier-1 corridors.'
  };

  let allCities = [];
  let allOpportunities = [];
  let selectedCityA = 'pune';
  let selectedCityB = 'ahmedabad';

  async function init() {
    setupEventListeners();
    await loadData();
    parseUrlParams();
    renderComparison();
  }

  function setupEventListeners() {
    const selectA = document.getElementById('select-city-a');
    const selectB = document.getElementById('select-city-b');
    const swapBtn = document.getElementById('btn-swap-cities');
    const capexSelect = document.getElementById('input-custom-capex');
    const shareWhatsAppBtn = document.getElementById('btn-share-comparison-whatsapp');
    const copyLinkedInBtn = document.getElementById('btn-copy-linkedin-debate');

    if (selectA) {
      selectA.addEventListener('change', (e) => {
        selectedCityA = e.target.value;
        if (selectedCityA === selectedCityB) {
          // Prevent comparing same city
          selectedCityB = (selectedCityA === 'pune') ? 'ahmedabad' : 'pune';
          if (selectB) selectB.value = selectedCityB;
        }
        updateUrlParams();
        renderComparison();
      });
    }

    if (selectB) {
      selectB.addEventListener('change', (e) => {
        selectedCityB = e.target.value;
        if (selectedCityB === selectedCityA) {
          selectedCityA = (selectedCityB === 'ahmedabad') ? 'pune' : 'ahmedabad';
          if (selectA) selectA.value = selectedCityA;
        }
        updateUrlParams();
        renderComparison();
      });
    }

    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        const temp = selectedCityA;
        selectedCityA = selectedCityB;
        selectedCityB = temp;
        if (selectA) selectA.value = selectedCityA;
        if (selectB) selectB.value = selectedCityB;
        updateUrlParams();
        renderComparison();
      });
    }

    if (capexSelect) {
      capexSelect.addEventListener('change', () => {
        renderRunwaySimulator();
      });
    }

    // Quick battle buttons
    document.querySelectorAll('.quick-battle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        selectedCityA = targetBtn.getAttribute('data-city-a');
        selectedCityB = targetBtn.getAttribute('data-city-b');
        if (selectA) selectA.value = selectedCityA;
        if (selectB) selectB.value = selectedCityB;
        updateUrlParams();
        renderComparison();
      });
    });

    if (shareWhatsAppBtn) {
      shareWhatsAppBtn.addEventListener('click', shareToWhatsApp);
    }

    if (copyLinkedInBtn) {
      copyLinkedInBtn.addEventListener('click', copyLinkedInHook);
    }
  }

  async function loadData() {
    // 1. Load Cities
    if (typeof INDIA_CITIES_MASTER !== 'undefined' && Array.isArray(INDIA_CITIES_MASTER)) {
      allCities = INDIA_CITIES_MASTER;
    } else {
      try {
        const res = await API.get('cities');
        allCities = (res && Array.isArray(res.data)) ? res.data : [];
      } catch (err) {
        console.warn('Could not fetch cities, using fallback list');
        allCities = [];
      }
    }

    populateDropdowns();

    // 2. Load Opportunities
    try {
      const oppRes = await API.get('opportunities');
      if (oppRes && Array.isArray(oppRes.data)) {
        allOpportunities = oppRes.data;
      }
    } catch (err) {
      console.warn('Could not load opportunities');
    }
  }

  function populateDropdowns() {
    const selectA = document.getElementById('select-city-a');
    const selectB = document.getElementById('select-city-b');
    if (!selectA || !selectB) return;

    selectA.innerHTML = '';
    selectB.innerHTML = '';

    allCities.forEach(c => {
      const optA = document.createElement('option');
      optA.value = c.slug;
      optA.textContent = `${c.city_name}, ${c.state_code || c.state} (${c.tier || 'Tier 2'})`;
      selectA.appendChild(optA);

      const optB = document.createElement('option');
      optB.value = c.slug;
      optB.textContent = `${c.city_name}, ${c.state_code || c.state} (${c.tier || 'Tier 2'})`;
      selectB.appendChild(optB);
    });

    selectA.value = selectedCityA;
    selectB.value = selectedCityB;
  }

  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const cA = params.get('cityA');
    const cB = params.get('cityB');
    if (cA) selectedCityA = cA;
    if (cB) selectedCityB = cB;

    const selectA = document.getElementById('select-city-a');
    const selectB = document.getElementById('select-city-b');
    if (selectA) selectA.value = selectedCityA;
    if (selectB) selectB.value = selectedCityB;
  }

  function updateUrlParams() {
    const url = new URL(window.location);
    url.searchParams.set('cityA', selectedCityA);
    url.searchParams.set('cityB', selectedCityB);
    window.history.replaceState({}, '', url);
  }

  function getCityObj(slug) {
    return allCities.find(c => c.slug === slug) || {
      city_name: slug.charAt(0).toUpperCase() + slug.slice(1),
      state: 'India',
      state_code: 'IN',
      tier: 'Tier 2',
      population_band: '2M - 5M',
      economic_profile: 'Regional industrial and trading hub.'
    };
  }

  function getBenchmark(slug) {
    return BENCHMARKS[slug] || DEFAULT_BENCHMARK;
  }

  function renderComparison() {
    const cityA = getCityObj(selectedCityA);
    const cityB = getCityObj(selectedCityB);
    const benchA = getBenchmark(selectedCityA);
    const benchB = getBenchmark(selectedCityB);

    // Update Table Headers
    const thA = document.getElementById('th-city-a-name');
    const thB = document.getElementById('th-city-b-name');
    if (thA) thA.textContent = `${cityA.city_name} (${cityA.state_code || cityA.state})`;
    if (thB) thB.textContent = `${cityB.city_name} (${cityB.state_code || cityB.state})`;

    // Render Table Rows
    const tbody = document.getElementById('compare-table-body');
    if (tbody) {
      const rows = [
        {
          factor: 'Market Tier & Region',
          valA: `${cityA.tier || 'Tier 2'} · ${cityA.region || 'India'}`,
          valB: `${cityB.tier || 'Tier 2'} · ${cityB.region || 'India'}`
        },
        {
          factor: 'Population & Consumer Density',
          valA: cityA.population_band || '3M – 6M',
          valB: cityB.population_band || '3M – 6M'
        },
        {
          factor: 'Commercial Godown Rent',
          valA: benchA.godownRent,
          valB: benchB.godownRent,
          highlight: true
        },
        {
          factor: 'Industrial 3-Phase Power',
          valA: benchA.powerTariff,
          valB: benchB.powerTariff
        },
        {
          factor: 'Semi-Skilled Daily Wage',
          valA: benchA.dailyWage,
          valB: benchB.dailyWage
        },
        {
          factor: '₹10 Lakh Operational Runway',
          valA: `<strong style="color: var(--teal-light); font-feature-settings: 'tnum' 1;">${benchA.runwayPer10L}</strong>`,
          valB: `<strong style="color: #f59e0b; font-feature-settings: 'tnum' 1;">${benchB.runwayPer10L}</strong>`,
          highlight: true
        },
        {
          factor: 'Primary Anchor Clusters',
          valA: benchA.keyCluster,
          valB: benchB.keyCluster
        },
        {
          factor: 'Core Operational Advantage',
          valA: benchA.strengths,
          valB: benchB.strengths
        },
        {
          factor: 'Key Friction / Bottleneck',
          valA: benchA.bottleneck,
          valB: benchB.bottleneck
        }
      ];

      tbody.innerHTML = rows.map((r, i) => `
        <tr style="border-bottom: 1px solid var(--border-color); background: ${r.highlight ? 'rgba(13,148,136,0.06)' : (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)')};">
          <td style="padding: 14px 20px; font-weight: 600; color: #fff;">${r.factor}</td>
          <td style="padding: 14px 20px; color: #cbd5e1; line-height: 1.5;">${r.valA}</td>
          <td style="padding: 14px 20px; color: #cbd5e1; line-height: 1.5;">${r.valB}</td>
        </tr>
      `).join('');
    }

    // Update Verdict
    renderVerdict(cityA, cityB, benchA, benchB);

    // Update Runway Simulator
    renderRunwaySimulator();

    // Update Opportunities List
    renderOpportunitiesList(cityA, cityB);
  }

  function renderVerdict(cityA, cityB, benchA, benchB) {
    const headline = document.getElementById('verdict-headline');
    const narrative = document.getElementById('verdict-narrative');

    const diffPct = Math.round(Math.abs((benchB.runwayMonthsNum - benchA.runwayMonthsNum) / benchA.runwayMonthsNum) * 100);
    const longerCity = benchB.runwayMonthsNum > benchA.runwayMonthsNum ? cityB.city_name : cityA.city_name;
    const shorterCity = benchB.runwayMonthsNum > benchA.runwayMonthsNum ? cityA.city_name : cityB.city_name;

    if (headline) {
      if (diffPct === 0) {
        headline.textContent = `${cityA.city_name} and ${cityB.city_name} offer comparable capex runways with differing cluster strengths.`;
      } else {
        headline.textContent = `${longerCity} provides +${diffPct}% longer operational runway than ${shorterCity} on identical seed capex.`;
      }
    }

    if (narrative) {
      narrative.textContent = `Founders prioritizing cluster density and specialized Tier-1 vendor networks find faster commercial pilot cycles in ${cityA.city_name} (${benchA.keyCluster}). Conversely, operators seeking lower burn, cheaper warehouse storage (${benchB.godownRent}), and competitive tariffs achieve extended survival runway in ${cityB.city_name}.`;
    }
  }

  function renderRunwaySimulator() {
    const capexSelect = document.getElementById('input-custom-capex');
    const capex = capexSelect ? parseInt(capexSelect.value, 10) : 1000000;

    const cityA = getCityObj(selectedCityA);
    const cityB = getCityObj(selectedCityB);
    const benchA = getBenchmark(selectedCityA);
    const benchB = getBenchmark(selectedCityB);

    // Scale runway proportionally
    const runwayMonthsA = ((capex / 1000000) * benchA.runwayMonthsNum).toFixed(1);
    const runwayMonthsB = ((capex / 1000000) * benchB.runwayMonthsNum).toFixed(1);

    const container = document.getElementById('runway-comparison-cards');
    if (!container) return;

    container.innerHTML = `
      <div style="background: rgba(13,148,136,0.1); border: 1px solid rgba(13,148,136,0.3); border-radius: var(--radius-md); padding: 20px;">
        <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--teal-light); font-weight: 700; margin-bottom: 6px;">${cityA.city_name} Runway</div>
        <div style="font-size: 2.2rem; font-weight: 800; color: #fff; font-feature-settings: 'tnum' 1; margin-bottom: 8px;">${runwayMonthsA} <span style="font-size: 1rem; font-weight: 400; color: var(--text-muted);">Months</span></div>
        <p style="font-size: 0.86rem; color: #cbd5e1; margin: 0; line-height: 1.5;">
          Estimated monthly burn of ₹${Math.round(capex / runwayMonthsA).toLocaleString('en-IN')}/mo including storage lease, compliance, and initial 2-person pilot ops.
        </p>
      </div>

      <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: var(--radius-md); padding: 20px;">
        <div style="font-size: 0.8rem; text-transform: uppercase; color: #f59e0b; font-weight: 700; margin-bottom: 6px;">${cityB.city_name} Runway</div>
        <div style="font-size: 2.2rem; font-weight: 800; color: #fff; font-feature-settings: 'tnum' 1; margin-bottom: 8px;">${runwayMonthsB} <span style="font-size: 1rem; font-weight: 400; color: var(--text-muted);">Months</span></div>
        <p style="font-size: 0.86rem; color: #cbd5e1; margin: 0; line-height: 1.5;">
          Estimated monthly burn of ₹${Math.round(capex / runwayMonthsB).toLocaleString('en-IN')}/mo with lower municipal godown costs.
        </p>
      </div>
    `;
  }

  function renderOpportunitiesList(cityA, cityB) {
    const listA = document.getElementById('opp-list-city-a');
    const listB = document.getElementById('opp-list-city-b');
    const titleA = document.getElementById('opp-list-city-a-title');
    const titleB = document.getElementById('opp-list-city-b-title');

    if (titleA) titleA.textContent = `${cityA.city_name} Verified Blueprints`;
    if (titleB) titleB.textContent = `${cityB.city_name} Verified Blueprints`;

    function filterOpps(cityName, stateName) {
      const target = cityName.toLowerCase();
      const stateTarget = (stateName || '').toLowerCase();
      let matches = allOpportunities.filter(o => {
        const c = (o.city || o.city_name || '').toLowerCase();
        const s = (o.state || '').toLowerCase();
        const sc = (o.scope || '').toLowerCase();
        return c.includes(target) || sc.includes(target) || s.includes(stateTarget);
      });

      if (matches.length === 0) {
        // Fallback to top 2 general blueprints with city attribution
        matches = allOpportunities.slice(0, 2);
      }
      return matches.slice(0, 3);
    }

    const oppsA = filterOpps(cityA.city_name, cityA.state);
    const oppsB = filterOpps(cityB.city_name, cityB.state);

    if (listA) {
      listA.innerHTML = oppsA.map(o => `
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="font-size: 0.78rem; color: var(--teal-light); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">${o.category || 'B2B Opportunity'}</div>
          <a href="../opportunity/index.html?id=${o.opportunity_id || o.slug}" style="font-size: 0.95rem; font-weight: 700; color: #fff; text-decoration: none; display: block; margin-bottom: 6px;">
            ${o.title || o.opportunity_name} &rarr;
          </a>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-feature-settings: 'tnum' 1;">
            Indicative Capex: <strong>${o.indicative_startup_capex || o.capex || '₹20K – ₹1.5L'}</strong>
          </div>
        </div>
      `).join('');
    }

    if (listB) {
      listB.innerHTML = oppsB.map(o => `
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="font-size: 0.78rem; color: #f59e0b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">${o.category || 'B2B Opportunity'}</div>
          <a href="../opportunity/index.html?id=${o.opportunity_id || o.slug}" style="font-size: 0.95rem; font-weight: 700; color: #fff; text-decoration: none; display: block; margin-bottom: 6px;">
            ${o.title || o.opportunity_name} &rarr;
          </a>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-feature-settings: 'tnum' 1;">
            Indicative Capex: <strong>${o.indicative_startup_capex || o.capex || '₹20K – ₹1.5L'}</strong>
          </div>
        </div>
      `).join('');
    }
  }

  function shareToWhatsApp() {
    const cityA = getCityObj(selectedCityA);
    const cityB = getCityObj(selectedCityB);
    const benchA = getBenchmark(selectedCityA);
    const benchB = getBenchmark(selectedCityB);

    const shareUrl = `${window.location.origin}/pages/compare/index.html?cityA=${selectedCityA}&cityB=${selectedCityB}&utm_source=whatsapp&utm_medium=city_arbitrage`;

    const text = `*City Arbitrage: ${cityA.city_name} vs ${cityB.city_name}* 📊\n\n` +
      `Where does ₹10 Lakhs capital go farther?\n\n` +
      `🏢 *Commercial Godown Rent:*\n` +
      `• ${cityA.city_name}: ${benchA.godownRent}\n` +
      `• ${cityB.city_name}: ${benchB.godownRent}\n\n` +
      `⚡ *Industrial Power:*\n` +
      `• ${cityA.city_name}: ${benchA.powerTariff}\n` +
      `• ${cityB.city_name}: ${benchB.powerTariff}\n\n` +
      `⏱️ *₹10L Operational Runway:*\n` +
      `• ${cityA.city_name}: ${benchA.runwayPer10L}\n` +
      `• ${cityB.city_name}: ${benchB.runwayPer10L}\n\n` +
      `Read complete head-to-head empirical breakdown:\n${shareUrl}`;

    const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waLink, '_blank', 'noopener,noreferrer');
  }

  function copyLinkedInHook() {
    const cityA = getCityObj(selectedCityA);
    const cityB = getCityObj(selectedCityB);
    const benchA = getBenchmark(selectedCityA);
    const benchB = getBenchmark(selectedCityB);

    const shareUrl = `${window.location.origin}/pages/compare/index.html?cityA=${selectedCityA}&cityB=${selectedCityB}&utm_source=linkedin&utm_medium=city_arbitrage`;

    const hookText = `The ₹10 Lakhs founder dilemma in India: ${cityA.city_name} vs. ${cityB.city_name}.\n\n` +
      `Most entrepreneurs default to metros without evaluating the municipal ground realities:\n\n` +
      `1. Godown Leases: ${cityA.city_name} averages ${benchA.godownRent} vs ${cityB.city_name} at ${benchB.godownRent}.\n` +
      `2. Power Tariffs: ${cityA.city_name} (${benchA.powerTariff}) vs ${cityB.city_name} (${benchB.powerTariff}).\n` +
      `3. Runway on ₹10L seed: ${benchA.runwayPer10L} in ${cityA.city_name} vs ${benchB.runwayPer10L} in ${cityB.city_name}.\n\n` +
      `Before allocating capital, run the empirical arbitrage simulator:\n${shareUrl}\n\n` +
      `#IndianStartups #MSME #Manufacturing #Founders #BusinessScope`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hookText).then(() => {
        alert('LinkedIn post hook copied to clipboard! Paste it into your LinkedIn update.');
      }).catch(() => {
        prompt('Copy your LinkedIn post text:', hookText);
      });
    } else {
      prompt('Copy your LinkedIn post text:', hookText);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
