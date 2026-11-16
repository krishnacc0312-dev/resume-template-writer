"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TEMPLATES } from "@/lib/templateMeta";
import type { ParseResult, ResumeData } from "@/lib/types";
import { verify } from "@/lib/verify";
import Editor, { addTo, targetsFor } from "@/components/Editor";
import Preview, { renderFile } from "@/components/Preview";
import SampleCard from "@/components/SampleCard";
import SamplesGallery from "@/components/SamplesGallery";
import SamplePreview from "@/components/SamplePreview";
import DownloadDialog from "@/components/DownloadDialog";

type Step = "input" | "template" | "result" | "done";
import type { Format } from "@/components/DownloadDialog";

const STEPS: { key: Step; label: string }[] = [
  { key: "input", label: "Your resume" },
  { key: "template", label: "Choose a sample" },
  { key: "result", label: "Results" },
  { key: "done", label: "Finished" }
];

export default function Convert() {
  const [step, setStep] = useState<Step>("input");
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [tpl, setTpl] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [data, setData] = useState<ResumeData | null>(null);
  const [pages, setPages] = useState(0);
  const [over, setOver] = useState(false);
  const [editing, setEditing] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [dlBusy, setDlBusy] = useState<Format | null>(null);
  const [dlError, setDlError] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const report = useMemo(() => (data && parsed ? verify(data, parsed.lines, parsed.roles) : null), [data, parsed]);
  const flagged = useMemo(() => new Set(report ? report.changed.map((c) => c.text) : []), [report]);
  const onPages = useCallback((n: number) => setPages(n), []);
  const template = TEMPLATES.find((t) => t.id === tpl) || TEMPLATES[0];

  // A sample chosen on the home page (/convert?sample=3).
  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get("sample"));
    if (TEMPLATES.some((t) => t.id === n)) setTpl(n);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  function pickFile(f: File | null) { setFile(f); setError(""); }

  async function next() {
    setError("");
    if (mode === "upload" && !file) { setError("Choose your resume file first."); return; }
    if (mode === "paste" && !paste.trim()) { setError("Paste your resume text first."); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      if (mode === "upload" && file) fd.append("file", file); else fd.append("text", paste);
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "This file couldn't be read.");
      setParsed(json); setData(json.data); setEditing(false); setPages(0);
      setStep("template");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally { setBusy(false); }
  }

  function fileName(format: "pdf" | "docx") {
    const base = (data?.name || "Resume").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_") || "Resume";
    return `${base}_Resume.${format}`;
  }

  async function download(format: Format) {
    if (!data) return;
    setDlBusy(format); setDlError("");
    try {
      const formats: ("pdf" | "docx")[] = format === "both" ? ["docx", "pdf"] : [format];
      const names: string[] = [];
      for (const f of formats) {
        const blob = await renderFile(data, tpl, f);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName(f);
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 8000);
        names.push(fileName(f));
        if (formats.length > 1) await new Promise((r) => setTimeout(r, 400));
      }
      setSaved(names); setChoosing(false); setStep("done");
    } catch { setDlError("The file couldn't be created. Try again."); }
    finally { setDlBusy(null); }
  }

  function startOver() {
    setFile(null); setPaste(""); setParsed(null); setData(null); setSaved([]); setError(""); setPages(0);
    if (fileInput.current) fileInput.current.value = "";
    setStep("input");
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const targets = data ? targetsFor(data) : [];
  const go = (s: Step) => { if (s === "input" || data) setStep(s); };

  return (
    <main className="container app">
      <ol className="stepper" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.key} className={i < stepIndex ? "done" : i === stepIndex ? "now" : ""} aria-current={i === stepIndex ? "step" : undefined}>
            <span className="dot">{i < stepIndex ? "✓" : i + 1}</span><span className="lbl">{s.label}</span>
          </li>
        ))}
      </ol>

      {step === "input" && (
        <section className="panel-card" key="input">
          <h2>Add your resume</h2>
          <p className="sub">Upload your current resume or paste its text. Nothing is rewritten.</p>
          <div className="choice" role="radiogroup" aria-label="How do you want to add your resume?">
            <button type="button" role="radio" aria-checked={mode === "upload"} className="opt" onClick={() => { setMode("upload"); setError(""); }}>
              <span className="opt-ic" aria-hidden="true">⇪</span>
              <span><b>Upload resume</b><br /><span className="muted">PDF or Word (.docx), up to 4 MB</span></span>
            </button>
            <button type="button" role="radio" aria-checked={mode === "paste"} className="opt" onClick={() => { setMode("paste"); setError(""); }}>
              <span className="opt-ic" aria-hidden="true">¶</span>
              <span><b>Paste resume text</b><br /><span className="muted">Copy all the text from your resume</span></span>
            </button>
          </div>

          {mode === "upload" ? (
            <label key="up" className={"drop swap" + (over ? " over" : "") + (file ? " has" : "")}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); pickFile(e.dataTransfer.files[0] || null); }}>
              <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,.md,.doc" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
              <strong>{file ? "✓ " + file.name : "Choose a file or drop it here"}</strong>
              <span className="muted">{file ? "Click to choose a different file" : "Scanned image PDFs can't be read; use the Word version instead."}</span>
            </label>
          ) : (
            <textarea key="paste" className="paste swap" value={paste} placeholder="Paste the full text of your resume here"
              aria-label="Resume text" onChange={(e) => { setPaste(e.target.value); setError(""); }} />
          )}

          <div className="row end">
            {error && <span className="err" role="alert">{error}</span>}
            <button type="button" className="btn primary big" onClick={next} disabled={busy}>
              {busy ? <><span className="spinner" aria-hidden="true" />Reading your resume…</> : "Next →"}
            </button>
          </div>

          <div className="mini-gallery">
            <h3>Browse the samples</h3>
            <p className="muted">Hover over a sample to preview or download it. Click one to choose it now ({template.id}. {template.name} is selected). You can change it after uploading.</p>
            <SamplesGallery selected={tpl} onSelect={setTpl} />
          </div>
        </section>
      )}

      {step === "template" && (
        <section className="panel-card" key="template">
          <h2>Choose a sample</h2>
          <p className="sub">Your resume was read{parsed ? ` (${parsed.lines.length} lines)` : ""}. Pick the look you want. You can try others later.</p>
          <p className="muted" style={{ marginTop: -14, marginBottom: 16 }}>Hover over a sample to preview your resume in it or download it.</p>
          <div className="grid" role="radiogroup" aria-label="Samples">
            {TEMPLATES.map((t) => (
              <SampleCard key={t.id} t={t} selected={t.id === tpl} onSelect={() => setTpl(t.id)}
                onPreview={() => setPreviewId(t.id)} onDownload={() => { setTpl(t.id); setDlError(""); setChoosing(true); }} />
            ))}
          </div>
          <div className="row between">
            <button type="button" className="btn" onClick={() => go("input")}>← Back</button>
            <button type="button" className="btn primary big" onClick={() => go("result")}>See my resume →</button>
          </div>
        </section>
      )}

      {step === "result" && data && parsed && report && (
        <section className="panel-card" key="result">
          <div className="result-head">
            <div>
              <h2>Your resume</h2>
              <p className="muted" style={{ fontSize: 15 }}>Sample <b>{template.id}. {template.name}</b>{pages > 0 && <> · {pages} page{pages > 1 ? "s" : ""}</>}</p>
            </div>
            <div className="row" style={{ marginTop: 0 }}>
              <button type="button" className="btn" onClick={() => go("template")}>Change sample</button>
              <button type="button" className="btn" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? "Close editor" : "Edit"}</button>
              <button type="button" className="btn primary" onClick={() => setChoosing(true)}>Download</button>
            </div>
          </div>

          <div className={"check " + (report.ok ? "ok" : "warn")}>
            <strong>{report.ok ? "✓ Accuracy check passed" : "Accuracy check: please review"}</strong>
            <p>{report.placed} of {report.total} lines from your resume are in the new version, copied word for word.</p>
            {report.changed.length > 0 && (
              <>
                <p>This text isn&apos;t in your original resume (edited or typed in):</p>
                <ul>{report.changed.slice(0, 12).map((c, i) => <li key={i}><b>{c.where}:</b> {c.text}</li>)}</ul>
              </>
            )}
            {!report.ok && !editing && <p>Use <b>Edit</b> to fix anything before downloading.</p>}
          </div>

          {report.missing.length > 0 && (
            <div className="panel">
              <h3>Lines not placed yet ({report.missing.length})</h3>
              <p className="muted" style={{ marginBottom: 8 }}>These lines from your resume aren&apos;t in the new version. Add each one where it belongs, or leave it out.</p>
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

          {parsed.other.length > 0 && (
            <div className="check info">
              <strong>Left out on purpose</strong>
              <p>The samples only have Header, Summary, Skills, Clients and Education, so these sections aren&apos;t included. You can still add any line.</p>
              {parsed.other.map((o, k) => (
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

          <div className={editing ? "work" : "solo"}>
            {editing && <div className="swap"><Editor data={data} onChange={setData} flagged={flagged} /></div>}
            <div className={editing ? "sticky" : ""}>
              <Preview data={data} templateId={tpl} onPages={onPages} />
              <p className="muted center" style={{ marginTop: 10 }}>Word files use Calibri. The preview and PDF use Carlito, which has the same letter widths as Calibri.</p>
            </div>
          </div>

          <div className="row center">
            <button type="button" className="btn primary big" onClick={() => setChoosing(true)}>Download my resume</button>
          </div>
        </section>
      )}

      {step === "done" && (
        <section className="panel-card done-wrap" key="done">
          <div className="tick" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M11 21 l6 6 l12 -14" /></svg></div>
          <h2>Your resume is ready</h2>
          <p className="sub">It&apos;s in your Downloads folder.</p>
          <div className="files">{saved.map((n) => <span key={n} className="file-chip">⇩ {n}</span>)}</div>
          <div className="row center">
            <button type="button" className="btn primary big" onClick={startOver}>Convert another resume</button>
            <button type="button" className="btn big" onClick={() => go("template")}>Check more samples</button>
          </div>
          <p style={{ marginTop: 14 }}><button type="button" className="btn ghost small" onClick={() => go("result")}>← Back to results</button></p>
        </section>
      )}

      {previewId !== null && data && (
        <SamplePreview id={previewId} data={data} isOwn onChange={setPreviewId} onClose={() => setPreviewId(null)}
          useLabel="Use this sample →"
          onUse={() => { setTpl(previewId); setPreviewId(null); go("result"); }}
          onDownload={() => { setTpl(previewId); setPreviewId(null); setDlError(""); setChoosing(true); }} />
      )}

      {choosing && (
        <DownloadDialog busy={dlBusy} error={dlError} onPick={download} onClose={() => setChoosing(false)}
          note={`Sample ${template.id}. ${template.name}. Choose a format.`} />
      )}
    </main>
  );
}
