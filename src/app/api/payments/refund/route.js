import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

// In-memory cache for WebXPay merchant API token
let tokenCache = {
  token: null,
  expiresAt: null,
};

/**
 * Decodes the JWT token payload to extract expiration time
 */
function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Get or refresh the WebXPay merchant authentication token
 */
async function getWebXPayMerchantToken(forceRefresh = false) {
  const now = Math.floor(Date.now() / 1000);
  if (!forceRefresh && tokenCache.token && tokenCache.expiresAt && now < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const username = process.env.WEBXPAY_REFUND_API_USERNAME || process.env.WEBXPAY_USERNAME;
  const password = process.env.WEBXPAY_REFUND_API_PASSWORD;
  const merchantNumber = process.env.WEBXPAY_MERCHANT_NUMBER;

  if (!username || !password || !merchantNumber) {
    throw new Error("Missing WebXPay Refund credentials in environment variables (.env.local)");
  }

  const params = new URLSearchParams();
  params.append('api_username', username);
  params.append('api_password', password);
  params.append('merchant_number', merchantNumber);

  const res = await fetch('https://webxpay.com/index.php?route=api/merchant_api/apiLogin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`WebXPay login API request failed with status: ${res.status}`);
  }

  const data = await res.json();
  
  if (data.error || data.status === 'error' || data.success === false) {
    throw new Error(data.message || data.error || 'WebXPay login API returned authentication failure');
  }

  const token = data.token || data.access_token || (typeof data === 'string' ? data : null);
  if (!token) {
    throw new Error('WebXPay API login did not return a valid authentication token');
  }

  const payload = decodeJwt(token);
  const expiresAt = payload?.exp ? payload.exp - 60 : now + 3540; // 1 hour default with 1 min buffer

  tokenCache = {
    token,
    expiresAt,
  };

  console.log('[WebXPay Merchant Auth] Token updated. Expiring at:', new Date(expiresAt * 1000).toISOString());
  return token;
}

/**
 * Sends a refund request to WebXPay
 */
async function requestWebXPayRefund(token, { orderReference, amount, reasonId, reasonText }) {
  const portalPassword = process.env.WEBXPAY_PORTAL_PASSWORD || process.env.WEBXPAY_PASSWORD;
  if (!portalPassword) {
    throw new Error("Missing WEBXPAY_PORTAL_PASSWORD in environment variables");
  }

  const params = new URLSearchParams();
  params.append('order_refference_number', orderReference);
  params.append('refund_amount', String(amount));
  params.append('user_password', portalPassword);
  params.append('refund_reason_id', String(reasonId));
  if (reasonText) {
    params.append('other_reason_text', reasonText);
  }

  const res = await fetch('https://webxpay.com/index.php?route=api/merchant_api/requestRefundByOrderReference', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`WebXPay refund request failed with HTTP status: ${res.status}`);
  }

  const data = await res.json();
  return data;
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Support multiple field naming styles (camelCase, snake_case, etc.)
    const orderReference = body.order_refference_number || body.orderReference || body.orderRef || body.orderNumber;
    const amount = body.refund_amount ?? body.amount;
    const reasonId = body.refund_reason_id ?? body.reasonId;
    const reasonText = body.other_reason_text ?? body.reasonText ?? body.comment;
    // Whether to also cancel the booking after a successful refund
    const cancelBooking = body.cancel_booking === true || body.cancelBooking === true;

    // 1. Validation
    if (!orderReference) {
      return Response.json(
        { success: false, error: 'MISSING_ORDER_REF', explanation: 'Order reference number is required.' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return Response.json(
        { success: false, error: 'INVALID_AMOUNT', explanation: 'Refund amount must be a positive number.' },
        { status: 400 }
      );
    }

    const parsedReasonId = Number(reasonId);
    if (!reasonId || Number.isNaN(parsedReasonId) || parsedReasonId < 1 || parsedReasonId > 5) {
      return Response.json(
        { success: false, error: 'INVALID_REASON_ID', explanation: 'Refund reason ID must be an integer between 1 and 5.' },
        { status: 400 }
      );
    }

    if (parsedReasonId === 5 && (!reasonText || !reasonText.trim())) {
      return Response.json(
        { success: false, error: 'MISSING_REASON_TEXT', explanation: 'Reason text is required when reason ID is 5 (Other).' },
        { status: 400 }
      );
    }

    // 2. Fetch/cache token and invoke refund API
    let token;
    try {
      token = await getWebXPayMerchantToken();
    } catch (authErr) {
      console.error('[Refund Auth Error]:', authErr);
      return Response.json(
        { success: false, error: 'AUTH_FAILED', explanation: authErr.message },
        { status: 500 }
      );
    }

    let refundResult;
    try {
      refundResult = await requestWebXPayRefund(token, { orderReference, amount, reasonId, reasonText });
      
      // If WebXPay API indicates token expiration in JSON response, retry with forced token refresh
      if (
        refundResult && 
        (refundResult.error?.toLowerCase().includes('token') || 
         refundResult.message?.toLowerCase().includes('token') || 
         refundResult.status === 'expired')
      ) {
        console.warn('[WebXPay Merchant Refund] API returned token error/expiration, retrying with fresh token...');
        token = await getWebXPayMerchantToken(true);
        refundResult = await requestWebXPayRefund(token, { orderReference, amount, reasonId, reasonText });
      }
    } catch (refundErr) {
      // If request failed with HTTP 401/403 or network auth-like error, retry once
      if (
        refundErr.message.includes('401') || 
        refundErr.message.includes('403') || 
        refundErr.message.toLowerCase().includes('token')
      ) {
        console.warn('[WebXPay Merchant Refund] Request caught token-related error, retrying with fresh token...', refundErr.message);
        try {
          token = await getWebXPayMerchantToken(true);
          refundResult = await requestWebXPayRefund(token, { orderReference, amount, reasonId, reasonText });
        } catch (retryErr) {
          console.error('[Refund Retry Error]:', retryErr);
          return Response.json(
            { success: false, error: 'REFUND_FAILED', explanation: retryErr.message },
            { status: 500 }
          );
        }
      } else {
        console.error('[Refund Request Error]:', refundErr);
        return Response.json(
          { success: false, error: 'REFUND_FAILED', explanation: refundErr.message },
          { status: 500 }
        );
      }
    }

    // 3. Process API result
    if (refundResult?.error || refundResult?.success === false || refundResult?.status === 'failed') {
      return Response.json({
        success: false,
        error: refundResult.error || 'GATEWAY_ERROR',
        explanation: refundResult.message || refundResult.explanation || 'WebXPay refund request was rejected by the gateway.',
        raw: refundResult
      });
    }

    // 4. Update database (bookings and payments table) on success
    let dbUpdated = false;
    let matchedBookingId = null;

    if (isAdminClientConfigured()) {
      try {
        const supabaseAdmin = createAdminClient();
        const refStr = String(orderReference);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refStr);
        
        if (isUuid) {
          matchedBookingId = refStr;
        } else {
          // If reference has prefix BK- or #TP-, extract alphanumeric suffix
          const cleanRef = refStr.replace(/^(BK-|#TP-)/i, '').replace(/-/g, '').toLowerCase();
          if (cleanRef.length >= 4) {
            const { data: matchedBookings } = await supabaseAdmin
              .from('bookings')
              .select('id')
              .like('id', `${cleanRef}%`);
            if (matchedBookings && matchedBookings.length === 1) {
              matchedBookingId = matchedBookings[0].id;
            }
          }
        }

        if (matchedBookingId) {
          // Update booking — always mark payment refunded; only cancel if requested
          const bookingUpdates = { payment_status: 'refunded' };
          if (cancelBooking) bookingUpdates.booking_status = 'cancelled';

          const { error: bookingUpdateErr } = await supabaseAdmin
            .from('bookings')
            .update(bookingUpdates)
            .eq('id', matchedBookingId);

          if (bookingUpdateErr) {
            console.error('[Refund DB Sync] Error updating booking:', bookingUpdateErr);
          } else {
            dbUpdated = true;
          }

          // Update payments status if row exists
          await supabaseAdmin
            .from('payments')
            .update({ payment_status: 'refunded' })
            .eq('booking_id', matchedBookingId);
        } else {
          // Try to search by transaction_id in payments table
          const { data: matchedPayments } = await supabaseAdmin
            .from('payments')
            .select('booking_id, id')
            .eq('transaction_id', refStr);

          if (matchedPayments && matchedPayments.length > 0) {
            for (const payment of matchedPayments) {
              await supabaseAdmin
                .from('payments')
                .update({ payment_status: 'refunded' })
                .eq('id', payment.id);

              if (payment.booking_id) {
                const paymentBookingUpdates = { payment_status: 'refunded' };
                if (cancelBooking) paymentBookingUpdates.booking_status = 'cancelled';

                const { error: bookingUpdateErr } = await supabaseAdmin
                  .from('bookings')
                  .update(paymentBookingUpdates)
                  .eq('id', payment.booking_id);

                if (!bookingUpdateErr) {
                  dbUpdated = true;
                  matchedBookingId = payment.booking_id;
                }
              }
            }
          }
        }
      } catch (dbErr) {
        console.error('[Refund DB Sync Exception]:', dbErr);
      }
    }

    return Response.json({
      success: true,
      message: 'Refund requested successfully.',
      dbUpdated,
      bookingId: matchedBookingId,
      gatewayResponse: refundResult
    });

  } catch (err) {
    console.error('[Refund Handler Exception]:', err);
    return Response.json(
      { success: false, error: 'SERVER_ERROR', explanation: err.message },
      { status: 500 }
    );
  }
}
