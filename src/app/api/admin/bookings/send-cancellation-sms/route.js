import { NextResponse } from "next/server";
import { sendBookingCancellationSms } from "@/lib/sms/bookingConfirmationSms";

export async function POST(request) {
  try {
    const body = await request.json();
    const phone = body?.phone?.trim();

    if (!phone) {
      return NextResponse.json(
        { success: false, skipped: true, error: "Phone number is required." },
        { status: 400 }
      );
    }

    const result = await sendBookingCancellationSms({
      phone,
      customerName: body.customerName,
      reference: body.reference,
      date: body.date,
      time: body.time,
      location: body.location,
      sport: body.sport,
      court: body.court,
    });

    if (!result.success && !result.skipped) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message ?? "Failed to send booking cancellation SMS.",
      },
      { status: 500 }
    );
  }
}
