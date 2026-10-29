import { redirect } from "next/navigation";
import { TEMPORARY_BYPASS_AUTH } from "@/middleware";

export default function RootPage() {
  if (TEMPORARY_BYPASS_AUTH) {
    redirect("/app/acme-corp/overview");
  }
  redirect("/login");
}
