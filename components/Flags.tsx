"use client";
import { useMemo, useState } from "react";
import type { ResumeData } from "@/lib/types";
import { checkResume, type Flag } from "@/lib/flags";

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
export default function Flags({ data }: { data: ResumeData }) {
  const r = useMemo(() => checkResume(data), [data]);
  const [tab, setTab] = useState<"tech" | "timeline" | "ats">("tech");
  const [open, setOpen] = useState(true);
  const count = (fs: Flag[]) => fs.filter((f) => f.severity === "error" || f.severity === "warn").length;
  const tabs = [
    { k: "tech" as const, label: "Technology dates", n: count(r.tech) },
    { k: "timeline" as const, label: "Client timeline", n: count(r.timeline) },
    { k: "ats" as const, label: "ATS keywords", n: count(r.ats.flags) }
  ];
  const total = r.counts.error + r.counts.warn;
  return (
    <div className={"flags-card" + (open ? " open" : "")}>
      <button type="button" className="flags-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>
          <b>Resume flags</b>
          <span className="muted"> · checks your original resume, not the template</span>
        </span>
        <span className="flag-sum">
          {r.counts.error > 0 && <span className="chip error">{r.counts.error} issue{r.counts.error > 1 ? "s" : ""}</span>}
          {r.counts.warn > 0 && <span className="chip warn">{r.counts.warn} to review</span>}
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
