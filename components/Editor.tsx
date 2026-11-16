"use client";
import type { ClientEntry, ResumeData } from "@/lib/types";
import { emptyClient } from "@/lib/types";

export type Target = { key: string; label: string };

/** Where a piece of text can be moved or added. */
export function targetsFor(d: ResumeData): Target[] {
  const t: Target[] = [
    { key: "contact", label: "Header: contact" },
    { key: "summary", label: "Summary" },
    { key: "skills", label: "Skills (new row)" }
  ];
  d.clients.forEach((c, i) => {
    const n = c.client || c.role || `Client ${i + 1}`;
    t.push({ key: `resp:${i}`, label: `${n}: bullets` });
    t.push({ key: `desc:${i}`, label: `${n}: description` });
  });
  t.push({ key: "education", label: "Education" });
  return t;
}

export function addTo(d: ResumeData, key: string, text: string): ResumeData {
  const n = structuredClone(d);
  const [k, i] = key.split(":");
  if (k === "contact") n.contact.push(text);
  else if (k === "summary") n.summary.push(text);
  else if (k === "skills") {
    const m = text.match(/^([^:]{2,50}?)\s*:\s*(.+)$/);
    n.skills.push(m ? { cat: m[1].trim(), items: m[2].trim() } : { cat: "", items: text });
  } else if (k === "education") n.education.push(text);
  else if (k === "resp") n.clients[+i]?.responsibilities.push(text);
  else if (k === "desc") n.clients[+i]?.description.push(text);
  return n;
}

function getList(d: ResumeData, key: string): string[] | null {
  const [k, i] = key.split(":");
  if (k === "contact") return d.contact;
  if (k === "summary") return d.summary;
  if (k === "education") return d.education;
  if (k === "resp") return d.clients[+i]?.responsibilities ?? null;
  if (k === "desc") return d.clients[+i]?.description ?? null;
  return null;
}

type Props = { data: ResumeData; onChange: (d: ResumeData) => void; flagged: Set<string> };

