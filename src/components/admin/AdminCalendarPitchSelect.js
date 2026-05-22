"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "./BookingsCalendar.module.css";

const SEGMENTED_MAX = 5;

export default function AdminCalendarPitchSelect({
  pitches = [],
  selectedPitchId,
  onSelectPitch,
}) {
  const useSegments = pitches.length > 1 && pitches.length <= SEGMENTED_MAX;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected =
    pitches.find(
      (p) =>
        String(p.id) === String(selectedPitchId) ||
        String(p.dbId) === String(selectedPitchId)
    ) ?? pitches[0];

  useEffect(() => {
    if (useSegments) return undefined;

    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [useSegments]);

  if (!pitches.length || pitches.length < 2) return null;

  if (useSegments) {
    return (
      <div
        className={styles.pitchSwitcher}
        role="group"
        aria-label="Select court or pitch"
      >
        <div className={styles.pitchTabs}>
          {pitches.map((pitch) => {
            const pitchId = String(pitch.dbId ?? pitch.id);
            const isActive = String(selectedPitchId) === pitchId;
            return (
              <button
                key={pitchId}
                type="button"
                className={`${styles.pitchTab} ${isActive ? styles.pitchTabActive : ""}`}
                aria-pressed={isActive}
                title={pitch.name}
                onClick={() => onSelectPitch(pitchId)}
              >
                {pitch.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pitchSwitcher} ref={rootRef}>
      <div className={styles.pitchDropdown}>
        <button
          type="button"
          className={`${styles.pitchDropdownTrigger} ${open ? styles.pitchDropdownTriggerOpen : ""}`}
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={styles.pitchDropdownValue}>
            {selected?.name ?? "Select court"}
          </span>
          <ChevronDown
            size={16}
            className={`${styles.pitchDropdownChevron} ${open ? styles.pitchDropdownChevronOpen : ""}`}
            aria-hidden
          />
        </button>

        {open && (
          <ul className={styles.pitchDropdownMenu} role="listbox">
            {pitches.map((pitch) => {
              const pitchId = String(pitch.dbId ?? pitch.id);
              const isActive = String(selectedPitchId) === pitchId;
              return (
                <li key={pitchId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`${styles.pitchDropdownOption} ${isActive ? styles.pitchDropdownOptionActive : ""}`}
                    onClick={() => {
                      onSelectPitch(pitchId);
                      setOpen(false);
                    }}
                  >
                    <span className={styles.pitchDropdownOptionText}>
                      {pitch.name}
                    </span>
                    {isActive ? (
                      <Check size={16} className={styles.pitchDropdownCheck} aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
