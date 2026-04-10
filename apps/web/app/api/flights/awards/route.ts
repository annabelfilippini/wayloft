import { createClient } from "@/lib/supabase/server";
import { searchAwards, SeatsAeroError } from "@/lib/flights/seats-aero";
import type { AwardCabin, AwardSearchParams } from "@/lib/flights/types";

const VALID_CABINS: AwardCabin[] = ["Y", "W", "J", "F"];

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return Response.json(
      { error: "origin and destination are required" },
      { status: 400 }
    );
  }

  const cabinsParam = searchParams.get("cabins");
  const cabins = cabinsParam
    ? (cabinsParam
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c): c is AwardCabin =>
          VALID_CABINS.includes(c as AwardCabin)
        ))
    : undefined;

  const sourcesParam = searchParams.get("sources");
  const sources = sourcesParam
    ? sourcesParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const takeParam = searchParams.get("take");
  const parsedTake = takeParam ? parseInt(takeParam, 10) : NaN;
  const take = Number.isFinite(parsedTake)
    ? Math.min(Math.max(parsedTake, 10), 1000)
    : 100;

  const params: AwardSearchParams = {
    origin,
    destination,
    startDate: searchParams.get("start_date") ?? undefined,
    endDate: searchParams.get("end_date") ?? undefined,
    onlyDirect: searchParams.get("only_direct") === "true",
    cabins,
    sources,
    take,
  };

  try {
    const result = await searchAwards(params);
    return Response.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof SeatsAeroError) {
      const status =
        error.category === "validation"
          ? 400
          : error.category === "auth"
            ? 502
            : error.category === "rate_limit"
              ? 429
              : 502;
      return Response.json(
        {
          success: false,
          error: {
            category: error.category === "validation" ? "validation" : "transient",
            message:
              error.category === "auth"
                ? "Award search is temporarily unavailable"
                : error.message,
            isRetryable: error.isRetryable,
          },
        },
        { status }
      );
    }
    console.error("Award search unexpected error:", error);
    return Response.json(
      {
        success: false,
        error: {
          category: "transient",
          message: "Award search failed",
          isRetryable: true,
        },
      },
      { status: 500 }
    );
  }
}
