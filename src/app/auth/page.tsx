import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth-options";
import { AuthForms } from "./auth-forms";

export const metadata: Metadata = {
  title: "লগইন",
  description: "দোকানদার লগইন ও নিবন্ধন",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard");
  }

  const raw = searchParams.error;
  const nextAuthError = typeof raw === "string" ? raw : undefined;

  return (
    <main className="bg-app-mesh relative flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6">
      <AuthForms nextAuthError={nextAuthError} />
    </main>
  );
}
