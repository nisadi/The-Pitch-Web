"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ADMIN_SETTINGS_TABS } from "./settings/adminSettingsTabs";
import { useAdminSettingsTab } from "./settings/adminSettingsTabContext";
import styles from "./Admin.module.css";

export default function AdminSettingsTabSelect() {
  const { activeTab, setActiveTab } = useAdminSettingsTab();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const current =
    ADMIN_SETTINGS_TABS.find((tab) => tab.id === activeTab) ??
    ADMIN_SETTINGS_TABS[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.settingsTabSelectWrap} ref={rootRef}>
      <span className={styles.locationLabel}>Section</span>
      <button
        type="button"
        className={styles.locationTrigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.locationName}>
          <span>{current.label}</span>
        </span>
        <ChevronDown
          size={18}
          className={`${styles.locationChevron} ${open ? styles.locationChevronOpen : ""}`}
        />
      </button>

      {open && (
        <ul className={styles.settingsTabMenu} role="listbox">
          {ADMIN_SETTINGS_TABS.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                role="option"
                aria-selected={activeTab === tab.id}
                className={`${styles.settingsTabOption} ${activeTab === tab.id ? styles.settingsTabOptionActive : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setOpen(false);
                }}
              >
                <span className={styles.settingsTabOptionLabel}>{tab.label}</span>
                <span className={styles.settingsTabOptionHint}>{tab.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
