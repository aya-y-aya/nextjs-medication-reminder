export interface User {
  id: number;
  email: string;
  password_hash: string;
  timezone: string;
  daily_water_goal: number;
  water_consumed_today: number;
  last_water_log_date: string | null;
}

export interface Medication {
  id: number;
  user_id: number;
  name: string;
  reminder_times: string[];
  last_taken_date: string | null;
  last_reminded_at: string | null;
}

export interface CreateMedicationInput {
  user_id: number;
  name: string;
  reminder_times: string[];
}

export interface UpdateWaterInput {
  user_id: number;
  amount: number;
}
