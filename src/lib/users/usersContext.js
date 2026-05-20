"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  DEFAULT_TEAM_USERS,
  compareUsers,
  normalizeUser,
  USERS_STORAGE_KEY,
} from "./usersDefaults";
import {
  applyRoleRealtimeEvent,
  fetchRoleUsersFromSupabase,
  subscribeToRoleUsers,
} from "./roleRealtime";
import {
  createTeamUser,
  deleteTeamUser,
  fetchTeamUsers,
  fetchUserRoles,
  updateTeamUser,
} from "./usersRepository";
import { sortRoles, USER_ROLES as FALLBACK_ROLES } from "./userRoles";

const LEGACY_STORAGE_KEYS = [
  "the_pitch_admin_users_v2",
  "the_pitch_admin_users_v1",
];

const UsersContext = createContext(null);

function rolesToMap(roles) {
  return Object.fromEntries(roles.map((role) => [role.id, role]));
}

function sortUsers(list) {
  return [...list].sort(compareUsers);
}

function loadUsersFromStorage() {
  if (typeof window === "undefined") {
    return DEFAULT_TEAM_USERS.map(normalizeUser);
  }

  const readKey = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : parsed.users;
      return Array.isArray(list) ? list.map(normalizeUser) : null;
    } catch {
      return null;
    }
  };

  const current = readKey(USERS_STORAGE_KEY);
  if (current) return current;

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = readKey(key);
    if (legacy) {
      localStorage.removeItem(key);
      return legacy;
    }
  }

  return DEFAULT_TEAM_USERS.map(normalizeUser);
}

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(() => sortRoles());
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const usesSupabase = isSupabaseConfigured();

  const setUsersSorted = useCallback((updater) => {
    setUsers((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : updater;
      return sortUsers(next);
    });
  }, []);

  const refreshUsers = useCallback(async () => {
    if (!usesSupabase) return;
    const list = await fetchRoleUsersFromSupabase();
    setUsersSorted(list);
    setSyncError(null);
  }, [usesSupabase, setUsersSorted]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeRealtime = () => {};

    async function init() {
      const remoteRoles = await fetchUserRoles();
      if (!cancelled && remoteRoles?.length) {
        setRoles(sortRoles(remoteRoles));
      }

      if (!usesSupabase) {
        const remoteUsers = await fetchTeamUsers();
        if (!cancelled) {
          setUsersSorted(remoteUsers ?? loadUsersFromStorage());
          setReady(true);
        }
        return;
      }

      try {
        const initial = await fetchRoleUsersFromSupabase();
        if (cancelled) return;

        setUsersSorted(initial);
        setSyncError(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(USERS_STORAGE_KEY);
          LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        }

        unsubscribeRealtime = subscribeToRoleUsers((payload) => {
          setUsersSorted((prev) => applyRoleRealtimeEvent(prev, payload));
        });
      } catch (err) {
        if (cancelled) return;
        setSyncError(err?.message ?? "Could not connect to Supabase");
        setUsersSorted(loadUsersFromStorage());
      }

      if (!cancelled) setReady(true);
    }

    init();

    return () => {
      cancelled = true;
      unsubscribeRealtime();
    };
  }, [usesSupabase, setUsersSorted]);

  const rolesById = useMemo(() => rolesToMap(roles), [roles]);

  const getRole = useCallback(
    (roleId) => rolesById[roleId] ?? FALLBACK_ROLES[roleId] ?? null,
    [rolesById]
  );

  const inviteUser = useCallback(
    async (payload) => {
      const email = payload.email.trim().toLowerCase();

      if (users.some((user) => user.email === email)) {
        window.alert("A user with this email already exists.");
        return false;
      }

      if (!payload.password || payload.password.length < 8) {
        window.alert("Password must be at least 8 characters.");
        return false;
      }

      try {
        const created = await createTeamUser({
          name: payload.name.trim(),
          email,
          roleId: payload.roleId ?? payload.role ?? "staff",
          status: "active",
          password: payload.password,
        });

        setUsersSorted((prev) => {
          const rest = prev.filter(
            (user) => user.email !== created.email && user.id !== created.id
          );
          return [...rest, created];
        });
        return true;
      } catch (err) {
        window.alert(err?.message ?? "Could not create user.");
        await refreshUsers();
        return false;
      }
    },
    [users, setUsersSorted, refreshUsers]
  );

  const updateUser = useCallback(
    async (id, patch) => {
      const existing = users.find((user) => user.id === id);
      if (!existing) return;

      const nextPatch = { ...patch };
      if (patch.roleId !== undefined || patch.role !== undefined) {
        nextPatch.roleId = patch.roleId ?? patch.role;
      }

      const optimistic = normalizeUser({ ...existing, ...nextPatch });
      setUsersSorted((prev) =>
        prev.map((user) => (user.id === id ? optimistic : user))
      );

      try {
        const updated = await updateTeamUser(existing, {
          name: optimistic.name,
          email: optimistic.email,
          roleId: optimistic.roleId,
          status: optimistic.status,
          password: patch.password,
        });

        setUsersSorted((prev) =>
          prev.map((user) => (user.id === id ? updated : user))
        );
      } catch (err) {
        const message =
          err?.message ??
          err?.details ??
          err?.hint ??
          "Could not update user in Supabase.";
        window.alert(message);
        await refreshUsers();
      }
    },
    [users, setUsersSorted, refreshUsers]
  );

  const removeUser = useCallback(
    async (id) => {
      const snapshot = users;
      setUsersSorted((prev) => prev.filter((user) => user.id !== id));

      const target = snapshot.find((user) => user.id === id);
      if (!target) return;

      try {
        await deleteTeamUser(target);
      } catch (err) {
        window.alert(err?.message ?? "Could not remove user.");
        setUsersSorted(snapshot);
        await refreshUsers();
      }
    },
    [users, setUsersSorted, refreshUsers]
  );

  const value = useMemo(
    () => ({
      ready,
      syncError,
      users,
      roles,
      rolesById,
      getRole,
      inviteUser,
      updateUser,
      removeUser,
      refreshUsers,
    }),
    [
      ready,
      syncError,
      users,
      roles,
      rolesById,
      getRole,
      inviteUser,
      updateUser,
      removeUser,
      refreshUsers,
    ]
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
