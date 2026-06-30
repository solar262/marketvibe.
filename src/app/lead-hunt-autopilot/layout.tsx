import { requireAdmin } from "@/lib/auth";

export default async function LeadHuntAutopilotLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
