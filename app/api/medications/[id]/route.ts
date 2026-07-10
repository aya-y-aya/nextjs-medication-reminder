import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const medicationId = parseInt(id, 10);

  if (isNaN(medicationId)) {
    return Response.json({ error: "Invalid medication id" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare("DELETE FROM medications WHERE id = ? AND user_id = ?")
    .run(medicationId, 1);

  if (result.changes === 0) {
    return Response.json({ error: "Medication not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const medicationId = parseInt(id, 10);

  if (isNaN(medicationId)) {
    return Response.json({ error: "Invalid medication id" }, { status: 400 });
  }

  const body = await request.json();
  const db = getDb();

  const existing = db
    .prepare("SELECT * FROM medications WHERE id = ? AND user_id = ?")
    .get(medicationId, 1) as Record<string, unknown> | undefined;

  if (!existing) {
    return Response.json({ error: "Medication not found" }, { status: 404 });
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.name !== undefined) {
    updates.push("name = ?");
    values.push(body.name);
  }

  if (body.reminder_times !== undefined) {
    updates.push("reminder_times = ?");
    values.push(JSON.stringify(body.reminder_times));
  }

  if (body.last_taken_date !== undefined) {
    updates.push("last_taken_date = ?");
    values.push(body.last_taken_date);
  }

  if (updates.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(medicationId, 1);
  db.prepare(
    `UPDATE medications SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`
  ).run(...values);

  const updated = db
    .prepare("SELECT * FROM medications WHERE id = ?")
    .get(medicationId) as Record<string, unknown>;

  return Response.json({
    id: updated.id,
    user_id: updated.user_id,
    name: updated.name,
    reminder_times: JSON.parse(updated.reminder_times as string),
    last_taken_date: updated.last_taken_date,
  });
}
