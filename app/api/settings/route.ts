import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSettingsStatus, saveSettings } from "@/lib/settings";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { userId: user.id };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json({ settings: await getSettingsStatus() });
}

const PutSchema = z.object({
  updates: z.record(z.string(), z.string()),
});

export async function PUT(request: NextRequest) {
  const { error, userId } = await requireAdmin();
  if (error) return error;

  const parsed = PutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const result = await saveSettings(parsed.data.updates, userId ?? null);
  return NextResponse.json({ ok: true, ...result, settings: await getSettingsStatus() });
}
