import { createAdminReply, parseReplies } from "./enquiryMapper";

export const STADIUM_EVENT_COLUMNS =
  "id, reference_code, thread_key, organization_name, contact_person, email, phone, event_category, guest_count, preferred_date, requirements, subject, location, status, replies, created_at, updated_at";

function splitTimestamp(iso) {
  if (!iso) return { date: "", time: "" };
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "" };
  return {
    date: parsed.toISOString().slice(0, 10),
    time: parsed.toTimeString().slice(0, 5),
  };
}

function referenceFromId(id) {
  if (!id) return "";
  return `EVT-${String(id).replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

export function threadKeyFromStadiumRow(row) {
  const email = row.email?.trim().toLowerCase();
  if (email) return `email:${email}`;
  const phone = row.phone?.replace(/\D/g, "");
  if (phone) return `phone:${phone}`;
  return row.thread_key ?? (row.id ? `ref:${row.id}` : null);
}

export function normalizeStadiumEventInquiry(row) {
  if (!row) return null;

  const { date, time } = splitTimestamp(row.createdAt ?? row.created_at);
  const reference =
    row.referenceCode ??
    row.reference_code ??
    (row.dbId ? referenceFromId(row.dbId) : "");

  const contact = row.contact_person ?? row.contactPerson ?? "";
  const organization = row.organization_name ?? row.organizationName ?? "";

  return {
    id: reference,
    dbId: row.dbId ?? row.id ?? null,
    referenceCode: reference,
    threadKey: row.threadKey ?? row.thread_key ?? threadKeyFromStadiumRow(row),
    date: row.date ?? date,
    time: row.time ?? time,
    name: row.name ?? contact,
    organizationName: organization,
    contactPerson: contact,
    phone: row.phone ?? "",
    email: row.email ?? "",
    subject:
      row.subject ??
      row.event_category ??
      row.eventCategory ??
      "Event inquiry",
    message: row.message ?? row.requirements ?? "",
    requirements: row.requirements ?? "",
    eventCategory: row.event_category ?? row.eventCategory ?? "",
    guestCount: row.guest_count ?? row.guestCount ?? null,
    preferredDate: row.preferred_date ?? row.preferredDate ?? "",
    location: row.location ?? "",
    status: row.status ?? "new",
    replies: parseReplies(row.replies, reference),
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

export { createAdminReply };

export function stadiumEventFromRow(row) {
  return normalizeStadiumEventInquiry({
    id: row.id,
    dbId: row.id,
    reference_code: row.reference_code,
    thread_key: row.thread_key,
    organization_name: row.organization_name,
    contact_person: row.contact_person,
    email: row.email,
    phone: row.phone,
    event_category: row.event_category,
    guest_count: row.guest_count,
    preferred_date: row.preferred_date,
    requirements: row.requirements,
    subject: row.subject,
    location: row.location,
    status: row.status,
    replies: row.replies,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

export function stadiumEventToRow(inquiry) {
  const email = inquiry.email?.trim().toLowerCase();
  const phone = inquiry.phone?.replace(/\D/g, "");
  const threadKey =
    inquiry.threadKey ??
    (email ? `email:${email}` : phone ? `phone:${phone}` : null);

  return {
    reference_code: inquiry.referenceCode ?? inquiry.id,
    thread_key: threadKey,
    organization_name:
      inquiry.organizationName?.trim() ||
      inquiry.name?.trim() ||
      null,
    contact_person: inquiry.contactPerson?.trim() || inquiry.name?.trim(),
    email: inquiry.email?.trim() || null,
    phone: inquiry.phone?.trim() || null,
    event_category: inquiry.eventCategory?.trim() || null,
    guest_count:
      inquiry.guestCount != null && inquiry.guestCount !== ""
        ? Number(inquiry.guestCount)
        : null,
    preferred_date: inquiry.preferredDate || null,
    requirements: inquiry.requirements?.trim() || inquiry.message?.trim() || null,
    subject: inquiry.subject?.trim() || inquiry.eventCategory?.trim() || null,
    location: inquiry.location?.trim() || null,
    status: inquiry.status ?? "new",
    replies: inquiry.replies ?? [],
    updated_at: new Date().toISOString(),
  };
}
