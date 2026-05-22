import { createClient } from "@/lib/supabase/client";
import { PROMO_COLUMNS, promoFromRow } from "./promoMapper";

function sortOffers(list) {
  return [...list].sort((a, b) =>
    (a.title || a.code).localeCompare(b.title || b.code)
  );
}

export async function fetchPromosFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select(PROMO_COLUMNS)
    .order("title");

  if (error) throw error;

  return sortOffers((data ?? []).map(promoFromRow).filter(Boolean));
}

export function subscribeToPromos(onPayload) {
  const supabase = createClient();

  const channel = supabase
    .channel("promo-codes-table-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "promo_codes" },
      onPayload
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error(
          "Supabase realtime subscription failed for promo_codes table"
        );
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function applyPromoRealtimeEvent(offers, payload) {
  const event = payload.eventType;

  if (event === "DELETE") {
    const dbId = payload.old?.id;
    const codeSlug = payload.old?.code
      ? payload.old.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : null;
    return offers.filter(
      (item) =>
        item.dbId !== dbId &&
        item.id !== dbId &&
        (codeSlug ? item.id !== codeSlug : true)
    );
  }

  const offer = promoFromRow(payload.new);
  if (!offer?.id) return offers;

  const exists = offers.some(
    (item) =>
      item.dbId === offer.dbId ||
      item.id === offer.id ||
      (offer.code && item.code === offer.code)
  );

  if (event === "INSERT" && !exists) {
    return sortOffers([...offers, offer]);
  }

  return sortOffers(
    offers.map((item) =>
      item.dbId === offer.dbId ||
      item.id === offer.id ||
      (offer.code && item.code === offer.code)
        ? offer
        : item
    )
  );
}
