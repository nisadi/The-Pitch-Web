"use client";

import SettingsGeneral from "./SettingsGeneral";
import SettingsGallery from "./SettingsGallery";
import SettingsLocations from "./SettingsLocations";
import SettingsOffers from "./SettingsOffers";
import SettingsSports from "./SettingsSports";
import SettingsPitches from "./SettingsPitches";
import { ADMIN_SETTINGS_TABS } from "./adminSettingsTabs";
import { useAdminSettingsTab } from "./adminSettingsTabContext";
import styles from "./AdminSettings.module.css";

const PANELS = {
  locations: SettingsLocations,
  sports: SettingsSports,
  pitches: SettingsPitches,
  offers: SettingsOffers,
  gallery: SettingsGallery,
  general: SettingsGeneral,
};

export default function AdminSettings() {
  const { activeTab } = useAdminSettingsTab();
  const ActivePanel = PANELS[activeTab] ?? PANELS.locations;

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Settings sections">
          {ADMIN_SETTINGS_TABS.map((tab) => (
            <SettingsNavButton key={tab.id} tab={tab} />
          ))}
        </nav>

        <div className={styles.content}>
          <ActivePanel />
        </div>
      </div>
    </div>
  );
}

function SettingsNavButton({ tab }) {
  const { activeTab, setActiveTab } = useAdminSettingsTab();

  return (
    <button
      type="button"
      className={`${styles.navBtn} ${activeTab === tab.id ? styles.navBtnActive : ""}`}
      onClick={() => setActiveTab(tab.id)}
    >
      <span className={styles.navLabel}>{tab.label}</span>
      <span className={styles.navHint}>{tab.hint}</span>
    </button>
  );
}
