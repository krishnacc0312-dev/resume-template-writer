"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#samples", label: "Samples" },
  { href: "/#features", label: "Features" },
  { href: "/#faq", label: "FAQ" }
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  return (
    <header className={"site-header" + (scrolled ? " scrolled" : "")}>
      <div className="container nav">
        <Link href="/" className="logo" aria-label="Resume Template Writer home">
          <span className="logo-mark" aria-hidden="true"><i /></span>
          Resume Template Writer
        </Link>
        <button type="button" className="menu-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "✕" : "☰"}
        </button>
        <nav className={"nav-links" + (open ? " open" : "")} aria-label="Main">
          {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>)}
          <Link href="/convert" className="btn primary nav-cta">Convert my resume</Link>
        </nav>
      </div>
    </header>
  );
}
