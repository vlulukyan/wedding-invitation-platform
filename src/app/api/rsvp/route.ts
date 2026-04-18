import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { saveInviteeResponseFromRsvp } from "@/lib/invitees";
import { rsvpSchema } from "@/lib/rsvpSchema";
import { saveRsvp } from "@/lib/rsvp";
import { sendRsvpEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const payload = rsvpSchema.parse(data);
    const record = saveRsvp(payload);
    saveInviteeResponseFromRsvp(payload);

    let emailSent = false;
    try {
      emailSent = await sendRsvpEmail(payload, record.id);
    } catch (emailError) {
      console.error("RSVP notification email failed", emailError);
    }

    return NextResponse.json({
      ok: true,
      id: record.id,
      createdAt: record.createdAt,
      emailSent,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        {
          ok: false,
          error: firstIssue?.message ?? "Invalid RSVP submission.",
        },
        { status: 400 }
      );
    }

    console.error("RSVP API error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save your RSVP right now. Please try again in a few minutes.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
