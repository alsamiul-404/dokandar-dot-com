import * as React from "react";

import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Frosted + shimmer sweep — fits glass / SaaS shells */
  glass?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, glass = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md",
        glass
          ? "skeleton-shimmer border border-border/40 bg-muted/25 backdrop-blur-md dark:bg-muted/15"
          : "animate-pulse bg-muted/80",
        className,
      )}
      {...props}
    />
  ),
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
