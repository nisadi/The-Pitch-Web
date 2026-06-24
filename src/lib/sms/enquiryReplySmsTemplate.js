const DEFAULT_CONTACT_PHONE =
  process.env.PITCH_CONTACT_PHONE?.trim() ||
  process.env.NEXT_PUBLIC_PITCH_CONTACT_PHONE?.trim() ||
  "+94 77 748 1786";

function collapseWhitespace(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Composed enquiry reply SMS. Admin reply is never truncated.
 */
export function buildEnquiryReplySmsBody({
  locationName,
  reply,
  contactPhone,
}) {
  const locStr = locationName ? ` - ${locationName}` : "";
  const header = `The Pitch Indoor Stadium${locStr}\n\n`;
  const footer = contactPhone ? `\n\nEnquiries: ${contactPhone}` : "";

  const answer = collapseWhitespace(reply);
  return `${header}${answer}${footer}`;
}

export function getPitchContactPhone() {
  return DEFAULT_CONTACT_PHONE;
}
