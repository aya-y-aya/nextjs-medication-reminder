import { getDb } from "@/lib/db";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST() {
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

    // Get medications for this user
    const medications = db
      .prepare("SELECT * FROM medications WHERE user_id = ?")
      .all(user.id as number) as Array<Record<string, unknown>>;

    for (const med of medications) {
      const reminderTimes: string[] = JSON.parse(
        med.reminder_times as string
      );

      if (reminderTimes.includes(currentTime)) {
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
