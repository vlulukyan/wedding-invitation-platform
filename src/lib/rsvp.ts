import { getDb } from "@/lib/db";
import type { RsvpPayload } from "@/lib/rsvpSchema";

export type SavedRsvp = RsvpPayload & { id: number; createdAt: string };

export function saveRsvp(payload: RsvpPayload): SavedRsvp {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO rsvps (name, email, phone, attending, guest_count, what, meal)
    VALUES (@name, @email, @phone, @attending, @guestCount, @what, @meal)
  `);

  const info = stmt.run({
    name: payload.name,
    email: "",
    phone: payload.phone ?? null,
    attending: payload.attending === "yes" ? 1 : 0,
    guestCount: payload.guestCount,
    what: null,
    meal: null,
  });

  return {
    ...payload,
    id: Number(info.lastInsertRowid),
    createdAt: new Date().toISOString(),
  };
}
