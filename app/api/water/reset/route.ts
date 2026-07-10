import { updateUser } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  updateUser(session.userId, { water_consumed_today: 0, last_water_log_date: today });

  return Response.json({
    water_consumed_today: 0,
    last_water_log_date: today,
  });
}
