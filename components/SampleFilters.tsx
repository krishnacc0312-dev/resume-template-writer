"use client";
import { useState } from "react";
import { TEMPLATES, TYPES, STYLES, type Template } from "@/lib/templateMeta";

type TypeKey = keyof typeof TYPES | "all";
type StyleKey = keyof typeof STYLES | "all";

/** Type and style filters for sample galleries. */
export function useSampleFilters() {
  const [type, setType] = useState<TypeKey>("all");
  const [style, setStyle] = useState<StyleKey>("all");
  const list: Template[] = TEMPLATES.filter((t) => (type === "all" || t.type === type) && (style === "all" || t.style === style));
  const chip = (active: boolean, label: string, n: number, on: () => void) => (
    <button type="button" className="fchip" aria-pressed={active} onClick={on} key={label}>{label}<span>{n}</span></button>
  );
  const bar = (
    <div className="filters" role="group" aria-label="Filter samples">
      <div className="fgroup">
        <span className="lb-label">Type</span>
        {chip(type === "all", "All", TEMPLATES.length, () => setType("all"))}
        {(Object.keys(TYPES) as (keyof typeof TYPES)[]).map((k) => chip(type === k, TYPES[k], TEMPLATES.filter((t) => t.type === k).length, () => setType(k)))}
      </div>
      <div className="fgroup">
        <span className="lb-label">Style</span>
        {chip(style === "all", "All", TEMPLATES.length, () => setStyle("all"))}
        {(Object.keys(STYLES) as (keyof typeof STYLES)[]).map((k) => chip(style === k, STYLES[k], TEMPLATES.filter((t) => t.style === k).length, () => setStyle(k)))}
      </div>
    </div>
  );
  return { list, bar, empty: list.length === 0 && <p className="muted">No samples match both filters. <button type="button" className="linkbtn" onClick={() => { setType("all"); setStyle("all"); }}>Clear filters</button></p> };
}
