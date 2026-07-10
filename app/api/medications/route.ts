import { getMedications, createMedication } from "@/lib/db";
import type { Medication } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const medications: Medication[] = getMedications(1);
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

  const medication = createMedication(1, name.trim(), reminder_times);

  return Response.json(medication, { status: 201 });
}
