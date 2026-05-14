import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type BannerProps = {
  title: string;
  hint?: string;
  className?: string;
};

/** Glass-style loading strip — entrance, soft glow pulse, top sweep bar, spinner ping. */
export function ReportLoadingBanner({ title, hint, className }: BannerProps) {
  return (
    <div className={cn("w-full motion-safe:animate-loading-enter", className)}>
      <div
        className={cn(
          "glass-panel relative flex items-center gap-3 overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.06] px-4 py-3.5 shadow-sm sm:px-5",
          "motion-safe:animate-loading-glow-pulse motion-safe:[animation-duration:2.8s]",
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] overflow-hidden rounded-t-[inherit] bg-primary/10"
        >
          <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-transparent via-primary/80 to-transparent motion-safe:animate-loading-bar-sweep" />
        </div>

        <span className="relative z-[2] flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
          <span
            className="absolute inset-0 rounded-xl bg-primary/20 motion-safe:animate-ping motion-reduce:hidden"
            aria-hidden
          />
          <Loader2
            className="relative z-[1] h-5 w-5 animate-spin text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.4)]"
            aria-hidden
          />
        </span>
        <div className="relative z-[2] min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-bold leading-tight text-foreground sm:text-base">{title}</p>
          {hint ? <p className="text-xs text-muted-foreground sm:text-sm">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

type OverlayProps = {
  label: string;
  className?: string;
};

/** Frosted overlay — backdrop fades up, pill glows. */
export function DataRefreshOverlay({ label, className }: OverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-start justify-center rounded-[inherit] bg-background/50 p-4 pt-6 backdrop-blur-[5px] motion-safe:animate-fade-up",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={cn(
          "glass-panel flex items-center gap-2.5 rounded-xl border border-border/70 px-3.5 py-2.5 shadow-lg",
          "motion-safe:animate-loading-glow-pulse motion-safe:[animation-duration:2.2s]",
        )}
      >
        <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
          <span
            className="absolute inset-[-3px] rounded-full bg-primary/15 motion-safe:animate-ping motion-reduce:hidden"
            aria-hidden
          />
          <Loader2
            className="relative z-[1] h-4 w-4 shrink-0 animate-spin text-primary"
            aria-hidden
          />
        </span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
    </div>
  );
}

type InlineProps = {
  loading: boolean;
  idle: ReactNode;
  loadingLabel: string;
  className?: string;
};

/** Button label with compact spinner + soft ping. */
export function InlineLoadingLabel({ loading, idle, loadingLabel, className }: InlineProps) {
  if (!loading) return <>{idle}</>;
  return (
    <span className={cn("inline-flex items-center justify-center gap-2.5", className)}>
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center text-primary">
        <span
          className="absolute inset-0 rounded-full bg-primary/20 motion-safe:animate-ping motion-reduce:hidden"
          aria-hidden
        />
        <Loader2 className="relative z-[1] h-4 w-4 shrink-0 animate-spin" aria-hidden />
      </span>
      <span>{loadingLabel}</span>
    </span>
  );
}
