import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  db.prepare(
    "UPDATE users SET water_consumed_today = 0, last_water_log_date = ? WHERE id = ?"
  ).run(today, 1);

  return Response.json({
    water_consumed_today: 0,
    last_water_log_date: today,
  });
}
