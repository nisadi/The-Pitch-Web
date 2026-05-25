"use client";

import { useState } from "react";
import SettingsGeneral from "./SettingsGeneral";
import SettingsGallery from "./SettingsGallery";
import SettingsLocations from "./SettingsLocations";
import SettingsOffers from "./SettingsOffers";
import SettingsSports from "./SettingsSports";
import SettingsPitches from "./SettingsPitches";
import styles from "./AdminSettings.module.css";

const TABS = [
  {
    id: "locations",
    label: "Locations",
    hint: "Venues & addresses",
  },
  {
    id: "sports",
    label: "Sports",
    hint: "Bookable activities",
  },
  {
    id: "pitches",
    label: "Pitches",
    hint: "Courts & pricing",
  },
  {
    id: "offers",
    label: "Offers",
    hint: "Promotions & discounts",
  },
  {
    id: "gallery",
    label: "Gallery",
    hint: "Website photos & layout",
  },
  {
    id: "general",
    label: "General",
    hint: "Business & booking rules",
  },
];

const PANELS = {
  locations: SettingsLocations,
  sports: SettingsSports,
  pitches: SettingsPitches,
  offers: SettingsOffers,
  gallery: SettingsGallery,
  general: SettingsGeneral,
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("locations");
  const ActivePanel = PANELS[activeTab];

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Settings sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.navBtn} ${activeTab === tab.id ? styles.navBtnActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.navLabel}>{tab.label}</span>
              <span className={styles.navHint}>{tab.hint}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          <ActivePanel />
        </div>
      </div>
    </div>
  );
}
