import { getMedication, updateMedication } from "@/lib/db";
import { getUserToday } from "@/lib/timezone";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const medicationId = parseInt(id, 10);

  if (isNaN(medicationId)) {
    return Response.json({ error: "Invalid medication id" }, { status: 400 });
  }

  const existing = getMedication(medicationId, session.userId);

  if (!existing) {
    return Response.json({ error: "Medication not found" }, { status: 404 });
  }

  const today = getUserToday(session.userId);

  // Toggle: if last_taken_date matches today, uncheck (set to null); otherwise, check (set to today)
  const newDate = existing.last_taken_date === today ? null : today;

  updateMedication(medicationId, session.userId, { last_taken_date: newDate });

  return Response.json({
    id: existing.id,
    user_id: existing.user_id,
    name: existing.name,
    reminder_times: existing.reminder_times,
    last_taken_date: newDate,
  });
}
