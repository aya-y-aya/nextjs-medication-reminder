"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Medication } from "@/lib/types";

interface MedicationReminderAlertProps {
  medications: Medication[];
}

interface ActiveAlert {
  id: string;
  medicationName: string;
  time: string;
  timestamp: number;
}

export default function MedicationReminderAlert({
  medications,
}: MedicationReminderAlertProps) {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
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
          const dedupeKey = `${med.id}-${time}-${currentTime}`;

          if (!notifiedRef.current.has(dedupeKey)) {
            notifiedRef.current.add(dedupeKey);

            const alert: ActiveAlert = {
              id: `${med.id}-${time}-${Date.now()}`,
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
      const keyTime = key.split("-").slice(-1)[0];
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

    // Then check every 30 seconds
    const interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, [checkReminders]);

  // Auto-dismiss alerts after 60 seconds
  useEffect(() => {
    if (alerts.length === 0) return;

    const timeout = setTimeout(() => {
      const now = Date.now();
      setAlerts((prev) => prev.filter((a) => now - a.timestamp < 60000));
    }, 60000);

    return () => clearTimeout(timeout);
  }, [alerts]);

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
          className="flex items-start gap-3 rounded-xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-zinc-900 sm:p-5"
        >
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
        </article>
      ))}
    </aside>
  );
}
