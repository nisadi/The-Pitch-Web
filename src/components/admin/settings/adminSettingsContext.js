"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ADMIN_SETTINGS_STORAGE_KEY,
  DEFAULT_ADMIN_SETTINGS,
  locationToNavItem,
  normalizeLocation,
  slugifyId,
} from "./adminSettingsDefaults";

const AdminSettingsContext = createContext(null);

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
      sports: parsed.sports ?? DEFAULT_ADMIN_SETTINGS.sports,
      offers: parsed.offers ?? DEFAULT_ADMIN_SETTINGS.offers,
      general: { ...DEFAULT_ADMIN_SETTINGS.general, ...parsed.general },
    };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

function persistSettings(settings) {
  localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function AdminSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_ADMIN_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setReady(true);
  }, []);

  const commit = useCallback((updater) => {
    setSettings((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistSettings(next);
      return next;
    });
  }, []);

  const addLocation = useCallback(
    (location) => {
      const id = location.id || slugifyId(location.shortName || location.name);
      commit((prev) => ({
        ...prev,
        locations: [...prev.locations, { ...location, id }],
      }));
      return id;
    },
    [commit]
  );

  const updateLocation = useCallback(
    (id, patch) => {
      commit((prev) => ({
        ...prev,
        locations: prev.locations.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      }));
    },
    [commit]
  );

  const removeLocation = useCallback(
    (id) => {
      commit((prev) => ({
        ...prev,
        locations: prev.locations.filter((item) => item.id !== id),
        offers: prev.offers.map((offer) => ({
          ...offer,
          locationIds: offer.locationIds.filter((locId) => locId !== id),
        })),
      }));
    },
    [commit]
  );

  const addSport = useCallback(
    (sport) => {
      const id = sport.id || slugifyId(sport.name);
      commit((prev) => ({
        ...prev,
        sports: [...prev.sports, { ...sport, id }],
      }));
      return id;
    },
    [commit]
  );

  const updateSport = useCallback(
    (id, patch) => {
      commit((prev) => ({
        ...prev,
        sports: prev.sports.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      }));
    },
    [commit]
  );

  const removeSport = useCallback(
    (id) => {
      commit((prev) => ({
        ...prev,
        sports: prev.sports.filter((item) => item.id !== id),
        locations: prev.locations.map((location) => ({
          ...location,
          sportIds: location.sportIds.filter((sportId) => sportId !== id),
        })),
      }));
    },
    [commit]
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
  }, []);

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
      settings,
      locations: settings.locations,
      sports: settings.sports,
      offers: settings.offers,
      general: settings.general,
      navLocations,
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
      settings,
      navLocations,
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
