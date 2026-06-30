import { requireAdmin } from "@/lib/auth";

export default async function FacebookRadarLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
