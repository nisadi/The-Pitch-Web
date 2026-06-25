export function formatCustomerAmount(amount) {
  return `LKR ${Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCustomerDate(date) {
  const parsed = new Date(`${date}T00:00`);
  return parsed.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatEnquiryDateTime(date, time) {
  const parsed = new Date(`${date}T${time || "00:00"}`);
  return parsed.toLocaleString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function filterCustomers(
  customers,
  { location, locationAliases, status, query }
) {
  const search = query.trim().toLowerCase();
  const aliases =
    locationAliases ??
    (location && location !== "all" ? [location] : []);

  return customers.filter((customer) => {
    if (status !== "all" && customer.status !== status) return false;
    if (aliases.length > 0) {
      const venueNames = customer.locations ?? [];
      const matchesVenue =
        aliases.includes(customer.location) ||
        venueNames.some((name) => aliases.includes(name));
      if (!matchesVenue) return false;
    }

    if (!search) return true;

    const haystack = [
      customer.id,
      customer.name,
      customer.phone,
      customer.email,
      customer.location,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

/** Build strings that may appear in contact_messages.location for a venue. */
export function venueLocationAliases(location) {
  if (!location) return [];
  const shortName = location.shortName?.trim() ?? "";
  const name = location.name?.trim() ?? "";
  const bareName = name.replace(/^The Pitch\s*-\s*/i, "").trim();
  return [...new Set([shortName, bareName, name].filter(Boolean))];
}

export function filterEnquiries(
  enquiries,
  { location, locationAliases, status, query }
) {
  const search = query.trim().toLowerCase();
  const aliases =
    locationAliases ??
    (location && location !== "all" ? [location] : []);

  return enquiries.filter((enquiry) => {
    if (status !== "all" && enquiry.status !== status) return false;
    if (aliases.length > 0 && enquiry.location) {
      const matchesVenue = aliases.some((alias) => alias === enquiry.location);
      if (!matchesVenue) return false;
    }

    if (!search) return true;

    const haystack = [
      enquiry.id,
      enquiry.name,
      enquiry.phone,
      enquiry.email,
      enquiry.subject,
      enquiry.message,
      enquiry.sport,
      enquiry.location,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

export function summarizeCustomers(customers) {
  const active = customers.filter((c) => c.status === "active");
  const inactive = customers.filter((c) => c.status === "inactive");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

  const recentVisitors = customers.filter((c) => c.lastVisit >= cutoff);

  return {
    total: customers.length,
    active: active.length,
    inactive: inactive.length,
    recentVisitors: recentVisitors.length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
  };
}

export function filterEnquiryThreads(
  threads,
  { locationAliases, status, query }
) {
  const search = query.trim().toLowerCase();

  return threads.filter((thread) => {
    if (status !== "all") {
      const statusMatch = thread.sourceRows?.some((row) => row.status === status);
      if (!statusMatch) return false;
    }

    if (locationAliases?.length > 0) {
      const locationMatch = thread.sourceRows?.some(
        (row) => row.location && locationAliases.includes(row.location)
      );
      if (!locationMatch) return false;
    }

    if (!search) return true;

    const haystack = [
      thread.id,
      thread.name,
      thread.phone,
      thread.email,
      thread.subject,
      thread.organizationName,
      thread.eventCategory,
      thread.location,
      ...(thread.messages ?? []).map((m) => `${m.author} ${m.message}`),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

export function summarizeEnquiries(enquiriesOrThreads) {
  return {
    total: enquiriesOrThreads.length,
    new: enquiriesOrThreads.filter((e) => e.status === "new").length,
    inProgress: enquiriesOrThreads.filter((e) => e.status === "in_progress")
      .length,
    resolved: enquiriesOrThreads.filter((e) => e.status === "resolved").length,
  };
}

export function truncateText(text, max = 72) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}
