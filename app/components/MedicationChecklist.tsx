"use client";

import { useTransition } from "react";
import { toggleMedication, deleteMedication } from "@/lib/actions";
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

  if (medications.length === 0) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400 text-sm italic">
        No medications added yet. Use the form below to add your first
        medication.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Medication checklist">
      {medications.map((med) => {
        const isTakenToday = med.last_taken_date === today;

        return (
          <li
            key={med.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-800 sm:p-4"
          >
            <label className="flex flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isTakenToday}
                onChange={() => handleToggle(med.id)}
                disabled={isPending}
                className="h-5 w-5 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700"
                aria-label={`Mark ${med.name} as ${isTakenToday ? "not taken" : "taken"}`}
              />
              <span className="flex flex-col gap-0.5">
                <span
                  className={`text-sm font-medium sm:text-base ${
                    isTakenToday
                      ? "text-zinc-400 line-through dark:text-zinc-500"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {med.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {med.reminder_times.join(", ")}
                </span>
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
          </li>
        );
      })}
    </ul>
  );
}
