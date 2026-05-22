"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  buildEventCardsMapFromNormalized,
  cardToForm,
  formToCard,
  normalizeEventCard,
} from "./eventCardsMapper";
import { EVENT_CARD_FALLBACKS } from "./eventCardsDefaults";
import { fetchEventCardsFromSupabase, upsertEventCardClient } from "./eventCardsData";
import { subscribeToEventCards } from "./eventCardsRealtime";

const EventCardsContext = createContext(null);

function fallbackCardsList() {
  return Object.entries(EVENT_CARD_FALLBACKS).map(([cardKey, fb]) =>
    normalizeEventCard({
      slug: fb.slug,
      title: fb.title,
      category: fb.section,
      description: fb.description,
      section: fb.section,
      card_role: fb.cardRole,
      badges: fb.badges,
      price_tiers: (fb.priceTiers ?? []).map((tier) => ({
        label: tier.label,
        sublabel: tier.sublabel,
        price: tier.price,
        price_suffix: tier.priceSuffix ?? "",
      })),
      highlight_tags: fb.highlightTags,
      footer_badge: fb.footerBadge,
      cta_label: fb.ctaLabel,
      cta_href: fb.ctaHref,
      brochure_url: fb.brochureUrl,
      price: fb.price ?? 0,
      image_url: fb.imageUrl ?? null,
      sort_order: fb.sortOrder ?? 0,
      is_active: true,
    })
  );
}

export function EventCardsProvider({ children }) {
  const usesSupabase = isSupabaseConfigured();
  const [cards, setCards] = useState(fallbackCardsList);
  const [ready, setReady] = useState(!usesSupabase);
  const [syncError, setSyncError] = useState(null);

  const cardsMap = useMemo(
    () => buildEventCardsMapFromNormalized(cards),
    [cards]
  );

  const loadCards = useCallback(async () => {
    const list = await fetchEventCardsFromSupabase();
    setCards(list);
    setSyncError(null);
  }, []);

  useEffect(() => {
    if (!usesSupabase) return undefined;

    let cancelled = false;
    let unsubscribe = null;

    void (async () => {
      try {
        await loadCards();
        if (!cancelled) {
          setReady(true);
        }

        unsubscribe = await subscribeToEventCards(() => {
          if (cancelled) return;
          void loadCards().catch(() => {});
        });
      } catch (err) {
        if (!cancelled) {
          setSyncError(
            err?.message ?? "Could not sync event cards from Supabase."
          );
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      void unsubscribe?.();
    };
  }, [usesSupabase, loadCards]);

  const updateCard = useCallback(
    async (cardKey, form) => {
      const existing = cards.find((c) => c.cardKey === cardKey);
      if (!existing) return;

      const payload = formToCard({ ...existing, ...form, cardKey });

      if (!usesSupabase) {
        setCards((prev) =>
          prev.map((c) =>
            c.cardKey === cardKey ? normalizeEventCard({ ...c, ...payload }) : c
          )
        );
        return payload;
      }

      const saved = await upsertEventCardClient({ ...existing, ...payload });
      setCards((prev) =>
        prev.map((c) => (c.cardKey === cardKey ? saved : c))
      );
      setSyncError(null);
      return saved;
    },
    [cards, usesSupabase]
  );

  const value = useMemo(
    () => ({
      ready,
      syncError,
      usesSupabase,
      cards,
      cardsMap,
      loadCards,
      updateCard,
      cardToForm,
    }),
    [ready, syncError, usesSupabase, cards, cardsMap, loadCards, updateCard]
  );

  return (
    <EventCardsContext.Provider value={value}>
      {children}
    </EventCardsContext.Provider>
  );
}

export function useEventCards() {
  const ctx = useContext(EventCardsContext);
  if (!ctx) {
    throw new Error("useEventCards must be used within EventCardsProvider");
  }
  return ctx;
}
