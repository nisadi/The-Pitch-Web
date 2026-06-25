import { isEsmsConfigured } from "./enquiryReplySms";
import { formatPhoneForEsms, normalizePhoneForSms } from "./phoneFormat";
import { getPitchContactPhone } from "./enquiryReplySmsTemplate";

function formatBookingDate(dateKey) {
  if (!dateKey) return "";
  try {
    const dateStr = String(dateKey).split("T")[0];
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateKey;
  }
}

function formatAmountLkr(amount) {
  const value = Number(amount) || 0;
  if (value <= 0) return "";
  return `LKR ${value.toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;
}

export function buildBookingConfirmationSmsBody({
  customerName,
  reference,
  date,
  time,
  location,
  sport,
  court,
  totalAmount,
  remark,
  discountType,
  discountValue,
  finalAmount,
  contactPhone = getPitchContactPhone(),
}) {
  const name = customerName?.trim().split(' ')[0];
  const greeting = name ? `Hi ${name}, ` : "Hi, ";

  const displayAmount = finalAmount !== undefined ? finalAmount : totalAmount;
  const amtFormatted = displayAmount !== undefined && displayAmount !== null
    ? `Rs. ${Number(displayAmount).toLocaleString("en-LK", { maximumFractionDigits: 2 })}`
    : null;

  const dateStr = date ? formatBookingDate(date) : "";
  const dateTimeLine = [dateStr, time].filter(Boolean).join(" - ");

  const lines = [
    `${greeting}booking confirmed.`,
    dateTimeLine || null,
    location ? `Venue: ${location}` : null,
    sport && court ? `${sport}-${court}` : sport || court || null,
    amtFormatted ? `Amount: ${amtFormatted}` : null,
    `Enquiries: ${contactPhone}`
  ].filter(Boolean);

  return lines.join("\n");
}

export function buildBookingCancellationSmsBody({
  customerName,
  reference,
  date,
  time,
  location,
  sport,
  court,
  contactPhone = getPitchContactPhone(),
}) {
  const name = customerName?.trim().split(' ')[0];
  const greeting = name ? `Hi ${name}, ` : "Hi, ";

  const dateStr = date ? formatBookingDate(date) : "";
  const dateTimeLine = [dateStr, time].filter(Boolean).join(" - ");

  const lines = [
    `${greeting}booking cancelled.`,
    dateTimeLine || null,
    location ? `Venue: ${location}` : null,
    sport && court ? `${sport}-${court}` : sport || court || null,
    `Enquiries: ${contactPhone}`
  ].filter(Boolean);

  return lines.join("\n");
}

async function deliverBookingSms(phone, smsBody) {
  if (!isEsmsConfigured()) {
    return {
      success: false,
      skipped: true,
      error: "SMS gateway is not configured.",
    };
  }

  const normalizedPhone = normalizePhoneForSms(phone);
  if (!normalizedPhone) {
    return { success: false, skipped: true, error: "No phone number provided." };
  }

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
      };
    }

    return {
      success: true,
      phone: normalizedPhone,
      formattedPhone,
      messageId: result.messageId ?? null,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message ?? "Failed to send SMS.",
      phone: normalizedPhone,
    };
  }
}

async function resolveContactPhoneForLocation(locationName) {
  const defaultPhone = getPitchContactPhone();
  if (!locationName) return defaultPhone;

  try {
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase
      .from("locations")
      .select("name, short_name, phone")
      .eq("is_active", true);

    if (data && data.length > 0) {
      const match = data.find(
        (loc) =>
          loc.name?.toLowerCase() === locationName.toLowerCase() ||
          loc.short_name?.toLowerCase() === locationName.toLowerCase()
      );
      if (match?.phone?.trim()) {
        return match.phone.trim();
      }
    }
  } catch (err) {
    console.warn("[resolveContactPhoneForLocation] Error:", err);
  }

  return defaultPhone;
}

export async function sendBookingConfirmationSms({
  phone,
  customerName,
  reference,
  date,
  time,
  location,
  sport,
  court,
  totalAmount,
  remark,
  discountType,
  discountValue,
  finalAmount,
}) {
  const contactPhone = await resolveContactPhoneForLocation(location);

  const smsBody = buildBookingConfirmationSmsBody({
    customerName,
    reference,
    date,
    time,
    location,
    sport,
    court,
    totalAmount,
    remark,
    discountType,
    discountValue,
    finalAmount,
    contactPhone,
  });

  return deliverBookingSms(phone, smsBody);
}

export async function sendBookingCancellationSms({
  phone,
  customerName,
  reference,
  date,
  time,
  location,
  sport,
  court,
}) {
  const contactPhone = await resolveContactPhoneForLocation(location);

  const smsBody = buildBookingCancellationSmsBody({
    customerName,
    reference,
    date,
    time,
    location,
    sport,
    court,
    contactPhone,
  });

  return deliverBookingSms(phone, smsBody);
}
