import { redirect } from "next/navigation";
import { getDefaultAppRoute } from "@/lib/routes";

export default function SearchPage() {
  redirect(getDefaultAppRoute());
}
