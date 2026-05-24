import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium text-gray-900">{profile?.full_name ?? "—"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Role</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{profile?.role ?? "recruiter"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data &amp; Privacy</CardTitle>
            <CardDescription>How candidate data is handled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>• Interview recordings and transcripts are retained for <strong>90 days</strong> by default.</p>
            <p>• Candidate PII is stored securely in Supabase and never shared with third parties.</p>
            <p>• AI analysis is performed by Claude (Anthropic). Transcripts are sent to Anthropic for processing.</p>
            <p>• Charlie never makes final hiring decisions — all recommendations require human confirmation.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span>ATS Export</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">CSV / JSON</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span>Phone Interviews</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Browser only (v1)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Language</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">English (v1)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
