import { normalizeEnquiry, normalizeReply } from "./enquiryMapper";

function messageSortKey(entry) {
  const iso = entry.createdAt ?? `${entry.date}T${entry.time ?? "00:00"}`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

/** Stable key to group messages from the same person. */
export function threadKeyForEnquiry(enquiry) {
  if (enquiry.threadKey ?? enquiry.thread_key) {
    return enquiry.threadKey ?? enquiry.thread_key;
  }

  const email = enquiry.email?.trim().toLowerCase();
  if (email) return `email:${email}`;

  const phone = enquiry.phone?.replace(/\D/g, "");
  if (phone) return `phone:${phone}`;

  return `ref:${enquiry.dbId ?? enquiry.id}`;
}

/** First non-empty phone on any row in the thread (for SMS replies). */
export function resolveThreadPhone(thread) {
  if (!thread) return "";
  const rows = thread.sourceRows?.length
    ? thread.sourceRows
    : thread.phone
      ? [thread]
      : [];
  for (const row of rows) {
    const phone = row.phone?.trim();
    if (phone) return phone;
  }
  return thread.phone?.trim() ?? "";
}

function pickPrimaryRow(rows) {
  const statusOrder = { in_progress: 0, new: 1, resolved: 2, closed: 3 };
  return [...rows].sort((a, b) => {
    const statusDiff =
      (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return messageSortKey(b) - messageSortKey(a);
  })[0];
}

function buildConversationMessages(rows) {
  const chronological = [...rows].sort(
    (a, b) => messageSortKey(a) - messageSortKey(b)
  );
  const messages = [];

  for (const row of chronological) {
    messages.push({
      id: `customer-${row.dbId ?? row.id}`,
      role: "customer",
      author: row.name,
      message: row.message,
      date: row.date,
      time: row.time,
      createdAt: row.createdAt,
      enquiryId: row.id,
    });

    for (const reply of row.replies ?? []) {
      const normalized = normalizeReply(reply, row.id);
      if (
        normalized.inReplyTo &&
        normalized.inReplyTo !== row.id &&
        normalized.inReplyTo !== row.referenceCode
      ) {
        continue;
      }
      messages.push({
        id: normalized.id ?? `admin-${row.id}-${messages.length}`,
        role: "admin",
        author: normalized.author ?? "Admin",
        message: normalized.message,
        date: normalized.date,
        time: normalized.time,
        createdAt:
          normalized.createdAt ?? `${normalized.date}T${normalized.time ?? "00:00"}`,
        enquiryId: row.id,
        inReplyTo: normalized.inReplyTo ?? row.id,
      });
    }
  }

  return messages.sort((a, b) => messageSortKey(a) - messageSortKey(b));
}

/**
 * Merge multiple contact_messages rows from the same email/phone into one thread.
 */
export function groupEnquiriesIntoThreads(enquiries) {
  const groups = new Map();

  for (const enquiry of enquiries) {
    const key = threadKeyForEnquiry(enquiry);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(enquiry);
  }

  const threads = [];

  for (const rows of groups.values()) {
    const primary = pickPrimaryRow(rows);
    const messages = buildConversationMessages(rows);
    const customerMessages = messages.filter((m) => m.role === "customer");
    const latestCustomer = customerMessages[customerMessages.length - 1];

    const phone = resolveThreadPhone({ sourceRows: rows, phone: primary.phone });

    threads.push({
      ...primary,
      phone: phone || primary.phone,
      messages,
      sourceRows: rows,
      primaryDbId: primary.dbId,
      threadCount: rows.length,
      messageCount: messages.length,
      message: latestCustomer?.message ?? primary.message,
      subject:
        rows.length > 1
          ? `${primary.subject} (${rows.length} messages)`
          : primary.subject,
    });
  }

  return threads.sort(
    (a, b) => messageSortKey(b) - messageSortKey(a)
  );
}

export function findThreadById(threads, id) {
  return threads.find((thread) => thread.id === id) ?? null;
}

/** Row that receives the next admin reply (latest customer submission). */
export function pickReplyTargetRow(thread) {
  if (!thread?.sourceRows?.length) return null;
  return [...thread.sourceRows].sort(
    (a, b) => messageSortKey(b) - messageSortKey(a)
  )[0];
}

/** Reference IDs oldest-first for display (ENQ-2402, ENQ-2402B). */
export function sortedThreadReferences(thread) {
  if (!thread?.sourceRows?.length) {
    return thread?.id ? [thread.id] : [];
  }
  return [...thread.sourceRows]
    .sort((a, b) => messageSortKey(a) - messageSortKey(b))
    .map((row) => row.id);
}

/** Unique venue labels when a thread spans multiple locations. */
export function threadLocationLabel(thread) {
  const locations = [
    ...new Set(
      (thread?.sourceRows ?? [])
        .map((row) => row.location?.trim())
        .filter(Boolean)
    ),
  ];
  if (locations.length === 0) return thread?.location?.trim() || "";
  return locations.join(", ");
}

/** Update flat enquiry rows that belong to a thread (e.g. status sync). */
export function patchEnquiriesForThread(enquiries, thread, patch) {
  const dbIds = new Set(
    thread.sourceRows.map((row) => row.dbId).filter(Boolean)
  );
  const refs = new Set(thread.sourceRows.map((row) => row.id));

  return enquiries.map((enquiry) => {
    if (
      (enquiry.dbId && dbIds.has(enquiry.dbId)) ||
      refs.has(enquiry.id)
    ) {
      return normalizeEnquiry({ ...enquiry, ...patch });
    }
    return enquiry;
  });
}
