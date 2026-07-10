"use client";

import { useTransition } from "react";
import { addWater } from "@/lib/actions";

interface WaterTrackerProps {
  waterConsumed: number;
  dailyGoal: number;
}

export default function WaterTracker({
  waterConsumed,
  dailyGoal,
}: WaterTrackerProps) {
  const [isPending, startTransition] = useTransition();

  const percentage = Math.min(
    Math.round((waterConsumed / dailyGoal) * 100),
    100
  );

  function handleAddWater(amount: number) {
    const formData = new FormData();
    formData.set("amount", amount.toString());
    startTransition(() => {
      addWater(formData);
    });
  }

  function handleCustomSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = parseInt(formData.get("amount") as string, 10);
    if (isNaN(amount) || amount <= 0) return;
    startTransition(() => {
      addWater(formData);
    });
    event.currentTarget.reset();
  }

  return (
    <div className="space-y-4">
      {/* Progress display */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {waterConsumed} ml / {dailyGoal} ml
          </span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {percentage}%
          </span>
        </div>
        <div
          className="h-4 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
          role="progressbar"
          aria-valuenow={waterConsumed}
          aria-valuemin={0}
          aria-valuemax={dailyGoal}
          aria-label={`Water intake: ${waterConsumed} of ${dailyGoal} ml`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out dark:from-blue-500 dark:to-blue-700"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {[250, 500, 750].map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handleAddWater(amount)}
            disabled={isPending}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 sm:px-4"
          >
            +{amount} ml
          </button>
        ))}
      </div>

      {/* Custom amount form */}
      <form
        onSubmit={handleCustomSubmit}
        className="flex items-center gap-2"
      >
        <label htmlFor="custom-water-amount" className="sr-only">
          Custom water amount in ml
        </label>
        <input
          id="custom-water-amount"
          type="number"
          name="amount"
          min={1}
          placeholder="Custom ml"
          required
          className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 sm:w-32"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Add
        </button>
      </form>
    </div>
  );
}
