"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  shopName: string;
  children: React.ReactNode;
};

export function DashboardChrome({ shopName, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/50">
      <header className="sticky top-0 z-20 border-b-2 border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3 sm:max-w-2xl">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-muted-foreground">দোকান</p>
            <p className="truncate text-lg font-bold leading-tight text-foreground">
              {shopName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/">হোম</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => signOut({ callbackUrl: "/auth" })}
              aria-label="লগ আউট"
            >
              <LogOut className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4 sm:max-w-2xl">
        {children}
      </div>
    </div>
  );
}
