"use client";
import { useMemo, useState } from "react";
import type { ResumeData } from "@/lib/types";
import { checkResume, type Flag } from "@/lib/flags";
import { healthCheck } from "@/lib/health";
import { jobMatch } from "@/lib/jobmatch";

const ICON: Record<Flag["severity"], string> = { error: "✕", warn: "!", ok: "✓", info: "i" };

function List({ flags }: { flags: Flag[] }) {
  return (
    <ul className="flag-list">
      {flags.map((f, i) => (
        <li key={i} className={"flag " + f.severity} style={{ ["--i" as string]: i }}>
          <span className="flag-ic" aria-label={f.severity}>{ICON[f.severity]}</span>
          <div><b>{f.title}</b>{f.detail && <p>{f.detail}</p>}</div>
        </li>
      ))}
    </ul>
  );
}

/** Resume flags: technology release dates vs. client dates, client timeline and ATS keywords. */
export default function Flags({ data, pages }: { data: ResumeData; pages?: number }) {
  const r = useMemo(() => checkResume(data), [data]);
  const health = useMemo(() => healthCheck(data, pages), [data, pages]);
  const [jd, setJd] = useState("");
  const match = useMemo(() => jobMatch(jd, data), [jd, data]);
  const [tab, setTab] = useState<"tech" | "timeline" | "health" | "ats" | "job">("tech");
  const [open, setOpen] = useState(true);
  const count = (fs: Flag[]) => fs.filter((f) => f.severity === "error" || f.severity === "warn").length;
  const tabs = [
    { k: "tech" as const, label: "Technology dates", n: count(r.tech) },
    { k: "timeline" as const, label: "Client timeline", n: count(r.timeline) },
    { k: "health" as const, label: "Health check", n: count(health) },
    { k: "ats" as const, label: "ATS keywords", n: count(r.ats.flags) },
    { k: "job" as const, label: "Job match", n: 0 }
  ];
  const errors = r.counts.error + health.filter((f) => f.severity === "error").length;
  const warns = r.counts.warn + health.filter((f) => f.severity === "warn").length;
  const total = errors + warns;
  return (
    <div className={"flags-card" + (open ? " open" : "")}>
      <button type="button" className="flags-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>
          <b>Resume flags</b>
          <span className="muted"> · checks your original resume, not the template</span>
        </span>
        <span className="flag-sum">
          {errors > 0 && <span className="chip error">{errors} issue{errors > 1 ? "s" : ""}</span>}
          {warns > 0 && <span className="chip warn">{warns} to review</span>}
          {total === 0 && <span className="chip ok">All clear</span>}
          <span className="chev" aria-hidden="true">⌄</span>
        </span>
      </button>
      <div className="flags-body"><div>
        <div className="tabs" role="tablist" aria-label="Flag categories">
          {tabs.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} className="tab" onClick={() => setTab(t.k)}>
              {t.label}{t.n > 0 && <span className="tab-n">{t.n}</span>}
            </button>
          ))}
        </div>
        <div role="tabpanel" key={tab} className="tab-panel">
          {tab === "tech" && <>
            <p className="muted tab-note">Each technology and version mentioned under a client is compared with its release (GA) date. Something released after the client ended is a red flag for recruiters.</p>
            <List flags={r.tech} />
          </>}
          {tab === "timeline" && <>
            <p className="muted tab-note">Checks the client dates: readable, in order, no overlaps or long gaps, and consistent with the years in your summary.</p>
            <List flags={r.timeline} />
          </>}
          {tab === "health" && <>
            <p className="muted tab-note">Consistency and writing checks recruiters notice: date styles, missing details, repeated or very long bullets, and terms spelled more than one way.</p>
            <List flags={health} />
          </>}
          {tab === "job" && <>
            <p className="muted tab-note">Paste a job description to see which of its skills and keywords your resume already has. Nothing is sent anywhere; matching happens in your browser.</p>
            <textarea className="jd" rows={6} value={jd} onChange={(e) => setJd(e.target.value)} aria-label="Job description"
              placeholder="Paste the job description here" />
            {match && (match.matched.length + match.missing.length === 0 ? (
              <p className="muted" style={{ marginTop: 10 }}>No known skills or keywords were found in this text yet.</p>
            ) : (
              <div className="match">
                <div className="score" style={{ ["--p" as string]: match.score }}>
                  <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.9" className="trk" /><circle cx="18" cy="18" r="15.9" className="val" style={{ strokeDasharray: `${match.score} 100` }} /></svg>
                  <span><b>{match.score}%</b><small>match</small></span>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <p><b>{match.matched.length}</b> of {match.matched.length + match.missing.length} keywords from the job description are in your resume.</p>
                  {match.jdYears !== undefined && (
                    <p className="muted" style={{ marginTop: 4 }}>The job asks for {match.jdYears}+ years{match.resumeYears !== undefined ? `; your summary says ${match.resumeYears}.` : "; your summary doesn't state years of experience."}</p>
                  )}
                  {match.missing.length > 0 && <><p className="sublabel">Missing from your resume</p>
                    <div className="kw">{match.missing.map((k) => <span key={k} className="kw-chip missing">✕ {k}</span>)}</div></>}
                  {match.matched.length > 0 && <><p className="sublabel">Already in your resume</p>
                    <div className="kw">{match.matched.map((k) => <span key={k} className="kw-chip found">✓ {k}</span>)}</div></>}
                  <p className="muted" style={{ fontSize: 13 }}>Only add keywords that are true for your experience.</p>
                </div>
              </div>
            ))}
          </>}
          {tab === "ats" && <>
            <p className="muted tab-note">Keywords that applicant tracking systems and recruiters commonly search for in Senior Full Stack Developer roles.</p>
            <div className="kw">
              {r.ats.found.map((k) => <span key={k} className="kw-chip found">✓ {k}</span>)}
              {r.ats.missing.map((k) => <span key={k} className="kw-chip missing">✕ {k}</span>)}
            </div>
            <List flags={r.ats.flags} />
          </>}
        </div>
        <p className="muted tab-note" style={{ marginTop: 10 }}>Flags are suggestions. Release dates are month-level and use the earliest public release; fix anything in your original resume, then convert again.</p>
      </div></div>
    </div>
  );
}
