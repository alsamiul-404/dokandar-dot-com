"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookMarked, Package, Receipt, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

const MotionLink = motion(Link);

const modules = [
  {
    href: "/dashboard/baki",
    title: "বাকি খাতা",
    subtitle: "গ্রাহকের পাওনা ও জমা",
    icon: BookMarked,
    accent:
      "border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-100/90 text-amber-950 dark:border-amber-900/60 dark:from-amber-950/40 dark:to-amber-900/20 dark:text-amber-50",
    iconWrap: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  },
  {
    href: "/dashboard/stock",
    title: "স্টক হিসাব",
    subtitle: "পণ্য ও মজুদ দেখুন",
    icon: Package,
    accent:
      "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-emerald-100/90 text-emerald-950 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:text-emerald-50",
    iconWrap: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  },
  {
    href: "/dashboard/daily-sales",
    title: "দৈনিক বিক্রি",
    subtitle: "POS চেকআউট ও বিক্রয়",
    icon: Receipt,
    accent:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-sky-100/90 text-sky-950 dark:border-sky-900/60 dark:from-sky-950/40 dark:to-sky-900/20 dark:text-sky-50",
    iconWrap: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  },
  {
    href: "/dashboard/profit",
    title: "লাভ হিসাব",
    subtitle: "ক্রয় বনাম বিক্রয় — আনুমানিক লাভ",
    icon: TrendingUp,
    accent:
      "border-violet-200/90 bg-gradient-to-br from-violet-50 to-violet-100/90 text-violet-950 dark:border-violet-900/60 dark:from-violet-950/45 dark:to-violet-900/25 dark:text-violet-50",
    iconWrap: "bg-violet-500/15 text-violet-800 dark:text-violet-200",
  },
] as const;

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const tileVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 360, damping: 26 },
  },
};

export function DashboardHomeTiles() {
  return (
    <div className="flex flex-col gap-5">
      <motion.div
        className="space-y-1 px-0.5"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-24px" }}
        transition={{ type: "spring", stiffness: 400, damping: 34 }}
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">মডিউল</h2>
        <p className="text-base text-muted-foreground">
          কাজ শুরু করতে নিচের একটি বাটনে চাপ দিন
        </p>
      </motion.div>

      <motion.ul
        className="flex flex-col gap-4"
        role="list"
        variants={listVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
      >
        {modules.map((m) => (
          <motion.li key={m.href} variants={tileVariants}>
            <MotionLink
              href={m.href}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className={cn(
                "group relative flex min-h-[10rem] w-full flex-col justify-between overflow-hidden rounded-3xl border-2 border-black/10 p-5 shadow-md ring-1 ring-black/[0.03] transition-shadow duration-200 will-change-transform hover:shadow-lg hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:ring-white/[0.06] dark:hover:shadow-black/40 sm:min-h-[11rem] sm:p-6",
                m.accent,
              )}
              aria-label={`${m.title} — ${m.subtitle}`}
            >
              <span
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/25 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100 dark:bg-white/15"
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-2xl font-bold leading-tight sm:text-3xl">
                    {m.title}
                  </p>
                  <p className="text-base font-medium leading-snug text-black/70 dark:text-white/75">
                    {m.subtitle}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 sm:h-16 sm:w-16",
                    m.iconWrap,
                  )}
                  aria-hidden
                >
                  <m.icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.75} />
                </span>
              </div>
              <span className="relative mt-4 inline-flex min-h-[44px] items-center text-base font-bold underline-offset-4 group-hover:underline">
                খুলুন →
              </span>
            </MotionLink>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
