const STORAGE_KEY = "pitch_admin_session";

export function getAdminUser() {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed?.email || !parsed?.roleId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function setAdminSession(user) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId ?? user.role,
      role: user.roleId ?? user.role,
      status: user.status,
    })
  );
}

/** @deprecated Use setAdminSession */
export function setAdminUser(user) {
  setAdminSession(user);
}

export function isAdminLoggedIn() {
  return Boolean(getAdminUser());
}
