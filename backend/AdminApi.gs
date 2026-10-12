/**
 * Business Scope in Your City — Administrative Mutation API
 * Strictly enforces identity allowlisting via Session.getActiveUser().getEmail()
 * to protect editorial database updates and order reconciliations.
 */

const AdminApi = (function() {
  'use strict';

  /**
   * Retrieve list of authorized administrator emails from Script Properties.
   * @returns {Array<string>}
   */
  function getAuthorizedAdminEmails_() {
    const props = PropertiesService.getScriptProperties();
    const emailsStr = props.getProperty('ADMIN_EMAILS') || '';
    return emailsStr
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
  }

  /**
   * Verify whether the current Google session belongs to an authorized admin.
   * Throws 403 Security Exception if caller fails authorization.
   */
  function assertAdminAuthorized_() {
    const activeUser = Session.getActiveUser().getEmail().trim().toLowerCase();
    const authorizedList = getAuthorizedAdminEmails_();

    if (!activeUser || !authorizedList.includes(activeUser)) {
      Database.logAudit('UNAUTHORIZED_ADMIN_ATTEMPT', activeUser || 'anonymous', 'AdminApi', 'Access Denied 403');
      throw new Error('403 Forbidden: Operation requires authorized administrator privileges.');
    }

    return activeUser;
  }

  /**
   * Reconcile customer order payment status (e.g. mark as Paid once UTR clears bank).
   * @param {string} orderId
   * @param {string} newStatus 'Paid' | 'Rejected' | 'Refunded'
   * @param {string} [notes]
   * @returns {Object}
   */
  function reconcileOrderPayment(orderId, newStatus, notes = '') {
    const adminUser = assertAdminAuthorized_();
    const sheet = Database.getSheet(Database.SHEETS.ORDERS);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return { status: 'error', message: 'Orders worksheet is empty.' };
    }

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idCol = headers.indexOf('order_id');
    const statusCol = headers.indexOf('payment_status');
    const notesCol = headers.indexOf('notes');

    let foundRow = -1;
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idCol]).trim().toUpperCase() === String(orderId).trim().toUpperCase()) {
        foundRow = r + 1; // 1-indexed sheet row
        break;
      }
    }

    if (foundRow === -1) {
      return { status: 'error', message: `Order ${orderId} not found.` };
    }

    const cleanStatus = Validation.sanitizeText(newStatus, 30);
    sheet.getRange(foundRow, statusCol + 1).setValue(cleanStatus);

    if (notesCol !== -1 && notes) {
      sheet.getRange(foundRow, notesCol + 1).setValue(Validation.sanitizeText(notes, 500));
    }

    Database.logAudit('RECONCILE_ORDER', adminUser, orderId, { status: cleanStatus, notes: notes });

    return {
      status: 'success',
      order_id: orderId,
      updated_status: cleanStatus
    };
  }

  /**
   * Publish or Unpublish an opportunity.
   * @param {string} opportunityId
   * @param {string} targetStatus 'Published' | 'Draft' | 'Archived'
   * @returns {Object}
   */
  function setOpportunityStatus(opportunityId, targetStatus) {
    const adminUser = assertAdminAuthorized_();
    const sheet = Database.getSheet(Database.SHEETS.OPPORTUNITIES);
    const data = sheet.getDataRange().getValues();

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idCol = headers.indexOf('opportunity_id');
    const statusCol = headers.indexOf('status');

    let foundRow = -1;
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idCol]).trim() === String(opportunityId).trim()) {
        foundRow = r + 1;
        break;
      }
    }

    if (foundRow === -1) {
      return { status: 'error', message: `Opportunity ${opportunityId} not found.` };
    }

    const cleanStatus = Validation.sanitizeText(targetStatus, 30);
    sheet.getRange(foundRow, statusCol + 1).setValue(cleanStatus);

    Database.logAudit('UPDATE_OPPORTUNITY_STATUS', adminUser, opportunityId, { status: cleanStatus });

    return {
      status: 'success',
      opportunity_id: opportunityId,
      new_status: cleanStatus
    };
  }

  return {
    assertAdminAuthorized: assertAdminAuthorized_,
    reconcileOrderPayment: reconcileOrderPayment,
    setOpportunityStatus: setOpportunityStatus
  };
})();
