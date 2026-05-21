import { buildEnquiryReplySmsBody } from "./enquiryReplySmsTemplate";

export { buildEnquiryReplySmsBody, getPitchContactPhone } from "./enquiryReplySmsTemplate";

/** Strip to digits; Dialog accepts +94 / 07 / 9-digit mobile. */
export function sanitizePhoneInput(phone) {
  if (!phone || typeof phone !== "string") return "";
  return phone.replace(/[^\d+]/g, "").replace(/\s+/g, "");
}

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
  referenceCode,
  enquiryQuestion,
  contactPhone,
}) {
  if (!isEsmsConfigured()) {
    return {
      success: false,
      error: "SMS gateway is not configured. Add ESMS_* variables to .env.local.",
    };
  }

  const sanitizedPhone = sanitizePhoneInput(phone);
  if (!sanitizedPhone) {
    return { success: false, error: "Customer phone number is missing." };
  }

  const smsBody = buildEnquiryReplySmsBody({
    referenceCode,
    enquiryQuestion,
    reply: message,
    contactPhone,
  });
  const hasGetKey = Boolean(process.env.ESMS_GET_KEY?.trim());
  const useGetMethod =
    process.env.ESMS_USE_GET === "true" ||
    (hasGetKey && process.env.ESMS_USE_GET !== "false");

  try {
    const { sendSMS, formatPhoneNumber } = await import("../../../messenger.js");
    let formattedPhone;
    try {
      formattedPhone = formatPhoneNumber(sanitizedPhone);
    } catch (formatErr) {
      return {
        success: false,
        error: formatErr?.message ?? "Invalid phone number format.",
        phone: sanitizedPhone,
      };
    }

    const result = await sendSMS(sanitizedPhone, smsBody, {
      sourceAddress: process.env.ESMS_DEFAULT_MASK,
      useGetMethod,
      skipMaxLength: true,
    });

    if (!result?.success) {
      return {
        success: false,
        error: result?.error ?? "SMS gateway rejected the message.",
        phone: sanitizedPhone,
        formattedPhone,
        method: useGetMethod ? "GET" : "POST",
      };
    }

    return {
      success: true,
      phone: sanitizedPhone,
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
