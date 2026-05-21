"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCATION_ID, getLocationById } from "./adminLocations";
import { locationToNavItem } from "./settings/adminSettingsDefaults";
import { useAdminSettings } from "./settings/adminSettingsContext";

const STORAGE_KEY = "admin_selected_location";

const AdminLocationContext = createContext(null);

export function AdminLocationProvider({ children }) {
  const { ready: settingsReady, navLocations, locations } = useAdminSettings();
  const [locationId, setLocationId] = useState(DEFAULT_LOCATION_ID);
  const [ready, setReady] = useState(false);

  const resolveLocation = useMemo(() => {
    return (id) => {
      const fromSettings = locations.find((loc) => loc.id === id);
      if (fromSettings) return locationToNavItem(fromSettings);
      return getLocationById(id);
    };
  }, [locations]);

  useEffect(() => {
    if (!settingsReady) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const validIds = navLocations.map((loc) => loc.id);
    const fallbackId = validIds[0] ?? DEFAULT_LOCATION_ID;

    if (stored && validIds.includes(stored)) {
      setLocationId(stored);
    } else {
      setLocationId(fallbackId);
      localStorage.setItem(STORAGE_KEY, fallbackId);
    }
    setReady(true);
  }, [settingsReady, navLocations]);

  const setLocation = (id) => {
    setLocationId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const location = resolveLocation(
    ready ? locationId : navLocations[0]?.id ?? DEFAULT_LOCATION_ID
  );

  return (
    <AdminLocationContext.Provider
      value={{
        locationId: ready ? locationId : navLocations[0]?.id ?? DEFAULT_LOCATION_ID,
        location,
        filterValue: location.filterValue,
        setLocation,
      }}
    >
      {children}
    </AdminLocationContext.Provider>
  );
}

export function useAdminLocation() {
  const context = useContext(AdminLocationContext);
  if (!context) {
    throw new Error("useAdminLocation must be used within AdminLocationProvider");
  }
  return context;
}
