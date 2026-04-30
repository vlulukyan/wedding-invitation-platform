import crypto from "node:crypto";

import { queryRow, queryRows, sql } from "@/lib/db";
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

export async function listInvitees(): Promise<Invitee[]> {
  return queryRows<Invitee>("SELECT * FROM invitees ORDER BY created_at DESC");
}

export async function createInvitee(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  locale?: Locale;
}): Promise<Invitee> {
  const invite_code = generateCode();
  const locale = (data.locale ?? "en") as Locale;
  const [created] = await sql`
    INSERT INTO invitees (first_name, last_name, email, phone, locale, invite_code)
    VALUES (
      ${data.first_name ?? null},
      ${data.last_name ?? null},
      ${data.email ?? null},
      ${data.phone ?? null},
      ${locale},
      ${invite_code}
    )
    RETURNING *
  `;
  return created as Invitee;
}

export async function updateInvitee(id: number, data: Partial<Invitee>): Promise<Invitee> {
  const keys = Object.keys(data);
  if (keys.length) {
    const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map((key) => data[key as keyof Invitee]);
    await sql.query(`UPDATE invitees SET ${assignments.join(", ")}, updated_at = now() WHERE id = $${values.length + 1}`, [
      ...values,
      id,
    ]);
  }
  const row = await queryRow<Invitee>("SELECT * FROM invitees WHERE id = $1", [id]);
  if (!row) {
    throw new Error("Invitee not found");
  }
  return row;
}

export async function deleteInvitee(id: number): Promise<void> {
  await queryRows("DELETE FROM invitees WHERE id = $1", [id]);
}

export async function updateInviteeByCode(inviteCode: string, data: Partial<Invitee>): Promise<Invitee | undefined> {
  const keys = Object.keys(data);
  if (keys.length) {
    const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map((key) => data[key as keyof Invitee]);
    await sql.query(
      `UPDATE invitees SET ${assignments.join(", ")}, updated_at = now() WHERE invite_code = $${values.length + 1}`,
      [...values, inviteCode]
    );
  }
  return queryRow<Invitee>("SELECT * FROM invitees WHERE invite_code = $1", [inviteCode]);
}

export async function markInviteeResponse(inviteCode: string, attending: boolean, guestCount: number | null, note?: string) {
  const status: InviteeStatus = attending ? "accepted" : "declined";
  return updateInviteeByCode(inviteCode, {
    attending: attending ? 1 : 0,
    guest_count: guestCount ?? null,
    response_note: note ?? null,
    responded_at: new Date().toISOString(),
    status,
  });
}

export async function saveInviteeResponseFromRsvp(payload: RsvpPayload) {
  const attending = payload.attending === "yes";
  const status: InviteeStatus = attending ? "accepted" : "declined";
  const response = {
    email: null,
    attending: attending ? 1 : 0,
    guest_count: attending ? payload.guestCount : 0,
    response_note: null,
    responded_at: new Date().toISOString(),
    status,
  };

  if (payload.inviteCode) {
    return updateInviteeByCode(payload.inviteCode, response);
  }

  const invitee = await createInvitee({
    first_name: payload.name,
    last_name: payload.lastName,
    locale: payload.locale as Locale | undefined,
  });

  return updateInvitee(invitee.id, response);
}
