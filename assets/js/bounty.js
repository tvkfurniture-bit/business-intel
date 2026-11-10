/**
 * Business Scope in Your City — Local Gap Bounty Submission Handler
 */
(function() {
  'use strict';

  function init() {
    const form = document.getElementById('bounty-submission-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('bounty-name');
      const phoneInput = document.getElementById('bounty-phone');
      const emailInput = document.getElementById('bounty-email');
      const cityInput = document.getElementById('bounty-city');
      const categorySelect = document.getElementById('bounty-category');
      const gapTitleInput = document.getElementById('bounty-gap-title');
      const workaroundInput = document.getElementById('bounty-workaround');
      const buyerInput = document.getElementById('bounty-buyer-profile');
      const termsCheckbox = document.getElementById('bounty-terms');
      const feedbackEl = document.getElementById('bounty-feedback');
      const submitBtn = document.getElementById('btn-submit-bounty');

      if (feedbackEl) {
        feedbackEl.hidden = true;
        feedbackEl.textContent = '';
      }

      const name = (nameInput ? nameInput.value : '').trim();
      const phone = (phoneInput ? phoneInput.value : '').trim();
      const email = (emailInput ? emailInput.value : '').trim();
      const city = (cityInput ? cityInput.value : '').trim();
      const category = (categorySelect ? categorySelect.value : '').trim();
      const gapTitle = (gapTitleInput ? gapTitleInput.value : '').trim();
      const workaround = (workaroundInput ? workaroundInput.value : '').trim();
      const buyerProfile = (buyerInput ? buyerInput.value : '').trim();

      if (!name || !phone || !email || !city || !category || !gapTitle || !workaround || !buyerProfile) {
        showError('Please complete all required fields with accurate details.');
        return;
      }

      if (!termsCheckbox || !termsCheckbox.checked) {
        showError('Please confirm the Contributor Research terms to qualify for the 25% royalty.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Transmitting Bounty to Analyst Desk...';
      }

      try {
        const payload = {
          enquiry_type: 'Local Gap Bounty',
          customer_name: name,
          customer_email: email,
          phone: phone,
          city: city,
          state: 'Regional Industrial Pocket',
          budget_range: 'Bounty Submission',
          business_interest: gapTitle,
          requested_deliverable: '25% Royalty Contributor Submission',
          message: `[Category]: ${category}\n[Workaround]: ${workaround}\n[Target Buyers]: ${buyerProfile}\n[Phone UPI]: ${phone}`,
          consent_status: true,
          timestamp: new Date().toISOString()
        };

        const res = await API.post('submit_enquiry', payload);
        const refId = (res && res.enquiry_id) ? res.enquiry_id : ('BS-BTY-' + Math.floor(100000 + Math.random() * 900000));

        // Switch to success view
        const formContainer = document.getElementById('bounty-form-container');
        const successView = document.getElementById('bounty-success-view');
        const refEl = document.getElementById('bounty-ref-code');
        const waShareBtn = document.getElementById('btn-share-bounty-wa');

        if (formContainer) formContainer.hidden = true;
        if (refEl) refEl.textContent = refId;
        if (successView) {
          successView.hidden = false;
          successView.scrollIntoView({ behavior: 'smooth' });
        }

        if (waShareBtn) {
          waShareBtn.addEventListener('click', () => {
            const shareText = `*I just reported a local business gap in ${city} on Business Scope!* 🔍\n\n` +
              `Opportunity: *${gapTitle}*\n` +
              `Sector: ${category}\n` +
              `Status: Under field analyst review (Ref: ${refId})\n\n` +
              `Do local businesses face this problem in your area too? Submit your city's unmet gaps:\n` +
              `${window.location.origin}/pages/bounty/index.html?utm_source=whatsapp&utm_medium=bounty_referral`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
          });
        }

      } catch (err) {
        showError('Transmission failed: ' + err.message + '. Please check your connection and retry.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Transmit Opportunity Bounty →';
        }
      }
    });

    function showError(msg) {
      const feedbackEl = document.getElementById('bounty-feedback');
      if (feedbackEl) {
        feedbackEl.className = 'form-feedback error';
        feedbackEl.textContent = msg;
        feedbackEl.hidden = false;
        feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
