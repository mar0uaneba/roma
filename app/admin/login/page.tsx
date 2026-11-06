import { Suspense } from "react";
import { LoginScreen } from "@/components/admin/login-screen";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return <LoginScreen configured={isSupabaseConfigured()} accessDenied={erreur === "acces"} />;
}
