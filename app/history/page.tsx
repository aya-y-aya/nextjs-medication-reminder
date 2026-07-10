import {
  getHistoryDates,
  getMedicationLogsByDate,
  getWaterLogsByDate,
} from "@/lib/db";
import { requireSession } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function HistoryPage() {
  const session = await requireSession();
  const userId = session.userId;

  const allDates = getHistoryDates(userId);
  // Limit to last 20 entries
  const dates = allDates.slice(0, 20);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
              History
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Your medication and water intake log
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {dates.length === 0 ? (
            <section className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-500 dark:text-zinc-400">
                No history yet. Start tracking your medications and water intake
                to see your daily logs here.
              </p>
            </section>
          ) : (
            dates.map((date) => {
              const medLogs = getMedicationLogsByDate(userId, date);
              const waterLogs = getWaterLogsByDate(userId, date);

              return (
                <section
                  key={date}
                  aria-labelledby={`date-${date}`}
                  className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <h2
                    id={`date-${date}`}
                    className="border-b border-zinc-100 px-5 py-4 text-lg font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 sm:px-6"
                  >
                    {formatDate(date)}
                  </h2>

                  <div className="grid gap-0 divide-y divide-zinc-100 dark:divide-zinc-800 md:grid-cols-2 md:divide-x md:divide-y-0">
                    {/* Medications taken */}
                    <div className="p-5 sm:p-6">
                      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Medications Taken
                      </h3>
                      {medLogs.length === 0 ? (
                        <p className="text-sm text-zinc-400 dark:text-zinc-500">
                          No medications logged
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {medLogs.map((log) => (
                            <li
                              key={log.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {log.medication_name}
                              </span>
                              <time
                                dateTime={log.taken_at}
                                className="text-zinc-500 dark:text-zinc-400"
                              >
                                {formatTime(log.taken_at)}
                              </time>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Water intake */}
                    <div className="p-5 sm:p-6">
                      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Water Intake
                      </h3>
                      {waterLogs.length === 0 ? (
                        <p className="text-sm text-zinc-400 dark:text-zinc-500">
                          No water logged
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {waterLogs.map((log) => (
                            <li
                              key={log.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {log.amount} ml
                              </span>
                              <time
                                dateTime={log.logged_at}
                                className="text-zinc-500 dark:text-zinc-400"
                              >
                                {formatTime(log.logged_at)}
                              </time>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
