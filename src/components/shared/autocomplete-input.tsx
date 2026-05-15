"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AutocompleteInputProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  emptyHint?: string;
};

/** Type-to-search input with inline suggestions (category, names, etc.). */
export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  disabled,
  id,
  className,
  emptyHint = "লিখতে থাকুন — পরামর্শ দেখাবে",
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listId = React.useId();
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 10);
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [value, suggestions]);

  const showList = open && filtered.length > 0;

  React.useEffect(() => {
    setActiveIndex(0);
  }, [filtered]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(s: string) {
    onChange(s);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <Input
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && filtered[activeIndex]) {
            e.preventDefault();
            pick(filtered[activeIndex]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border/60 bg-popover py-1 shadow-lg"
        >
          {filtered.map((s, i) => (
            <li key={s} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                className={cn(
                  "flex w-full px-4 py-2.5 text-left text-base transition-colors hover:bg-accent",
                  i === activeIndex && "bg-accent",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : open && value.trim() && filtered.length === 0 ? (
        <p className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-popover px-4 py-2 text-sm text-muted-foreground shadow-md">
          নতুন: &quot;{value.trim()}&quot; — Enter চাপলে ব্যবহার হবে
        </p>
      ) : !value.trim() && open ? (
        <p className="absolute z-50 mt-1 w-full rounded-xl border border-dashed border-border/60 bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {emptyHint}
        </p>
      ) : null}
    </div>
  );
}
