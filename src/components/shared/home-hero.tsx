import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const features = ["বাকি খাতা", "স্টক", "POS", "রিপোর্ট"];

/** Hero uses CSS-only motion so first paint is never stuck at opacity:0 (Framer SSR/hydration edge cases). */
export function HomeHero() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-20 sm:px-8">
      <div className="bg-app-mesh pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-[22rem] w-[22rem] animate-float-soft rounded-full bg-primary/25 blur-3xl [animation-duration:10s] sm:h-[28rem] sm:w-[28rem]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-[18rem] w-[18rem] animate-float-soft rounded-full bg-chart-2/30 blur-3xl [animation-delay:1s] [animation-duration:12s] sm:h-[24rem] sm:w-[24rem]"
      />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="animate-fade-up motion-reduce:animate-none inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary shadow-glow-sm">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            বাংলাদেশি দোকানদারদের জন্য
          </div>

          <h1 className="animate-fade-up motion-reduce:animate-none text-balance text-4xl font-bold tracking-tight text-foreground [animation-delay:60ms] sm:text-6xl sm:leading-[1.08]">
            Dokandar.app
          </h1>

          <p className="animate-fade-up motion-reduce:animate-none text-pretty max-w-lg text-lg leading-relaxed text-muted-foreground [animation-delay:120ms] sm:text-xl">
            হিসাব, স্টক, গ্রাহক ও বিক্রয় — সব এক জায়গায়। আধুনিক ড্যাশবোর্ড, বাংলা ফ্রেন্ডলি UI।
          </p>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-2" aria-label="মূল ফিচার">
          {features.map((label, i) => (
            <li
              key={label}
              className="animate-fade-up motion-reduce:animate-none"
              style={{ animationDelay: `${180 + i * 45}ms` }}
            >
              <span className="inline-flex rounded-full border border-border/80 bg-background/80 px-3 py-1 text-sm font-medium text-foreground/90 shadow-sm backdrop-blur-sm">
                {label}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <div className="animate-fade-up w-full motion-reduce:animate-none sm:w-auto [animation-delay:240ms]">
            <Button
              asChild
              size="lg"
              className="h-14 min-h-[3.5rem] w-full gap-2 rounded-2xl text-lg shadow-glow transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-glow-sm active:scale-[0.98] sm:w-auto sm:min-w-[13rem]"
            >
              <Link href="/auth">
                শুরু করুন
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
          </div>
          <div className="animate-fade-up w-full motion-reduce:animate-none sm:w-auto [animation-delay:300ms]">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 min-h-[3.5rem] w-full rounded-2xl border-2 text-lg backdrop-blur-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:min-w-[13rem]"
            >
              <Link href="/dashboard">ড্যাশবোর্ড</Link>
            </Button>
          </div>
        </div>

        <p className="animate-fade-up max-w-sm text-sm text-muted-foreground motion-reduce:animate-none [animation-delay:380ms]">
          PWA সাপোর্ট · মোবাইল ফার্স্ট · দ্রুত চেকআউট
        </p>
      </div>
    </main>
  );
}
