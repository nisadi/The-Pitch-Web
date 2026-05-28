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
  applyPitchRealtimeEvent,
  fetchPitchesFromSupabase,
  subscribeToPitches,
} from "@/lib/pitches/pitchRealtime";
import {
  deletePitchClient,
  upsertPitchClient,
} from "@/lib/pitches/pitchMutations";
import { normalizePitch } from "@/lib/pitches/pitchMapper";
import {
  applyPromoRealtimeEvent,
  fetchPromosFromSupabase,
  subscribeToPromos,
} from "@/lib/promos/promoRealtime";
import {
  deletePromoClient,
  upsertPromoClient,
} from "@/lib/promos/promoMutations";
import { normalizeOffer } from "@/lib/promos/promoMapper";
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

function sortPitches(list) {
  return [...list].sort((a, b) => {
    const loc = (a.locationName || "").localeCompare(b.locationName || "");
    if (loc !== 0) return loc;
    return a.name.localeCompare(b.name);
  });
}

function sortOffers(list) {
  return [...list].sort((a, b) =>
    (a.title || a.code).localeCompare(b.title || b.code)
  );
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
      offers: (parsed.offers ?? DEFAULT_ADMIN_SETTINGS.offers).map(normalizeOffer),
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
  const [settings, setSettings] = useState({
    ...DEFAULT_ADMIN_SETTINGS,
    pitches: [],
  });
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

  const setOffersSorted = useCallback((updater) => {
    setSettings((prev) => {
      const nextOffers =
        typeof updater === "function" ? updater(prev.offers) : updater;
      return { ...prev, offers: sortOffers(nextOffers) };
    });
  }, []);

  const setPitchesSorted = useCallback((updater) => {
    setSettings((prev) => {
      const nextPitches =
        typeof updater === "function" ? updater(prev.pitches ?? []) : updater;
      return { ...prev, pitches: sortPitches(nextPitches) };
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

  const refreshOffers = useCallback(async () => {
    if (!usesSupabase) return;
    const list = await fetchPromosFromSupabase();
    setOffersSorted(list);
    setSyncError(null);
  }, [usesSupabase, setOffersSorted]);

  const refreshPitches = useCallback(async () => {
    if (!usesSupabase) return;
    const list = await fetchPitchesFromSupabase();
    setPitchesSorted(list);
    setSyncError(null);
  }, [usesSupabase, setPitchesSorted]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeLocations = () => {};
    let unsubscribeSports = () => {};
    let unsubscribePitches = () => {};
    let unsubscribePromos = () => {};

    async function init() {
      const local = loadSettings();

      if (!usesSupabase) {
        if (!cancelled) {
          setSettings({ ...local, pitches: [] });
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

      try {
        const remoteOffers = await fetchPromosFromSupabase();
        if (!cancelled) {
          setSettings((prev) => ({
            ...prev,
            offers: remoteOffers.length ? remoteOffers : prev.offers,
          }));
        }
      } catch (err) {
        errors.push(err?.message ?? "Could not load offers from Supabase.");
      }

      try {
        const remotePitches = await fetchPitchesFromSupabase();
        if (!cancelled) {
          setSettings((prev) => ({
            ...prev,
            pitches: remotePitches,
          }));
        }
      } catch (err) {
        errors.push(err?.message ?? "Could not load pitches from Supabase.");
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

        unsubscribePitches = subscribeToPitches((payload) => {
          setPitchesSorted((prev) => applyPitchRealtimeEvent(prev, payload));
          setSyncError(null);
        });

        unsubscribePromos = subscribeToPromos((payload) => {
          setOffersSorted((prev) => applyPromoRealtimeEvent(prev, payload));
          setSyncError(null);
        });
      }
    }

    init();

    return () => {
      cancelled = true;
      unsubscribeLocations();
      unsubscribeSports();
      unsubscribePitches();
      unsubscribePromos();
    };
  }, [
    usesSupabase,
    setLocationsSorted,
    setSportsSorted,
    setPitchesSorted,
    setOffersSorted,
  ]);

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

  const addPitch = useCallback(
    async (pitch) => {
      const normalized = normalizePitch(pitch);

      if (!usesSupabase) {
        throw new Error("Pitches require Supabase configuration.");
      }

      const created = await upsertPitchClient(normalized);
      setPitchesSorted((prev) => {
        const rest = prev.filter(
          (item) => item.id !== created.id && item.dbId !== created.dbId
        );
        return [...rest, created];
      });
      return created.id;
    },
    [usesSupabase, setPitchesSorted]
  );

  const updatePitch = useCallback(
    async (id, patch) => {
      const existing = (settings.pitches ?? []).find((item) => item.id === id);
      if (!existing) return;

      const optimistic = normalizePitch({ ...existing, ...patch, id });

      setPitchesSorted((prev) =>
        prev.map((item) => (item.id === id ? optimistic : item))
      );

      if (!usesSupabase) return;

      try {
        const updated = await upsertPitchClient(optimistic);
        setPitchesSorted((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        setSyncError(null);
      } catch (err) {
        setSyncError(err?.message ?? "Could not update pitch in Supabase.");
        await refreshPitches();
        throw err;
      }
    },
    [settings.pitches, usesSupabase, setPitchesSorted, refreshPitches]
  );

  const removePitch = useCallback(
    async (pitchOrId) => {
      const pitch =
        typeof pitchOrId === "object" && pitchOrId !== null
          ? pitchOrId
          : (settings.pitches ?? []).find(
              (item) => item.id === pitchOrId || item.dbId === pitchOrId
            );

      if (!pitch?.id && !pitch?.dbId) {
        throw new Error("Pitch not found.");
      }

      const pitchKey = pitch.id ?? pitch.dbId;
      const snapshot = settings.pitches ?? [];

      setPitchesSorted((prev) =>
        prev.filter((item) => item.id !== pitchKey && item.dbId !== pitchKey)
      );

      if (!usesSupabase) return;

      try {
        await deletePitchClient(pitch);
        setSyncError(null);
      } catch (err) {
        setPitchesSorted(snapshot);
        setSyncError(err?.message ?? "Could not delete pitch in Supabase.");
        throw err;
      }
    },
    [settings.pitches, usesSupabase, setPitchesSorted]
  );

  const addOffer = useCallback(
    async (offer) => {
      const normalized = normalizeOffer(offer);

      if (usesSupabase) {
        const created = await upsertPromoClient(normalized);
        setOffersSorted((prev) => {
          const rest = prev.filter(
            (item) =>
              item.id !== created.id &&
              item.dbId !== created.dbId &&
              item.code !== created.code
          );
          return [...rest, created];
        });
        return created.id;
      }

      const id = offer.id || slugifyId(offer.code || offer.title);
      const local = normalizeOffer({ ...normalized, id, dbId: null });

      commit((prev) => ({
        ...prev,
        offers: [...prev.offers, local],
      }));
      return id;
    },
    [usesSupabase, commit, setOffersSorted]
  );

  const updateOffer = useCallback(
    async (id, patch) => {
      const existing = settings.offers.find((item) => item.id === id);
      if (!existing) return;

      const optimistic = normalizeOffer({ ...existing, ...patch, id });

      setOffersSorted((prev) =>
        prev.map((item) => (item.id === id ? optimistic : item))
      );

      if (!usesSupabase) {
        commit((prev) => ({
          ...prev,
          offers: prev.offers.map((item) =>
            item.id === id ? optimistic : item
          ),
        }));
        return;
      }

      try {
        const updated = await upsertPromoClient(optimistic);
        setOffersSorted((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        setSyncError(null);
      } catch (err) {
        setSyncError(err?.message ?? "Could not update offer in Supabase.");
        await refreshOffers();
        throw err;
      }
    },
    [
      settings.offers,
      usesSupabase,
      commit,
      setOffersSorted,
      refreshOffers,
    ]
  );

  const removeOffer = useCallback(
    async (id) => {
      const existing = settings.offers.find((item) => item.id === id);
      const snapshot = settings.offers;

      setOffersSorted((prev) => prev.filter((item) => item.id !== id));

      if (!usesSupabase) {
        commit((prev) => ({
          ...prev,
          offers: prev.offers.filter((item) => item.id !== id),
        }));
        return;
      }

      if (!existing) return;

      try {
        await deletePromoClient(existing);
        setSyncError(null);
      } catch (err) {
        setOffersSorted(snapshot);
        setSyncError(err?.message ?? "Could not delete offer in Supabase.");
        throw err;
      }
    },
    [settings.offers, usesSupabase, commit, setOffersSorted]
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
    setSettings({ ...DEFAULT_ADMIN_SETTINGS, pitches: [] });
    if (usesSupabase) {
      void refreshLocations();
      void refreshSports();
      void refreshPitches();
      void refreshOffers();
    }
  }, [
    usesSupabase,
    refreshLocations,
    refreshSports,
    refreshPitches,
    refreshOffers,
  ]);

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
      usesSupabase,
      usesSupabaseLocations: usesSupabase,
      usesSupabaseSports: usesSupabase,
      usesSupabaseOffers: usesSupabase,
      settings,
      locations: settings.locations,
      sports: settings.sports,
      pitches: settings.pitches ?? [],
      offers: settings.offers,
      general: settings.general,
      navLocations,
      refreshLocations,
      refreshSports,
      refreshPitches,
      refreshOffers,
      addLocation,
      updateLocation,
      removeLocation,
      addSport,
      updateSport,
      removeSport,
      addPitch,
      updatePitch,
      removePitch,
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
      refreshPitches,
      refreshOffers,
      addLocation,
      updateLocation,
      removeLocation,
      addSport,
      updateSport,
      removeSport,
      addPitch,
      updatePitch,
      removePitch,
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
