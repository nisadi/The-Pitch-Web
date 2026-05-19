export function formatCustomerAmount(amount) {
  return `LKR ${Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

export function filterCustomers(customers, { location, status, query }) {
  const search = query.trim().toLowerCase();

  return customers.filter((customer) => {
    if (status !== "all" && customer.status !== status) return false;
    if (location !== "all" && customer.location !== location) return false;

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

export function filterEnquiries(enquiries, { location, status, query }) {
  const search = query.trim().toLowerCase();

  return enquiries.filter((enquiry) => {
    if (status !== "all" && enquiry.status !== status) return false;
    if (location !== "all" && enquiry.location !== location) return false;

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
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

  const recentVisitors = customers.filter((c) => c.lastVisit >= cutoff);

  return {
    total: customers.length,
    active: active.length,
    recentVisitors: recentVisitors.length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
  };
}

export function summarizeEnquiries(enquiries) {
  return {
    total: enquiries.length,
    new: enquiries.filter((e) => e.status === "new").length,
    inProgress: enquiries.filter((e) => e.status === "in_progress").length,
    resolved: enquiries.filter((e) => e.status === "resolved").length,
  };
}

export function truncateText(text, max = 72) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}
