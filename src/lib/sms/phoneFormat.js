/**
 * Sri Lanka mobile numbers for Dialog eSMS (9-digit MSISDN: 7XXXXXXXX).
 * Accepts local entry without country code, e.g. 0757622092 or 757622092.
 */

const DEFAULT_COUNTRY_CODE =
  process.env.SMS_DEFAULT_COUNTRY_CODE?.trim().replace(/\D/g, "") || "94";

/** Digits only. */
export function sanitizePhoneInput(phone) {
  if (!phone || typeof phone !== "string") return "";
  return phone.replace(/\D/g, "");
}

function isNineDigitMobile(digits) {
  return /^7\d{8}$/.test(digits);
}

/**
 * Normalize to 9-digit Dialog format (7XXXXXXXX), or return "" if empty.
 * Does not throw — use formatPhoneForEsms for validation + throw.
 */
export function normalizePhoneForSms(phone) {
  let digits = sanitizePhoneInput(phone);
  if (!digits) return "";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (
    digits.length === 11 &&
    digits.startsWith(DEFAULT_COUNTRY_CODE) &&
    isNineDigitMobile(digits.slice(DEFAULT_COUNTRY_CODE.length))
  ) {
    return digits.slice(DEFAULT_COUNTRY_CODE.length);
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    const national = digits.slice(1);
    if (isNineDigitMobile(national)) return national;
  }

  if (digits.length === 9 && isNineDigitMobile(digits)) {
    return digits;
  }

  // Local mobile without leading 7 (8 digits), e.g. 57622092 → 757622092
  if (digits.length === 8 && /^[1-9]\d{7}$/.test(digits)) {
    const candidate = `7${digits}`;
    if (isNineDigitMobile(candidate)) return candidate;
  }

  // Country code pasted without leading 7 on national part (rare)
  if (
    digits.startsWith(DEFAULT_COUNTRY_CODE) &&
    digits.length > DEFAULT_COUNTRY_CODE.length
  ) {
    const rest = digits.slice(DEFAULT_COUNTRY_CODE.length);
    if (isNineDigitMobile(rest)) return rest;
    if (rest.length === 8 && /^[1-9]\d{7}$/.test(rest)) {
      const candidate = `7${rest}`;
      if (isNineDigitMobile(candidate)) return candidate;
    }
  }

  return digits;
}

/**
 * Format for Dialog eSMS; throws if not a valid SL mobile after fallbacks.
 */
export async function formatPhoneForEsms(phone) {
  const normalized = normalizePhoneForSms(phone);
  if (!normalized) {
    throw new Error("Customer phone number is missing.");
  }

  const { formatPhoneNumber } = await import("../../../messenger.js");

  try {
    return formatPhoneNumber(normalized);
  } catch {
    if (normalized.length === 9 && isNineDigitMobile(normalized)) {
      return formatPhoneNumber(`0${normalized}`);
    }
    if (normalized.length === 10 && normalized.startsWith("0")) {
      return formatPhoneNumber(normalized);
    }
    if (
      normalized.length === 11 &&
      normalized.startsWith(DEFAULT_COUNTRY_CODE)
    ) {
      return formatPhoneNumber(normalized);
    }
    throw new Error(
      `Invalid phone number. Use a Sri Lanka mobile (e.g. 0757622092 or +94757622092). Received: ${phone}`
    );
  }
}
