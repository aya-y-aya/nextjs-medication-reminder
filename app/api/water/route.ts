import { getUser, updateUser } from "@/lib/db";
import { getUserToday } from "@/lib/timezone";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = getUser(session.userId);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 500 });
  }

  const today = getUserToday(session.userId);

  // Reset water if it is a new day
  if (user.last_water_log_date !== today) {
    updateUser(session.userId, { water_consumed_today: 0, last_water_log_date: today });

    return Response.json({
      water_consumed_today: 0,
      daily_water_goal: user.daily_water_goal,
      last_water_log_date: today,
    });
  }

  return Response.json({
    water_consumed_today: user.water_consumed_today,
    daily_water_goal: user.daily_water_goal,
    last_water_log_date: user.last_water_log_date,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { amount } = body;

  if (amount === undefined || typeof amount !== "number" || amount <= 0) {
    return Response.json(
      { error: "amount is required and must be a positive number" },
      { status: 400 }
    );
  }

  const today = getUserToday(session.userId);
  const user = getUser(session.userId);

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 500 });
  }

  let currentWater = user.water_consumed_today;

  if (user.last_water_log_date !== today) {
    // New day - reset and start fresh
    currentWater = 0;
  }

  const newTotal = currentWater + amount;

  updateUser(session.userId, { water_consumed_today: newTotal, last_water_log_date: today });

  return Response.json({
    water_consumed_today: newTotal,
    daily_water_goal: user.daily_water_goal,
    last_water_log_date: today,
  });
}
