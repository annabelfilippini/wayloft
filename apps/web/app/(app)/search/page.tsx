import { redirect } from "next/navigation";

const TRAVEL_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TRAVEL === "true";

export default function SearchPage() {
  redirect(TRAVEL_ENABLED ? "/travel" : "/dashboard");
}
