export const ENQUIRY_COLUMNS =
  "id, reference_code, thread_key, full_name, email, phone, subject, message, location, status, replies, created_at, updated_at";

function splitTimestamp(iso) {
  if (!iso) {
    return { date: "", time: "" };
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "", time: "" };
  }

  return {
    date: parsed.toISOString().slice(0, 10),
    time: parsed.toTimeString().slice(0, 5),
  };
}

export function parseReplies(value, defaultInReplyTo = null) {
  let list = [];
  if (Array.isArray(value)) list = value;
  else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      list = Array.isArray(parsed) ? parsed : [];
    } catch {
      list = [];
    }
  }

  return list.map((reply) => normalizeReply(reply, defaultInReplyTo));
}

/** Admin reply stored in contact_messages.replies (jsonb). */
export function normalizeReply(reply, fallbackInReplyTo = null) {
  if (!reply) return null;
  return {
    id: reply.id ?? `REP-${Date.now()}`,
    inReplyTo: reply.inReplyTo ?? reply.in_reply_to ?? fallbackInReplyTo,
    author: reply.author ?? "Admin",
    message: reply.message ?? "",
    date: reply.date ?? "",
    time: reply.time ?? "",
    createdAt:
      reply.createdAt ??
      reply.created_at ??
      (reply.date ? `${reply.date}T${reply.time ?? "00:00"}` : null),
    channel: reply.channel ?? null,
    smsMessageId: reply.smsMessageId ?? reply.sms_message_id ?? null,
  };
}

export function createAdminReply({
  message,
  author,
  inReplyTo,
  date,
  time,
  channel,
  smsMessageId,
}) {
  const now = new Date();
  return normalizeReply({
    id: `REP-${Date.now()}`,
    inReplyTo,
    author,
    message,
    date: date ?? now.toISOString().slice(0, 10),
    time: time ?? now.toTimeString().slice(0, 5),
    createdAt: now.toISOString(),
    channel: channel ?? null,
    smsMessageId: smsMessageId ?? null,
  });
}

function referenceFromId(id) {
  if (!id) return "";
  return `ENQ-${String(id).replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

export function normalizeEnquiry(enquiry) {
  const { date, time } = splitTimestamp(enquiry.createdAt ?? enquiry.created_at);
  const reference =
    enquiry.referenceCode ??
    enquiry.reference_code ??
    enquiry.id ??
    (enquiry.dbId ? referenceFromId(enquiry.dbId) : "");

  return {
    id: reference,
    dbId: enquiry.dbId ?? enquiry.db_id ?? null,
    referenceCode: reference,
    threadKey: enquiry.threadKey ?? enquiry.thread_key ?? null,
    date: enquiry.date ?? date,
    time: enquiry.time ?? time,
    name: enquiry.name ?? enquiry.full_name ?? enquiry.contact_person ?? "",
    phone: enquiry.phone ?? "",
    email: enquiry.email ?? "",
    subject: enquiry.subject ?? "General enquiry",
    message: enquiry.message ?? "",
    location: enquiry.location ?? "",
    sport: enquiry.sport ?? "",
    status: enquiry.status ?? "new",
    replies: parseReplies(enquiry.replies, enquiry.referenceCode ?? enquiry.id),
    createdAt: enquiry.createdAt ?? enquiry.created_at ?? null,
    updatedAt: enquiry.updatedAt ?? enquiry.updated_at ?? null,
  };
}

export function enquiryFromRow(row) {
  if (!row) return null;

  const reference = row.reference_code ?? referenceFromId(row.id);

  return normalizeEnquiry({
    id: reference,
    dbId: row.id,
    reference_code: reference,
    thread_key: row.thread_key,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    location: row.location,
    status: row.status,
    replies: parseReplies(row.replies, reference),
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

export function threadKeyFromEnquiry(enquiry) {
  const email = enquiry.email?.trim().toLowerCase();
  if (email) return `email:${email}`;
  const phone = enquiry.phone?.replace(/\D/g, "");
  if (phone) return `phone:${phone}`;
  return enquiry.threadKey ?? enquiry.thread_key ?? null;
}

export function enquiryToRow(enquiry) {
  return {
    reference_code: enquiry.referenceCode ?? enquiry.id,
    thread_key: threadKeyFromEnquiry(enquiry),
    full_name: enquiry.name?.trim(),
    email: enquiry.email?.trim() || null,
    phone: enquiry.phone?.trim() || null,
    subject: enquiry.subject?.trim() || null,
    message: enquiry.message?.trim() || null,
    location: enquiry.location?.trim() || null,
    status: enquiry.status ?? "new",
    replies: enquiry.replies ?? [],
    updated_at: new Date().toISOString(),
  };
}
