import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function FacebookRadarLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
