const STORAGE_KEY = "thepitch-admin-calendar-pitch";

function readMap() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function readStoredCalendarPitchId(locationDbId) {
  if (!locationDbId) return null;
  const map = readMap();
  const value = map[String(locationDbId)];
  return value ? String(value) : null;
}

export function writeStoredCalendarPitchId(locationDbId, pitchId) {
  if (typeof window === "undefined" || !locationDbId || !pitchId) return;
  try {
    const map = readMap();
    map[String(locationDbId)] = String(pitchId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}
