"use client";
import { useEffect } from "react";

export type Format = "pdf" | "docx" | "both" | "txt";

export default function DownloadDialog({ title = "Download your resume", note, busy, error, onPick, onClose }: {
  title?: string; note?: string; busy: Format | null; error: string; onPick: (f: Format) => void; onClose: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [busy, onClose]);
  const opt = (f: Format, icon: string, cls: string, name: string, desc: string, focus = false) => (
    <button type="button" className="fmt" disabled={!!busy} onClick={() => onPick(f)} autoFocus={focus}>
      <span className={"fi " + cls}>{icon}</span><div><b>{name}</b><span>{desc}</span></div>
      {busy === f && <span className="spinner" aria-label="Preparing" />}
    </button>
  );
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="dl-title" onClick={() => !busy && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="dl-title">{title}</h3>
        <p className="muted">{note || "Choose a format."}</p>
        <div className="formats">
          {opt("pdf", "PDF", "pdf", "PDF", "Best for emailing and job portals", true)}
          {opt("docx", "DOC", "doc", "Word (.docx)", "Editable; what most vendors ask for")}
          {opt("both", "ALL", "both", "Both", "PDF and Word together")}
          {opt("txt", "TXT", "txt", "Plain text (.txt)", "For job portals that ask you to paste text")}
        </div>
        {error && <p className="err" style={{ marginTop: 10 }}>{error}</p>}
        <div className="row end"><button type="button" className="btn" disabled={!!busy} onClick={onClose}>Cancel</button></div>
      </div>
    </div>
  );
}
