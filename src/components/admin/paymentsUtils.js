export function formatPaymentAmount(amount) {
  return `LKR ${Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPaymentDate(date, time) {
  const parsed = new Date(`${date}T${time || "00:00"}`);
  return parsed.toLocaleString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDateRange(preset, customFrom, customTo) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  if (preset === "custom") {
    return { from: customFrom || "", to: customTo || "" };
  }

  if (preset === "today") {
    const key = toKey(today);
    return { from: key, to: key };
  }

  if (preset === "last7") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: toKey(from), to: toKey(today) };
  }

  if (preset === "last30") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from: toKey(from), to: toKey(today) };
  }

  if (preset === "thisMonth") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toKey(from), to: toKey(today) };
  }

  return { from: "", to: "" };
}

export function filterPayments(
  payments,
  { from, to, status, location, locationAliases, query }
) {
  const search = query.trim().toLowerCase();
  const aliases =
    locationAliases ??
    (location && location !== "all" ? [location] : []);

  return payments.filter((payment) => {
    if (from && payment.date < from) return false;
    if (to && payment.date > to) return false;
    if (status !== "all" && payment.status !== status) return false;
    if (aliases.length > 0 && payment.location) {
      const loc = payment.location.toLowerCase();
      const matchesVenue = aliases.some((alias) => alias.toLowerCase() === loc);
      if (!matchesVenue) return false;
    }

    if (!search) return true;

    const haystack = [
      payment.id,
      payment.reference,
      payment.customerName,
      payment.customerPhone,
      payment.description,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

export function summarizePayments(payments) {
  const completed = payments.filter((p) => p.status === "completed");
  const pending = payments.filter((p) => p.status === "pending");
  const failed = payments.filter((p) => p.status === "failed");

  return {
    totalRevenue: completed.reduce((sum, p) => sum + p.amount, 0),
    transactionCount: payments.length,
    pendingCount: pending.length,
    pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
    failedCount: failed.length,
  };
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function exportPaymentsCsv(payments, filename = "payment-summary.csv") {
  const headers = [
    "Transaction ID",
    "Date",
    "Time",
    "Reference",
    "Customer",
    "Email",
    "Location",
    "Description",
    "Method",
    "Method (other)",
    "Status",
    "Amount (LKR)",
  ];

  const rows = payments.map((payment) => [
    payment.id,
    payment.date,
    payment.time,
    payment.reference,
    payment.customerName,
    payment.customerEmail ?? payment.customerPhone,
    payment.location,
    payment.description,
    payment.method,
    payment.methodOther ?? "",
    payment.status,
    payment.amount,
  ]);

  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
