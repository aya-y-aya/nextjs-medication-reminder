import { getDb } from "@/lib/db";
import { getDateInTimezone } from "@/lib/timezone";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Verify CRON_SECRET to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const db = getDb();

  // Get all users
  const users = db.prepare("SELECT * FROM users").all() as Array<
    Record<string, unknown>
  >;

  const emailsSent: Array<{ user_email: string; medication_name: string }> = [];
  const errors: string[] = [];

  for (const user of users) {
    const userTimezone = user.timezone as string;
    const userEmail = user.email as string;

    // Get the current time in the user's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
    const currentTime = `${hour}:${minute}`;

    // Get the current date in the user's timezone for deduplication
    const todayInUserTz = getDateInTimezone(userTimezone);

    // Get medications for this user
    const medications = db
      .prepare("SELECT * FROM medications WHERE user_id = ?")
      .all(user.id as number) as Array<Record<string, unknown>>;

    for (const med of medications) {
      const reminderTimes: string[] = JSON.parse(
        med.reminder_times as string
      );

      if (reminderTimes.includes(currentTime)) {
        // Deduplication: check if we already sent a reminder for this time slot today
        const lastRemindedAt = med.last_reminded_at as string | null;
        const expectedKey = `${todayInUserTz}T${currentTime}`;

        if (lastRemindedAt === expectedKey) {
          // Already sent for this time slot today, skip
          continue;
        }

        // Time matches - send email reminder
        try {
          const resendApiKey = process.env.RESEND_API_KEY;

          if (resendApiKey) {
            const resend = new Resend(resendApiKey);
            await resend.emails.send({
              from: "Health Reminder <reminders@example.com>",
              to: [userEmail],
              subject: `Medication Reminder: ${med.name}`,
              html: `<p>It's time to take your medication: <strong>${med.name}</strong></p><p>Scheduled time: ${currentTime}</p>`,
            });
          }

          // Record that we sent this reminder to prevent duplicates
          db.prepare(
            "UPDATE medications SET last_reminded_at = ? WHERE id = ?"
          ).run(expectedKey, med.id as number);

          emailsSent.push({
            user_email: userEmail,
            medication_name: med.name as string,
          });
        } catch (err) {
          errors.push(
            `Failed to send email to ${userEmail} for ${med.name}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
  }

  return Response.json({
    checked_at: new Date().toISOString(),
    emails_sent: emailsSent,
    errors,
  });
}
