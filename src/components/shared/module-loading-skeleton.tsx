import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportLoadingBanner } from "@/components/shared/loading-status";

type GlassPanelProps = {
  children: React.ReactNode;
  className?: string;
};

/** Glassmorphic shell for loading placeholders (matches app `glass-panel`). */
export function GlassLoadingPanel({ children, className }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden rounded-2xl p-5 sm:rounded-[1.35rem] sm:p-6",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="লোড হচ্ছে"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[2px] overflow-hidden rounded-t-[inherit] bg-muted/30"
      >
        <div className="h-full w-[32%] rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent motion-safe:animate-loading-bar-sweep motion-safe:[animation-duration:2.1s]" />
      </div>
      <span className="sr-only">লোড হচ্ছে…</span>
      <div className="relative z-[0]">{children}</div>
    </div>
  );
}

export function ModuleHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton glass className="h-4 w-28 rounded-lg" />
      <Skeleton glass className="h-9 w-56 max-w-full rounded-lg sm:h-10 sm:w-72" />
      <Skeleton glass className="h-4 w-full max-w-md rounded-lg" />
    </div>
  );
}

/** Dashboard home — three summary stat cards */
export function DashboardSummarySkeleton() {
  return (
    <div className="space-y-3">
      <ReportLoadingBanner
        title="আজকের সারাংশ লোড হচ্ছে…"
        hint="বিক্রয় ও নগদ/বাকি হিসাব আনা হচ্ছে"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <GlassLoadingPanel key={i} className="flex min-h-[8.5rem] flex-col gap-4">
            <div className="space-y-2">
              <Skeleton glass className="h-4 w-32 rounded-md" />
              <Skeleton glass className="h-3 w-full max-w-[12rem] rounded-md" />
            </div>
            <Skeleton glass className="h-9 w-40 rounded-lg" />
          </GlassLoadingPanel>
        ))}
      </div>
    </div>
  );
}

type TableSkeletonProps = {
  rows?: number;
  className?: string;
  /** No outer glass wrapper — nest inside another panel */
  embedded?: boolean;
};

/** Fake table rows inside a glass panel (বাকি / স্টক তালিকা). */
export function DataTableSkeleton({ rows = 6, className, embedded }: TableSkeletonProps) {
  const inner = (
    <>
      <div className="border-b border-border/50 bg-muted/20 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex gap-4">
          <Skeleton glass className="h-4 flex-1 rounded-md sm:max-w-[8rem]" />
          <Skeleton glass className="hidden h-4 flex-1 rounded-md sm:block sm:max-w-[6rem]" />
          <Skeleton glass className="h-4 w-24 rounded-md sm:w-28" />
        </div>
      </div>
      <div className="divide-y divide-border/40 px-4 py-2 sm:px-6">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3.5">
            <Skeleton glass className="h-4 flex-1 rounded-md sm:max-w-[10rem]" />
            <Skeleton glass className="hidden h-4 w-28 rounded-md sm:block" />
            <Skeleton glass className="h-4 w-20 shrink-0 rounded-md sm:w-24" />
            <Skeleton glass className="h-8 w-16 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border/40 bg-muted/10 backdrop-blur-sm",
          className,
        )}
        role="status"
        aria-busy="true"
        aria-label="লোড হচ্ছে"
      >
        <span className="sr-only">লোড হচ্ছে…</span>
        {inner}
      </div>
    );
  }

  return <GlassLoadingPanel className={cn("overflow-hidden p-0", className)}>{inner}</GlassLoadingPanel>;
}

/** Full module shell: back crumb + title block + stacked glass sections */
export function ModulePageGlassSkeleton({
  sections = 2,
  className,
}: {
  sections?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6 pb-4", className)}>
      <ModuleHeaderSkeleton />
      <ReportLoadingBanner
        title="মডিউল লোড হচ্ছে…"
        hint="ডাটা সার্ভার থেকে আনা হচ্ছে — একটু অপেক্ষা করুন"
      />
      {Array.from({ length: sections }).map((_, i) => (
        <GlassLoadingPanel key={i} className="space-y-4">
          <div className="space-y-2">
            <Skeleton glass className="h-5 w-40 rounded-md" />
            <Skeleton glass className="h-3 w-full max-w-sm rounded-md" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton glass className="h-12 rounded-xl sm:col-span-2" />
            <Skeleton glass className="h-12 rounded-xl" />
            <Skeleton glass className="h-12 rounded-xl" />
            <Skeleton glass className="h-12 rounded-xl sm:col-span-2" />
          </div>
        </GlassLoadingPanel>
      ))}
    </div>
  );
}

