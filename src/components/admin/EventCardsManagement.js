"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { EVENT_CARD_ROLE_KEYS } from "@/lib/events/eventCardsDefaults";
import { useEventCards } from "@/lib/events/eventCardsContext";
import EventCardFormModal from "./EventCardFormModal";
import styles from "./PackageManagement.module.css";

const CARD_UI = {
  corporate_packages: {
    label: "Corporate Packages",
    hint: "Large card — title, description, badge pills",
  },
  corporate_entry: {
    label: "Corporate Entry",
    hint: "Pricing tiers + brochure CTA",
  },
  school_programs: {
    label: "School Programs",
    hint: "Pricing tiers + footer certification badge",
  },
  school_excellence: {
    label: "School Excellence",
    hint: "Description + highlight tag buttons",
  },
};

export default function EventCardsManagement() {
  const {
    ready,
    syncError,
    cards,
    updateCard,
    cardToForm,
  } = useEventCards();

  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const cardsByKey = useMemo(
    () => Object.fromEntries(cards.map((c) => [c.cardKey, c])),
    [cards]
  );

  const openEdit = (cardKey) => {
    const card = cardsByKey[cardKey];
    if (!card) return;
    setEditingKey(cardKey);
    setForm(cardToForm(card));
  };

  const closeModal = () => {
    setEditingKey(null);
    setForm(null);
  };

  const handleSave = async () => {
    if (!editingKey || !form) return;
    setSaving(true);
    try {
      await updateCard(editingKey, form);
      closeModal();
    } catch (err) {
      window.alert(err?.message ?? "Could not save event card.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Events page cards</h3>
          <p>
            Edit the four cards on the public Events page (/events). Content is
            stored in the <code>events</code> table and updates in real time.
          </p>
          <Link href="/events" className={styles.previewLink} target="_blank">
            <ExternalLink size={14} />
            Preview on website
          </Link>
          {syncError && (
            <p className={styles.syncError} style={{ marginTop: "0.75rem" }}>
              {syncError}
            </p>
          )}
        </div>

        {!ready ? (
          <p className={styles.empty}>Loading event cards from Supabase…</p>
        ) : (
          <div className={styles.templateGrid}>
            {EVENT_CARD_ROLE_KEYS.map((cardKey) => {
              const meta = CARD_UI[cardKey];
              const card = cardsByKey[cardKey];
              return (
                <article key={cardKey} className={styles.templateCard}>
                  <h4>{meta?.label ?? cardKey}</h4>
                  <p>{meta?.hint}</p>
                  {card && (
                    <p style={{ fontSize: "0.8rem", opacity: 0.85 }}>
                      {card.title}
                      {card.isActive === false ? " · Hidden" : ""}
                    </p>
                  )}
                  <button
                    type="button"
                    className={styles.useTemplate}
                    onClick={() => openEdit(cardKey)}
                  >
                    <Pencil size={14} style={{ verticalAlign: "middle" }} />{" "}
                    Edit card →
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <EventCardFormModal
        open={Boolean(editingKey)}
        cardKey={editingKey}
        form={form}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onClose={closeModal}
        onSubmit={handleSave}
        saving={saving}
      />
    </>
  );
}
