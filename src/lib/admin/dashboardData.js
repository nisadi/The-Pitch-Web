import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const BOOKING_METRICS_SELECT =
  "id, booking_date, booking_status, total_amount";

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatChartDayLabel(dateKey) {
  const parsed = new Date(`${dateKey}T12:00:00`);
  return parsed.toLocaleDateString("en-LK", { day: "numeric", month: "short" });
}

function formatChartTooltipLabel(dateKey) {
  const parsed = new Date(`${dateKey}T12:00:00`);
  return parsed.toLocaleDateString("en-LK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatPeriodLabel(fromKey, toKey) {
  const from = new Date(`${fromKey}T12:00:00`);
  const to = new Date(`${toKey}T12:00:00`);
  const fromStr = from.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
  });
  const toStr = to.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
  });
  return `${fromStr} – ${toStr}`;
}

export function formatDashboardLkr(amount) {
  return `LKR ${Number(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isActiveBooking(row) {
  return row.booking_status !== "cancelled";
}

function countsTowardRevenue(row) {
  return (
    row.booking_status !== "cancelled" && row.booking_status !== "blocked"
  );
}

function sumRevenueForDate(bookings, dateKey) {
  return bookings
    .filter((b) => b.booking_date === dateKey && countsTowardRevenue(b))
    .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
}

function buildDailyPoints(bookings, startKey, endKey) {
  const start = new Date(`${startKey}T12:00:00`);
  const end = new Date(`${endKey}T12:00:00`);
  const points = [];

  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const key = toDateKey(d);
    points.push({
      date: formatChartDayLabel(key),
      tooltipDate: formatChartTooltipLabel(key),
      value: sumRevenueForDate(bookings, key),
    });
  }

  return points;
}

export function computeDashboardMetrics(bookings, upcomingEvents, now = new Date()) {
  const todayKey = toDateKey(now);

  const todayActive = bookings.filter(
    (b) => b.booking_date === todayKey && isActiveBooking(b)
  );

  const todayRevenueBookings = todayActive.filter(countsTowardRevenue);
  const todaySales = todayRevenueBookings.reduce(
    (sum, b) => sum + (Number(b.total_amount) || 0),
    0
  );

  const revenueCount = todayRevenueBookings.length;
  const averageTicket =
    revenueCount > 0 ? todaySales / revenueCount : 0;

  return {
    todayBookings: todayActive.length,
    todaySales,
    upcomingEvents,
    averageTicket,
  };
}

export function buildSalesOverviewFromBookings(bookings, now = new Date()) {
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);

  const thisPeriodEnd = toDateKey(today);
  const thisPeriodStart = toDateKey(addDays(today, -6));
  const lastPeriodEnd = toDateKey(addDays(today, -7));
  const lastPeriodStart = toDateKey(addDays(today, -13));

  const thisPoints = buildDailyPoints(
    bookings,
    thisPeriodStart,
    thisPeriodEnd
  );
  const lastPoints = buildDailyPoints(
    bookings,
    lastPeriodStart,
    lastPeriodEnd
  );

  const maxValue = Math.max(
    2500,
    ...thisPoints.map((p) => p.value),
    ...lastPoints.map((p) => p.value),
    1
  );

  return {
    thisPeriod: {
      label: `This period (${formatPeriodLabel(thisPeriodStart, thisPeriodEnd)})`,
      points: thisPoints,
    },
    lastPeriod: {
      label: `Last period (${formatPeriodLabel(lastPeriodStart, lastPeriodEnd)})`,
      points: lastPoints,
    },
    maxY: Math.ceil(maxValue / 500) * 500 || 2500,
  };
}

export async function fetchDashboardBookings(now = new Date()) {
  if (!isSupabaseConfigured()) return [];

  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const fromKey = toDateKey(addDays(today, -13));

  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_METRICS_SELECT)
    .gte("booking_date", fromKey)
    .order("booking_date");

  if (error) throw error;
  return data ?? [];
}

export async function fetchUpcomingEventInquiryCount() {
  if (!isSupabaseConfigured()) return 0;

  const supabase = createClient();
  const { count, error } = await supabase
    .from("event_inquiries")
    .select("id", { count: "exact", head: true })
    .in("status", ["new", "in_progress"]);

  if (error) throw error;
  return count ?? 0;
}

export async function fetchDashboardSnapshot(now = new Date()) {
  const [bookings, upcomingEvents] = await Promise.all([
    fetchDashboardBookings(now),
    fetchUpcomingEventInquiryCount(),
  ]);

  const metrics = computeDashboardMetrics(bookings, upcomingEvents, now);
  const salesOverview = buildSalesOverviewFromBookings(bookings, now);

  return { bookings, metrics, salesOverview };
}

export function subscribeToDashboard(onChange) {
  if (!isSupabaseConfigured()) return () => {};

  const supabase = createClient();
  const channelName = `admin-dashboard-${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "event_inquiries" },
      () => onChange()
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("Dashboard realtime subscription failed");
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
