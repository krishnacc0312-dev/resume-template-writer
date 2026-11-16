"use client";
import { useEffect, useState } from "react";
import { TEMPLATES } from "@/lib/templateMeta";
import type { ResumeData } from "@/lib/types";
import Preview from "./Preview";

/** Full-size, scrollable preview of a sample, with previous/next and actions. */
export default function SamplePreview({ id, data, isOwn, onChange, onClose, onUse, onDownload, useLabel }: {
  id: number; data: ResumeData; isOwn: boolean; onChange: (id: number) => void; onClose: () => void;
  onUse: () => void; onDownload: () => void; useLabel: string;
}) {
  const i = TEMPLATES.findIndex((t) => t.id === id);
  const t = TEMPLATES[i];
  const [pages, setPages] = useState(0);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange(TEMPLATES[(i + 1) % TEMPLATES.length].id);
      if (e.key === "ArrowLeft") onChange(TEMPLATES[(i - 1 + TEMPLATES.length) % TEMPLATES.length].id);
    };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = ""; };
  }, [i, onChange, onClose]);
  useEffect(() => setPages(0), [id]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="pv-title" onClick={onClose}>
      <div className="viewer" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-head">
          <div>
            <h3 id="pv-title">{t.id}. {t.name}</h3>
            <p className="muted">{isOwn ? "Your resume in this sample" : "Example resume in this sample"}{pages > 0 && ` · ${pages} page${pages > 1 ? "s" : ""}`}</p>
          </div>
          <div className="row" style={{ marginTop: 0 }}>
            <button type="button" className="btn icon" aria-label="Previous sample" onClick={() => onChange(TEMPLATES[(i - 1 + TEMPLATES.length) % TEMPLATES.length].id)}>‹</button>
            <span className="muted">{i + 1} / {TEMPLATES.length}</span>
            <button type="button" className="btn icon" aria-label="Next sample" onClick={() => onChange(TEMPLATES[(i + 1) % TEMPLATES.length].id)}>›</button>
            <button type="button" className="btn icon" aria-label="Close preview" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="viewer-body">
          <Preview key={id} data={data} templateId={id} onPages={setPages} />
        </div>
        <div className="viewer-foot">
          <p className="muted">{t.desc}</p>
          <div className="row" style={{ marginTop: 0 }}>
            <button type="button" className="btn" onClick={onDownload}>⇩ Download</button>
            <button type="button" className="btn primary" onClick={onUse}>{useLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