export default function Editor({ data, onChange, flagged }: Props) {
  const targets = targetsFor(data);
  const set = (fn: (n: ResumeData) => void) => { const n = structuredClone(data); fn(n); onChange(n); };

  const moveItem = (fromKey: string, idx: number, toKey: string) => {
    if (!toKey || toKey === fromKey) return;
    const n = structuredClone(data);
    const from = getList(n, fromKey);
    if (!from) return;
    const [text] = from.splice(idx, 1);
    onChange(addTo(n, toKey, text));
  };

  const list = ({ k, items, rows = 2, placeholder }: { k: string; items: string[]; rows?: number; placeholder: string }) => (
    <div>
      {items.map((s, i) => (
        <div className={"item" + (flagged.has(s) ? " flag" : "")} key={k + ":" + i + ":" + s}>
          {rows === 1 ? (
            <input type="text" defaultValue={s} aria-label={placeholder}
              onBlur={(e) => e.target.value !== s && set((n) => { getList(n, k)![i] = e.target.value; })} />
          ) : (
            <textarea rows={Math.max(rows, Math.ceil(s.length / 62))} defaultValue={s} aria-label={placeholder}
              onBlur={(e) => e.target.value !== s && set((n) => { getList(n, k)![i] = e.target.value; })} />
          )}
          <div className="tools">
            <button type="button" className="btn icon" title="Move up" aria-label="Move up" disabled={i === 0}
              onClick={() => set((n) => { const l = getList(n, k)!; [l[i - 1], l[i]] = [l[i], l[i - 1]]; })}>↑</button>
            <button type="button" className="btn icon" title="Move down" aria-label="Move down" disabled={i === items.length - 1}
              onClick={() => set((n) => { const l = getList(n, k)!; [l[i + 1], l[i]] = [l[i], l[i + 1]]; })}>↓</button>
            <button type="button" className="btn icon" title="Delete" aria-label="Delete"
              onClick={() => set((n) => { getList(n, k)!.splice(i, 1); })}>✕</button>
            <select aria-label="Move to section" value="" onChange={(e) => moveItem(k, i, e.target.value)}>
              <option value="">Move to…</option>
              {targets.filter((t) => t.key !== k).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
        </div>
      ))}
      <button type="button" className="btn small" onClick={() => set((n) => { getList(n, k)!.push(""); })}>+ Add</button>
    </div>
  );

  const clientCard = (c: ClientEntry, i: number) => {
    const field = (f: "client" | "location" | "role" | "dates", label: string) => (
      <div className={"field" + (flagged.has(c[f]) ? " item flag" : "")} style={{ marginBottom: 0 }}>
        <label>{label}</label>
        <input type="text" key={f + c[f]} defaultValue={c[f]} onBlur={(e) => e.target.value !== c[f] && set((n) => { n.clients[i][f] = e.target.value; })} />
      </div>
    );
    return (
      <div className="client" key={"cl" + i + ":" + JSON.stringify(c).length + c.client + c.role}>
        <div className="head">
          <span>Client {i + 1}</span>
          <span className="tools" style={{ maxWidth: "none" }}>
            <button type="button" className="btn icon" aria-label="Move client up" disabled={i === 0}
              onClick={() => set((n) => { [n.clients[i - 1], n.clients[i]] = [n.clients[i], n.clients[i - 1]]; })}>↑</button>
            <button type="button" className="btn icon" aria-label="Move client down" disabled={i === data.clients.length - 1}
              onClick={() => set((n) => { [n.clients[i + 1], n.clients[i]] = [n.clients[i], n.clients[i + 1]]; })}>↓</button>
            <button type="button" className="btn icon" aria-label="Delete client"
              onClick={() => set((n) => { n.clients.splice(i, 1); })}>✕</button>
          </span>
        </div>
        <div className="two">{field("client", "Client")}{field("location", "Location")}</div>
        <div className="two" style={{ marginTop: 6 }}>{field("role", "Role")}{field("dates", "Dates")}</div>
        <p className="sublabel">Project description (optional)</p>
        {list({ k: `desc:${i}`, items: c.description, rows: 2, placeholder: "Description" })}
        <p className="sublabel">Responsibilities</p>
        {list({ k: `resp:${i}`, items: c.responsibilities, rows: 2, placeholder: "Responsibility" })}
        <p className="sublabel">Environment</p>
        <div className={flagged.has(c.environment) ? "item flag" : ""} style={{ display: "block" }}>
          <textarea rows={2} key={"env" + c.environment} defaultValue={c.environment} aria-label="Environment"
            onBlur={(e) => e.target.value !== c.environment && set((n) => { n.clients[i].environment = e.target.value; })} />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="panel">
        <h3>Header</h3>
        <div className="two">
          <div className={"field" + (flagged.has(data.name) ? " item flag" : "")}><label>Name</label>
            <input type="text" key={"nm" + data.name} defaultValue={data.name} onBlur={(e) => e.target.value !== data.name && set((n) => { n.name = e.target.value; })} /></div>
          <div className={"field" + (flagged.has(data.title) ? " item flag" : "")}><label>Title (optional)</label>
            <input type="text" key={"tt" + data.title} defaultValue={data.title} onBlur={(e) => e.target.value !== data.title && set((n) => { n.title = e.target.value; })} /></div>
        </div>
        <p className="sublabel">Contact details</p>
        {list({ k: "contact", items: data.contact, rows: 1, placeholder: "Contact item" })}
      </div>

      <div className="panel">
        <h3>Summary</h3>
        {list({ k: "summary", items: data.summary, rows: 3, placeholder: "Summary item" })}
      </div>

      <div className="panel">
        <h3>Skills</h3>
        {data.skills.map((s, i) => (
          <div className={"item" + (flagged.has(s.items) || flagged.has(s.cat) ? " flag" : "")} key={"sk" + i + ":" + s.cat + ":" + s.items}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(90px, 30%) 1fr", gap: 6 }}>
              <input type="text" defaultValue={s.cat} placeholder="Category" aria-label="Skill category"
                onBlur={(e) => e.target.value !== s.cat && set((n) => { n.skills[i].cat = e.target.value; })} />
              <textarea rows={Math.max(1, Math.ceil(s.items.length / 45))} defaultValue={s.items} aria-label="Skills"
                onBlur={(e) => e.target.value !== s.items && set((n) => { n.skills[i].items = e.target.value; })} />
            </div>
            <div className="tools">
              <button type="button" className="btn icon" aria-label="Move up" disabled={i === 0}
                onClick={() => set((n) => { [n.skills[i - 1], n.skills[i]] = [n.skills[i], n.skills[i - 1]]; })}>↑</button>
              <button type="button" className="btn icon" aria-label="Move down" disabled={i === data.skills.length - 1}
                onClick={() => set((n) => { [n.skills[i + 1], n.skills[i]] = [n.skills[i], n.skills[i + 1]]; })}>↓</button>
              <button type="button" className="btn icon" aria-label="Delete" onClick={() => set((n) => { n.skills.splice(i, 1); })}>✕</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn small" onClick={() => set((n) => { n.skills.push({ cat: "", items: "" }); })}>+ Add row</button>
      </div>

      <div className="panel">
        <h3>Clients <button type="button" className="btn small" onClick={() => set((n) => { n.clients.push(emptyClient()); })}>+ Add client</button></h3>
        {data.clients.map((c, i) => clientCard(c, i))}
      </div>

      <div className="panel">
        <h3>Education</h3>
        {list({ k: "education", items: data.education, rows: 1, placeholder: "Education entry" })}
      </div>
    </div>
  );
}
