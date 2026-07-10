"use client";

import { useState, useTransition } from "react";
import { addMedication } from "@/lib/actions";

export default function AddMedicationForm() {
  const [isPending, startTransition] = useTransition();
  const [times, setTimes] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);

  function addTimeSlot() {
    setTimes((prev) => [...prev, ""]);
  }

  function removeTimeSlot(index: number) {
    setTimes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTime(index: number, value: string) {
    setTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;

    if (!name || name.trim().length === 0) {
      setError("Please enter a medication name.");
      return;
    }

    const validTimes = times.filter((t) => t.trim().length > 0);
    if (validTimes.length === 0) {
      setError("Please add at least one reminder time.");
      return;
    }

    const submitData = new FormData();
    submitData.set("name", name.trim());
    submitData.set("reminder_times", JSON.stringify(validTimes));

    startTransition(async () => {
      try {
        await addMedication(submitData);
        // Reset form on success
        const form = event.currentTarget as HTMLFormElement | null;
        form?.reset();
        setTimes([""]);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to add medication."
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset disabled={isPending} className="space-y-4">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          New Medication Details
        </legend>

        {/* Medication name */}
        <div>
          <label
            htmlFor="medication-name"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Medication Name
          </label>
          <input
            id="medication-name"
            type="text"
            name="name"
            placeholder="e.g., Vitamin D"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>

        {/* Reminder times */}
        <div className="space-y-2">
          <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Reminder Times
          </span>
          {times.map((time, index) => (
            <div key={index} className="flex items-center gap-2">
              <label htmlFor={`time-${index}`} className="sr-only">
                Reminder time {index + 1}
              </label>
              <input
                id={`time-${index}`}
                type="time"
                value={time}
                onChange={(e) => updateTime(index, e.target.value)}
                required
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              {times.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTimeSlot(index)}
                  className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                  aria-label={`Remove time slot ${index + 1}`}
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
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addTimeSlot}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/30"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add another time
          </button>
        </div>
      </fieldset>

      {/* Error feedback */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600 sm:w-auto"
      >
        {isPending ? "Adding..." : "Add Medication"}
      </button>
    </form>
  );
}
