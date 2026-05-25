import { createClient } from "@/lib/supabase/server";
import {
  calculatePromoDiscount,
  formatBookingDate,
  validatePromoForBooking,
} from "@/lib/promos/validatePromo";
import { PROMO_COLUMNS } from "@/lib/promos/promoMapper";

export async function POST(request) {
  try {
    // Promo lookup uses anon RLS; no cookie session required. Checkout auth uses
    // the browser supabase-js client (localStorage), which does not populate SSR cookies.
    const supabase = await createClient();

    const body = await request.json();
    const code = (body.code ?? "").trim().toUpperCase();
    const locationId = body.location_id ?? body.locationId;
    const bookingDate = body.booking_date ?? body.bookingDate;
    const subtotal = Number(body.subtotal);

    if (!code) {
      return Response.json(
        { valid: false, error: "Please enter a promo code." },
        { status: 400 }
      );
    }

    if (!locationId) {
      return Response.json(
        { valid: false, error: "Booking location is required." },
        { status: 400 }
      );
    }

    if (!subtotal || subtotal <= 0) {
      return Response.json(
        { valid: false, error: "Invalid order amount." },
        { status: 400 }
      );
    }

    const { data: promoRow, error: promoError } = await supabase
      .from("promo_codes")
      .select(PROMO_COLUMNS)
      .eq("code", code)
      .maybeSingle();

    if (promoError) {
      console.error("[api/promos/validate]", promoError);
      return Response.json(
        { valid: false, error: "Could not validate promo code." },
        { status: 500 }
      );
    }

    if (!promoRow) {
      return Response.json(
        { valid: false, error: "Promo code not found." },
        { status: 404 }
      );
    }

    const { data: locationRow } = await supabase
      .from("locations")
      .select("slug, name")
      .eq("id", locationId)
      .maybeSingle();

    const locationSlug =
      locationRow?.slug ??
      (locationRow?.name
        ? locationRow.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        : "");

    const validation = validatePromoForBooking(promoRow, {
      locationSlug,
      bookingDate: formatBookingDate(bookingDate),
    });

    if (!validation.valid) {
      return Response.json({ valid: false, error: validation.error });
    }

    const discountAmount = calculatePromoDiscount(
      validation.promo,
      subtotal
    );
    const totalAmount = Math.max(0, subtotal - discountAmount);

    return Response.json({
      valid: true,
      promo: {
        id: promoRow.id,
        code: promoRow.code,
        title: promoRow.title ?? promoRow.code,
        description: promoRow.description ?? "",
        discountType: validation.promo.discountType,
        discountValue: validation.promo.discountValue,
      },
      subtotal,
      discountAmount,
      totalAmount,
    });
  } catch (err) {
    console.error("[api/promos/validate]", err);
    return Response.json(
      { valid: false, error: err.message ?? "Server error." },
      { status: 500 }
    );
  }
}
