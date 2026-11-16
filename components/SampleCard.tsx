"use client";
import { FONTS, TYPES, STYLES, type Template } from "@/lib/templateMeta";

/** A sample thumbnail. Hovering (or focusing) shows Preview and Download buttons. */
export default function SampleCard({ t, selected, onSelect, onPreview, onDownload }: {
  t: Template; selected?: boolean; onSelect: () => void; onPreview: () => void; onDownload: () => void;
}) {
  return (
    <div className="tpl" role="radio" aria-checked={!!selected} aria-pressed={!!selected} tabIndex={0}
      aria-label={t.name}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(); } }}>
      <div className="thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/thumbs/${t.id}.png`} alt="" loading="lazy" />
        <span className="pick" aria-hidden="true">✓</span>
        <div className="thumb-actions">
          <button type="button" className="ta-btn primary" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            {selected ? "✓ Selected" : "Use this sample"}
          </button>
          <button type="button" className="ta-btn" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
            <span aria-hidden="true">⤢</span> Preview
          </button>
          <button type="button" className="ta-btn ghost" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
            <span aria-hidden="true">⇩</span> Download
          </button>
        </div>
      </div>
      <span className="tname">{t.name}</span>
      <span className="ttags">
        <span className={"tag t-" + t.type}>{TYPES[t.type]}</span>
        <span className="tag">{STYLES[t.style]}</span>
        <span className="tag">{FONTS.find((f) => f.key === t.font)?.name}</span>
      </span>
      <span className="tdesc">{t.desc}</span>
    </div>
  );
}
