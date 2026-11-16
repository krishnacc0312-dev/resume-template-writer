"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "system" | "dark";
const KEY = "rtw-theme";
const svg = (d: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const OPTIONS: { v: Theme; icon: React.ReactNode; label: string }[] = [
  { v: "light", label: "Light theme", icon: svg(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>) },
  { v: "system", label: "Use system theme", icon: svg(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>) },
  { v: "dark", label: "Dark theme", icon: svg(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />) }
];

export function applyTheme(t: Theme) {
  const html = document.documentElement;
  if (t === "system") html.removeAttribute("data-theme"); else html.setAttribute("data-theme", t);
}

/** Light / System / Dark switch. The choice is remembered in this browser. */
export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try { const t = localStorage.getItem(KEY) as Theme | null; if (t === "light" || t === "dark") setTheme(t); } catch { /* storage blocked */ }
  }, []);
  const pick = (t: Theme) => {
    const html = document.documentElement;
    html.classList.add("theme-anim");
    applyTheme(t); setTheme(t);
    try { localStorage.setItem(KEY, t); } catch { /* storage blocked */ }
    setTimeout(() => html.classList.remove("theme-anim"), 400);
  };
  const idx = OPTIONS.findIndex((o) => o.v === theme);
  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      <span className="thumb-ind" aria-hidden="true" style={{ transform: `translateX(${idx * 34}px)` }} />
      {OPTIONS.map((o) => (
        <button key={o.v} type="button" aria-label={o.label} title={o.label} aria-pressed={theme === o.v} onClick={() => pick(o.v)}>{o.icon}</button>
      ))}
    </div>
  );
}
