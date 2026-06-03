/**
 * Cashfree Payment Service
 *
 * Handles all Cashfree REST API interactions for the hosted checkout flow.
 * Uses direct HTTP calls (no SDK) for full control and zero dependency risk.
 *
 * API Docs: https://www.cashfree.com/docs/payments/online/web/redirect
 * API Reference: https://docs.cashfree.com/reference/pgcreateorder
 */

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = (process.env.CASHFREE_ENV || "SANDBOX").toUpperCase();

const BASE_URL =
  CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const API_VERSION = "2025-01-01";

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:8080";

// ─── Pricing Table ─────────────────────────────────────────
const PRICING = {
  basic: { monthly: 199, yearly: 1910 },
  startup: { monthly: 999, yearly: 9590 },
};

/**
 * Returns the price in INR for a given tier and billing period.
 */
function getPriceForTier(tier, period = "monthly") {
  const tierPricing = PRICING[tier];
  if (!tierPricing) throw new Error(`Invalid tier: ${tier}`);
  const price = tierPricing[period];
  if (!price) throw new Error(`Invalid period: ${period}`);
  return price;
}

/**
 * Returns scan limit for each tier.
 */
function getLimitFromTier(tier) {
  if (tier === "basic") return 100;
  if (tier === "startup") return 1000;
  if (tier === "enterprise") return 999999;
  return 5; // free = 5 scans/month
}

/**
 * Returns the plan duration in days based on billing period.
 */
function getPlanDurationDays(period) {
  return period === "yearly" ? 365 : 30;
}

// ─── API Helpers ───────────────────────────────────────────

function getHeaders() {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error(
      "CASHFREE_APP_ID and CASHFREE_SECRET_KEY must be set in environment variables"
    );
  }
  return {
    "Content-Type": "application/json",
    "x-api-version": API_VERSION,
    "x-client-id": CASHFREE_APP_ID,
    "x-client-secret": CASHFREE_SECRET_KEY,
  };
}

/**
 * Creates a Cashfree order via the REST API.
 * Returns the payment_session_id and payment link for redirect.
 *
 * @param {string} userId - Internal user ID
 * @param {string} userEmail - User's email
 * @param {string} tier - Plan tier: "basic" | "startup"
 * @param {string} period - "monthly" | "yearly"
 * @returns {{ orderId, paymentSessionId, paymentLink }}
 */
async function createCashfreeOrder(userId, userEmail, tier, period = "monthly") {
  const amount = getPriceForTier(tier, period);
  const orderId = `sentinel_${tier}_${Date.now()}_${userId.substring(0, 8)}`;

  const returnUrl = `${FRONTEND_URL}/settings?tab=billing&order_id=${orderId}`;

  const body = {
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: userId.substring(0, 50), // Cashfree max 50 chars
      customer_email: userEmail,
      customer_phone: "9999999999", // placeholder, Cashfree requires phone
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: null, // No webhook for now; we verify server-side
    },
    order_note: `CodeAurora Sentinel - ${tier} plan (${period})`,
    order_tags: {
      user_id: userId,
      tier: tier,
      period: period,
    },
  };

  console.log(`💳 Creating Cashfree order: ${orderId} (₹${amount}, ${tier}/${period})`);

  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Cashfree create order error:", data);
    throw new Error(
      data.message || data.error || `Cashfree API error: ${res.status}`
    );
  }

  console.log(`✅ Cashfree order created: ${orderId}, session: ${data.payment_session_id}`);

  return {
    orderId: data.cf_order_id || orderId,
    paymentSessionId: data.payment_session_id,
    // Build the hosted checkout redirect link
    paymentLink: `${BASE_URL.replace("/pg", "")}/pg/orders/sessions/${data.payment_session_id}`,
  };
}

/**
 * Verifies an order's payment status directly with Cashfree.
 *
 * SECURITY: Never trust the frontend redirect alone.
 * Always call this from the backend to confirm the order is actually PAID.
 *
 * @param {string} orderId - The order_id to verify
 * @returns {{ orderStatus, orderAmount, orderId, tier, period }}
 */
async function verifyCashfreeOrder(orderId) {
  console.log(`🔍 Verifying Cashfree order: ${orderId}`);

  const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Cashfree verify order error:", data);
    throw new Error(
      data.message || data.error || `Cashfree verify error: ${res.status}`
    );
  }

  console.log(`📋 Cashfree order status: ${data.order_status} (₹${data.order_amount})`);

  return {
    orderStatus: data.order_status, // "PAID" | "ACTIVE" | "EXPIRED" | etc.
    orderAmount: data.order_amount,
    orderId: data.order_id,
    cfOrderId: data.cf_order_id,
    tier: data.order_tags?.tier || null,
    period: data.order_tags?.period || null,
  };
}

module.exports = {
  createCashfreeOrder,
  verifyCashfreeOrder,
  getLimitFromTier,
  getPriceForTier,
  getPlanDurationDays,
};
