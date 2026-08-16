import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
