import { NextResponse } from "next/server";
import { sendEnquiryReplySms } from "@/lib/sms/enquiryReplySms";

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, message, locationName, contactPhone } = body ?? {};

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Reply message is required." },
        { status: 400 }
      );
    }

    const result = await sendEnquiryReplySms({
      phone,
      message: message.trim(),
      locationName: locationName?.trim() || undefined,
      contactPhone: contactPhone?.trim() || undefined,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message ?? "Failed to send enquiry reply SMS.",
      },
      { status: 500 }
    );
  }
}
