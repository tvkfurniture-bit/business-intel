/**
 * Business Scope in Your City — Viral Distribution & Social Card Engine
 * Generates high-resolution 1200x675 visual infographics on HTML5 canvas,
 * formats WhatsApp and LinkedIn deal-flow snippets, and handles 1-click sharing.
 */

(function() {
  'use strict';

  const ViralShare = {
    /**
     * Formats WhatsApp markdown text from opportunity data.
     */
    formatWhatsAppText(opp) {
      const url = opp.url || window.location.href.split('#')[0];
      const shareUrl = url.includes('?') 
        ? `${url}&utm_source=whatsapp&utm_medium=viral_dossier`
        : `${url}?utm_source=whatsapp&utm_medium=viral_dossier`;

      const title = opp.title || 'Local Business Opportunity';
      const city = opp.city || opp.resolved_location || 'Pan-India';
      const capex = opp.capex || (opp.budget_min && opp.budget_max ? `₹${Number(opp.budget_min).toLocaleString('en-IN')} – ₹${Number(opp.budget_max).toLocaleString('en-IN')}` : '₹50K – ₹5L');
      const margin = opp.margin || '55% – 70%';
      const payback = opp.payback || '4 – 6 Months';
      const risk = opp.risk || 'Low–Medium';
      const sprint = opp.sprint || 'Interview 15 target customers; secure minimum 3 signed letters of intent before investing.';
      const gate = opp.gate || 'Fewer than 3 signed LOIs in 7 days';

      return `📊 *LOCAL BUSINESS DOSSIER: ${title.toUpperCase()}*\n` +
        `📍 *Location:* ${city}\n` +
        `🏷️ *Category:* ${opp.category || 'MSME Opportunity'}\n\n` +
        `💰 *Indicative Startup Capex:* ${capex}\n` +
        `📈 *Target Gross Margin:* ${margin}\n` +
        `⏱️ *Break-Even Payback:* ${payback}\n` +
        `⚠️ *Risk Index:* ${risk}\n\n` +
        `🧪 *7-Day Falsification Test:*\n` +
        `"${sprint}"\n` +
        `🛑 *Kill Gate:* ${gate}\n\n` +
        `🔍 *Examine Full Unit Economics & 90-Day Blueprint:*\n` +
        `${shareUrl}`;
    },

    /**
     * Formats LinkedIn viral discussion text.
     */
    formatLinkedInText(opp) {
      const url = opp.url || window.location.href.split('#')[0];
      const shareUrl = url.includes('?') 
        ? `${url}&utm_source=linkedin&utm_medium=viral_post`
        : `${url}?utm_source=linkedin&utm_medium=viral_post`;

      const title = opp.title || 'Local Business Opportunity';
      const city = opp.city || opp.resolved_location || 'India';
      const capex = opp.capex || (opp.budget_min && opp.budget_max ? `₹${Number(opp.budget_min).toLocaleString('en-IN')} – ₹${Number(opp.budget_max).toLocaleString('en-IN')}` : '₹50K – ₹5L');
      const margin = opp.margin || '55% – 70%';
      const payback = opp.payback || '4 – 6 Months';

      return `Analyzing uncrowded business opportunities across India:\n\n` +
        `Opportunity Spotlight: ${title} (${city})\n\n` +
        `Before allocating capital, here are the empirical unit economics:\n` +
        `• Indicative Startup Capex: ${capex}\n` +
        `• Gross Margins: ${margin}\n` +
        `• Break-Even Payback: ${payback}\n` +
        `• Operating Model: ${opp.business_model || 'B2B Managed Service'}\n\n` +
        `The biggest failure mode in local businesses is building before testing demand. A disciplined 7-day pre-mortem test is required before committing capital.\n\n` +
        `Would this business model work in your tier-2 or tier-3 city? What are the biggest local hurdles you see?\n\n` +
        `Full audited unit economics & validation framework: ${shareUrl}`;
    },

    /**
     * Renders a crisp 1200x675 visual card onto an HTML5 canvas.
     */
    drawCanvasCard(canvas, opp) {
      const ctx = canvas.getContext('2d');
      const width = 1200;
      const height = 675;

      canvas.width = width;
      canvas.height = height;

      // 1. Deep Midnight Obsidian Backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0B132B');
      bgGrad.addColorStop(0.5, '#0F172A');
      bgGrad.addColorStop(1, '#070C1B');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Ambient Teal Glow in Top Right
      const glowGrad = ctx.createRadialGradient(width - 150, 150, 10, width - 150, 150, 450);
      glowGrad.addColorStop(0, 'rgba(45, 212, 191, 0.18)');
      glowGrad.addColorStop(0.6, 'rgba(13, 148, 136, 0.05)');
      glowGrad.addColorStop(1, 'rgba(11, 19, 43, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Hairline Frame Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(32, 32, width - 64, height - 64);

      // 4. Header Top Bar (Brand & Eyebrow)
      ctx.fillStyle = '#2DD4BF';
      ctx.font = '700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText('BUSINESS SCOPE IN YOUR CITY', 64, 82);

      ctx.fillStyle = '#64748B';
      ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('·   EMPIRICAL MARKET RESEARCH & UNIT ECONOMICS', 330, 82);

      // Scope Location Badge Top Right
      const locationText = (opp.city || opp.resolved_location || 'Pan-India Coverage').toUpperCase();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      const locWidth = ctx.measureText(locationText).width + 36;
      ctx.beginPath();
      ctx.roundRect(width - 64 - locWidth, 62, locWidth, 32, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.stroke();

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '750 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(locationText, width - 64 - locWidth + 18, 83);

      // 5. Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(64, 115);
      ctx.lineTo(width - 64, 115);
      ctx.stroke();

      // 6. Category Tag
      ctx.fillStyle = '#38BDF8';
      ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText((opp.category || 'B2B Services / MSME Automation').toUpperCase(), 64, 148);

      // 7. Opportunity Title (Wrapped if long)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '850 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const title = opp.title || 'Business Opportunity Blueprint';
      const words = title.split(' ');
      let line = '';
      let y = 192;
      const maxTitleWidth = width - 128;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTitleWidth && n > 0) {
          ctx.fillText(line.trim(), 64, y);
          line = words[n] + ' ';
          y += 42;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), 64, y);

      // 8. Four-Cell Unit Economics Matrix
      const matrixY = Math.max(y + 36, 280);
      const cellWidth = (width - 128 - 36) / 4;
      const cellHeight = 110;

      const cells = [
        { label: 'INDICATIVE CAPEX', val: opp.capex || (opp.budget_min ? `₹${(opp.budget_min/100000).toFixed(1)}L–₹${(opp.budget_max/100000).toFixed(1)}L` : '₹50K–₹4L'), color: '#2DD4BF' },
        { label: 'GROSS MARGIN', val: opp.margin || '55% – 70%', color: '#38BDF8' },
        { label: 'TARGET PAYBACK', val: opp.payback || '4 – 6 Months', color: '#F1F5F9' },
        { label: 'RISK PROFILE', val: opp.risk || 'Low–Med (3.4)', color: '#FCD34D' }
      ];

      cells.forEach((cell, idx) => {
        const cellX = 64 + idx * (cellWidth + 12);

        // Cell Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.beginPath();
        ctx.roundRect(cellX, matrixY, cellWidth, cellHeight, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#94A3B8';
        ctx.font = '750 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(cell.label, cellX + 16, matrixY + 32);

        // Value
        ctx.fillStyle = cell.color;
        ctx.font = '850 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(cell.val, cellX + 16, matrixY + 74);
      });

      // 9. Validation Sprint & Kill Gate Box
      const sprintY = matrixY + cellHeight + 20;
      const sprintHeight = 115;
      const sprintWidth = width - 128;

      ctx.fillStyle = 'rgba(13, 148, 136, 0.08)';
      ctx.beginPath();
      ctx.roundRect(64, sprintY, sprintWidth, sprintHeight, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Sprint Header
      ctx.fillStyle = '#2DD4BF';
      ctx.font = '800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('7-DAY FALSIFICATION SPRINT & KILL GATE', 84, sprintY + 30);

      const gateLabel = `Kill Criteria: ${opp.gate || 'Fewer than 3 signed LOIs'}`;
      ctx.fillStyle = '#F59E0B';
      ctx.font = '750 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const gateWidth = ctx.measureText(gateLabel).width;
      ctx.fillText(gateLabel, 64 + sprintWidth - 20 - gateWidth, sprintY + 30);

      // Sprint Text
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const sprintText = opp.sprint || 'Pitch 15 local industrial owners on a recurring compliance subscription. Verify minimum 3 paying pilots before writing software or signing office leases.';
      
      // Wrap Sprint Text
      let sLine = '';
      let sY = sprintY + 62;
      const sWords = sprintText.split(' ');
      for (let i = 0; i < sWords.length; i++) {
        const test = sLine + sWords[i] + ' ';
        if (ctx.measureText(test).width > sprintWidth - 40 && i > 0) {
          ctx.fillText(sLine.trim(), 84, sY);
          sLine = sWords[i] + ' ';
          sY += 24;
        } else {
          sLine = test;
        }
      }
      ctx.fillText(sLine.trim(), 84, sY);

      // 10. Footer Strip
      const footerY = height - 52;
      ctx.fillStyle = '#64748B';
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('businessscope.in  ·  Verified Local Opportunities Across 88+ Indian Cities', 64, footerY);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '750 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Scan or Visit to Access 90-Day Execution Blueprint →', width - 440, footerY);
    },

    /**
     * Opens the interactive Viral Share Modal with real-time preview and export actions.
     */
    openShareModal(opp) {
      // Remove any pre-existing modal
      const existing = document.getElementById('viral-share-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'viral-share-modal';
      modal.className = 'viral-modal-backdrop';
      modal.innerHTML = `
        <div class="viral-modal-container" role="dialog" aria-labelledby="viral-modal-title">
          <div class="viral-modal-header">
            <div>
              <span class="viral-modal-kicker">VIRAL DEAL-FLOW EXPORT</span>
              <h3 id="viral-modal-title" class="viral-modal-title">Share Opportunity Intelligence Card</h3>
            </div>
            <button type="button" class="viral-modal-close" id="viral-modal-close-btn" aria-label="Close Share Modal">&times;</button>
          </div>

          <div class="viral-modal-body">
            <!-- Visual Card Preview Canvas -->
            <div class="viral-canvas-preview-wrap">
              <canvas id="viral-share-canvas" class="viral-share-canvas" width="1200" height="675"></canvas>
              <div class="viral-canvas-badge">Ready for WhatsApp / LinkedIn / Twitter</div>
            </div>

            <!-- Quick Action Transmission Buttons -->
            <div class="viral-actions-grid">
              <button type="button" class="btn btn-viral-wa" id="viral-wa-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.58 2.007.92 2.791.92 3.182 0 5.77-2.587 5.77-5.766.001-3.183-2.585-5.768-5.77-5.768zm0 10.375c-.752 0-1.748-.287-2.431-.722l-.174-.11-1.58.414.423-1.542-.119-.19c-.482-.767-.743-1.603-.742-2.459.001-2.463 2.005-4.468 4.623-4.468 2.463 0 4.47 2.005 4.47 4.469 0 2.462-2.007 4.468-4.47 4.468zm2.607-3.328c-.143-.072-.846-.417-.977-.465-.131-.048-.226-.072-.321.072-.095.143-.369.465-.452.56-.083.096-.167.108-.31.036-.143-.072-.604-.223-1.15-.71-.426-.38-.713-.85-.796-.993-.083-.143-.009-.22.063-.292.065-.064.143-.167.214-.25.071-.084.095-.143.143-.238.048-.096.024-.18-.012-.251-.036-.072-.321-.774-.44-1.06-.116-.279-.234-.241-.321-.246-.083-.004-.179-.005-.274-.005-.095 0-.25.036-.381.18-.131.143-.5 488-.5 1.19s.512 1.381.583 1.477c.071.096 1.008 1.539 2.442 2.158.341.147.607.235.815.301.343.109.655.094.902.057.275-.041.846-.346.965-.68.119-.333.119-.619.083-.679-.036-.06-.131-.096-.274-.168z"/>
                </svg>
                <span>Share to WhatsApp Chat</span>
              </button>

              <button type="button" class="btn btn-viral-download" id="viral-download-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download High-Res Card (PNG)</span>
              </button>

              <button type="button" class="btn btn-viral-linkedin" id="viral-linkedin-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.81a1.45 1.45 0 0 0-1.45 1.45 1.45 1.45 0 0 0 1.45 1.45 1.45 1.45 0 0 0 1.45-1.45 1.45 1.45 0 0 0-1.45-1.45Z"/>
                </svg>
                <span>Copy LinkedIn Post Hook</span>
              </button>

              <button type="button" class="btn btn-viral-link" id="viral-copy-link-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <span>Copy Direct Dossier URL</span>
              </button>
            </div>

            <!-- Toast alert inside modal -->
            <div id="viral-toast" class="viral-toast" hidden></div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Render the visual canvas card
      const canvas = document.getElementById('viral-share-canvas');
      ViralShare.drawCanvasCard(canvas, opp);

      // Event Listeners
      const closeBtn = document.getElementById('viral-modal-close-btn');
      closeBtn.addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });

      function showToast(msg) {
        const toast = document.getElementById('viral-toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.hidden = false;
        setTimeout(() => { toast.hidden = true; }, 3200);
      }

      // WhatsApp Share
      document.getElementById('viral-wa-btn').addEventListener('click', () => {
        const text = ViralShare.formatWhatsAppText(opp);
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
      });

      // Download PNG Card
      document.getElementById('viral-download-btn').addEventListener('click', () => {
        const link = document.createElement('a');
        const slug = opp.slug || 'business-opportunity';
        link.download = `${slug}-opportunity-card.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('✓ Card image downloaded! Attach it to your WhatsApp status or LinkedIn post.');
      });

      // LinkedIn Hook Copy
      document.getElementById('viral-linkedin-btn').addEventListener('click', async () => {
        const text = ViralShare.formatLinkedInText(opp);
        try {
          await navigator.clipboard.writeText(text);
          showToast('✓ LinkedIn post text copied to clipboard! Paste it directly into your post.');
        } catch (e) {
          showToast('Failed to copy. Please allow clipboard permissions.');
        }
      });

      // Direct Link Copy
      document.getElementById('viral-copy-link-btn').addEventListener('click', async () => {
        const url = opp.url || window.location.href.split('#')[0];
        const shareUrl = url.includes('?') 
          ? `${url}&utm_source=direct_copy&utm_medium=viral_share`
          : `${url}?utm_source=direct_copy&utm_medium=viral_share`;
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast('✓ Link copied to clipboard with viral tracking!');
        } catch (e) {
          showToast('Failed to copy link.');
        }
      });
    }
  };

  window.ViralShare = ViralShare;
})();
