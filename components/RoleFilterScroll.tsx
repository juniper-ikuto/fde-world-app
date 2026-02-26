"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

interface Props {
  roles: { key: string; label: string; count: number }[];
}

export default function RoleFilterScroll({ roles }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Left fade + arrow */}
      {canScrollLeft && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-bg-elevated to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-bg-primary border border-border shadow-sm hover:bg-bg-secondary transition-colors duration-150"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </>
      )}

      {/* Scrollable chips */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]"
      >
        {roles.map(({ key, label, count }) => (
          <Link
            key={key}
            href={`/feed?role=${key}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-bg-primary border border-border rounded-md text-sm hover:border-border-hover hover:bg-bg-secondary transition-all duration-150 whitespace-nowrap shrink-0"
          >
            <span className="font-medium text-text-primary">{label}</span>
            <span className="text-xs text-text-tertiary tabular-nums">
              {count.toLocaleString()}
            </span>
          </Link>
        ))}
      </div>

      {/* Right fade + arrow */}
      {canScrollRight && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bg-elevated to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-bg-primary border border-border shadow-sm hover:bg-bg-secondary transition-colors duration-150"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2L8 6l-3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
