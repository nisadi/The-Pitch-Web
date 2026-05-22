/**
 * POST /api/payments/session-pay
 *
 * Initiates a WebXPay Session Pay (3DS) transaction.
 * Mirrors the Spring Boot callSessionPayAPI logic from Engineering_pro.
 *
 * Request body:
 *   { session, amount, currency, customer, bookingRef }
 *
 * Response:
 *   { html3ds_url } on success (browser should redirect there)
 *   { error, explanation } on failure
 */

const WEBXPAY_BASE_URL = process.env.WEBXPAY_BASE_URL;
const WEBXPAY_USERNAME = process.env.WEBXPAY_USERNAME;
const WEBXPAY_PASSWORD = process.env.WEBXPAY_PASSWORD;
const WEBXPAY_BANK_MID = process.env.WEBXPAY_BANK_MID;

/** Authenticates with WebXPay and returns the bearer token. */
async function getWebXPayToken() {
  const res = await fetch(`${WEBXPAY_BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: WEBXPAY_USERNAME,
      password: WEBXPAY_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`WebXPay auth failed: ${res.status}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error('WebXPay auth: no token in response');
  return data.token;
}

/** Generates a unique merchant order reference (e.g. TPB-2026-00042). */
function generateOrderRef() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `TPB-${year}-${rand}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { session, amount, currency = 'LKR', customer, bookingRef } = body;

    if (!session || !amount || !customer) {
      return Response.json(
        { error: 'MISSING_FIELDS', explanation: 'session, amount and customer are required.' },
        { status: 400 }
      );
    }

    // 1. Get bearer token
    const token = await getWebXPayToken();

    // 2. Build the 3DS redirect URL — bank will POST back to /checkout with ?result3ds=...
    const origin =
      request.headers.get('origin') ||
      request.headers.get('referer')?.replace(/\/[^/]*$/, '') ||
      'http://localhost:3000';

    const secure3dResponseURL = `${origin}/checkout`;

    // 3. Generate order number
    const orderNumber = bookingRef || generateOrderRef();

    // 4. Build session-pay payload (mirrors SessionPayRequestDTO from Engineering_pro)
    const payload = {
      session,
      amount,
      orderNumber,
      currency,
      bankMID: WEBXPAY_BANK_MID,
      secure3dResponseURL,
      customer: {
        id: customer.id || '',
        email: customer.email || '',
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        contactNumber: customer.contactNumber || '',
        addressLineOne: customer.addressLineOne || '',
        city: customer.city || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'Sri Lanka',
      },
    };

    // 5. Call WebXPay session-pay endpoint
    const wxRes = await fetch(`${WEBXPAY_BASE_URL}/cards/pay/session3ds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const wxData = await wxRes.json();

    if (!wxRes.ok) {
      return Response.json(
        { error: 'WEBXPAY_ERROR', explanation: wxData?.explanation || 'Payment initiation failed.' },
        { status: wxRes.status }
      );
    }

    // 6. Return the 3DS HTML or redirect URL to the frontend
    return Response.json({
      success: !wxData.error,
      html3ds_url: wxData.html3ds_url || wxData.html3dsUrl || null,
      html3ds: wxData.html3ds || null,
      threeDsIframeBody: wxData['3ds_iframe_body'] || wxData.threeDsIframeBody || null,
      error: wxData.error || false,
      explanation: wxData.explanation || null,
      type: wxData.type || null,
      orderNumber,
    });
  } catch (err) {
    console.error('[session-pay] Error:', err);
    return Response.json(
      { error: 'SERVER_ERROR', explanation: err.message },
      { status: 500 }
    );
  }
}
