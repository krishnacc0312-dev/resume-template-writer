"use client";
import { useCallback, useEffect, useState } from "react";
import { TEMPLATES } from "@/lib/templateMeta";
import type { ResumeData } from "@/lib/types";
import Preview, { type LayoutOptions } from "./Preview";

/** Two samples side by side with the user's resume. */
export default function CompareView({ data, left, options, onUse, onClose }: {
  data: ResumeData; left: number; options?: LayoutOptions; onUse: (id: number) => void; onClose: () => void;
}) {
  const [a, setA] = useState(left);
  const [b, setB] = useState(left === 1 ? 2 : 1);
  const [pa, setPa] = useState(0), [pb, setPb] = useState(0);
  const onPa = useCallback((n: number) => setPa(n), []), onPb = useCallback((n: number) => setPb(n), []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc); document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);
  const side = (id: number, set: (n: number) => void, pages: number, onP: (n: number) => void, label: string) => (
    <div className="cmp-side">
      <div className="cmp-head">
        <select className="tplsel" aria-label={`${label} sample`} value={id} onChange={(e) => set(+e.target.value)}>
          {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.id}. {t.name}</option>)}
        </select>
        <button type="button" className="btn primary small" onClick={() => onUse(id)}>Use this</button>
      </div>
      <p className="muted" style={{ fontSize: 13, margin: "6px 2px" }}>{pages > 0 ? `${pages} page${pages > 1 ? "s" : ""}` : " "}</p>
      <Preview key={id} data={data} templateId={id} options={options} onPages={onP} />
    </div>
  );
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="cmp-title" onClick={onClose}>
      <div className="viewer wide" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-head">
          <div><h3 id="cmp-title">Compare two samples</h3><p className="muted">Your resume in both. Pick a sample on each side.</p></div>
          <button type="button" className="btn icon" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="viewer-body cmp">
          {side(a, setA, pa, onPa, "Left")}
          {side(b, setB, pb, onPb, "Right")}
        </div>
      </div>
    </div>
  );
}
