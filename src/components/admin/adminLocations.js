export const ADMIN_LOCATIONS = [
  {
    id: "maharagama",
    label: "The Pitch - Maharagama",
    filterValue: "Maharagama",
  },
  {
    id: "attidiya",
    label: "The Pitch - Attidiya",
    filterValue: "Attidiya",
  },
  {
    id: "moratuwa",
    label: "The Pitch - Moratuwa",
    filterValue: "Moratuwa",
  },
];

export const DEFAULT_LOCATION_ID = ADMIN_LOCATIONS[0].id;

export function getLocationById(id) {
  if (id === "all") return ADMIN_LOCATIONS[0];
  return ADMIN_LOCATIONS.find((loc) => loc.id === id) ?? ADMIN_LOCATIONS[0];
}
