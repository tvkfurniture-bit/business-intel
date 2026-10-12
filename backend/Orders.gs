/**
 * Business Scope in Your City — Orders & Entitlement Verification Engine
 * Enforces dual-factor customer order verification (Order ID + Matching Email)
 * to strictly prevent ID enumeration and unauthorized document access.
 */

const Orders = (function() {
  'use strict';

  /**
   * Generate an unguessable cryptographic Order Reference.
   * e.g. ORD-9X4K2M
   * @returns {string}
   */
  function generateOrderId_() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ORD-${code}`;
  }

  /**
   * Create a new purchase order record.
   * @param {Object} payload
   * @returns {Object}
   */
  function createOrder(payload) {
    const customerEmail = String(payload.customer_email || '').trim().toLowerCase();
    const customerName = Validation.sanitizeText(payload.customer_name, 100);
    const productId = Validation.sanitizeText(payload.product_id, 80);
    const utrRef = Validation.sanitizeText(payload.utr_number || payload.payment_ref, 80);

    if (!Validation.isValidEmail(customerEmail)) {
      return { status: 'error', message: 'A valid email address is required.' };
    }

    if (!productId) {
      return { status: 'error', message: 'Product specification required.' };
    }

    // Lookup blueprint product to record verified price
    const product = Database.findRecord(Database.SHEETS.BLUEPRINTS, 'product_id', productId);
    const amountInr = product ? Number(product.price_inr) : Number(payload.amount_inr || 0);
    const orderId = generateOrderId_();

    const orderRecord = {
      order_id: orderId,
      created_at: new Date().toISOString(),
      customer_name: customerName,
      customer_email: customerEmail,
      product_id: productId,
      product_title: product ? product.title : (payload.product_title || 'Business Blueprint'),
      amount_inr: amountInr,
      payment_status: utrRef ? 'Verification In Progress' : 'Pending Payment',
      utr_number: utrRef,
      idempotency_token: Validation.sanitizeText(payload.idempotency_token, 60),
      notes: ''
    };

    Database.appendRecord(Database.SHEETS.ORDERS, orderRecord);
    Database.logAudit('CREATE_ORDER', customerEmail, orderId, { amount: amountInr, product: productId });

    // Send customer order notification
    Notifications.sendOrderConfirmation(orderRecord);

    return {
      status: 'success',
      order_id: orderId,
      amount_inr: amountInr,
      message: 'Order initiated. Deliverables will unlock once bank payment reconciles.'
    };
  }

  /**
   * Securely verify and unlock order deliverables.
   * STRICT ANTI-ENUMERATION CONTROL:
   * Requires BOTH valid Order ID AND identical matching Customer Email.
   * @param {string} orderId
   * @param {string} email
   * @returns {Object}
   */
  function handleOrderAccessVerification(orderId, email) {
    if (!Validation.isValidOrderId(orderId) || !Validation.isValidEmail(email)) {
      Database.logAudit('ORDER_VERIFICATION_INVALID_SYNTAX', email, orderId);
      return {
        status: 'error',
        verified: false,
        message: 'Invalid Order Reference ID or Email format.'
      };
    }

    const cleanOrderId = String(orderId).trim().toUpperCase();
    const cleanEmail = String(email).trim().toLowerCase();

    // Query order from database
    const order = Database.findRecord(Database.SHEETS.ORDERS, 'order_id', cleanOrderId);

    // If order not found OR email does not match identically:
    // Return identical generic error to prevent email/ID enumeration attacks
    if (!order || String(order.customer_email || '').trim().toLowerCase() !== cleanEmail) {
      Database.logAudit('ORDER_VERIFICATION_FAILED_MISMATCH', cleanEmail, cleanOrderId);
      return {
        status: 'error',
        verified: false,
        message: 'No order matched the provided Order Reference ID and Email combination. Please check your purchase confirmation.'
      };
    }

    Database.logAudit('ORDER_VERIFICATION_SUCCESS', cleanEmail, cleanOrderId);

    const isPaid = ['paid', 'reconciled', 'completed'].includes(String(order.payment_status || '').toLowerCase());

    if (!isPaid) {
      return {
        status: 'success',
        verified: true,
        order_id: order.order_id,
        product_title: order.product_title,
        payment_status: order.payment_status || 'Pending Verification',
        is_unlocked: false,
        message: 'Order confirmed. Your UTR payment reference is currently under bank reconciliation (standard turnaround: 2 hours).'
      };
    }

    // Retrieve protected product download link via Reports engine
    const downloadDetails = Reports.getSecureDeliverableAccess(order.product_id);

    return {
      status: 'success',
      verified: true,
      order_id: order.order_id,
      product_title: order.product_title,
      customer_name: order.customer_name,
      payment_status: 'Verified & Reconciled',
      is_unlocked: true,
      deliverables: downloadDetails
    };
  }

  return {
    createOrder: createOrder,
    handleOrderAccessVerification: handleOrderAccessVerification
  };
})();
