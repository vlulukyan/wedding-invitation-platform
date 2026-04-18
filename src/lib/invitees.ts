import crypto from "node:crypto";

import { getDb } from "@/lib/db";
import type { Locale } from "@/lib/locales";
import type { RsvpPayload } from "@/lib/rsvpSchema";

export type InviteeStatus = "pending" | "accepted" | "declined";

export type Invitee = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  locale: Locale;
  invite_code: string;
  status: InviteeStatus;
  attending: number | null;
  guest_count: number | null;
  response_note: string | null;
  responded_at: string | null;
};

function generateCode() {
  return crypto.randomBytes(6).toString("hex");
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  const first_name = parts.shift() ?? name.trim();
  const last_name = parts.length ? parts.join(" ") : undefined;
  return { first_name, last_name };
}

export function listInvitees(): Invitee[] {
  return getDb().prepare("SELECT * FROM invitees ORDER BY created_at DESC").all() as Invitee[];
}

export function createInvitee(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  locale?: Locale;
}): Invitee {
  const db = getDb();
  const invite_code = generateCode();
  const locale = (data.locale ?? "en") as Locale;
  const result = db
    .prepare(
      `INSERT INTO invitees (first_name, last_name, email, phone, locale, invite_code)
       VALUES (@first_name, @last_name, @email, @phone, @locale, @invite_code)`
    )
    .run({ ...data, locale, invite_code });
  return db.prepare("SELECT * FROM invitees WHERE id = ?").get(result.lastInsertRowid) as Invitee;
}

export function updateInvitee(id: number, data: Partial<Invitee>): Invitee {
  const keys = Object.keys(data);
  if (!keys.length) {
    return getDb().prepare("SELECT * FROM invitees WHERE id = ?").get(id) as Invitee;
  }
  const assignments = keys.map((key) => `${key} = @${key}`);
  getDb()
    .prepare(`UPDATE invitees SET ${assignments.join(", ")}, updated_at = datetime('now') WHERE id = @id`)
    .run({ ...data, id });
  return getDb().prepare("SELECT * FROM invitees WHERE id = ?").get(id) as Invitee;
}

export function deleteInvitee(id: number): void {
  getDb().prepare("DELETE FROM invitees WHERE id = ?").run(id);
}

export function updateInviteeByCode(inviteCode: string, data: Partial<Invitee>): Invitee | undefined {
  const db = getDb();
  const assignments = Object.keys(data).map((key) => `${key} = @${key}`);
  if (!assignments.length) {
    return db.prepare("SELECT * FROM invitees WHERE invite_code = ?").get(inviteCode) as Invitee | undefined;
  }
  db.prepare(`UPDATE invitees SET ${assignments.join(", ")}, updated_at = datetime('now') WHERE invite_code = @invite_code`).run({
    ...data,
    invite_code: inviteCode,
  });
  return db.prepare("SELECT * FROM invitees WHERE invite_code = ?").get(inviteCode) as Invitee | undefined;
}

export function markInviteeResponse(inviteCode: string, attending: boolean, guestCount: number | null, note?: string) {
  const status: InviteeStatus = attending ? "accepted" : "declined";
  return updateInviteeByCode(inviteCode, {
    attending: attending ? 1 : 0,
    guest_count: guestCount ?? null,
    response_note: note ?? null,
    responded_at: new Date().toISOString(),
    status,
  });
}

export function saveInviteeResponseFromRsvp(payload: RsvpPayload) {
  const attending = payload.attending === "yes";
  const status: InviteeStatus = attending ? "accepted" : "declined";
  const response = {
    email: null,
    phone: payload.phone ?? null,
    attending: attending ? 1 : 0,
    guest_count: attending ? payload.guestCount : 0,
    response_note: null,
    responded_at: new Date().toISOString(),
    status,
  };

  if (payload.inviteCode) {
    return updateInviteeByCode(payload.inviteCode, response);
  }

  const invitee = createInvitee({
    ...splitName(payload.name),
    phone: payload.phone,
    locale: payload.locale as Locale | undefined,
  });

  return updateInvitee(invitee.id, response);
}
