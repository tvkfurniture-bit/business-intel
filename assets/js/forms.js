/**
 * Business Scope in Your City — Forms & Validation Engine
 * Unified client-side validation, duplicate submission protection,
 * and asynchronous communication with the Google Apps Script backend.
 */

const FormManager = (function() {
  'use strict';

  // Email regex compliant with RFC 5322 validation standard
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  /**
   * Validate email address syntax.
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim().toLowerCase());
  }

  /**
   * Sanitize text input to prevent basic script injection.
   * @param {string} text
   * @returns {string}
   */
  function sanitizeInput(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/<[^>]*>?/gm, '').trim();
  }

  /**
   * Display an inline alert message inside a specified feedback element.
   * @param {HTMLElement} element Target container
   * @param {string} message Text message
   * @param {'error'|'success'|'info'} type Alert style
   */
  function showFeedback(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `form-feedback form-feedback-${type}`;
    element.hidden = false;
  }

  /**
   * Reset feedback alert container.
   * @param {HTMLElement} element Target container
   */
  function clearFeedback(element) {
    if (!element) return;
    element.textContent = '';
    element.hidden = true;
  }

  /**
   * Set loading state on a form submit button to prevent double-submissions.
   * @param {HTMLButtonElement} button
   * @param {boolean} isLoading
   * @param {string} loadingText
   * @param {string} defaultText
   */
  function setButtonLoading(button, isLoading, loadingText, defaultText) {
    if (!button) return;
    button.disabled = isLoading;
    if (isLoading) {
      button.setAttribute('data-original-text', button.innerHTML);
      button.innerHTML = `<span>${loadingText || 'Processing Request...'}</span>`;
    } else {
      const original = button.getAttribute('data-original-text');
      button.innerHTML = defaultText || original || 'Submit';
    }
  }

  /**
   * Initialize Global Form Listeners on DOMContentLoaded.
   */
  function init() {
    initNewsletterForms();
    initContactForm();
    initCorrectionForm();
  }

  /**
   * 1. Newsletter Subscription Forms (Homepage and Global Footers)
   */
  function initNewsletterForms() {
    const newsletterForms = document.querySelectorAll('#newsletter-form, #homepage-newsletter-form');

    newsletterForms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        const consentCheckbox = form.querySelector('input[type="checkbox"]');
        let feedbackEl = form.querySelector('.form-feedback') || document.getElementById('newsletter-msg');

        if (!emailInput) return;

        const email = emailInput.value.trim();

        // Consent verification if checkbox exists
        if (consentCheckbox && !consentCheckbox.checked) {
          showFeedback(feedbackEl, 'Please check the box to consent to receiving weekly research updates.', 'error');
          return;
        }

        if (!isValidEmail(email)) {
          showFeedback(feedbackEl, 'Please enter a valid business email address.', 'error');
          return;
        }

        clearFeedback(feedbackEl);
        setButtonLoading(submitBtn, true, 'Subscribing...', 'Subscribe Free');

        try {
          const response = await API.post('subscribe_newsletter', { email: email });

          if (response && response.status === 'success') {
            showFeedback(feedbackEl, '✓ Successfully subscribed to weekly market intelligence!', 'success');
            form.reset();
          } else {
            throw new Error((response && response.message) ? response.message : 'Subscription request failed.');
          }
        } catch (err) {
          showFeedback(feedbackEl, 'Error: ' + err.message, 'error');
        } finally {
          setButtonLoading(submitBtn, false);
        }
      });
    });
  }

  /**
   * 2. General Contact Desk Form (/contact/)
   */
  function initContactForm() {
    const contactForm = document.getElementById('contact-inquiry-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const cityInput = document.getElementById('contact-city');
      const stateSelect = document.getElementById('contact-state');
      const categorySelect = document.getElementById('contact-category');
      const messageInput = document.getElementById('contact-message');
      const consentCheckbox = document.getElementById('contact-consent');
      const errorBox = document.getElementById('contact-error-box');
      const submitBtn = document.getElementById('btn-submit-contact');

      clearFeedback(errorBox);

      // Validate Required Fields
      const name = sanitizeInput(nameInput ? nameInput.value : '');
      const email = sanitizeInput(emailInput ? emailInput.value : '');
      const city = sanitizeInput(cityInput ? cityInput.value : '');
      const state = stateSelect ? stateSelect.value : '';
      const category = categorySelect ? categorySelect.value : '';
      const message = sanitizeInput(messageInput ? messageInput.value : '');

      if (!name || !email || !city || !state || !category || !message) {
        showFeedback(errorBox, 'Please complete all required fields.', 'error');
        return;
      }

      if (!isValidEmail(email)) {
        showFeedback(errorBox, 'Please provide a valid email address for communications.', 'error');
        return;
      }

      if (consentCheckbox && !consentCheckbox.checked) {
        showFeedback(errorBox, 'You must provide consent for inquiry processing.', 'error');
        return;
      }

      setButtonLoading(submitBtn, true, 'Logging Inquiry...', 'Transmit Inquiry');

      try {
        const payload = {
          enquiry_type: category,
          customer_name: name,
          customer_email: email,
          city: city,
          state: state,
          budget_range: 'N/A',
          business_interest: category,
          requested_deliverable: 'General Contact Inquiry',
          message: message,
          consent_status: true
        };

        const res = await API.post('submit_enquiry', payload);

        if (res && res.status === 'success' && res.enquiry_id) {
          // Hide form and display verified success reference
          contactForm.hidden = true;
          const header = document.querySelector('.form-card-header');
          if (header) header.hidden = true;

          const successView = document.getElementById('contact-success-view');
          if (successView) {
            document.getElementById('contact-display-ref').textContent = res.enquiry_id;
            document.getElementById('contact-display-email').textContent = email;
            successView.hidden = false;
            successView.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          throw new Error((res && res.message) ? res.message : 'Database recording failure.');
        }
      } catch (err) {
        showFeedback(errorBox, 'Transmission failed: ' + err.message + '. Please retry.', 'error');
        setButtonLoading(submitBtn, false);
      }
    });
  }

  /**
   * 3. Editorial Correction Form (/methodology/)
   */
  function initCorrectionForm() {
    const corrForm = document.getElementById('correction-form');
    if (!corrForm) return;

    corrForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const urlInput = document.getElementById('corr-url');
      const detailsInput = document.getElementById('corr-details');
      const emailInput = document.getElementById('corr-email');
      const feedbackEl = document.getElementById('corr-feedback');
      const submitBtn = document.getElementById('corr-submit-btn');

      clearFeedback(feedbackEl);

      const oppRef = sanitizeInput(urlInput ? urlInput.value : '');
      const details = sanitizeInput(detailsInput ? detailsInput.value : '');
      const email = sanitizeInput(emailInput ? emailInput.value : '');

      if (!oppRef || !details || !email) {
        showFeedback(feedbackEl, 'Please fill out all required correction fields.', 'error');
        return;
      }

      if (!isValidEmail(email)) {
        showFeedback(feedbackEl, 'Please enter a valid email address.', 'error');
        return;
      }

      setButtonLoading(submitBtn, true, 'Submitting...', 'Submit Correction for Analyst Review');

      try {
        const res = await API.post('submit_enquiry', {
          enquiry_type: 'Correction Report',
          customer_name: 'Editorial Contributor',
          customer_email: email,
          city: 'Editorial Desk',
          state: 'National',
          budget_range: 'N/A',
          business_interest: oppRef,
          requested_deliverable: 'Data Correction',
          message: details,
          consent_status: true
        });

        if (res && res.status === 'success') {
          showFeedback(feedbackEl, `✓ Correction logged under reference ${res.enquiry_id || ''}. Our editorial team will review the verified source.`, 'success');
          corrForm.reset();
        } else {
          throw new Error((res && res.message) ? res.message : 'Submission failed.');
        }
      } catch (err) {
        showFeedback(feedbackEl, 'Error: ' + err.message, 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  // Public Interface
  return {
    init,
    isValidEmail,
    sanitizeInput,
    showFeedback,
    clearFeedback,
    setButtonLoading
  };
})();

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', FormManager.init);
