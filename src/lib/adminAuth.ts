import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "aya_admin";
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours
const encoder = new TextEncoder();

function getAdminPassword() {
  const secret = process.env.ADMIN_PASSWORD?.trim();
  if (!secret) {
    throw new Error("ADMIN_PASSWORD is not configured");
  }
  return secret;
}

function passwordBuffer(value: string) {
  return encoder.encode(value);
}

export function isPasswordValid(password: string): boolean {
  const secret = getAdminPassword();
  const provided = passwordBuffer(password);
  const expected = passwordBuffer(secret);
  if (provided.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(provided, expected);
}

function sessionToken() {
  return createHash("sha256").update(getAdminPassword()).digest("hex");
}

export function applyAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: sessionToken(),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  });
}

export function hasValidSessionFromRequest(request: NextRequest): boolean {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return Boolean(token && token === sessionToken());
}

export function hasValidSessionFromCookies(): boolean {
  const token = cookies().get(COOKIE_NAME)?.value;
  return Boolean(token && token === sessionToken());
}

export function redirectToLogin() {
  return NextResponse.redirect(new URL("/admin/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
