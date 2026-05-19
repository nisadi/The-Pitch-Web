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
  DEFAULT_PACKAGES,
  LEGACY_PACKAGES_STORAGE_KEY,
  LEGACY_SEED_PACKAGE_IDS,
  normalizePackage,
  PACKAGES_STORAGE_KEY,
  slugifyPackageId,
} from "./packagesDefaults";

const PackagesContext = createContext(null);

function parsePackageList(raw) {
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed) ? parsed : parsed.packages;
  if (!Array.isArray(list)) return [];
  return list
    .filter((pkg) => !LEGACY_SEED_PACKAGE_IDS.has(pkg.id))
    .map(normalizePackage);
}

function loadPackages() {
  if (typeof window === "undefined") {
    return DEFAULT_PACKAGES.map(normalizePackage);
  }

  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (raw) {
      const loaded = parsePackageList(raw);
      const parsed = JSON.parse(raw);
      const original = Array.isArray(parsed) ? parsed : parsed.packages;
      if (
        Array.isArray(original) &&
        original.some((pkg) => LEGACY_SEED_PACKAGE_IDS.has(pkg.id))
      ) {
        localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(loaded));
      }
      return loaded;
    }

    const legacyRaw = localStorage.getItem(LEGACY_PACKAGES_STORAGE_KEY);
    if (legacyRaw) {
      const migrated = parsePackageList(legacyRaw);
      localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_PACKAGES_STORAGE_KEY);
      return migrated;
    }

    return DEFAULT_PACKAGES.map(normalizePackage);
  } catch {
    return DEFAULT_PACKAGES.map(normalizePackage);
  }
}

function persistPackages(packages) {
  localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
}

export function PackagesProvider({ children }) {
  const [packages, setPackages] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPackages(loadPackages());
    setReady(true);
  }, []);

  const commit = useCallback((updater) => {
    setPackages((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistPackages(next);
      return next;
    });
  }, []);

  const addPackage = useCallback(
    (pkg) => {
      const id = pkg.id || slugifyPackageId(pkg.name);
      const normalized = normalizePackage({ ...pkg, id });
      commit((prev) => {
        if (prev.some((item) => item.id === id)) {
          window.alert("A package with this ID already exists. Change the name.");
          return prev;
        }
        return [...prev, normalized];
      });
      return id;
    },
    [commit]
  );

  const updatePackage = useCallback(
    (id, patch) => {
      commit((prev) =>
        prev.map((item) =>
          item.id === id ? normalizePackage({ ...item, ...patch }) : item
        )
      );
    },
    [commit]
  );

  const removePackage = useCallback(
    (id) => {
      commit((prev) => prev.filter((item) => item.id !== id));
    },
    [commit]
  );

  const publishedPackages = useMemo(
    () =>
      [...packages]
        .filter((p) => p.status === "published")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [packages]
  );

  const value = useMemo(
    () => ({
      ready,
      packages,
      publishedPackages,
      addPackage,
      updatePackage,
      removePackage,
    }),
    [ready, packages, publishedPackages, addPackage, updatePackage, removePackage]
  );

  return (
    <PackagesContext.Provider value={value}>{children}</PackagesContext.Provider>
  );
}

export function usePackages() {
  const context = useContext(PackagesContext);
  if (!context) {
    throw new Error("usePackages must be used within PackagesProvider");
  }
  return context;
}
