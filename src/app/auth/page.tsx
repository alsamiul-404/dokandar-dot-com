import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth-options";
import { AuthForms } from "./auth-forms";

export const metadata: Metadata = {
  title: "লগইন",
  description: "দোকানদার লগইন ও নিবন্ধন",
};

export default async function AuthPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-dvh flex-col bg-gradient-to-b from-muted/40 to-background">
      <AuthForms />
    </main>
  );
}
