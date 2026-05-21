export const ADMIN_SETTINGS_STORAGE_KEY = "the_pitch_admin_settings_v1";

export const DEFAULT_ADMIN_SETTINGS = {
  locations: [
    {
      id: "maharagama",
      name: "The Pitch - Maharagama",
      shortName: "Maharagama",
      address: "45 High Level Road, Maharagama",
      phone: "+94 11 456 7890",
      description: "Main indoor stadium with futsal and cricket nets.",
      image: "",
      peakHourRate: 4500,
      nonPeakHourRate: 3000,
      sportIds: ["futsal", "cricket", "badminton"],
      operationalStart: "08:00",
      operationalEnd: "21:00",
      status: "active",
    },
    {
      id: "attidiya",
      name: "The Pitch - Attidiya",
      shortName: "Attidiya",
      address: "12 Dehiwala Road, Attidiya",
      phone: "+94 11 234 5678",
      description: "Coastal venue with multi-sport courts.",
      image: "",
      peakHourRate: 4200,
      nonPeakHourRate: 2800,
      sportIds: ["futsal", "cricket"],
      operationalStart: "07:00",
      operationalEnd: "22:00",
      status: "active",
    },
    {
      id: "moratuwa",
      name: "The Pitch - Moratuwa",
      shortName: "Moratuwa",
      address: "8 Galle Road, Moratuwa",
      phone: "+94 11 987 6543",
      description: "Full-size courts near the beach.",
      image: "",
      peakHourRate: 4000,
      nonPeakHourRate: 2500,
      sportIds: ["futsal", "badminton"],
      operationalStart: "08:00",
      operationalEnd: "20:00",
      status: "active",
    },
  ],
  sports: [
    {
      id: "futsal",
      name: "Futsal",
      slug: "futsal",
      icon: "futsal",
      description: "5-a-side indoor futsal courts",
      status: "active",
    },
    {
      id: "cricket",
      name: "Cricket Nets",
      slug: "cricket",
      icon: "cricket",
      description: "Practice nets with bowling machine option",
      status: "active",
    },
    {
      id: "badminton",
      name: "Badminton",
      slug: "badminton",
      icon: "badminton",
      description: "Indoor badminton courts",
      status: "active",
    },
  ],
  offers: [
    {
      id: "weekend-morning",
      title: "Weekend Morning Special",
      description: "20% off all slots before 12:00 on Sat & Sun",
      discountType: "percent",
      discountValue: 20,
      locationIds: ["maharagama", "attidiya", "moratuwa"],
      startsAt: "2026-05-01",
      endsAt: "2026-08-31",
      status: "active",
    },
    {
      id: "weekday-bundle",
      title: "Weekday 3-Hour Bundle",
      description: "Book 3 consecutive hours on weekdays and save LKR 1,500",
      discountType: "fixed",
      discountValue: 1500,
      locationIds: ["moratuwa"],
      startsAt: "2026-05-01",
      endsAt: "2026-12-31",
      status: "active",
    },
  ],
  general: {
    businessName: "The Pitch Indoor Stadium",
    tagline: "Book your game. Play your best.",
    supportEmail: "hello@thepitch.lk",
    supportPhone: "+94 11 000 0000",
    currency: "LKR",
    defaultSlotMinutes: 60,
    bookingLeadTimeHours: 2,
    cancellationHours: 24,
  },
};

export const DEFAULT_OPERATIONAL_START = "08:00";
export const DEFAULT_OPERATIONAL_END = "21:00";

export function normalizeLocation(location) {
  return {
    ...location,
    dbId: location.dbId ?? null,
    description: location.description ?? "",
    image: location.image ?? "",
    peakHourRate: Number(location.peakHourRate) || 0,
    nonPeakHourRate: Number(location.nonPeakHourRate) || 0,
    sportIds: Array.isArray(location.sportIds) ? location.sportIds : [],
    operationalStart: location.operationalStart || DEFAULT_OPERATIONAL_START,
    operationalEnd: location.operationalEnd || DEFAULT_OPERATIONAL_END,
  };
}

export function slugifyId(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function locationToNavItem(location) {
  return {
    id: location.id,
    label: location.name,
    filterValue: location.shortName,
  };
}
