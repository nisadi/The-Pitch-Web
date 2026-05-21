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
  applyLocationRealtimeEvent,
  fetchLocationsFromSupabase,
  subscribeToLocations,
} from "@/lib/locations/locationRealtime";
import {
  deleteLocationClient,
  upsertLocationClient,
} from "@/lib/locations/locationMutations";
import {
  applySportRealtimeEvent,
  fetchSportsFromSupabase,
  subscribeToSports,
} from "@/lib/sports/sportRealtime";
import {
  deleteSportClient,
  upsertSportClient,
} from "@/lib/sports/sportMutations";
import { normalizeSport } from "@/lib/sports/sportMapper";
import {
  ADMIN_SETTINGS_STORAGE_KEY,
  DEFAULT_ADMIN_SETTINGS,
  locationToNavItem,
  normalizeLocation,
  slugifyId,
} from "./adminSettingsDefaults";

const AdminSettingsContext = createContext(null);

function sortLocations(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

function sortSports(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

function loadSettings() {
  if (typeof window === "undefined") return DEFAULT_ADMIN_SETTINGS;

  try {
    const raw = localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      locations: (parsed.locations ?? DEFAULT_ADMIN_SETTINGS.locations).map(
        normalizeLocation
      ),
      sports: (parsed.sports ?? DEFAULT_ADMIN_SETTINGS.sports).map(normalizeSport),
      offers: parsed.offers ?? DEFAULT_ADMIN_SETTINGS.offers,
      general: { ...DEFAULT_ADMIN_SETTINGS.general, ...parsed.general },
    };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

function persistSettings(settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function AdminSettingsProvider({ children }) {
  const usesSupabase = isSupabaseConfigured();
  const [settings, setSettings] = useState(DEFAULT_ADMIN_SETTINGS);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const commit = useCallback(
    (updater) => {
      setSettings((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (!usesSupabase) {
          persistSettings(next);
        } else {
          const stored = loadSettings();
          persistSettings({
            ...stored,
            sports: next.sports,
            offers: next.offers,
            general: next.general,
          });
        }
        return next;
      });
    },
    [usesSupabase]
  );

  const setLocationsSorted = useCallback((updater) => {
    setSettings((prev) => {
      const nextLocations =
        typeof updater === "function" ? updater(prev.locations) : updater;
      return { ...prev, locations: sortLocations(nextLocations) };
    });
  }, []);

  const setSportsSorted = useCallback((updater) => {
    setSettings((prev) => {
      const nextSports =
        typeof updater === "function" ? updater(prev.sports) : updater;
      return { ...prev, sports: sortSports(nextSports) };
    });
  }, []);

  const refreshLocations = useCallback(async () => {
    if (!usesSupabase) return;
    const list = await fetchLocationsFromSupabase();
    setLocationsSorted(list);
    setSyncError(null);
  }, [usesSupabase, setLocationsSorted]);

  const refreshSports = useCallback(async () => {
    if (!usesSupabase) return;
    const list = await fetchSportsFromSupabase();
    setSportsSorted(list);
    setSyncError(null);
  }, [usesSupabase, setSportsSorted]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeLocations = () => {};
    let unsubscribeSports = () => {};

    async function init() {
      const local = loadSettings();

      if (!usesSupabase) {
        if (!cancelled) {
          setSettings(local);
          setReady(true);
        }
        return;
      }

      const errors = [];

      try {
        const remoteLocations = await fetchLocationsFromSupabase();
        if (!cancelled) {
          setSettings((prev) => ({
            ...prev,
            locations: remoteLocations.length
              ? remoteLocations
              : prev.locations,
          }));
        }
      } catch (err) {
        errors.push(err?.message ?? "Could not load locations from Supabase.");
      }

      try {
        const remoteSports = await fetchSportsFromSupabase();
        if (!cancelled) {
          setSettings((prev) => ({
            ...prev,
            sports: remoteSports.length ? remoteSports : prev.sports,
          }));
        }
      } catch (err) {
        errors.push(err?.message ?? "Could not load sports from Supabase.");
      }

      if (!cancelled) {
        setSyncError(errors.length ? errors.join(" ") : null);
        setReady(true);

        unsubscribeLocations = subscribeToLocations((payload) => {
          setLocationsSorted((prev) =>
            applyLocationRealtimeEvent(prev, payload)
          );
          setSyncError(null);
        });

        unsubscribeSports = subscribeToSports((payload) => {
          setSportsSorted((prev) => applySportRealtimeEvent(prev, payload));
          setSyncError(null);
        });
      }
    }

    init();

    return () => {
      cancelled = true;
      unsubscribeLocations();
      unsubscribeSports();
    };
  }, [usesSupabase, setLocationsSorted, setSportsSorted]);

  const addLocation = useCallback(
    async (location) => {
      const id = location.id || slugifyId(location.shortName || location.name);
      const normalized = normalizeLocation({ ...location, id });

      if (usesSupabase) {
        const created = await upsertLocationClient(normalized);
        setLocationsSorted((prev) => {
          const rest = prev.filter(
            (item) => item.id !== created.id && item.dbId !== created.dbId
          );
          return [...rest, created];
        });
        return created.id;
      }

      commit((prev) => ({
        ...prev,
        locations: [...prev.locations, normalized],
      }));
      return id;
    },
    [usesSupabase, commit, setLocationsSorted]
  );

  const updateLocation = useCallback(
    async (id, patch) => {
      const existing = settings.locations.find((item) => item.id === id);
      if (!existing) return;

      const optimistic = normalizeLocation({ ...existing, ...patch });

      setLocationsSorted((prev) =>
        prev.map((item) => (item.id === id ? optimistic : item))
      );

      if (!usesSupabase) {
        commit((prev) => ({
          ...prev,
          locations: prev.locations.map((item) =>
            item.id === id ? optimistic : item
          ),
        }));
        return;
      }

      try {
        const updated = await upsertLocationClient(optimistic);
        setLocationsSorted((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        setSyncError(null);
      } catch (err) {
        setSyncError(err?.message ?? "Could not update location in Supabase.");
        await refreshLocations();
        throw err;
      }
    },
    [
      settings.locations,
      usesSupabase,
      commit,
      setLocationsSorted,
      refreshLocations,
    ]
  );

  const removeLocation = useCallback(
    async (id) => {
      const existing = settings.locations.find((item) => item.id === id);
      const snapshot = settings.locations;

      setLocationsSorted((prev) => prev.filter((item) => item.id !== id));

      if (!usesSupabase) {
        commit((prev) => ({
          ...prev,
          locations: prev.locations.filter((item) => item.id !== id),
          offers: prev.offers.map((offer) => ({
            ...offer,
            locationIds: offer.locationIds.filter((locId) => locId !== id),
          })),
        }));
        return;
      }

      if (!existing) return;

      try {
        await deleteLocationClient(existing);
        setSyncError(null);
      } catch (err) {
        setLocationsSorted(snapshot);
        setSyncError(err?.message ?? "Could not delete location in Supabase.");
        throw err;
      }
    },
    [settings.locations, usesSupabase, commit, setLocationsSorted]
  );

  const addSport = useCallback(
    async (sport) => {
      const normalized = normalizeSport(sport);

      if (usesSupabase) {
        const created = await upsertSportClient(normalized);
        setSportsSorted((prev) => {
          const rest = prev.filter(
            (item) => item.id !== created.id && item.dbId !== created.dbId
          );
          return [...rest, created];
        });
        return created.id;
      }

      const localId = sport.id || slugifyId(sport.name);
      const local = normalizeSport({ ...normalized, id: localId, dbId: null });

      commit((prev) => ({
        ...prev,
        sports: [...prev.sports, local],
      }));
      return localId;
    },
    [usesSupabase, commit, setSportsSorted]
  );

  const updateSport = useCallback(
    async (id, patch) => {
      const existing = settings.sports.find((item) => item.id === id);
      if (!existing) return;

      const optimistic = normalizeSport({ ...existing, ...patch, id });

      setSportsSorted((prev) =>
        prev.map((item) => (item.id === id ? optimistic : item))
      );

      if (!usesSupabase) {
        commit((prev) => ({
          ...prev,
          sports: prev.sports.map((item) =>
            item.id === id ? optimistic : item
          ),
        }));
        return;
      }

      try {
        const updated = await upsertSportClient(optimistic);
        setSportsSorted((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        setSyncError(null);
      } catch (err) {
        setSyncError(err?.message ?? "Could not update sport in Supabase.");
        await refreshSports();
        throw err;
      }
    },
    [
      settings.sports,
      usesSupabase,
      commit,
      setSportsSorted,
      refreshSports,
    ]
  );

  const removeSport = useCallback(
    async (id) => {
      const existing = settings.sports.find((item) => item.id === id);
      const sportsSnapshot = settings.sports;
      const locationsSnapshot = settings.locations;

      const nextLocations = settings.locations.map((location) => ({
        ...location,
        sportIds: location.sportIds.filter((sportId) => sportId !== id),
      }));

      setSportsSorted((prev) => prev.filter((item) => item.id !== id));
      setLocationsSorted(() => nextLocations);

      if (!usesSupabase) {
        commit((prev) => ({
          ...prev,
          sports: prev.sports.filter((item) => item.id !== id),
          locations: prev.locations.map((location) => ({
            ...location,
            sportIds: location.sportIds.filter((sportId) => sportId !== id),
          })),
        }));
        return;
      }

      if (!existing) return;

      try {
        await deleteSportClient(existing);

        const changedLocations = locationsSnapshot.filter((location) =>
          location.sportIds.includes(id)
        );

        for (const location of changedLocations) {
          const updated = normalizeLocation({
            ...location,
            sportIds: location.sportIds.filter((sportId) => sportId !== id),
          });
          await upsertLocationClient(updated);
        }

        setSyncError(null);
      } catch (err) {
        setSportsSorted(sportsSnapshot);
        setLocationsSorted(locationsSnapshot);
        setSyncError(err?.message ?? "Could not delete sport in Supabase.");
        throw err;
      }
    },
    [
      settings.sports,
      settings.locations,
      usesSupabase,
      commit,
      setSportsSorted,
      setLocationsSorted,
    ]
  );

  const addOffer = useCallback(
    (offer) => {
      const id = offer.id || slugifyId(offer.title);
      commit((prev) => ({
        ...prev,
        offers: [...prev.offers, { ...offer, id }],
      }));
      return id;
    },
    [commit]
  );

  const updateOffer = useCallback(
    (id, patch) => {
      commit((prev) => ({
        ...prev,
        offers: prev.offers.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      }));
    },
    [commit]
  );

  const removeOffer = useCallback(
    (id) => {
      commit((prev) => ({
        ...prev,
        offers: prev.offers.filter((item) => item.id !== id),
      }));
    },
    [commit]
  );

  const updateGeneral = useCallback(
    (patch) => {
      commit((prev) => ({
        ...prev,
        general: { ...prev.general, ...patch },
      }));
    },
    [commit]
  );

  const resetSettings = useCallback(() => {
    persistSettings(DEFAULT_ADMIN_SETTINGS);
    setSettings(DEFAULT_ADMIN_SETTINGS);
    if (usesSupabase) {
      void refreshLocations();
      void refreshSports();
    }
  }, [usesSupabase, refreshLocations, refreshSports]);

  const navLocations = useMemo(
    () =>
      settings.locations
        .filter((loc) => loc.status === "active")
        .map(locationToNavItem),
    [settings.locations]
  );

  const value = useMemo(
    () => ({
      ready,
      syncError,
      usesSupabaseLocations: usesSupabase,
      usesSupabaseSports: usesSupabase,
      settings,
      locations: settings.locations,
      sports: settings.sports,
      offers: settings.offers,
      general: settings.general,
      navLocations,
      refreshLocations,
      refreshSports,
      addLocation,
      updateLocation,
      removeLocation,
      addSport,
      updateSport,
      removeSport,
      addOffer,
      updateOffer,
      removeOffer,
      updateGeneral,
      resetSettings,
    }),
    [
      ready,
      syncError,
      usesSupabase,
      settings,
      navLocations,
      refreshLocations,
      refreshSports,
      addLocation,
      updateLocation,
      removeLocation,
      addSport,
      updateSport,
      removeSport,
      addOffer,
      updateOffer,
      removeOffer,
      updateGeneral,
      resetSettings,
    ]
  );

  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext);
  if (!context) {
    throw new Error("useAdminSettings must be used within AdminSettingsProvider");
  }
  return context;
}