/** POS-style: wide product area + side totals */
export function PosModuleSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 pb-4", className)}>
      <ModuleHeaderSkeleton />
      <ReportLoadingBanner
        title="POS লোড হচ্ছে…"
        hint="পণ্য তালিকা ও বিক্রয় স্ক্রিন প্রস্তুত করা হচ্ছে"
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(16rem,20rem)]">
        <GlassLoadingPanel className="min-h-[18rem] space-y-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton glass className="h-11 flex-1 rounded-xl sm:min-w-[12rem]" />
            <Skeleton glass className="h-11 w-24 rounded-xl" />
            <Skeleton glass className="h-11 w-full rounded-xl sm:w-32" />
          </div>
          <DataTableSkeleton rows={4} embedded className="border-0 bg-transparent" />
        </GlassLoadingPanel>
        <GlassLoadingPanel className="space-y-4">
          <Skeleton glass className="h-4 w-24 rounded-md" />
          <Skeleton glass className="h-10 w-full rounded-xl" />
          <Skeleton glass className="h-10 w-full rounded-xl" />
          <Skeleton glass className="h-24 w-full rounded-xl" />
          <Skeleton glass className="h-14 w-full rounded-2xl" />
        </GlassLoadingPanel>
      </div>
    </div>
  );
}

/** Customer / product detail — hero + cards + table strip */
export function DetailPageGlassSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 pb-4", className)}>
      <ModuleHeaderSkeleton />
      <ReportLoadingBanner
        title="বিস্তারিত লোড হচ্ছে…"
        hint="গ্রাহক বা পণ্যের তথ্য আনা হচ্ছে"
      />
      <GlassLoadingPanel className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton glass className="h-4 w-32 rounded-md" />
          <Skeleton glass className="h-10 w-48 max-w-full rounded-lg" />
        </div>
        <Skeleton glass className="h-12 w-full rounded-xl sm:w-40" />
      </GlassLoadingPanel>
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassLoadingPanel className="space-y-3">
          <Skeleton glass className="h-4 w-28 rounded-md" />
          <Skeleton glass className="h-11 w-full rounded-xl" />
          <Skeleton glass className="h-11 w-full rounded-xl" />
          <Skeleton glass className="h-24 w-full rounded-xl" />
          <Skeleton glass className="h-12 w-full rounded-xl" />
        </GlassLoadingPanel>
        <GlassLoadingPanel className="space-y-3">
          <Skeleton glass className="h-4 w-28 rounded-md" />
          <Skeleton glass className="h-11 w-full rounded-xl" />
          <Skeleton glass className="h-11 w-full rounded-xl" />
          <Skeleton glass className="h-12 w-full rounded-xl" />
        </GlassLoadingPanel>
      </div>
      <DataTableSkeleton rows={5} />
    </div>
  );
}

/** Profit report — date row + metric cards */
export function ProfitModuleSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 pb-4", className)}>
      <ModuleHeaderSkeleton />
      <ReportLoadingBanner
        title="লাভ হিসাব লোড হচ্ছে…"
        hint="নির্বাচিত দিনের বিক্রয় লাইন ও লাভ গণনা আনা হচ্ছে"
      />
      <GlassLoadingPanel className="space-y-4">
        <Skeleton glass className="h-4 w-24 rounded-md" />
        <Skeleton glass className="h-11 w-full max-w-xs rounded-xl" />
      </GlassLoadingPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <GlassLoadingPanel className="space-y-3">
          <Skeleton glass className="h-4 w-32 rounded-md" />
          <Skeleton glass className="h-10 w-44 rounded-lg" />
        </GlassLoadingPanel>
        <GlassLoadingPanel className="space-y-3">
          <Skeleton glass className="h-4 w-36 rounded-md" />
          <Skeleton glass className="h-10 w-40 rounded-lg" />
        </GlassLoadingPanel>
      </div>
      <GlassLoadingPanel className="space-y-3">
        <Skeleton glass className="h-4 w-40 rounded-md" />
        <Skeleton glass className="h-32 w-full rounded-xl" />
      </GlassLoadingPanel>
    </div>
  );
}
