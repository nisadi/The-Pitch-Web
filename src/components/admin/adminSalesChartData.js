export const salesOverviewData = {
  thisPeriod: {
    label: "This period (May 12 – 18)",
    points: [
      { date: "12 May", tooltipDate: "Mon 12 May", value: 800 },
      { date: "13 May", tooltipDate: "Tue 13 May", value: 0 },
      { date: "14 May", tooltipDate: "Wed 14 May", value: 2200 },
      { date: "15 May", tooltipDate: "Thu 15 May", value: 2100 },
      { date: "16 May", tooltipDate: "Fri 16 May", value: 900 },
      { date: "17 May", tooltipDate: "Sat 17 May", value: 700 },
      { date: "18 May", tooltipDate: "Sun 18 May", value: 600 },
    ],
  },
  lastPeriod: {
    label: "Last period (May 5 – 11)",
    points: [
      { date: "12 May", tooltipDate: "Mon 5 May", value: 1200 },
      { date: "13 May", tooltipDate: "Tue 6 May", value: 2100 },
      { date: "14 May", tooltipDate: "Wed 7 May", value: 450 },
      { date: "15 May", tooltipDate: "Thu 8 May", value: 0 },
      { date: "16 May", tooltipDate: "Fri 9 May", value: 980 },
      { date: "17 May", tooltipDate: "Sat 10 May", value: 320 },
      { date: "18 May", tooltipDate: "Sun 11 May", value: 180 },
    ],
  },
};

export function sumSalesPoints(points) {
  return points.reduce((sum, point) => sum + point.value, 0);
}

export function formatPercentChange(current, previous) {
  if (previous === 0) {
    if (current === 0) return null;
    return { text: "+100%", up: true };
  }

  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;

  return {
    text: `${pct > 0 ? "+" : ""}${pct}%`,
    up: pct > 0,
  };
}

export function formatLkr(amount, compact = false) {
  if (compact) {
    if (amount >= 1000) return `LKR ${Math.round(amount / 1000)}K`;
    return `LKR ${amount}`;
  }
  return `LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
