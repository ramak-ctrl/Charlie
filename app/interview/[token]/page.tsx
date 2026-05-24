import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import InterviewRoom from "@/components/candidate/InterviewRoom";
import CharlieLogo from "@/components/CharlieLogo";

export default async function InterviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: tokenData } = await supabase
    .from("interview_tokens")
    .select("*, candidates(*), jobs(id, title, company_intro, key_skills)")
    .eq("token", token)
    .single();

  if (!tokenData) notFound();

  const expired = new Date(tokenData.expires_at) < new Date();

  let interview = null;
  if (tokenData.used_at) {
    const { data } = await supabase
      .from("interviews")
      .select("id, status")
      .eq("token_id", tokenData.id)
      .single();
    interview = data;
  }

  const pageData = {
    token: {
      id: tokenData.id,
      token: tokenData.token,
      expires_at: tokenData.expires_at,
      used_at: tokenData.used_at,
    },
    candidate: tokenData.candidates as { id: string; name: string; email: string },
    job: tokenData.jobs as { id: string; title: string; company_intro: string | null; key_skills: string[] },
    interview,
    expired,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 32px" }}>
        <CharlieLogo size="sm" href="/" />
      </header>
      <InterviewRoom pageData={pageData} />
    </div>
  );
}
