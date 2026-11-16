"use client";
import { useEffect, useRef, useState } from "react";
import type { ResumeData } from "@/lib/types";
import { pdfToCanvases, renderWithMeta, type LayoutOptions } from "./Preview";

/** Drag a slider to compare page 1 of the original resume with page 1 of the new one. */
export default function BeforeAfter({ data, templateId, options, file, html, text, onClose }: {
  data: ResumeData; templateId: number; options?: LayoutOptions; file: File | null; html?: string; text?: string; onClose: () => void;
}) {
  const [pos, setPos] = useState(50);
  const [ready, setReady] = useState(false);
  const before = useRef<HTMLDivElement>(null), after = useRef<HTMLDivElement>(null), frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const W = 640;

  useEffect(() => {
    let alive = true;
    (async () => {
      const { blob } = await renderWithMeta(data, templateId, "pdf", options);
      const [newPage] = await pdfToCanvases(new Uint8Array(await blob.arrayBuffer()), W, 1);
      if (!alive) return;
      after.current?.replaceChildren(newPage);
      if (file && /\.pdf$/i.test(file.name)) {
        const [old] = await pdfToCanvases(new Uint8Array(await file.arrayBuffer()), W, 1);
        if (alive && old) before.current?.replaceChildren(old);
      }
      if (alive) setReady(true);
    })().catch(() => setReady(true));
    return () => { alive = false; };
  }, [data, templateId, options, file]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc); document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  const move = (clientX: number) => {
    const r = frame.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  const isPdf = !!file && /\.pdf$/i.test(file.name);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="ba-title" onClick={onClose}>
      <div className="viewer" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-head">
          <div><h3 id="ba-title">Before and after</h3><p className="muted">Drag the handle to compare the first page of your original with the new version.</p></div>
          <button type="button" className="btn icon" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="viewer-body" style={{ display: "grid", placeItems: "start center", padding: 18 }}>
          <div className="ba-labels" style={{ width: W, maxWidth: "100%" }}><span>Before</span><span>After</span></div>
          <div className="ba" ref={frame} style={{ width: W, maxWidth: "100%" }}
            onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e.clientX); }}
            onPointerMove={(e) => dragging.current && move(e.clientX)}
            onPointerUp={() => { dragging.current = false; }}>
            <div className="ba-layer ba-before" ref={before}>
              {!isPdf && (html
                ? <div className="ba-doc" dangerouslySetInnerHTML={{ __html: html }} />
                : <pre className="ba-doc ba-text">{text || ""}</pre>)}
            </div>
            <div className="ba-layer ba-after" ref={after} style={{ clipPath: `inset(0 0 0 ${pos}%)` }} />
            <div className="ba-handle" style={{ left: `${pos}%` }} aria-hidden="true"><span>⟷</span></div>
            {!ready && <div className="ba-loading"><div className="skeleton" /></div>}
          </div>
          <input type="range" min={0} max={100} value={Math.round(pos)} onChange={(e) => setPos(+e.target.value)}
            aria-label="Before and after position" style={{ width: W, maxWidth: "100%", marginTop: 12 }} />
          {!isPdf && <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{html ? "Your Word file is shown as plain formatting; fonts and spacing may differ from Word." : "Pasted text is shown as plain text."}</p>}
        </div>
      </div>
    </div>
  );
}
