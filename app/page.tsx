"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { TEMPLATES } from "@/lib/templateMeta";
import type { ParseResult, ResumeData } from "@/lib/types";
import { verify } from "@/lib/verify";
import Editor, { addTo, targetsFor } from "@/components/Editor";
import Preview, { renderFile } from "@/components/Preview";

export default function Home() {
  const [tpl, setTpl] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [data, setData] = useState<ResumeData | null>(null);
  const [pages, setPages] = useState(0);
  const [over, setOver] = useState(false);
  const [dlMsg, setDlMsg] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const report = useMemo(() => (data && parsed ? verify(data, parsed.lines, parsed.roles) : null), [data, parsed]);
  const flagged = useMemo(() => new Set(report ? report.changed.map((c) => c.text) : []), [report]);
  const onPages = useCallback((n: number) => setPages(n), []);

  async function convert() {
    setError("");
    if (!file && !paste.trim()) { setError("Upload your resume or paste its text first."); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file); else fd.append("text", paste);
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "This file couldn't be read.");
      setParsed(json); setData(json.data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally { setBusy(false); }
  }

  async function download(format: "pdf" | "docx") {
    if (!data) return;
    setDlMsg("Preparing your file…");
    try {
      const blob = await renderFile(data, tpl, format);
      const base = (data.name || "Resume").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_") || "Resume";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${base}_Resume.${format}`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setDlMsg("");
    } catch { setDlMsg("The file couldn't be created. Try again."); }
  }

  function pickFile(f: File | null) { setFile(f); if (f) setPaste(""); setError(""); }

  const targets = data ? targetsFor(data) : [];
  const leftOut = parsed ? parsed.other : [];

  return (
    <main>
      <h1>Resume Template Writer</h1>
      <p className="sub">
        Pick a template, upload your resume, check the result and download it. Your text is copied word for word: nothing is
        rewritten, and no AI is used. Every template uses Calibri on US Letter pages in a single ATS-friendly column with no tables or boxes.
      </p>

      <section className="step">
        <h2><span className="n">1</span>Choose a template</h2>
        <p className="hint">All templates have the same sections: Header, Summary, Skills, Clients and Education. You can switch templates later.</p>
        <div className="grid">
          {TEMPLATES.map((t) => (
            <button type="button" key={t.id} className="tpl" aria-pressed={t.id === tpl} onClick={() => setTpl(t.id)}>
              <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/thumbs/${t.id}.png`} alt={`${t.name} template preview`} loading="lazy" />
              </div>
              <span className="tname">{t.id}. {t.name}</span>
              <span className="tdesc">{t.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="step">
        <h2><span className="n">2</span>Upload your current resume</h2>
        <p className="hint">PDF, Word (.docx) or text file, up to 4 MB. Scanned image PDFs can&apos;t be read; use the Word version instead.</p>
        <label className={"drop" + (over ? " over" : "")}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pickFile(e.dataTransfer.files[0] || null); }}>
          <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,.md,.doc" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
          <strong>Choose a file or drop it here</strong>
          <span className="muted">{file ? file.name : "No file chosen"}</span>
        </label>
        <p className="or">or paste the resume text</p>
        <textarea className="paste" value={paste} placeholder="Paste the full text of your resume here"
          onChange={(e) => { setPaste(e.target.value); if (e.target.value) { setFile(null); if (fileInput.current) fileInput.current.value = ""; } setError(""); }} />
        <div className="row">
          <button type="button" className="btn primary" onClick={convert} disabled={busy}>{busy ? "Converting…" : "Convert resume"}</button>
          {error && <span className="err" role="alert">{error}</span>}
        </div>
      </section>

      {data && parsed && report && (
        <section className="step" ref={resultRef}>
          <h2><span className="n">3</span>Check, edit and download</h2>
          <p className="hint">Edits update the preview on the right. Highlighted fields contain text that isn&apos;t in your original file.</p>

          <div className={"check " + (report.ok ? "ok" : "warn")}>
            <strong>{report.ok ? "Accuracy check passed" : "Accuracy check: review needed"}</strong>
            <p>{report.placed} of {report.total} lines from your resume are in the new version, copied word for word.</p>
            {report.changed.length > 0 && (
              <>
                <p>This text isn&apos;t in your original file (edited or typed in):</p>
                <ul>{report.changed.slice(0, 12).map((c, i) => <li key={i}><b>{c.where}:</b> {c.text}</li>)}</ul>
              </>
            )}
          </div>

          {report.missing.length > 0 && (
            <div className="panel">
              <h3>Lines not placed yet ({report.missing.length})</h3>
              <p className="muted" style={{ marginTop: 0 }}>These lines from your resume aren&apos;t in the new version. Add each one where it belongs, or leave it out.</p>
              {report.missing.map((l, i) => (
                <div className="loose" key={i + l}>
                  <span>{l}</span>
                  <select aria-label="Add to section" value="" onChange={(e) => e.target.value && setData(addTo(data, e.target.value, l))}>
                    <option value="">Add to…</option>
                    {targets.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {leftOut.length > 0 && (
            <div className="check info">
              <strong>Left out on purpose</strong>
              <p>The templates only have Header, Summary, Skills, Clients and Education, so these sections aren&apos;t included. You can still add any line.</p>
              {leftOut.map((o, k) => (
                <details key={k}>
                  <summary>{o.section} ({o.lines.length} line{o.lines.length > 1 ? "s" : ""})</summary>
                  {o.lines.map((l, i) => (
                    <div className="loose" key={i + l}>
                      <span>{l}</span>
                      <select aria-label="Add to section" value="" onChange={(e) => e.target.value && setData(addTo(data, e.target.value, l))}>
                        <option value="">Add to…</option>
                        {targets.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                      </select>
                    </div>
                  ))}
                </details>
              ))}
            </div>
          )}

          <div className="work">
            <div><Editor data={data} onChange={setData} flagged={flagged} /></div>
            <div className="sticky">
              <div className="bar">
                <select className="tplsel" aria-label="Template" value={tpl} onChange={(e) => setTpl(+e.target.value)}>
                  {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.id}. {t.name}</option>)}
                </select>
              </div>
              <div className="bar">
                {pages > 0 && <span className="pill">{pages} page{pages > 1 ? "s" : ""}</span>}
                <span style={{ flex: 1 }} />
                <button type="button" className="btn primary" onClick={() => download("docx")}>Download Word</button>
                <button type="button" className="btn" onClick={() => download("pdf")}>Download PDF</button>
              </div>
              {dlMsg && <p className="muted">{dlMsg}</p>}
              <Preview data={data} templateId={tpl} onPages={onPages} />
              <p className="muted">Word files use Calibri. The preview and PDF use Carlito, which has the same letter widths as Calibri.</p>
            </div>
          </div>
        </section>
      )}
      <footer>Files are processed in memory and never stored.</footer>
    </main>
  );
}
