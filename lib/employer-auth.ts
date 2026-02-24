import { cookies } from "next/headers";
import { getEmployerBySessionToken } from "@/lib/db";

const COOKIE_NAME = "employer_session";

export async function getSessionEmployerId(): Promise<number | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const employer = await getEmployerBySessionToken(sessionCookie.value);
    return employer?.id ?? null;
  } catch {
    return null;
  }
}

export function setEmployerSessionCookie(token: string): void {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export function clearEmployerSessionCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
