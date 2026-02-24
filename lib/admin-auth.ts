import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminTokenRecord, consumeAdminToken } from "./db";

const ADMIN_ALLOWED_EMAILS = ["david@ikuto.co.uk"];
const COOKIE_NAME = "admin_session";
const SESSION_TTL_HOURS = 24;

const SESSION_SECRET = process.env.SESSION_SECRET || "change_me_to_random_32_char_string";

export function isAllowedAdmin(email: string): boolean {
  return ADMIN_ALLOWED_EMAILS.includes(email.toLowerCase().trim());
}

export async function createAdminToken(email: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await createAdminTokenRecord(tokenHash, email.toLowerCase().trim(), expiresAt.toISOString());

  return rawToken;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const result = await consumeAdminToken(tokenHash);
  return result !== null;
}

function createSessionValue(): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update("admin:" + timestamp)
    .digest("hex");
  return `admin:${timestamp}:${signature}`;
}

function validateSessionValue(value: string): boolean {
  const parts = value.split(":");
  if (parts.length !== 3 || parts[0] !== "admin") return false;

  const timestamp = parts[1];
  const signature = parts[2];

  // Check signature
  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update("admin:" + timestamp)
    .digest("hex");

  if (signature !== expected) return false;

  // Check TTL
  const created = parseInt(timestamp, 10);
  if (isNaN(created)) return false;

  const ageHours = (Date.now() - created) / (1000 * 60 * 60);
  return ageHours < SESSION_TTL_HOURS;
}

export function setAdminSessionCookie(response: NextResponse): void {
  const value = createSessionValue();
  response.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * SESSION_TTL_HOURS,
    path: "/",
  });
}

export function getAdminSession(request: NextRequest): boolean {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return false;
  return validateSessionValue(cookie.value);
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME);
}

/**
 * Server-side session check using cookies() from next/headers.
 * Use in Server Components or server-side logic.
 */
export function getAdminSessionFromCookies(): boolean {
  const cookieStore = cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return false;
  return validateSessionValue(cookie.value);
}
