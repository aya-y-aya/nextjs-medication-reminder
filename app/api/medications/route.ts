import { getDb } from "@/lib/db";
import type { Medication } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM medications WHERE user_id = ?").all(1);

  const medications: Medication[] = (rows as Array<Record<string, unknown>>).map(
    (row) => ({
      id: row.id as number,
      user_id: row.user_id as number,
      name: row.name as string,
      reminder_times: JSON.parse(row.reminder_times as string),
      last_taken_date: row.last_taken_date as string | null,
    })
  );

  return Response.json(medications);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { name, reminder_times } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json(
      { error: "name is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (
    !reminder_times ||
    !Array.isArray(reminder_times) ||
    reminder_times.length === 0
  ) {
    return Response.json(
      { error: "reminder_times is required and must be a non-empty array" },
      { status: 400 }
    );
  }

  const timeRegex = /^\d{2}:\d{2}$/;
  for (const time of reminder_times) {
    if (typeof time !== "string" || !timeRegex.test(time)) {
      return Response.json(
        {
          error:
            "Each reminder_time must be a string in HH:MM format",
        },
        { status: 400 }
      );
    }
  }

  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO medications (user_id, name, reminder_times, last_taken_date) VALUES (?, ?, ?, NULL)"
    )
    .run(1, name.trim(), JSON.stringify(reminder_times));

  const medication: Medication = {
    id: result.lastInsertRowid as number,
    user_id: 1,
    name: name.trim(),
    reminder_times,
    last_taken_date: null,
  };

  return Response.json(medication, { status: 201 });
}
