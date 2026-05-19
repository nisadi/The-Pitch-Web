"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_TEAM_USERS,
  normalizeUser,
  slugifyUserId,
  USERS_STORAGE_KEY,
} from "./usersDefaults";

const UsersContext = createContext(null);

function loadUsers() {
  if (typeof window === "undefined") {
    return DEFAULT_TEAM_USERS.map(normalizeUser);
  }

  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return DEFAULT_TEAM_USERS.map(normalizeUser);
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed.users;
    if (!Array.isArray(list)) return DEFAULT_TEAM_USERS.map(normalizeUser);
    return list.map(normalizeUser);
  } catch {
    return DEFAULT_TEAM_USERS.map(normalizeUser);
  }
}

function persistUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUsers(loadUsers());
    setReady(true);
  }, []);

  const commit = useCallback((updater) => {
    setUsers((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistUsers(next);
      return next;
    });
  }, []);

  const inviteUser = useCallback(
    (payload) => {
      const email = payload.email.trim().toLowerCase();
      const id = slugifyUserId(email);
      const today = new Date().toISOString().slice(0, 10);

      let created = false;
      commit((prev) => {
        if (prev.some((user) => user.email === email)) {
          window.alert("A user with this email already exists.");
          return prev;
        }

        created = true;
        return [
          ...prev,
          normalizeUser({
            id,
            name: payload.name.trim(),
            email,
            role: payload.role,
            status: "invited",
            locations: payload.locations ?? [],
            lastActive: "",
            invitedAt: today,
          }),
        ];
      });

      return created;
    },
    [commit]
  );

  const updateUser = useCallback(
    (id, patch) => {
      commit((prev) =>
        prev.map((user) =>
          user.id === id ? normalizeUser({ ...user, ...patch }) : user
        )
      );
    },
    [commit]
  );

  const removeUser = useCallback(
    (id) => {
      commit((prev) => prev.filter((user) => user.id !== id));
    },
    [commit]
  );

  const resendInvite = useCallback(
    (id) => {
      updateUser(id, {
        status: "invited",
        invitedAt: new Date().toISOString().slice(0, 10),
      });
    },
    [updateUser]
  );

  const value = useMemo(
    () => ({
      ready,
      users,
      inviteUser,
      updateUser,
      removeUser,
      resendInvite,
    }),
    [ready, users, inviteUser, updateUser, removeUser, resendInvite]
  );

  return (
    <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error("useUsers must be used within UsersProvider");
  }
  return context;
}
