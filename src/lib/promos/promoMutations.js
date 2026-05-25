import { createClient } from "@/lib/supabase/client";
import { PROMO_COLUMNS, promoFromRow, promoToRow } from "./promoMapper";

export async function upsertPromoClient(offer) {
  const supabase = createClient();
  const row = promoToRow(offer);

  if (offer.dbId) {
    const { data, error } = await supabase
      .from("promo_codes")
      .update(row)
      .eq("id", offer.dbId)
      .select(PROMO_COLUMNS)
      .single();

    if (error) throw error;
    return promoFromRow(data);
  }

  const { data, error } = await supabase
    .from("promo_codes")
    .insert(row)
    .select(PROMO_COLUMNS)
    .single();

  if (error) throw error;
  return promoFromRow(data);
}

export async function deletePromoClient(offer) {
  const supabase = createClient();
  const id = offer.dbId ?? offer.id;

  if (!id) return;

  const { error } = await supabase.from("promo_codes").delete().eq("id", id);
  if (error) throw error;
}
