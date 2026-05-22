import { createClient } from "@/lib/supabase/client";
import {
  STADIUM_EVENT_COLUMNS,
  stadiumEventFromRow,
  stadiumEventToRow,
} from "./stadiumEventMapper";

export async function upsertEventInquiryClient(inquiry) {
  const supabase = createClient();
  const row = stadiumEventToRow(inquiry);

  if (inquiry.dbId) {
    const { data, error } = await supabase
      .from("event_inquiries")
      .update(row)
      .eq("id", inquiry.dbId)
      .select(STADIUM_EVENT_COLUMNS)
      .single();

    if (error) throw error;
    return stadiumEventFromRow(data);
  }

  const { data, error } = await supabase
    .from("event_inquiries")
    .insert(row)
    .select(STADIUM_EVENT_COLUMNS)
    .single();

  if (error) throw error;
  return stadiumEventFromRow(data);
}
