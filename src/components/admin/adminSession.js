const STORAGE_KEY = "pitch_admin_user";

export const defaultAdminUser = {
  name: "Admin User",
  email: "admin@thepitch.com",
  role: "admin",
};

export function getAdminUser() {
  if (typeof window === "undefined") return defaultAdminUser;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultAdminUser, ...JSON.parse(stored) };
  } catch {
    // ignore invalid session data
  }

  return defaultAdminUser;
}

export function clearAdminSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function setAdminUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}
