/**
 * Business Scope in Your City — Input Validation & Sanitization Engine
 * Neutralizes Google Sheets formula injection, enforces length bounds,
 * and validates strict syntactic constraints.
 */

const Validation = (function() {
  'use strict';

  // RFC 5322 Compliant Email Validation Regex
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  // Standard Order Reference Regex (e.g. ORD-B7K9X2, ORD-20261012-99)
  const ORDER_ID_REGEX = /^ORD-[A-Z0-9_-]{5,20}$/i;

  // Formula injection prefix characters for Google Sheets / Excel
  const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

  /**
   * Neutralize Google Sheets formula injection (CSV/Spreadsheet Injection attack).
   * Prepends a single quote (') if the text begins with a dangerous operator.
   * @param {*} val
   * @returns {*}
   */
  function neutralizeFormula_(val) {
    if (typeof val !== 'string') return val;
    const trimmed = val.trim();
    if (trimmed.length > 0 && FORMULA_PREFIXES.includes(trimmed.charAt(0))) {
      return "'" + val;
    }
    return val;
  }

  /**
   * Sanitize text input: strip dangerous HTML/script tags, enforce max length,
   * and neutralize spreadsheet formula characters.
   * @param {string} text Raw user input
   * @param {number} [maxLength=1000] Maximum allowed characters
   * @returns {string}
   */
  function sanitizeText_(text, maxLength = 1000) {
    if (text === null || text === undefined) return '';
    let sanitized = String(text)
      .replace(/<[^>]*>?/gm, '') // Strip HTML tags
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); // Strip control characters

    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return neutralizeFormula_(sanitized.trim());
  }

  /**
   * Validate email address syntax.
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail_(email) {
    if (!email || typeof email !== 'string') return false;
    const normalized = email.trim().toLowerCase();
    return normalized.length <= 254 && EMAIL_REGEX.test(normalized);
  }

  /**
   * Validate customer Order Reference ID.
   * @param {string} orderId
   * @returns {boolean}
   */
  function isValidOrderId_(orderId) {
    if (!orderId || typeof orderId !== 'string') return false;
    return ORDER_ID_REGEX.test(orderId.trim());
  }

  /**
   * Validate positive currency or capex numbers.
   * @param {*} num
   * @returns {number|null}
   */
  function parsePositiveNumber_(num) {
    const parsed = Number(num);
    return (!isNaN(parsed) && parsed >= 0) ? parsed : null;
  }

  /**
   * Filter and sanitize an incoming payload against an explicit whitelist of allowed keys.
   * @param {Object} rawObject
   * @param {Array<string>} allowedKeys
   * @returns {Object}
   */
  function filterAllowedFields_(rawObject, allowedKeys) {
    if (!rawObject || typeof rawObject !== 'object') return {};
    const filtered = {};
    allowedKeys.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(rawObject, key)) {
        filtered[key] = sanitizeText_(rawObject[key]);
      }
    });
    return filtered;
  }

  return {
    sanitizeText: sanitizeText_,
    neutralizeFormula: neutralizeFormula_,
    isValidEmail: isValidEmail_,
    isValidOrderId: isValidOrderId_,
    parsePositiveNumber: parsePositiveNumber_,
    filterAllowedFields: filterAllowedFields_
  };
})();
