import { buildEnquiryReplySmsBody } from "./enquiryReplySmsTemplate";
import {
  formatPhoneForEsms,
  normalizePhoneForSms,
  sanitizePhoneInput,
} from "./phoneFormat";

export { buildEnquiryReplySmsBody, getPitchContactPhone } from "./enquiryReplySmsTemplate";
export { sanitizePhoneInput, normalizePhoneForSms, formatPhoneForEsms } from "./phoneFormat";

export function isEsmsConfigured() {
  const hasAuth = Boolean(
    process.env.ESMS_USERNAME?.trim() && process.env.ESMS_PASSWORD?.trim()
  );
  const hasGet = Boolean(process.env.ESMS_GET_KEY?.trim());
  const hasPostMask = Boolean(process.env.ESMS_DEFAULT_MASK?.trim());
  return hasAuth && (hasGet || hasPostMask);
}

export async function sendEnquiryReplySms({
  phone,
  message,
  locationName,
  contactPhone,
}) {
  if (!isEsmsConfigured()) {
    return {
      success: false,
      error: "SMS gateway is not configured. Add ESMS_* variables to .env.local.",
    };
  }

  const normalizedPhone = normalizePhoneForSms(phone);
  if (!normalizedPhone) {
    return { success: false, error: "Customer phone number is missing." };
  }

  const smsBody = buildEnquiryReplySmsBody({
    locationName,
    reply: message,
    contactPhone,
  });
  const hasGetKey = Boolean(process.env.ESMS_GET_KEY?.trim());
  const useGetMethod =
    process.env.ESMS_USE_GET === "true" ||
    (hasGetKey && process.env.ESMS_USE_GET !== "false");

  try {
    const { sendSMS } = await import("../../../messenger.js");
    let formattedPhone;
    try {
      formattedPhone = await formatPhoneForEsms(phone);
    } catch (formatErr) {
      return {
        success: false,
        error: formatErr?.message ?? "Invalid phone number format.",
        phone: normalizedPhone,
      };
    }

    const result = await sendSMS(normalizedPhone, smsBody, {
      sourceAddress: process.env.ESMS_DEFAULT_MASK,
      useGetMethod,
      skipMaxLength: true,
    });

    if (!result?.success) {
      return {
        success: false,
        error: result?.error ?? "SMS gateway rejected the message.",
        phone: normalizedPhone,
        formattedPhone,
        method: useGetMethod ? "GET" : "POST",
      };
    }

    return {
      success: true,
      phone: normalizedPhone,
      formattedPhone,
      method: useGetMethod ? "GET" : "POST",
      smsBody,
      messageId: result.messageId ?? null,
      transactionId: result.transactionId ?? null,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message ?? "Failed to send SMS.",
      phone,
    };
  }
}
