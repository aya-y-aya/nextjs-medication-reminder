"use server";

import {
  createMedication,
  getMedication,
  deleteMedication as dbDeleteMedication,
  updateMedication,
  getUser,
  updateUser,
  createMedicationLog,
  createWaterLog,
} from "@/lib/db";
import { getUserToday } from "@/lib/timezone";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";

export async function addMedication(formData: FormData) {
  const session = await requireSession();
  const userId = session.userId;

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

  createMedication(userId, name.trim(), reminderTimes);

  revalidatePath("/");
}

export async function toggleMedication(id: number) {
  const session = await requireSession();
  const userId = session.userId;

  const existing = getMedication(id, userId);

  if (!existing) {
    throw new Error("Medication not found");
  }

  const today = getUserToday(userId);
  const newDate = existing.last_taken_date === today ? null : today;

  updateMedication(id, userId, { last_taken_date: newDate });

  // Log the event when marking as taken (not when unchecking)
  if (newDate !== null) {
    createMedicationLog(userId, id, existing.name, today);
  }

  revalidatePath("/");
}

export async function deleteMedication(id: number) {
  const session = await requireSession();
  const userId = session.userId;

  const deleted = dbDeleteMedication(id, userId);

  if (!deleted) {
    throw new Error("Medication not found");
  }

  revalidatePath("/");
}

export async function recordMedicationIntakeFromAlert(
  medicationId: number,
  taken: boolean
) {
  const session = await requireSession();
  const userId = session.userId;

  if (taken) {
    const existing = getMedication(medicationId, userId);

    if (!existing) {
      throw new Error("Medication not found");
    }

    const today = getUserToday(userId);

    // Guard against duplicate log entries if already taken today
    if (existing.last_taken_date === today) {
      revalidatePath("/");
      return;
    }

    updateMedication(medicationId, userId, { last_taken_date: today });
    createMedicationLog(userId, medicationId, existing.name, today);
  }

  revalidatePath("/");
}

export async function addWater(formData: FormData) {
  const session = await requireSession();
  const userId = session.userId;

  const amountRaw = formData.get("amount") as string;
  const amount = parseInt(amountRaw, 10);

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const today = getUserToday(userId);
  const user = getUser(userId);

  if (!user) {
    throw new Error("User not found");
  }

  let currentWater = user.water_consumed_today;

  if (user.last_water_log_date !== today) {
    currentWater = 0;
  }

  const newTotal = currentWater + amount;

  updateUser(userId, { water_consumed_today: newTotal, last_water_log_date: today });

  // Log the individual water intake event
  createWaterLog(userId, amount, today);

  revalidatePath("/");
}
