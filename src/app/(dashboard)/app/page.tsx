import { redirect } from "next/navigation";
import { TEMPORARY_BYPASS_AUTH } from "@/middleware";

export default function AppEntryPage() {
  if (TEMPORARY_BYPASS_AUTH) {
    redirect("/app/demo-corp/overview");
  }
  // Redirect to workspace selection or default org
  redirect("/select-org");
}
