import { getDb } from "@/lib/db";
import type { Medication } from "@/lib/types";
import MedicationChecklist from "@/app/components/MedicationChecklist";
import WaterTracker from "@/app/components/WaterTracker";
import AddMedicationForm from "@/app/components/AddMedicationForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  // Fetch user data
  const userRow = db.prepare("SELECT * FROM users WHERE id = ?").get(1) as
    | Record<string, unknown>
    | undefined;

  let waterConsumed = 0;
  let dailyGoal = 2000;

  if (userRow) {
    dailyGoal = userRow.daily_water_goal as number;
    // Reset water if it is a new day
    if (userRow.last_water_log_date !== today) {
      waterConsumed = 0;
      db.prepare(
        "UPDATE users SET water_consumed_today = 0, last_water_log_date = ? WHERE id = ?"
      ).run(today, 1);
    } else {
      waterConsumed = userRow.water_consumed_today as number;
    }
  }

  // Fetch medications
  const medicationRows = db
    .prepare("SELECT * FROM medications WHERE user_id = ? ORDER BY name ASC")
    .all(1) as Array<Record<string, unknown>>;

  const medications: Medication[] = medicationRows.map((row) => ({
    id: row.id as number,
    user_id: row.user_id as number,
    name: row.name as string,
    reminder_times: JSON.parse(row.reminder_times as string) as string[],
    last_taken_date: row.last_taken_date as string | null,
  }));

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Health &amp; Hydration Reminder
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track your daily medications and water intake
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Medication checklist section */}
          <section
            aria-labelledby="medication-heading"
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
          >
            <h2
              id="medication-heading"
              className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Today&apos;s Medications
            </h2>
            <MedicationChecklist medications={medications} />
          </section>

          {/* Water tracker section */}
          <section
            aria-labelledby="water-heading"
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
          >
            <h2
              id="water-heading"
              className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Water Intake
            </h2>
            <WaterTracker
              waterConsumed={waterConsumed}
              dailyGoal={dailyGoal}
            />
          </section>

          {/* Add medication form section */}
          <section
            aria-labelledby="add-medication-heading"
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6 md:col-span-2"
          >
            <h2
              id="add-medication-heading"
              className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Add New Medication
            </h2>
            <AddMedicationForm />
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-200 px-4 py-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 sm:px-6">
        <p>Health &amp; Hydration Reminder &mdash; Stay on track, every day.</p>
      </footer>
    </div>
  );
}
