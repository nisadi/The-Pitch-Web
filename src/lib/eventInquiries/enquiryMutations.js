import { createClient } from "@/lib/supabase/client";
import { ENQUIRY_COLUMNS, enquiryFromRow, enquiryToRow } from "./enquiryMapper";

export async function upsertEnquiryClient(enquiry) {
  const supabase = createClient();
  const row = enquiryToRow(enquiry);

  if (enquiry.dbId) {
    const { data, error } = await supabase
      .from("contact_messages")
      .update(row)
      .eq("id", enquiry.dbId)
      .select(ENQUIRY_COLUMNS)
      .single();

    if (error) throw error;
    return enquiryFromRow(data);
  }

  const { data, error } = await supabase
    .from("contact_messages")
    .insert(row)
    .select(ENQUIRY_COLUMNS)
    .single();

  if (error) throw error;
  return enquiryFromRow(data);
}
