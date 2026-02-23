import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "change_me_to_random_32_char_string"
);

const COOKIE_NAME = "fde_session";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getTokenExpiry(): string {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry.toISOString();
}

export async function createSessionToken(candidateId: number): Promise<string> {
  const token = await new SignJWT({ candidateId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(SESSION_SECRET);

  return token;
}

export async function getSessionCandidateId(): Promise<number | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (!sessionCookie?.value) return null;

    const { payload } = await jwtVerify(sessionCookie.value, SESSION_SECRET);
    return (payload.candidateId as number) || null;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string): void {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export function clearSessionCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
