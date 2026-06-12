"use client";

import { createContext, useContext, useMemo, useState } from "react";

const AdminSettingsTabContext = createContext(null);

export function AdminSettingsTabProvider({ children }) {
  const [activeTab, setActiveTab] = useState("locations");

  const value = useMemo(
    () => ({ activeTab, setActiveTab }),
    [activeTab]
  );

  return (
    <AdminSettingsTabContext.Provider value={value}>
      {children}
    </AdminSettingsTabContext.Provider>
  );
}

export function useAdminSettingsTab() {
  const context = useContext(AdminSettingsTabContext);
  if (!context) {
    throw new Error(
      "useAdminSettingsTab must be used within AdminSettingsTabProvider"
    );
  }
  return context;
}
