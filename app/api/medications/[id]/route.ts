import {
  getMedication,
  deleteMedication,
  updateMedication,
} from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
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

  const deleted = deleteMedication(medicationId, session.userId);

  if (!deleted) {
    return Response.json({ error: "Medication not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}

export async function PATCH(
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

  const body = await request.json();

  const existing = getMedication(medicationId, session.userId);

  if (!existing) {
    return Response.json({ error: "Medication not found" }, { status: 404 });
  }

  const updates: Partial<{
    name: string;
    reminder_times: string[];
    last_taken_date: string | null;
  }> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return Response.json(
        { error: "name must be a non-empty string" },
        { status: 400 }
      );
    }
    updates.name = body.name.trim();
  }

  if (body.reminder_times !== undefined) {
    if (
      !Array.isArray(body.reminder_times) ||
      body.reminder_times.length === 0
    ) {
      return Response.json(
        { error: "reminder_times must be a non-empty array" },
        { status: 400 }
      );
    }
    const timeRegex = /^\d{2}:\d{2}$/;
    for (const time of body.reminder_times) {
      if (typeof time !== "string" || !timeRegex.test(time)) {
        return Response.json(
          { error: "Each reminder_time must be a string in HH:MM format" },
          { status: 400 }
        );
      }
    }
    updates.reminder_times = body.reminder_times;
  }

  if (body.last_taken_date !== undefined) {
    if (body.last_taken_date !== null) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (
        typeof body.last_taken_date !== "string" ||
        !dateRegex.test(body.last_taken_date)
      ) {
        return Response.json(
          { error: "last_taken_date must be null or a valid YYYY-MM-DD string" },
          { status: 400 }
        );
      }
    }
    updates.last_taken_date = body.last_taken_date;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = updateMedication(medicationId, session.userId, updates);

  if (!updated) {
    return Response.json({ error: "Medication not found" }, { status: 404 });
  }

  return Response.json({
    id: updated.id,
    user_id: updated.user_id,
    name: updated.name,
    reminder_times: updated.reminder_times,
    last_taken_date: updated.last_taken_date,
  });
}
