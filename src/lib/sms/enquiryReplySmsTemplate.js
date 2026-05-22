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
 * Composed enquiry reply SMS. Admin reply is never truncated; only the
 * customer question may be shortened if the full body exceeds maxTotalLength.
 */
export function buildEnquiryReplySmsBody({
  referenceCode,
  enquiryQuestion,
  reply,
  contactPhone = DEFAULT_CONTACT_PHONE,
  maxTotalLength = null,
}) {
  const ref = referenceCode ? `${referenceCode}\n` : "";
  const footer = `\n\nThe Pitch Indoor Stadium — enquiries: ${contactPhone}`;
  const replyLabel = "Reply: ";
  const questionLabel = "Q: ";

  const answer = collapseWhitespace(reply);
  let question = collapseWhitespace(enquiryQuestion);

  const build = () =>
    `${ref}${questionLabel}${question}\n${replyLabel}${answer}${footer}`;

  if (!maxTotalLength || maxTotalLength <= 0) {
    return build();
  }

  let body = build();
  if (body.length <= maxTotalLength) {
    return body;
  }

  const fixedLen =
    ref.length +
    questionLabel.length +
    replyLabel.length +
    answer.length +
    1 +
    footer.length;

  const questionBudget = maxTotalLength - fixedLen;
  if (questionBudget > 8) {
    question =
      question.length <= questionBudget
        ? question
        : `${question.slice(0, questionBudget - 1)}…`;
    body = build();
    if (body.length <= maxTotalLength) {
      return body;
    }
  }

  return build();
}

export function getPitchContactPhone() {
  return DEFAULT_CONTACT_PHONE;
}
