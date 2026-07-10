"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Medication } from "@/lib/types";
import { confirmMedicationIntake } from "@/lib/actions";

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
  const [confirmingAlerts, setConfirmingAlerts] = useState<
    Record<string, "yes" | "no" | null>
  >({});
  const [pendingAlerts, setPendingAlerts] = useState<Set<string>>(new Set());
  const notifiedRef = useRef<Set<string>>(new Set());

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setConfirmingAlerts((prev) => {
      const next = { ...prev };
      delete next[alertId];
      return next;
    });
  }, []);

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

  // Auto-dismiss each alert individually after a random duration
  // between 5 minutes (300000ms) and 10 minutes (600000ms)
  const dismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  useEffect(() => {
    for (const alert of alerts) {
      // Do not set auto-dismiss timer if user is interacting with this alert
      if (confirmingAlerts[alert.id] !== undefined) {
        // If a timer already exists for an alert being interacted with, clear it
        if (dismissTimersRef.current.has(alert.id)) {
          clearTimeout(dismissTimersRef.current.get(alert.id));
          dismissTimersRef.current.delete(alert.id);
        }
        continue;
      }

      if (!dismissTimersRef.current.has(alert.id)) {
        const minDuration = 5 * 60 * 1000; // 5 minutes
        const maxDuration = 10 * 60 * 1000; // 10 minutes
        const duration =
          Math.floor(Math.random() * (maxDuration - minDuration + 1)) +
          minDuration;
        const timer = setTimeout(() => {
          setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
          dismissTimersRef.current.delete(alert.id);
        }, duration);
        dismissTimersRef.current.set(alert.id, timer);
      }
    }

    // Clean up timers for alerts that have already been dismissed manually
    dismissTimersRef.current.forEach((timer, id) => {
      if (!alerts.some((a) => a.id === id)) {
        clearTimeout(timer);
        dismissTimersRef.current.delete(id);
      }
    });
  }, [alerts, confirmingAlerts]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      dismissTimersRef.current.forEach((timer) => clearTimeout(timer));
      dismissTimersRef.current.clear();
    };
  }, []);

  const handleRadioChange = (alertId: string, value: "yes" | "no") => {
    setConfirmingAlerts((prev) => ({ ...prev, [alertId]: value }));
  };

  const handleConfirm = (alert: ActiveAlert) => {
    const selection = confirmingAlerts[alert.id];
    if (selection === "yes") {
      setPendingAlerts((prev) => new Set(prev).add(alert.id));
      confirmMedicationIntake(alert.medicationId, alert.medicationName)
        .then(() => {
          dismissAlert(alert.id);
        })
        .finally(() => {
          setPendingAlerts((prev) => {
            const next = new Set(prev);
            next.delete(alert.id);
            return next;
          });
        });
    } else if (selection === "no") {
      dismissAlert(alert.id);
    }
  };

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
          className="flex flex-col rounded-xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-zinc-900 sm:p-5"
        >
          <div className="flex items-start gap-3">
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
            <button
              type="button"
              onClick={() => dismissAlert(alert.id)}
              className="shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label={`Dismiss reminder for ${alert.medicationName}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <fieldset className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Did you take this medicine?
            </legend>
            <div className="mt-2 flex flex-wrap items-center gap-4 sm:gap-6">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name={`confirm-${alert.id}`}
                  value="yes"
                  checked={confirmingAlerts[alert.id] === "yes"}
                  onChange={() => handleRadioChange(alert.id, "yes")}
                  className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name={`confirm-${alert.id}`}
                  value="no"
                  checked={confirmingAlerts[alert.id] === "no"}
                  onChange={() => handleRadioChange(alert.id, "no")}
                  className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                />
                No
              </label>
            </div>
            <button
              type="button"
              onClick={() => handleConfirm(alert)}
              disabled={
                confirmingAlerts[alert.id] == null || pendingAlerts.has(alert.id)
              }
              className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600 sm:w-auto"
            >
              {pendingAlerts.has(alert.id) ? "Saving..." : "Confirm"}
            </button>
          </fieldset>
        </article>
      ))}
    </aside>
  );
}
