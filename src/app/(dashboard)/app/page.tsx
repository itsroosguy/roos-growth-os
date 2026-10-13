import { redirect } from "next/navigation";

export default function AppEntryPage() {
  // Redirect to workspace selection or default org
  redirect("/select-org");
}
