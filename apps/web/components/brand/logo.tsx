import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const MARK_PATH = "M6 7.2h20v2.5H6zM12.6 9.7h6.8v12.6h-6.8zM6 22.3h20v2.5H6z";

const SIZES = {
  sm: { wordmark: "text-[1.625rem]", tile: "size-8 rounded-[9px]", glyph: "size-[1.0625rem]" },
  md: { wordmark: "text-[2.125rem]", tile: "size-9 rounded-[10px]", glyph: "size-5" }
} as const;

export type LogoMarkProps = Omit<ComponentPropsWithoutRef<"svg">, "children">;

export function LogoMark({ className, ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d={MARK_PATH} fill="currentColor" />
    </svg>
  );
}

export type LogoProps = {
  className?: string;
  href?: string;
  size?: keyof typeof SIZES;
  variant?: "full" | "wordmark" | "mark";
};

export function Logo({ className, href, size = "md", variant = "full" }: LogoProps) {
  const scale = SIZES[size];

  const mark = (
    <span className={cn("grid place-items-center bg-[#17352d] text-white", scale.tile)}>
      <LogoMark className={scale.glyph} />
    </span>
  );

  const wordmark = (
    <span
      className={cn(
        "font-serif leading-none tracking-[-0.01em] whitespace-nowrap text-current",
        scale.wordmark
      )}
    >
      Invocore
    </span>
  );

  const content =
    variant === "mark" ? (
      mark
    ) : variant === "wordmark" ? (
      wordmark
    ) : (
      <>
        {mark}
        {wordmark}
      </>
    );

  if (!href) {
    return (
      <span className={cn("inline-flex items-center gap-2.5 text-[#17352d]", className)}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label="Invocore"
      className={cn(
        "inline-flex items-center gap-2.5 text-[#17352d] transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
        className
      )}
    >
      {content}
    </Link>
  );
}
