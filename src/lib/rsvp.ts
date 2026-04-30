import { sql } from "@/lib/db";
import type { RsvpPayload } from "@/lib/rsvpSchema";

export type SavedRsvp = RsvpPayload & { id: number; createdAt: string };

export async function saveRsvp(payload: RsvpPayload): Promise<SavedRsvp> {
  const fullName = `${payload.name} ${payload.lastName}`.trim();
  const [row] = await sql`
    INSERT INTO rsvps (name, email, phone, attending, guest_count, what, meal)
    VALUES (${fullName}, '', NULL, ${payload.attending === "yes" ? 1 : 0}, ${payload.guestCount}, NULL, NULL)
    RETURNING id, created_at
  `;

  return {
    ...payload,
    id: Number((row as { id: number }).id),
    createdAt: String((row as { created_at: string }).created_at),
  };
}
