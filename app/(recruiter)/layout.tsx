import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecruiterShell from "@/components/recruiter/RecruiterShell";

export const dynamic = "force-dynamic";

export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return <RecruiterShell userEmail={user.email ?? ""}>{children}</RecruiterShell>;
}
