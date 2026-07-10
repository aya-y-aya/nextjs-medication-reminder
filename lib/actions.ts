"use server";

import {
  createMedication,
  getMedication,
  deleteMedication as dbDeleteMedication,
  updateMedication,
  getUser,
  updateUser,
} from "@/lib/db";
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

  createMedication(1, name.trim(), reminderTimes);

  revalidatePath("/");
}

export async function toggleMedication(id: number) {
  const existing = getMedication(id, 1);

  if (!existing) {
    throw new Error("Medication not found");
  }

  const today = getUserToday(1);
  const newDate = existing.last_taken_date === today ? null : today;

  updateMedication(id, 1, { last_taken_date: newDate });

  revalidatePath("/");
}

export async function deleteMedication(id: number) {
  const deleted = dbDeleteMedication(id, 1);

  if (!deleted) {
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

  const today = getUserToday(1);
  const user = getUser(1);

  if (!user) {
    throw new Error("User not found");
  }

  let currentWater = user.water_consumed_today;

  if (user.last_water_log_date !== today) {
    currentWater = 0;
  }

  const newTotal = currentWater + amount;

  updateUser(1, { water_consumed_today: newTotal, last_water_log_date: today });

  revalidatePath("/");
}
