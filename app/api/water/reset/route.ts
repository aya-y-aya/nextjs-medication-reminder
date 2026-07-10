import { updateUser } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getUserToday } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getUserToday(session.userId);

  updateUser(session.userId, { water_consumed_today: 0, last_water_log_date: today });

  return Response.json({
    water_consumed_today: 0,
    last_water_log_date: today,
  });
}
