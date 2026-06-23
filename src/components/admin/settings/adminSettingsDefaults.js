export const ADMIN_SETTINGS_STORAGE_KEY = "the_pitch_admin_settings_v1";

// ---------------------------------------------------------------------------
// Day-of-week: 0 = Monday … 6 = Sunday  (matches location_peaktimemapping.date_id)
// ---------------------------------------------------------------------------

/**
 * Default location data used when Supabase is not configured.
 * openTimeMappings / peakTimeMappings replace the old flat time columns.
 */
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
      sportIds: ["futsal", "cricket", "badminton"],
      // Mon–Fri: 08:00–21:00, Sat: 08:00–21:00, Sun: 09:00–18:00
      openTimeMappings: [
        { dateId: 0, openTime: "08:00", closeTime: "21:00" },
        { dateId: 1, openTime: "08:00", closeTime: "21:00" },
        { dateId: 2, openTime: "08:00", closeTime: "21:00" },
        { dateId: 3, openTime: "08:00", closeTime: "21:00" },
        { dateId: 4, openTime: "08:00", closeTime: "21:00" },
        { dateId: 5, openTime: "08:00", closeTime: "21:00" },
        { dateId: 6, openTime: "09:00", closeTime: "18:00" },
      ],
      // Mon–Sun: 18:00–22:00
      peakTimeMappings: [
        { dateId: 0, startTime: "18:00", endTime: "22:00" },
        { dateId: 1, startTime: "18:00", endTime: "22:00" },
        { dateId: 2, startTime: "18:00", endTime: "22:00" },
        { dateId: 3, startTime: "18:00", endTime: "22:00" },
        { dateId: 4, startTime: "18:00", endTime: "22:00" },
        { dateId: 5, startTime: "18:00", endTime: "22:00" },
        { dateId: 6, startTime: "17:00", endTime: "18:00" },
      ],
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
      sportIds: ["futsal", "cricket"],
      openTimeMappings: [
        { dateId: 0, openTime: "07:00", closeTime: "22:00" },
        { dateId: 1, openTime: "07:00", closeTime: "22:00" },
        { dateId: 2, openTime: "07:00", closeTime: "22:00" },
        { dateId: 3, openTime: "07:00", closeTime: "22:00" },
        { dateId: 4, openTime: "07:00", closeTime: "22:00" },
        { dateId: 5, openTime: "07:00", closeTime: "22:00" },
        { dateId: 6, openTime: "09:00", closeTime: "20:00" },
      ],
      peakTimeMappings: [
        { dateId: 0, startTime: "18:00", endTime: "22:00" },
        { dateId: 1, startTime: "18:00", endTime: "22:00" },
        { dateId: 2, startTime: "18:00", endTime: "22:00" },
        { dateId: 3, startTime: "18:00", endTime: "22:00" },
        { dateId: 4, startTime: "18:00", endTime: "22:00" },
        { dateId: 5, startTime: "18:00", endTime: "22:00" },
        { dateId: 6, startTime: "17:00", endTime: "20:00" },
      ],
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
      sportIds: ["futsal", "badminton"],
      openTimeMappings: [
        { dateId: 0, openTime: "08:00", closeTime: "20:00" },
        { dateId: 1, openTime: "08:00", closeTime: "20:00" },
        { dateId: 2, openTime: "08:00", closeTime: "20:00" },
        { dateId: 3, openTime: "08:00", closeTime: "20:00" },
        { dateId: 4, openTime: "08:00", closeTime: "20:00" },
        { dateId: 5, openTime: "08:00", closeTime: "20:00" },
        { dateId: 6, openTime: "09:00", closeTime: "18:00" },
      ],
      peakTimeMappings: [
        { dateId: 0, startTime: "18:00", endTime: "20:00" },
        { dateId: 1, startTime: "18:00", endTime: "20:00" },
        { dateId: 2, startTime: "18:00", endTime: "20:00" },
        { dateId: 3, startTime: "18:00", endTime: "20:00" },
        { dateId: 4, startTime: "18:00", endTime: "20:00" },
        { dateId: 5, startTime: "18:00", endTime: "20:00" },
        { dateId: 6, startTime: "16:00", endTime: "18:00" },
      ],
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
      id: "weekend20",
      code: "WEEKEND20",
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
      id: "weekday3h",
      code: "WEEKDAY3H",
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

export function normalizeLocation(location) {
  return {
    ...location,
    dbId: location.dbId ?? null,
    description: location.description ?? "",
    image: location.image ?? "",
    sportIds: Array.isArray(location.sportIds) ? location.sportIds : [],
    openTimeMappings: Array.isArray(location.openTimeMappings)
      ? location.openTimeMappings
      : [],
    peakTimeMappings: Array.isArray(location.peakTimeMappings)
      ? location.peakTimeMappings
      : [],
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
