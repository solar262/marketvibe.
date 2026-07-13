import type { Metadata } from "next";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="bg-stone-50 lg:flex">
      <AdminNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
