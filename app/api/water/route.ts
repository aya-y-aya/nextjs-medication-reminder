import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(1) as Record<
    string,
    unknown
  >;

  const today = new Date().toISOString().split("T")[0];

  // Reset water if it is a new day
  if (row.last_water_log_date !== today) {
    db.prepare(
      "UPDATE users SET water_consumed_today = 0, last_water_log_date = ? WHERE id = ?"
    ).run(today, 1);

    return Response.json({
      water_consumed_today: 0,
      daily_water_goal: row.daily_water_goal as number,
      last_water_log_date: today,
    });
  }

  return Response.json({
    water_consumed_today: row.water_consumed_today as number,
    daily_water_goal: row.daily_water_goal as number,
    last_water_log_date: row.last_water_log_date as string,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { amount } = body;

  if (amount === undefined || typeof amount !== "number" || amount <= 0) {
    return Response.json(
      { error: "amount is required and must be a positive number" },
      { status: 400 }
    );
  }

  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  // Check if we need to reset first (new day)
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(1) as Record<
    string,
    unknown
  >;

  let currentWater = row.water_consumed_today as number;

  if (row.last_water_log_date !== today) {
    // New day - reset and start fresh
    currentWater = 0;
  }

  const newTotal = currentWater + amount;

  db.prepare(
    "UPDATE users SET water_consumed_today = ?, last_water_log_date = ? WHERE id = ?"
  ).run(newTotal, today, 1);

  return Response.json({
    water_consumed_today: newTotal,
    daily_water_goal: row.daily_water_goal as number,
    last_water_log_date: today,
  });
}
