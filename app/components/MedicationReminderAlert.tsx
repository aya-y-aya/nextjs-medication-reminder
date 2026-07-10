"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import type { Medication } from "@/lib/types";
import { toggleMedication } from "@/lib/actions";

// Note: medications are passed as a prop from server-side rendering. If the user
// adds or modifies medications in another tab, this component will not see those
// changes until a full page navigation/reload. This is acceptable since each
// navigation triggers a fresh SSR fetch.

interface MedicationReminderAlertProps {
  medications: Medication[];
}

interface ActiveAlert {
  id: string;
  medicationId: number;
  medicationName: string;
  time: string;
  timestamp: number;
}

export default function MedicationReminderAlert({
  medications,
}: MedicationReminderAlertProps) {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [selections, setSelections] = useState<Record<string, "yes" | "no" | null>>({});
  const [isPending, startTransition] = useTransition();
  const notifiedRef = useRef<Set<string>>(new Set());

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setSelections((prev) => {
      const next = { ...prev };
      delete next[alertId];
      return next;
    });
  }, []);

  const handleSelectionChange = useCallback((alertId: string, value: "yes" | "no") => {
    setSelections((prev) => ({ ...prev, [alertId]: value }));
  }, []);

  const handleConfirm = useCallback(
    (alert: ActiveAlert) => {
      const selection = selections[alert.id];
      if (!selection) return;

      if (selection === "yes") {
        startTransition(async () => {
          try {
            await toggleMedication(alert.medicationId);
          } catch (error) {
            console.error("Failed to record medication intake:", error);
          }
          dismissAlert(alert.id);
        });
      } else {
        dismissAlert(alert.id);
      }
    },
    [selections, dismissAlert]
  );

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  }, []);

  const sendBrowserNotification = useCallback(
    (medicationName: string, time: string) => {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("Medication Reminder", {
          body: `Time to take ${medicationName} (scheduled for ${time})`,
          icon: "/favicon.ico",
        });
      }
    },
    []
  );

  const checkReminders = useCallback(() => {
    if (!medications || medications.length === 0) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const today = now.toISOString().split("T")[0];

    const newAlerts: ActiveAlert[] = [];

    for (const med of medications) {
      // Skip medications already taken today
      if (med.last_taken_date === today) continue;

      // Skip medications with no reminder times
      if (!med.reminder_times || med.reminder_times.length === 0) continue;

      for (const time of med.reminder_times) {
        if (time === currentTime) {
          const dedupeKey = `${med.id}|${time}`;

          if (!notifiedRef.current.has(dedupeKey)) {
            notifiedRef.current.add(dedupeKey);

            const alert: ActiveAlert = {
              id: `${med.id}-${time}-${Date.now()}`,
              medicationId: med.id,
              medicationName: med.name,
              time,
              timestamp: Date.now(),
            };

            newAlerts.push(alert);
            sendBrowserNotification(med.name, time);
          }
        }
      }
    }

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...prev, ...newAlerts]);
    }

    // Clean up old deduplication keys when the minute changes
    const keysToRemove: string[] = [];
    notifiedRef.current.forEach((key) => {
      const keyTime = key.split("|")[1];
      if (keyTime !== currentTime) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach((key) => notifiedRef.current.delete(key));
  }, [medications, sendBrowserNotification]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  useEffect(() => {
    // Check immediately on mount
    checkReminders();

    // Check every 10 seconds to avoid missing a one-minute window
    const interval = setInterval(checkReminders, 10000);

    return () => clearInterval(interval);
  }, [checkReminders]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Medication reminder alerts"
      aria-live="polite"
      className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6 md:max-w-md"
    >
      {alerts.map((alert) => (
        <article
          key={alert.id}
          role="alert"
          className="rounded-xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-zinc-900 sm:p-5"
        >
          <header className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 sm:h-10 sm:w-10"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">
                Medication Reminder
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Time to take{" "}
                <strong className="font-medium text-blue-700 dark:text-blue-400">
                  {alert.medicationName}
                </strong>
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Scheduled for {alert.time}
              </p>
            </div>
          </header>

          <form
            className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800"
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirm(alert);
            }}
          >
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Were you able to take this medicine?
              </legend>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <input
                  type="radio"
                  name={`response-${alert.id}`}
                  value="yes"
                  checked={selections[alert.id] === "yes"}
                  onChange={() => handleSelectionChange(alert.id, "yes")}
                  className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Yes, I took it
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <input
                  type="radio"
                  name={`response-${alert.id}`}
                  value="no"
                  checked={selections[alert.id] === "no"}
                  onChange={() => handleSelectionChange(alert.id, "no")}
                  className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  No, not yet
                </span>
              </label>
            </fieldset>

            <button
              type="submit"
              disabled={!selections[alert.id] || isPending}
              className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-900 sm:text-base"
            >
              {isPending ? "Saving..." : "Confirm"}
            </button>
          </form>
        </article>
      ))}
    </aside>
  );
}
