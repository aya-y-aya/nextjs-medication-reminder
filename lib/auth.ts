import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE_NAME = "session";

const authSecret = process.env.AUTH_SECRET || "dev-secret-do-not-use-in-prod";

export const SECRET = new TextEncoder().encode(authSecret);

/**
 * Call this at runtime to verify AUTH_SECRET is set in production.
 * Do not call at module load time since `next build` uses NODE_ENV=production.
 */
export function assertSecretConfigured(): void {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
    console.warn(
      "WARNING: AUTH_SECRET is not set. Using insecure fallback secret."
    );
  }
}

export interface SessionPayload {
  userId: number;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (
      typeof payload.userId === "number" &&
      typeof payload.email === "string"
    ) {
      return { userId: payload.userId, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
