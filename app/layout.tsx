import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/app/components/LogoutButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Health & Hydration Reminder",
  description:
    "Track your daily medications and water intake with automated reminders.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {session && (
          <nav className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Signed in as{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {session.email}
                </span>
              </span>
              <LogoutButton />
            </div>
          </nav>
        )}
        {children}
      </body>
    </html>
  );
}
