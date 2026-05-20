const SMS_MAX_LENGTH = 160;

const DEFAULT_CONTACT_PHONE =
  process.env.PITCH_CONTACT_PHONE?.trim() ||
  process.env.NEXT_PUBLIC_PITCH_CONTACT_PHONE?.trim() ||
  "+94 11 456 7890";

function collapseWhitespace(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, maxLen) {
  const t = collapseWhitespace(text);
  if (!t || maxLen <= 0) return "";
  if (t.length <= maxLen) return t;
  if (maxLen <= 1) return "…";
  return `${t.slice(0, maxLen - 1)}…`;
}

/**
 * Composed enquiry reply SMS (Dialog max 160 chars).
 * Keeps footer + reference; trims question/reply as needed.
 */
export function buildEnquiryReplySmsBody({
  referenceCode,
  enquiryQuestion,
  reply,
  contactPhone = DEFAULT_CONTACT_PHONE,
}) {
  const ref = referenceCode ? `${referenceCode}\n` : "";
  const footer = `\n\nThe Pitch Indoor Stadium — enquiries: ${contactPhone}`;

  const replyLabel = "Reply: ";
  const questionLabel = "Q: ";

  let question = collapseWhitespace(enquiryQuestion);
  let answer = collapseWhitespace(reply);

  const build = () =>
    `${ref}${questionLabel}${question}\n${replyLabel}${answer}${footer}`;

  let body = build();
  if (body.length <= SMS_MAX_LENGTH) return body;

  const fixedLen =
    ref.length +
    questionLabel.length +
    replyLabel.length +
    1 + // newline between blocks
    footer.length;

  let variableBudget = SMS_MAX_LENGTH - fixedLen;
  if (variableBudget < 20) {
    return truncate(
      `${ref}${truncate(answer, 40)}${footer.replace("\n\n", " ")}`,
      SMS_MAX_LENGTH
    );
  }

  const half = Math.floor(variableBudget / 2);
  let questionBudget = Math.min(question.length, half);
  let answerBudget = variableBudget - questionBudget;

  if (answer.length < answerBudget) {
    answerBudget = answer.length;
    questionBudget = Math.min(question.length, variableBudget - answerBudget);
  }
  if (question.length < questionBudget) {
    questionBudget = question.length;
    answerBudget = Math.min(answer.length, variableBudget - questionBudget);
  }

  question = truncate(question, questionBudget);
  answer = truncate(answer, answerBudget);
  body = build();

  while (body.length > SMS_MAX_LENGTH && (question.length > 8 || answer.length > 8)) {
    if (question.length >= answer.length && question.length > 8) {
      question = truncate(collapseWhitespace(enquiryQuestion), question.length - 6);
    } else if (answer.length > 8) {
      answer = truncate(collapseWhitespace(reply), answer.length - 6);
    } else {
      break;
    }
    body = build();
  }

  if (body.length > SMS_MAX_LENGTH) {
    return truncate(body, SMS_MAX_LENGTH);
  }

  return body;
}

export function getPitchContactPhone() {
  return DEFAULT_CONTACT_PHONE;
}
