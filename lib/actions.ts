"use server";

import { getDb } from "@/lib/db";
import { getUserToday } from "@/lib/timezone";
import { revalidatePath } from "next/cache";

export async function addMedication(formData: FormData) {
  const name = formData.get("name") as string;
  const reminderTimesRaw = formData.get("reminder_times") as string;

  if (!name || name.trim().length === 0) {
    throw new Error("Medication name is required");
  }

  let reminderTimes: string[];
  try {
    reminderTimes = JSON.parse(reminderTimesRaw);
    if (!Array.isArray(reminderTimes) || reminderTimes.length === 0) {
      throw new Error("Invalid format");
    }
  } catch {
    throw new Error("reminder_times must be a valid JSON array of time strings");
  }

  const db = getDb();
  db.prepare(
    "INSERT INTO medications (user_id, name, reminder_times, last_taken_date) VALUES (?, ?, ?, NULL)"
  ).run(1, name.trim(), JSON.stringify(reminderTimes));

  revalidatePath("/");
}

export async function toggleMedication(id: number) {
  const db = getDb();

  const existing = db
    .prepare("SELECT * FROM medications WHERE id = ? AND user_id = ?")
    .get(id, 1) as Record<string, unknown> | undefined;

  if (!existing) {
    throw new Error("Medication not found");
  }

  const today = getUserToday(1);
  const lastTakenDate = existing.last_taken_date as string | null;

  const newDate = lastTakenDate === today ? null : today;

  db.prepare(
    "UPDATE medications SET last_taken_date = ? WHERE id = ? AND user_id = ?"
  ).run(newDate, id, 1);

  revalidatePath("/");
}

export async function deleteMedication(id: number) {
  const db = getDb();

  const result = db
    .prepare("DELETE FROM medications WHERE id = ? AND user_id = ?")
    .run(id, 1);

  if (result.changes === 0) {
    throw new Error("Medication not found");
  }

  revalidatePath("/");
}

export async function addWater(formData: FormData) {
  const amountRaw = formData.get("amount") as string;
  const amount = parseInt(amountRaw, 10);

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const db = getDb();
  const today = getUserToday(1);

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(1) as Record<
    string,
    unknown
  >;

  let currentWater = row.water_consumed_today as number;

  if (row.last_water_log_date !== today) {
    currentWater = 0;
  }

  const newTotal = currentWater + amount;

  db.prepare(
    "UPDATE users SET water_consumed_today = ?, last_water_log_date = ? WHERE id = ?"
  ).run(newTotal, today, 1);

  revalidatePath("/");
}
