import { getUser, getMedications, updateUser } from "@/lib/db";
import { getUserToday } from "@/lib/timezone";
import type { Medication } from "@/lib/types";
import MedicationChecklist from "@/app/components/MedicationChecklist";
import MedicationReminderAlert from "@/app/components/MedicationReminderAlert";
import WaterTracker from "@/app/components/WaterTracker";
import AddMedicationForm from "@/app/components/AddMedicationForm";
import { requireSession } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await requireSession();
  const userId = session.userId;

  const today = getUserToday(userId);
  const userRow = getUser(userId);

  let waterConsumed = 0;
  let dailyGoal = 2000;

  if (userRow) {
    dailyGoal = userRow.daily_water_goal;
    // Reset water if it is a new day
    if (userRow.last_water_log_date !== today) {
      waterConsumed = 0;
      updateUser(userId, { water_consumed_today: 0, last_water_log_date: today });
    } else {
      waterConsumed = userRow.water_consumed_today;
    }
  }

  // Fetch medications (already sorted by name in getMedications)
  const medications: Medication[] = getMedications(userId);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <MedicationReminderAlert medications={medications} />
      <header className="border-b border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
              Health &amp; Hydration Reminder
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Track your daily medications and water intake
            </p>
          </div>
          <Link
            href="/history"
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            View History
          </Link>
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
