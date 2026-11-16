"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TEMPLATES } from "@/lib/templateMeta";
import type { ParseResult, ResumeData } from "@/lib/types";
import { verify } from "@/lib/verify";
import Editor, { addTo, targetsFor } from "@/components/Editor";
import Preview, { renderFile } from "@/components/Preview";

type Step = "welcome" | "input" | "template" | "result" | "done";
type Format = "pdf" | "docx" | "both";

const STEPS: { key: Step; label: string }[] = [
  { key: "input", label: "Your resume" },
  { key: "template", label: "Choose a sample" },
  { key: "result", label: "Results" },
  { key: "done", label: "Finished" }
];

export default function Home() {
  const [step, setStep] = useState<Step>("welcome");
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
  const [dlBusy, setDlBusy] = useState(false);
  const [dlError, setDlError] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const report = useMemo(() => (data && parsed ? verify(data, parsed.lines, parsed.roles) : null), [data, parsed]);
  const flagged = useMemo(() => new Set(report ? report.changed.map((c) => c.text) : []), [report]);
  const onPages = useCallback((n: number) => setPages(n), []);
  const template = TEMPLATES.find((t) => t.id === tpl) || TEMPLATES[0];

  // Welcome animation, then the first step.
  useEffect(() => {
    if (step !== "welcome") return;
    const t = setTimeout(() => setStep("input"), 3000);
    return () => clearTimeout(t);
  }, [step]);

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
      setParsed(json); setData(json.data); setEditing(false);
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
    setDlBusy(true); setDlError("");
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
    finally { setDlBusy(false); }
  }

  function startOver() {
    setFile(null); setPaste(""); setParsed(null); setData(null); setSaved([]); setError(""); setPages(0);
    if (fileInput.current) fileInput.current.value = "";
    setStep("input");
  }

  if (step === "welcome") {
    return (
      <div className="welcome" onClick={() => setStep("input")}>
        <div className="wl-doc" aria-hidden="true">
          <span className="l1" /><span className="l2" /><span className="l3" /><span className="l4" /><span className="l5" />
        </div>
        <h1 className="wl-title">Resume Template Writer</h1>
        <p className="wl-sub">Your resume, rebuilt in a clean ATS-friendly template. Word for word.</p>
        <div className="wl-bar" aria-hidden="true"><span /></div>
        <button type="button" className="wl-skip" onClick={() => setStep("input")}>Skip</button>
      </div>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const targets = data ? targetsFor(data) : [];

  return (
    <main>
      <header className="top">
        <button type="button" className="brand" onClick={startOver}>Resume Template Writer</button>
        <ol className="stepper" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s.key} className={i < stepIndex ? "done" : i === stepIndex ? "now" : ""} aria-current={i === stepIndex ? "step" : undefined}>
              <span className="dot">{i < stepIndex ? "✓" : i + 1}</span><span className="lbl">{s.label}</span>
            </li>
          ))}
        </ol>
      </header>

      {step === "input" && (
        <section className="step fade">
          <h2>Add your resume</h2>
          <p className="sub">Upload your current resume or paste its text. Nothing is rewritten, and no AI is used.</p>
          <div className="choice" role="radiogroup" aria-label="How do you want to add your resume?">
            <button type="button" role="radio" aria-checked={mode === "upload"} className="opt" onClick={() => { setMode("upload"); setError(""); }}>
              <span className="opt-ic" aria-hidden="true">⇪</span>
              <span><b>Upload resume</b><br /><span className="muted">PDF or Word (.docx), up to 4 MB</span></span>
            </button>
            <button type="button" role="radio" aria-checked={mode === "paste"} className="opt" onClick={() => { setMode("paste"); setError(""); }}>
              <span className="opt-ic" aria-hidden="true">¶</span>
              <span><b>Paste resume text</b><br /><span className="muted">Copy everything from your resume and paste it</span></span>
            </button>
          </div>

          {mode === "upload" ? (
            <label className={"drop" + (over ? " over" : "")}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); pickFile(e.dataTransfer.files[0] || null); }}>
              <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,.md,.doc" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
              <strong>{file ? file.name : "Choose a file or drop it here"}</strong>
              <span className="muted">{file ? "Click to choose a different file" : "Scanned image PDFs can't be read; use the Word version instead."}</span>
            </label>
          ) : (
            <textarea className="paste" value={paste} placeholder="Paste the full text of your resume here"
              onChange={(e) => { setPaste(e.target.value); setError(""); }} />
          )}

          <div className="row end">
            {error && <span className="err" role="alert">{error}</span>}
            <button type="button" className="btn primary big" onClick={next} disabled={busy}>{busy ? "Reading your resume…" : "Next"}</button>
          </div>
        </section>
      )}

      {step === "template" && (
        <section className="step fade">
          <h2>Choose a sample</h2>
          <p className="sub">Every sample has the same sections: Header, Summary, Skills, Clients and Education. You can try others later.</p>
          <div className="grid">
            {TEMPLATES.map((t) => (
              <button type="button" key={t.id} className="tpl" aria-pressed={t.id === tpl} onClick={() => setTpl(t.id)}>
                <div className="thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/thumbs/${t.id}.png`} alt={`${t.name} sample preview`} loading="lazy" />
                </div>
                <span className="tname">{t.id}. {t.name}</span>
                <span className="tdesc">{t.desc}</span>
              </button>
            ))}
          </div>
          <div className="row between">
            <button type="button" className="btn" onClick={() => setStep("input")}>Back</button>
            <button type="button" className="btn primary big" onClick={() => setStep("result")}>See my resume</button>
          </div>
        </section>
      )}

      {step === "result" && data && parsed && report && (
        <section className="step fade">
          <div className="row between" style={{ marginTop: 0 }}>
            <div>
              <h2>Your resume</h2>
              <p className="sub" style={{ marginBottom: 0 }}>Sample: <b>{template.id}. {template.name}</b>{pages > 0 && <> · {pages} page{pages > 1 ? "s" : ""}</>}</p>
            </div>
            <div className="row" style={{ marginTop: 0 }}>
              <button type="button" className="btn" onClick={() => setStep("template")}>Change sample</button>
              <button type="button" className="btn" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? "Close editor" : "Edit"}</button>
              <button type="button" className="btn primary big" onClick={() => setChoosing(true)}>Download</button>
            </div>
          </div>

          <div className={"check " + (report.ok ? "ok" : "warn")}>
            <strong>{report.ok ? "Accuracy check passed" : "Accuracy check: review needed"}</strong>
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
            {editing && <div><Editor data={data} onChange={setData} flagged={flagged} /></div>}
            <div className={editing ? "sticky" : ""}>
              <Preview data={data} templateId={tpl} onPages={onPages} />
              <p className="muted center">Word files use Calibri. The preview and PDF use Carlito, which has the same letter widths as Calibri.</p>
            </div>
          </div>

          {choosing && (
            <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="dl-title" onClick={() => !dlBusy && setChoosing(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3 id="dl-title">Download your resume</h3>
                <p className="muted">Choose a format.</p>
                <div className="formats">
                  <button type="button" className="fmt" disabled={dlBusy} onClick={() => download("pdf")}><b>PDF</b><span>Best for emailing and job portals</span></button>
                  <button type="button" className="fmt" disabled={dlBusy} onClick={() => download("docx")}><b>Word (.docx)</b><span>Editable; what most vendors ask for</span></button>
                  <button type="button" className="fmt" disabled={dlBusy} onClick={() => download("both")}><b>Both</b><span>PDF and Word together</span></button>
                </div>
                {dlBusy && <p className="muted">Preparing your file…</p>}
                {dlError && <p className="err">{dlError}</p>}
                <div className="row end"><button type="button" className="btn" disabled={dlBusy} onClick={() => setChoosing(false)}>Cancel</button></div>
              </div>
            </div>
          )}
        </section>
      )}

      {step === "done" && (
        <section className="step fade done-step">
          <div className="tick" aria-hidden="true">✓</div>
          <h2>Your resume is ready</h2>
          <p className="sub">Downloaded: {saved.join(" and ")}. Check your Downloads folder.</p>
          <div className="row center">
            <button type="button" className="btn primary big" onClick={startOver}>Convert another resume</button>
            <button type="button" className="btn big" onClick={() => setStep("template")}>Check more samples</button>
            <button type="button" className="btn big" onClick={() => setStep("result")}>Back to results</button>
          </div>
        </section>
      )}

      <footer>Files are processed in memory and never stored.</footer>
    </main>
  );
}
