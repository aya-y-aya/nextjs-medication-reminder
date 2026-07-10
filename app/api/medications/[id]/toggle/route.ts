import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const medicationId = parseInt(id, 10);

  if (isNaN(medicationId)) {
    return Response.json({ error: "Invalid medication id" }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM medications WHERE id = ? AND user_id = ?")
    .get(medicationId, 1) as Record<string, unknown> | undefined;

  if (!existing) {
    return Response.json({ error: "Medication not found" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];
  const lastTakenDate = existing.last_taken_date as string | null;

  // Toggle: if last_taken_date matches today, uncheck (set to null); otherwise, check (set to today)
  const newDate = lastTakenDate === today ? null : today;

  db.prepare(
    "UPDATE medications SET last_taken_date = ? WHERE id = ? AND user_id = ?"
  ).run(newDate, medicationId, 1);

  return Response.json({
    id: existing.id,
    user_id: existing.user_id,
    name: existing.name,
    reminder_times: JSON.parse(existing.reminder_times as string),
    last_taken_date: newDate,
  });
}
