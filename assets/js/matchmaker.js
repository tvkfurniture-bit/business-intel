/**
 * Business Scope in Your City — Founder-City Matchmaker Engine
 * Calculates real-time feasibility match score based on city, capital bracket,
 * and operational superpower, outputting verified dossiers with viral share actions.
 */

(function() {
  'use strict';

  const MATCHMAKER_CATALOG = [
    {
      id: 'complygrid',
      title: 'ComplyGrid — Compliance Calendar & Filing Assistant for Industrial MSMEs',
      slug: 'comply-grid-msme-compliance-automation',
      category: 'Business Software / Compliance Automation',
      model: 'SaaS + Managed B2B Hybrid',
      capexTier: 'micro', // ₹20k - ₹1.5L
      capexDisplay: '₹20,000 – ₹1,50,000',
      minBudget: 20000,
      maxBudget: 150000,
      grossMargin: '55% – 70%',
      payback: '4 – 6 Months',
      riskScore: 'Low–Medium (3.4/10)',
      superpower: 'software',
      killGate: 'Fewer than 3 signed LOIs in 7 days',
      sprintText: 'Pitch 15 small factory and godown owners a ₹1,499/mo compliance monitoring pilot. Require 3 signed LOIs before building any software.',
      image: '/assets/images/industrial-compliance-software.jpg',
      idealCities: ['pune', 'bengaluru', 'mumbai', 'ahmedabad', 'delhi', 'chennai', 'hyderabad', 'kolkata', 'indore', 'surat']
    },
    {
      id: 'scrapbridge',
      title: 'Dankuni ScrapBridge — Industrial Secondary Material Marketplace',
      slug: 'dankuni-scrapbridge-business-blueprint',
      category: 'Circular Economy / B2B Marketplace',
      model: 'Managed B2B Marketplace (Take Rate)',
      capexTier: 'bootstrap', // ₹1.5L - ₹5L
      capexDisplay: '₹50,000 – ₹4,00,000',
      minBudget: 50000,
      maxBudget: 400000,
      grossMargin: '12% – 18%',
      payback: '3 – 5 Months',
      riskScore: 'Medium (4.8/10)',
      superpower: 'scrap',
      killGate: 'Fewer than 2 repeat trading transactions in 14 days',
      sprintText: 'Visit 10 metal fabrication shops, secure commitments for 5 tons of mixed scrap, and quote 2 certified recyclers with a ₹1.5/kg margin spread.',
      image: '/assets/images/scrap-recycling-hub.jpg',
      idealCities: ['kolkata', 'howrah', 'dankuni', 'pune', 'ahmedabad', 'nagpur', 'kanpur', 'ludhiana', 'jaipur', 'coimbatore']
    },
    {
      id: 'shelfgrid',
      title: 'Dankuni ShelfGrid — Micro-Warehousing & Pallet Staging Network',
      slug: 'dankuni-shelfgrid-business-blueprint',
      category: 'Logistics / Managed Storage Marketplace',
      model: 'Managed Capacity Take Rate (15–20%)',
      capexTier: 'bootstrap', // ₹1.5L - ₹5L
      capexDisplay: '₹60,000 – ₹2,50,000',
      minBudget: 60000,
      maxBudget: 250000,
      grossMargin: '22% – 32%',
      payback: '5 – 7 Months',
      riskScore: 'Low–Medium (3.8/10)',
      superpower: 'logistics',
      killGate: 'Fewer than 2 of 15 shippers want pallet storage or <60% occupancy in 30 days',
      sprintText: 'Contract 200 sq.ft of empty godown corner on revenue share, then sell 15 pallets of overflow storage to 3 local distributors at ₹220/pallet/month.',
      image: '/assets/images/warehouse-pallet-storage.jpg',
      idealCities: ['kolkata', 'mumbai', 'bengaluru', 'delhi', 'pune', 'bhiwandi', 'surat', 'indore', 'patna', 'guwahati']
    },
    {
      id: 'roofgrid',
      title: 'RoofGrid — Industrial Warehouse Rooftop Solar Aggregator',
      slug: 'roofgrid-warehouse-rooftop-solar-aggregator',
      category: 'Clean Energy / Lead-Gen & Coordination',
      model: 'Commission & EPC Coordination Desk',
      capexTier: 'growth', // ₹5L - ₹15L
      capexDisplay: '₹50,000 – ₹2,00,000',
      minBudget: 50000,
      maxBudget: 200000,
      grossMargin: '65% – 80%',
      payback: '2 – 4 Months',
      riskScore: 'Low (2.8/10)',
      superpower: 'solar',
      killGate: 'Fewer than 2 warehouse power bills audited in 7 days',
      sprintText: 'Audit 8 warehouse electricity bills, perform shadow-free satellite roof assessments, and secure 2 signed EPC feasibility authorization letters.',
      image: '/assets/images/rooftop-solar-industrial.jpg',
      idealCities: ['pune', 'ahmedabad', 'mumbai', 'jaipur', 'surat', 'bengaluru', 'hyderabad', 'vadodara', 'rajkot', 'chennai']
    },
    {
      id: 'evfleet',
      title: 'Commercial EV Mid-Mile Fleet Aggregation & Battery Staging Desk',
      slug: 'ev-commercial-fleet-staging',
      category: 'Clean Energy & EV Mobility',
      model: 'Contracted Mid-Mile Fleet Operations',
      capexTier: 'scale', // ₹15L - ₹50L
      capexDisplay: '₹15,00,000 – ₹45,00,000',
      minBudget: 1500000,
      maxBudget: 4500000,
      grossMargin: '24% – 35%',
      payback: '12 – 18 Months',
      riskScore: 'Medium (5.2/10)',
      superpower: 'logistics',
      killGate: 'Fewer than 4 contracted daily delivery routes in 30 days',
      sprintText: 'Partner with 2 local courier hubs on a guaranteed ₹18/km pilot route before financing initial EV 3-wheeler fleet chassis.',
      image: '/assets/images/commercial-ev-fleet.jpg',
      idealCities: ['delhi', 'bengaluru', 'mumbai', 'pune', 'hyderabad', 'lucknow', 'chandigarh', 'chennai', 'ahmedabad']
    },
    {
      id: 'diaglink',
      title: 'DiagLink — Sample Collection Logistics for Clinics & Diagnostic Labs',
      slug: 'diaglink-sample-collection-logistics',
      category: 'Healthcare / Service Logistics',
      model: 'B2B Managed Sample Logistics (Per-Sample Fee)',
      capexTier: 'micro', // ₹20k - ₹1.5L
      capexDisplay: '₹80,000 – ₹3,00,000',
      minBudget: 80000,
      maxBudget: 300000,
      grossMargin: '38% – 48%',
      payback: '4 – 6 Months',
      riskScore: 'Low–Medium (3.6/10)',
      superpower: 'healthcare',
      killGate: 'Fewer than 5 clinic sample pickup contracts in 10 days',
      sprintText: 'Sign service agreements with 5 neighborhood clinics for cold-chain pathology delivery to central testing labs at ₹40/sample.',
      image: '/assets/images/healthcare-diagnostics-service.jpg',
      idealCities: ['lucknow', 'patna', 'varanasi', 'indore', 'bhopal', 'jaipur', 'nagpur', 'ranchi', 'agra', 'kochi']
    }
  ];

  function initFounderMatchmaker() {
    const container = document.getElementById('founder-matchmaker');
    if (!container) return;

    let selectedCity = 'pune';
    let selectedCityName = 'Pune';
    let selectedCapital = 'micro';
    let selectedCapitalLabel = '₹20K – ₹1.5L (Micro / Solo)';
    let selectedSuperpower = 'software';

    const cityInput = document.getElementById('mm-city-select');
    const capitalBtns = container.querySelectorAll('.mm-cap-btn');
    const powerBtns = container.querySelectorAll('.mm-power-btn');
    const quickCityChips = container.querySelectorAll('.mm-city-chip');

    // City Dropdown Change
    if (cityInput) {
      cityInput.addEventListener('change', () => {
        selectedCity = (cityInput.value || 'pune').toLowerCase();
        selectedCityName = cityInput.options[cityInput.selectedIndex].text.split(',')[0];
        recalculateMatch();
      });
    }

    // Quick City Chips
    quickCityChips.forEach(chip => {
      chip.addEventListener('click', () => {
        quickCityChips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        selectedCity = chip.getAttribute('data-city').toLowerCase();
        selectedCityName = chip.textContent.trim();
        if (cityInput) cityInput.value = selectedCity;
        recalculateMatch();
      });
    });

    // Capital Bracket Buttons
    capitalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        capitalBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        selectedCapital = btn.getAttribute('data-capital');
        selectedCapitalLabel = btn.querySelector('.mm-btn-title').textContent.trim();
        recalculateMatch();
      });
    });

    // Operating Superpower Buttons
    powerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        powerBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        selectedSuperpower = btn.getAttribute('data-power');
        recalculateMatch();
      });
    });

    function recalculateMatch() {
      // Find optimal match based on superpower, capital tier, and city affinity
      let bestMatch = null;
      let highestScore = -1;

      MATCHMAKER_CATALOG.forEach(opp => {
        let score = 70; // baseline

        // Superpower alignment (+18 pts)
        if (opp.superpower === selectedSuperpower) {
          score += 18;
        }

        // Capital alignment (+15 pts)
        if (opp.capexTier === selectedCapital) {
          score += 15;
        } else if (
          (selectedCapital === 'micro' && opp.capexTier === 'bootstrap') ||
          (selectedCapital === 'bootstrap' && opp.capexTier === 'micro') ||
          (selectedCapital === 'growth' && opp.capexTier === 'bootstrap')
        ) {
          score += 8;
        }

        // City cluster alignment (+12 pts)
        if (opp.idealCities.some(c => selectedCity.includes(c) || c.includes(selectedCity))) {
          score += 12;
        }

        // Jitter between 88% and 99%
        const finalScore = Math.min(99, Math.max(82, score));

        if (finalScore > highestScore) {
          highestScore = finalScore;
          bestMatch = { ...opp, score: finalScore };
        }
      });

      if (!bestMatch) bestMatch = { ...MATCHMAKER_CATALOG[0], score: 94 };

      renderMatchResult(bestMatch, selectedCityName, selectedCapitalLabel);
    }

    function renderMatchResult(match, cityName, capLabel) {
      const scoreEl = document.getElementById('mm-result-score');
      const titleEl = document.getElementById('mm-result-title');
      const scopeEl = document.getElementById('mm-result-scope');
      const modelEl = document.getElementById('mm-result-model');
      const capexEl = document.getElementById('mm-result-capex');
      const marginEl = document.getElementById('mm-result-margin');
      const paybackEl = document.getElementById('mm-result-payback');
      const riskEl = document.getElementById('mm-result-risk');
      const sprintEl = document.getElementById('mm-result-sprint');
      const gateEl = document.getElementById('mm-result-gate');
      const linkEl = document.getElementById('mm-result-link');
      const imgEl = document.getElementById('mm-result-img');

      if (scoreEl) scoreEl.textContent = `${match.score}% MATCH`;
      if (titleEl) titleEl.textContent = match.title;
      if (scopeEl) scopeEl.textContent = `📍 Recommended Scope: ${cityName} & Adjacent Clusters`;
      if (modelEl) modelEl.textContent = `Model: ${match.model}`;
      if (capexEl) capexEl.textContent = match.capexDisplay;
      if (marginEl) marginEl.textContent = match.grossMargin;
      if (paybackEl) paybackEl.textContent = match.payback;
      if (riskEl) riskEl.textContent = match.riskScore;
      if (sprintEl) sprintEl.textContent = match.sprintText;
      if (gateEl) gateEl.textContent = `Kill Gate: ${match.killGate}`;
      if (linkEl) linkEl.href = `pages/opportunity/index.html?slug=${encodeURIComponent(match.slug)}`;

      if (imgEl && match.image) {
        imgEl.src = match.image;
        imgEl.alt = match.title;
      }

      // 1-Click WhatsApp Share for Matched Result
      const waBtn = document.getElementById('mm-result-wa-btn');
      if (waBtn) {
        waBtn.onclick = function() {
          const url = `${window.location.origin}/pages/opportunity/index.html?slug=${encodeURIComponent(match.slug)}&utm_source=whatsapp_matchmaker&utm_medium=viral_share`;
          const text = `🎯 *MY FOUNDER MATCH: ${cityName.toUpperCase()}*\n\n` +
            `I just ran my capital and operational profile on Business Scope for *${cityName}* with *${capLabel}*.\n\n` +
            `👉 *Top Matched Opportunity:* ${match.title}\n` +
            `💰 *Indicative Capex:* ${match.capexDisplay}\n` +
            `📈 *Gross Margin:* ${match.grossMargin}\n` +
            `⏱️ *Payback Timeline:* ${match.payback}\n` +
            `🛑 *7-Day Kill Gate:* ${match.killGate}\n\n` +
            `Check out the verified blueprint & unit economics:\n${url}`;

          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        };
      }

      // Export Card Button
      const cardBtn = document.getElementById('mm-result-card-btn');
      if (cardBtn) {
        cardBtn.onclick = function() {
          if (window.ViralShare) {
            window.ViralShare.openShareModal({
              title: match.title,
              slug: match.slug,
              capex: match.capexDisplay,
              city: `${cityName}, India`,
              category: match.category,
              business_model: match.model,
              margin: match.grossMargin,
              payback: match.payback,
              risk: match.riskScore,
              sprint: match.sprintText,
              gate: match.killGate,
              url: `${window.location.origin}/pages/opportunity/index.html?slug=${encodeURIComponent(match.slug)}`
            });
          }
        };
      }
    }

    // Initial calculation on ready
    recalculateMatch();
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFounderMatchmaker);
  } else {
    initFounderMatchmaker();
  }
})();
