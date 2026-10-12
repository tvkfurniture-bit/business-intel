/**
 * Business Scope in Your City — Email Notification Service
 * Dispatches automated order confirmations, inquiry reference receipts,
 * and security alerts using MailApp.
 */

const Notifications = (function() {
  'use strict';

  const BRAND_NAME = 'Business Scope in Your City';
  const SUPPORT_EMAIL = 'research@businessscopeinyourcity.in';

  /**
   * Dispatch purchase order confirmation email with UTR tracking details.
   * @param {Object} order
   */
  function sendOrderConfirmation(order) {
    if (!order || !order.customer_email) return;

    try {
      const subject = `[${order.order_id}] Order Confirmation & Verification Status — ${BRAND_NAME}`;
      const body = `Dear ${order.customer_name || 'Customer'},\n\n`
        + `Thank you for your order on ${BRAND_NAME}.\n\n`
        + `ORDER DETAILS:\n`
        + `--------------------------------------------------\n`
        + `Order Reference ID: ${order.order_id}\n`
        + `Product: ${order.product_title}\n`
        + `Amount: INR ${Number(order.amount_inr).toLocaleString('en-IN')}\n`
        + `Status: ${order.payment_status}\n`
        + `--------------------------------------------------\n\n`
        + `HOW TO ACCESS YOUR DELIVERABLES:\n`
        + `Once your UTR payment is verified by our accounts desk, your deliverables will be immediately accessible via our purchase portal:\n`
        + `https://businessscopeinyourcity.in/pages/account/\n\n`
        + `You will need both your Order ID (${order.order_id}) and this email address (${order.customer_email}) to unlock your download files.\n\n`
        + `Warm regards,\n`
        + `Accounts & Research Desk\n`
        + `${BRAND_NAME}\n`
        + `${SUPPORT_EMAIL}\n`;

      MailApp.sendEmail({
        to: order.customer_email,
        subject: subject,
        body: body,
        name: BRAND_NAME
      });
    } catch (e) {
      console.warn('Order confirmation email notice failed:', e.message);
    }
  }

  /**
   * Dispatch research desk inquiry acknowledgment with tracking reference.
   * @param {Object} enquiry
   */
  function sendEnquiryAcknowledgement(enquiry) {
    if (!enquiry || !enquiry.customer_email) return;

    try {
      const subject = `[${enquiry.enquiry_id}] Research Inquiry Logged — ${BRAND_NAME}`;
      const body = `Dear ${enquiry.customer_name || 'Inquirer'},\n\n`
        + `Your inquiry has been successfully recorded in our municipal research database.\n\n`
        + `INQUIRY SUMMARY:\n`
        + `--------------------------------------------------\n`
        + `Ticket Reference: ${enquiry.enquiry_id}\n`
        + `Category: ${enquiry.enquiry_type}\n`
        + `City/State: ${enquiry.city}, ${enquiry.state}\n`
        + `--------------------------------------------------\n\n`
        + `A research analyst will evaluate your parameters and reply within 24 to 48 business hours.\n\n`
        + `Warm regards,\n`
        + `Research Desk\n`
        + `${BRAND_NAME}\n`;

      MailApp.sendEmail({
        to: enquiry.customer_email,
        subject: subject,
        body: body,
        name: BRAND_NAME
      });
    } catch (e) {
      console.warn('Enquiry acknowledgment email failed:', e.message);
    }
  }

  return {
    sendOrderConfirmation: sendOrderConfirmation,
    sendEnquiryAcknowledgement: sendEnquiryAcknowledgement
  };
})();
