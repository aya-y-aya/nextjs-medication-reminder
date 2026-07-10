"use client";

import { useTransition } from "react";
import { toggleMedication, deleteMedication, confirmMedicationIntake } from "@/lib/actions";
import type { Medication } from "@/lib/types";

interface MedicationChecklistProps {
  medications: Medication[];
}

export default function MedicationChecklist({
  medications,
}: MedicationChecklistProps) {
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];

  function handleToggle(id: number) {
    startTransition(() => {
      toggleMedication(id);
    });
  }

  function handleDelete(id: number) {
    startTransition(() => {
      deleteMedication(id);
    });
  }

  function handleConfirmTime(medicationId: number, medicationName: string, scheduledTime: string) {
    startTransition(() => {
      confirmMedicationIntake(medicationId, medicationName, scheduledTime);
    });
  }

  if (medications.length === 0) {
    return (
      <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
        No medications added yet. Use the form below to add your first
        medication.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Medication checklist">
      {medications.map((med) => {
        // Determine which times have been taken today
        const takenTimesToday =
          med.last_taken_times_date === today ? med.taken_times_today : [];

        const allTaken =
          med.reminder_times.length > 0 &&
          med.reminder_times.every((t) => takenTimesToday.includes(t));

        return (
          <li
            key={med.id}
            className="rounded-lg border border-zinc-200 bg-white shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={allTaken}
                  onChange={() => handleToggle(med.id)}
                  disabled={isPending}
                  className="h-5 w-5 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700"
                  aria-label={`Mark ${med.name} as ${allTaken ? "not taken" : "taken"}`}
                />
                <span
                  className={`text-sm font-medium sm:text-base ${
                    allTaken
                      ? "text-zinc-400 line-through dark:text-zinc-500"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {med.name}
                </span>
              </label>
              <button
                type="button"
                onClick={() => handleDelete(med.id)}
                disabled={isPending}
                className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-zinc-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                aria-label={`Delete ${med.name}`}
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
            {med.reminder_times.length > 0 && (
              <ul
                className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-700 sm:px-4"
                aria-label={`Schedule times for ${med.name}`}
              >
                {med.reminder_times.map((time) => {
                  const isTaken = takenTimesToday.includes(time);
                  return (
                    <li
                      key={time}
                      className="flex items-center gap-2 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={isTaken}
                        onChange={() => handleConfirmTime(med.id, med.name, time)}
                        disabled={isPending}
                        className="h-4 w-4 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700"
                        aria-label={`Mark ${med.name} at ${time} as taken`}
                      />
                      <span
                        className={`text-xs sm:text-sm ${
                          isTaken
                            ? "text-zinc-400 line-through dark:text-zinc-500"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {time}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
