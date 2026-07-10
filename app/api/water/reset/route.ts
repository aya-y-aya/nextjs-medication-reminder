import { updateUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const today = new Date().toISOString().split("T")[0];

  updateUser(1, { water_consumed_today: 0, last_water_log_date: today });

  return Response.json({
    water_consumed_today: 0,
    last_water_log_date: today,
  });
}
