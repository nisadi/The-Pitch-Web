"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ADMIN_LOCATIONS } from "./adminLocations";
import { useAdminLocation } from "./adminLocationContext";
import { useAdminSettings } from "./settings/adminSettingsContext";
import styles from "./Admin.module.css";

export default function AdminLocationSelect() {
  const { locationId, location, setLocation } = useAdminLocation();
  const { ready, navLocations } = useAdminSettings();
  const locations = ready && navLocations.length > 0 ? navLocations : ADMIN_LOCATIONS;
  const hasMultipleLocations = locations.length > 1;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nameParts = location.label.includes(" - ")
    ? location.label.split(" - ")
    : [location.label];

  return (
    <div className={styles.locationSelectWrap} ref={rootRef}>
      <span className={styles.locationLabel}>Location</span>
      <button
        type="button"
        className={`${styles.locationTrigger} ${!hasMultipleLocations ? styles.locationTriggerStatic : ""}`}
        onClick={() => {
          if (hasMultipleLocations) setOpen((prev) => !prev);
        }}
        aria-haspopup={hasMultipleLocations ? "listbox" : undefined}
        aria-expanded={hasMultipleLocations ? open : undefined}
        disabled={!hasMultipleLocations}
      >
        <span className={styles.locationName}>
          {nameParts.length > 1 ? (
            <>
              <span>{nameParts[0]} -</span>
              <span>{nameParts[1]}</span>
            </>
          ) : (
            <span>{location.label}</span>
          )}
        </span>
        {hasMultipleLocations && (
          <ChevronDown
            size={18}
            className={`${styles.locationChevron} ${open ? styles.locationChevronOpen : ""}`}
          />
        )}
      </button>

      {open && hasMultipleLocations && (
        <ul className={styles.locationMenu} role="listbox">
          {locations.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={locationId === item.id}
                className={`${styles.locationOption} ${locationId === item.id ? styles.locationOptionActive : ""}`}
                onClick={() => {
                  setLocation(item.id);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
