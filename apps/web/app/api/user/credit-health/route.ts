import { NextResponse } from "next/server";
import { getCreditHealth } from "@/app/actions/credit-health";

export async function GET() {
  const health = await getCreditHealth();

  if (!health) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(health);
}
