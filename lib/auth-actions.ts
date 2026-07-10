"use server";

import { redirect } from "next/navigation";
import { getUserByEmail, createUser } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = getUserByEmail(email);
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  const token = await createSessionToken({ userId: user.id, email: user.email });
  await setSessionCookie(token);

  redirect("/");
}

export async function register(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;
  const timezone =
    (formData.get("timezone") as string)?.trim() || "America/New_York";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const existing = getUserByEmail(email);
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  // Validate timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    return { error: "Invalid timezone. Please provide a valid IANA timezone (e.g., America/New_York)." };
  }

  const passwordHash = await hashPassword(password);
  const user = createUser(email, passwordHash, timezone);

  const token = await createSessionToken({ userId: user.id, email: user.email });
  await setSessionCookie(token);

  redirect("/");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
