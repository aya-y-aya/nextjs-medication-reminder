"use client";

import { useTransition } from "react";
import { logout } from "@/lib/auth-actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
      className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
