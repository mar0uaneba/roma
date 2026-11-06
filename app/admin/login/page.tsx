import { Suspense } from "react";
import { LoginScreen } from "@/components/admin/login-screen";
import { isAdminPasswordSet } from "@/lib/admin/session";

export const metadata = { title: "Sign in" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { err } = await searchParams;
  return <LoginScreen error={typeof err === "string" ? err : undefined} configured={isAdminPasswordSet()} />;
}
