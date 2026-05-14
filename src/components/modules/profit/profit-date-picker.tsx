"use client";

import { useMemo, useState } from "react";
import { addDays, format, isAfter, startOfToday, subDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import { bn } from "react-day-picker/locale";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import "react-day-picker/style.css";

function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function yesterdayIso(): string {
  return format(subDays(new Date(), 1), "yyyy-MM-dd");
}

function parseLocalIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

function isoFromDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function formatBnLongFromIso(iso: string): string {
  const parts = iso.split("-").map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const [y, m, day] = parts;
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function endOfToday(): Date {
  const t = new Date();
  t.setHours(23, 59, 59, 999);
  return t;
}

type Props = {
  value: string;
  onChange: (iso: string) => void;
  isRefreshing?: boolean;
  className?: string;
};

export function ProfitDatePicker({ value, onChange, isRefreshing, className }: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const labelBn = useMemo(() => formatBnLongFromIso(value), [value]);
  const selectedDate = useMemo(() => parseLocalIso(value), [value]);
  const canGoNext = useMemo(() => {
    return addDays(selectedDate, 1) <= endOfToday();
  }, [selectedDate]);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <motion.div
        layout
        className="glass-panel relative overflow-hidden rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
      >
        {isRefreshing ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-[2px] overflow-hidden bg-primary/15"
          >
            <div className="h-full w-[36%] rounded-full bg-gradient-to-r from-transparent via-primary/70 to-transparent motion-safe:animate-loading-bar-sweep motion-safe:[animation-duration:1.5s]" />
          </div>
        ) : null}
        <div className="relative flex items-start gap-4 p-5 sm:items-center sm:gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <CalendarDays className="h-7 w-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              নির্বাচিত দিন
            </p>
            <motion.p
              key={value}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="text-balance text-lg font-bold leading-snug text-foreground sm:text-xl"
            >
              {labelBn}
            </motion.p>
            <p className="text-sm text-muted-foreground">
              নিচে ক্যালেন্ডার বা শর্টকাট থেকে তারিখ বাছাই করুন
            </p>
          </div>
          {isRefreshing ? (
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden>
              <span className="absolute inset-0 rounded-full bg-primary/20 motion-safe:animate-ping motion-reduce:hidden" />
              <Loader2 className="relative z-[1] h-6 w-6 animate-spin text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.35)]" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-border/50 bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center justify-center gap-1 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl"
              aria-label="আগের দিন"
              onClick={() => onChange(isoFromDate(subDays(selectedDate, 1)))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl"
              aria-label="পরের দিন"
              disabled={!canGoNext}
              onClick={() => onChange(isoFromDate(addDays(selectedDate, 1)))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                className="h-12 w-full rounded-xl text-base font-semibold shadow-sm sm:min-w-[12rem] sm:flex-1"
              >
                <CalendarDays className="h-5 w-5" />
                ক্যালেন্ডার খুলুন
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="border-border/60 p-0 sm:w-auto sm:max-w-none">
              <div
                className={cn(
                  "profit-rdp p-3 sm:p-4",
                  "[--rdp-accent-color:hsl(var(--primary))] [--rdp-accent-background-color:hsl(var(--primary)/0.14)]",
                  "[--rdp-day-height:2.5rem] [--rdp-day-width:2.5rem] [--rdp-nav-height:2.75rem]",
                )}
              >
                <DayPicker
                  key={value}
                  mode="single"
                  locale={bn}
                  selected={selectedDate}
                  defaultMonth={selectedDate}
                  disabled={(d) => isAfter(d, startOfToday())}
                  captionLayout="dropdown"
                  startMonth={new Date(2020, 0)}
                  endMonth={new Date()}
                  onSelect={(d) => {
                    if (d) {
                      onChange(isoFromDate(d));
                      setCalendarOpen(false);
                    }
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          দ্রুত তারিখ
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-11 rounded-xl px-4 text-sm font-semibold sm:text-base"
            onClick={() => onChange(todayIso())}
          >
            আজ
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl px-4 text-sm font-semibold sm:text-base"
            onClick={() => onChange(yesterdayIso())}
          >
            গতকাল
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl px-4 text-sm font-semibold sm:text-base"
            onClick={() => onChange(format(subDays(new Date(), 7), "yyyy-MM-dd"))}
          >
            ৭ দিন আগে
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl px-4 text-sm font-semibold sm:text-base"
            onClick={() => onChange(format(subDays(new Date(), 30), "yyyy-MM-dd"))}
          >
            ৩০ দিন আগে
          </Button>
        </div>
      </div>
    </div>
  );
}
