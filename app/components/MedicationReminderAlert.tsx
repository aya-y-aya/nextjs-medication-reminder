"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { recordMedicationIntakeFromAlert } from "@/lib/actions";
import type { Medication } from "@/lib/types";

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

/**
 * Individual alert card component that owns its own useTransition,
 * preventing one card's pending state from blocking others.
 */
function AlertCard({
  alert,
  currentAnswer,
  onRadioChange,
  onConfirm,
  onDismiss,
}: {
  alert: ActiveAlert;
  currentAnswer: "yes" | "no" | null;
  onRadioChange: (alertId: string, value: "yes" | "no") => void;
  onConfirm: (alert: ActiveAlert, startTransition: React.TransitionStartFunction) => void;
  onDismiss: (alertId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <article
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
        <button
          type="button"
          onClick={() => onDismiss(alert.id)}
          aria-label={`Dismiss reminder for ${alert.medicationName}`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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
      </header>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800 sm:p-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Did you take this medicine?
          </legend>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="radio"
                name={`intake-${alert.id}`}
                value="yes"
                checked={currentAnswer === "yes"}
                onChange={() => onRadioChange(alert.id, "yes")}
                disabled={isPending}
                className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700"
              />
              Yes
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="radio"
                name={`intake-${alert.id}`}
                value="no"
                checked={currentAnswer === "no"}
                onChange={() => onRadioChange(alert.id, "no")}
                disabled={isPending}
                className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700"
              />
              No
            </label>
          </div>
        </fieldset>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onConfirm(alert, startTransition)}
            disabled={currentAnswer === null || isPending}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-900 sm:px-4 sm:py-2"
          >
            {isPending ? "Saving..." : "Confirm"}
          </button>
        </div>
      </section>
    </article>
  );
}

export default function MedicationReminderAlert({
  medications,
}: MedicationReminderAlertProps) {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, "yes" | "no" | null>
  >({});
  const notifiedRef = useRef<Set<string>>(new Set());

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[alertId];
      return next;
    });
  }, []);

  const handleConfirm = useCallback(
    (alert: ActiveAlert, startTransition: React.TransitionStartFunction) => {
      const answer = selectedAnswers[alert.id];
      if (!answer) return;

      const taken = answer === "yes";

      startTransition(async () => {
        await recordMedicationIntakeFromAlert(alert.medicationId, taken);
        dismissAlert(alert.id);
      });
    },
    [selectedAnswers, dismissAlert]
  );

  const handleRadioChange = useCallback(
    (alertId: string, value: "yes" | "no") => {
      setSelectedAnswers((prev) => ({ ...prev, [alertId]: value }));
    },
    []
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
    // Check immediately on mount using a short timeout to avoid
    // calling setState synchronously within an effect
    const initialTimer = setTimeout(checkReminders, 0);

    // Check every 10 seconds to avoid missing a one-minute window
    const interval = setInterval(checkReminders, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [checkReminders]);

  // Auto-dismiss each alert individually after 60 seconds,
  // but only if the user has not started interacting (no radio selected)
  const dismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  useEffect(() => {
    for (const alert of alerts) {
      const hasInteraction = selectedAnswers[alert.id] != null;

      if (hasInteraction) {
        // Cancel existing timer if user started interacting
        const existingTimer = dismissTimersRef.current.get(alert.id);
        if (existingTimer) {
          clearTimeout(existingTimer);
          dismissTimersRef.current.delete(alert.id);
        }
        continue;
      }

      if (!dismissTimersRef.current.has(alert.id)) {
        const timer = setTimeout(() => {
          setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
          dismissTimersRef.current.delete(alert.id);
        }, 60000);
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
  }, [alerts, selectedAnswers]);

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = dismissTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Medication reminder alerts"
      aria-live="polite"
      className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6 md:max-w-md"
    >
      {alerts.map((alert) => {
        const currentAnswer = selectedAnswers[alert.id] ?? null;

        return (
          <AlertCard
            key={alert.id}
            alert={alert}
            currentAnswer={currentAnswer}
            onRadioChange={handleRadioChange}
            onConfirm={handleConfirm}
            onDismiss={dismissAlert}
          />
        );
      })}
    </aside>
  );
}
