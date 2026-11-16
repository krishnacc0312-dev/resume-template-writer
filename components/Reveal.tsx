"use client";
import { useEffect, useRef } from "react";

/** Fades and lifts its children into view the first time they scroll on screen. */
export default function Reveal({ children, delay = 0, as: Tag = "div", className = "" }: {
  children: React.ReactNode; delay?: number; as?: "div" | "section" | "li"; className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { el.classList.add("in"); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={"reveal " + className} style={{ ["--d" as string]: delay + "ms" }}>{children}</Tag>
  );
}
