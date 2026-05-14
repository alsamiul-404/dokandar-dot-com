"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--muted))_0%,_transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 flex max-w-xl flex-col items-center gap-8 text-center"
      >
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            বাংলাদেশি দোকানদারদের জন্য
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Dokandar.app
          </h1>
          <p className="text-balance text-base text-muted-foreground sm:text-lg">
            হিসাব, স্টক, গ্রাহক ও বিক্রয় — সব এক জায়গায়। সহজ বাংলা ইন্টারফেস।
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-14 min-h-[3.5rem] w-full text-lg sm:w-auto sm:min-w-[12rem]"
          >
            <Link href="/auth">লগ ইন / নিবন্ধন</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 min-h-[3.5rem] w-full text-lg sm:w-auto sm:min-w-[12rem]"
          >
            <Link href="/dashboard">ড্যাশবোর্ড</Link>
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
