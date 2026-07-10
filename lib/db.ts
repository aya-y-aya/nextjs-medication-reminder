import type { Medication, User } from "@/lib/types";

// In-memory data store (singleton for server process lifetime)
// Data resets on cold start - acceptable for this MVP demo

interface Store {
  users: Map<number, User>;
  medications: Map<number, Medication>;
  nextUserId: number;
  nextMedicationId: number;
}

let store: Store | null = null;

function getStore(): Store {
  if (store) {
    return store;
  }

  store = {
    users: new Map(),
    medications: new Map(),
    nextUserId: 2,
    nextMedicationId: 1,
  };

  // Seed default demo user (password: "password123")
  // bcryptjs hash for "password123" with 10 rounds
  store.users.set(1, {
    id: 1,
    email: "demo@example.com",
    password_hash:
      "$2b$10$7rQsEaaiz2pzMsIsjvxD4uMLp5u5DJS.VjeI8nvekmPUeIHmCsaEW",
    timezone: "America/New_York",
    daily_water_goal: 2000,
    water_consumed_today: 0,
    last_water_log_date: null,
  });

  return store;
}

// --- User functions ---

export function getUser(id: number): User | undefined {
  return getStore().users.get(id);
}

export function getUserByEmail(email: string): User | undefined {
  const s = getStore();
  for (const user of s.users.values()) {
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
}

export function createUser(
  email: string,
  passwordHash: string,
  timezone: string
): User {
  const s = getStore();
  const id = s.nextUserId++;
  const user: User = {
    id,
    email,
    password_hash: passwordHash,
    timezone,
    daily_water_goal: 2000,
    water_consumed_today: 0,
    last_water_log_date: null,
  };
  s.users.set(id, user);
  return user;
}

export function getAllUsers(): User[] {
  return Array.from(getStore().users.values());
}

export function updateUser(
  id: number,
  updates: Partial<Omit<User, "id">>
): User | undefined {
  const s = getStore();
  const user = s.users.get(id);
  if (!user) return undefined;

  const updated: User = { ...user, ...updates };
  s.users.set(id, updated);
  return updated;
}

// --- Medication functions ---

export function getMedications(userId: number): Medication[] {
  const s = getStore();
  return Array.from(s.medications.values())
    .filter((m) => m.user_id === userId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getMedication(
  id: number,
  userId: number
): Medication | undefined {
  const s = getStore();
  const med = s.medications.get(id);
  if (!med || med.user_id !== userId) return undefined;
  return med;
}

export function createMedication(
  userId: number,
  name: string,
  reminderTimes: string[]
): Medication {
  const s = getStore();
  const id = s.nextMedicationId++;
  const medication: Medication = {
    id,
    user_id: userId,
    name,
    reminder_times: reminderTimes,
    last_taken_date: null,
    last_reminded_at: null,
  };
  s.medications.set(id, medication);
  return medication;
}

export function updateMedication(
  id: number,
  userId: number,
  updates: Partial<Omit<Medication, "id" | "user_id">>
): Medication | undefined {
  const s = getStore();
  const med = s.medications.get(id);
  if (!med || med.user_id !== userId) return undefined;

  const updated: Medication = { ...med, ...updates };
  s.medications.set(id, updated);
  return updated;
}

export function deleteMedication(
  id: number,
  userId: number
): boolean {
  const s = getStore();
  const med = s.medications.get(id);
  if (!med || med.user_id !== userId) return false;
  s.medications.delete(id);
  return true;
}
