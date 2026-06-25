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

  const username = process.env.WEBXPAY_REFUND_API_USERNAME;
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
  
  if (data.error || data.status === 'error' || data.status === 'Unsuccess' || data.success === false) {
    throw new Error(data.explain || data.message || data.error || 'WebXPay auth API returned authentication failure');
  }

  const token = data.token || data.access_token || (typeof data === 'string' ? data : null);
  if (!token) {
    throw new Error(`WebXPay auth API did not return a valid authentication token. Response: ${JSON.stringify(data)}`);
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
  // user_password is the Merchant Partner Portal login password (WEBXPAY_PORTAL_PASSWORD)
  const portalPassword = process.env.WEBXPAY_PORTAL_PASSWORD;
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

  console.log('[WebXPay Refund Request] Params:', {
    order_refference_number: orderReference,
    refund_amount: amount,
    refund_reason_id: reasonId,
    other_reason_text: reasonText,
  });

  const res = await fetch('https://webxpay.com/index.php?route=api/merchant_api/requestRefundByOrderReference', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('[WebXPay Refund HTTP Error]:', res.status, errText);
    throw new Error(`WebXPay refund request failed with HTTP status: ${res.status}`);
  }

  const data = await res.json();
  console.log('[WebXPay Refund Response Payload]:', data);
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

    // 1.5 Resolve booking ID and transaction ID from the DB if orderReference is a booking UUID or booking reference
    let matchedBookingId = null;
    let webxpayOrderReference = orderReference;

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

        // If matchedBookingId is found, search the payments table for transaction_id
        if (matchedBookingId) {
          const { data: paymentRow } = await supabaseAdmin
            .from('payments')
            .select('transaction_id')
            .eq('booking_id', matchedBookingId)
            .maybeSingle();

          if (paymentRow?.transaction_id) {
            console.log(`[Refund] Resolved booking ID ${matchedBookingId} to transaction_id: ${paymentRow.transaction_id}`);
            webxpayOrderReference = paymentRow.transaction_id;
          } else {
            console.warn(`[Refund] No payment row or transaction_id found for booking ${matchedBookingId}`);
          }
        } else {
          // If not matching a booking ID directly, check if orderReference is already a transaction_id
          const { data: paymentRow } = await supabaseAdmin
            .from('payments')
            .select('booking_id, transaction_id')
            .eq('transaction_id', refStr)
            .maybeSingle();

          if (paymentRow) {
            matchedBookingId = paymentRow.booking_id;
            webxpayOrderReference = paymentRow.transaction_id;
            console.log(`[Refund] Found booking ${matchedBookingId} using transaction_id: ${webxpayOrderReference}`);
          }
        }
      } catch (dbErr) {
        console.error('[Refund ID Resolution Error]:', dbErr);
      }
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
      refundResult = await requestWebXPayRefund(token, { orderReference: webxpayOrderReference, amount, reasonId, reasonText });
      
      // If WebXPay API indicates token expiration in JSON response, retry with forced token refresh
      if (
        refundResult && 
        (refundResult.error?.toLowerCase().includes('token') || 
         refundResult.message?.toLowerCase().includes('token') || 
         refundResult.status === 'expired')
      ) {
        console.warn('[WebXPay Merchant Refund] API returned token error/expiration, retrying with fresh token...');
        token = await getWebXPayMerchantToken(true);
        refundResult = await requestWebXPayRefund(token, { orderReference: webxpayOrderReference, amount, reasonId, reasonText });
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
          refundResult = await requestWebXPayRefund(token, { orderReference: webxpayOrderReference, amount, reasonId, reasonText });
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
    const isFailure = !refundResult || 
      refundResult.error || 
      refundResult.success === false || 
      refundResult.status === 'failed' || 
      refundResult.status === 'Unsuccess' || 
      refundResult.status === 'unsuccess';

    if (isFailure) {
      return Response.json({
        success: false,
        error: refundResult?.error || 'GATEWAY_ERROR',
        explanation: refundResult?.explain || refundResult?.message || refundResult?.explanation || 'WebXPay refund request was rejected by the gateway.',
        raw: refundResult
      });
    }

    // 4. Update database (bookings and payments table) on success
    let dbUpdated = false;

    if (isAdminClientConfigured()) {
      try {
        const supabaseAdmin = createAdminClient();
        
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
          // Fallback if matchedBookingId is still null
          const refStr = String(orderReference);
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
