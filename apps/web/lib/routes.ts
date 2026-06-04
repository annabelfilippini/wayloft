export const TRAVEL_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_TRAVEL === "true";

export function getDefaultAppRoute() {
  return TRAVEL_ENABLED ? "/travel" : "/dashboard";
}

export function getTripsRoute() {
  return TRAVEL_ENABLED ? "/travel#trips" : "/dashboard";
}
