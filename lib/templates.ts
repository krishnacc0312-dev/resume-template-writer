// @ts-nocheck -- layout code builds loosely-typed pdfmake/docx structures; inputs are typed at the exports.
// Layout engine: one resume + one template spec -> a PDF definition (pdfmake) and a Word document (docx).
import * as docxLib from "docx";
import type { ResumeData } from "./types";
import { TEMPLATES, ACCENTS, type Template, type FontKey } from "./templateMeta";
import { SAMPLE } from "./sample";
export { TEMPLATES, ACCENTS, SAMPLE };
export type { Template };

/** Options chosen by the user on the results page. */
export type RenderOptions = { pageSize?: "letter" | "a4"; accent?: string | null; scale?: number; font?: FontKey | null; size?: number | null };

/** PDF font (metric-compatible open fonts) and Word font for each choice. */
export const FONT_FILES: Record<FontKey, { pdf: string; word: string }> = {
  calibri: { pdf: "Carlito", word: "Calibri" },
  cambria: { pdf: "Caladea", word: "Cambria" },
  times: { pdf: "LiberationSerif", word: "Times New Roman" }
};

const HEADINGS = { summary: "Professional Summary", skills: "Technical Skills", clients: "Professional Experience", education: "Education" };
const INK = "#1A1A1A", MUTED = "#5B6270", LIGHT = "#C9CDD3", BAR = "#EEF0F4";

function metrics(t: Template, o: RenderOptions = {}) {
  const sc = o.scale || 1;
  const bodyBase = o.size || t.body;
  const k = (bodyBase / t.body) * sc;           // everything scales with the body size
  const font = o.font || t.font;
  const accent = o.accent || t.accent;
  return {
    k, font, accent,
    pdfFont: FONT_FILES[font].pdf, wordFont: FONT_FILES[font].word,
    body: round(bodyBase * sc), line: t.line,
    margin: sc < 1 ? t.margin * Math.max(0.78, sc) : t.margin,
    pageW: o.pageSize === "a4" ? 595.28 : 612, a4: o.pageSize === "a4",
    bullet: font === "cambria" && t.bullet === "▪" ? "•" : t.bullet
  };
}
const round = (n: number) => Math.round(n * 100) / 100;
const nonEmpty = (a?: string[]) => (a || []).filter((x) => x && String(x).trim());
const joinLoc = (c) => (c.location ? `${c.client}, ${c.location}` : c.client);
const colorOf = (which: string, m) => (which === "accent" ? m.accent : which === "muted" ? MUTED : INK);

/* ===================================================================== PDF */
let grpSeq = 0;
function keep(node) {
  const id = ++grpSeq; let n = 0;
  (function tag(x) {
    if (!x || typeof x !== "object") return;
    x.id = "kg" + id + "_" + (n++);
    (x.stack || []).forEach(tag); (x.columns || []).forEach(tag);
  })(node);
  node.headlineLevel = 1;
  return node;
}

export function pdfDef(data: ResumeData, t: Template, opts?: RenderOptions): any {
  const m = metrics(t, opts);
  const W = m.pageW - 2 * m.margin;
  const h = t.header, hd = t.heading;
  const C = [];
  const fs = (n: number) => round(n * m.k);
  const line = (x2, weight, color, mt = 0, mb = 0) => ({ canvas: [{ type: "line", x1: 0, y1: 0, x2, y2: 0, lineWidth: weight, lineColor: color }], margin: [0, mt, 0, mb] });
  const cell = (x) => (x && typeof x === "object" && !Array.isArray(x) ? x : { text: x || "" });
  const rightRow = (left, right, mb = 0) => ({ columns: [{ width: "*", ...cell(left) }, { width: "auto", ...cell(right) }], columnGap: 10, margin: [0, 0, 0, mb] });

  /* ---- header ---- */
  const name = h.nameCase === "upper" ? (data.name || "").toUpperCase() : data.name || "";
  const onBand = !!h.band;
  const nameColor = onBand ? "#FFFFFF" : colorOf(h.nameColor, m);
  const titleNode = () => {
    if (!data.title) return null;
    const st = { fontSize: fs(h.titleSize), color: onBand ? "#E6ECF5" : INK };
    if (h.titleStyle === "bold") Object.assign(st, { bold: true });
    if (h.titleStyle === "accent") Object.assign(st, { color: onBand ? "#FFFFFF" : m.accent });
    if (h.titleStyle === "muted") Object.assign(st, { color: onBand ? "#D5DEEB" : MUTED });
    const caps = h.titleStyle.startsWith("caps");
    if (caps) Object.assign(st, { characterSpacing: 1.6, bold: true, color: onBand ? "#FFFFFF" : h.titleStyle === "caps-accent" ? m.accent : MUTED });
    return { text: caps ? data.title.toUpperCase() : data.title, ...st };
  };
  const contact = nonEmpty(data.contact);
  const contactColor = onBand ? "#D5DEEB" : h.contactMuted ? MUTED : INK;
  const align = h.align === "center" ? "center" : "left";
  const head = [];
  if (h.align === "split") {
    const t1 = titleNode();
    head.push({
      columns: [
        { width: "*", stack: [{ text: name, bold: h.nameBold, fontSize: fs(h.nameSize), color: nameColor, characterSpacing: h.nameTracking || 0 }, ...(t1 ? [{ ...t1, margin: [0, 2, 0, 0] }] : [])] },
        { width: "auto", stack: contact.map((c) => ({ text: c, fontSize: fs(t.body - 0.5), color: contactColor, alignment: "right" })) }
      ], columnGap: 16
    });
  } else if (h.titleInline) {
    const parts = [{ text: name, bold: h.nameBold, fontSize: fs(h.nameSize), color: nameColor, characterSpacing: h.nameTracking || 0 }];
    const t1 = titleNode();
    if (t1) parts.push({ text: "  |  ", fontSize: fs(h.titleSize), color: MUTED }, t1);
    head.push({ text: parts, alignment: align });
    if (contact.length) head.push({ text: contact.join(h.contactSep), fontSize: fs(t.body - 0.5), color: contactColor, alignment: align, margin: [0, 3, 0, 0] });
  } else {
    head.push({ text: name, bold: h.nameBold, fontSize: fs(h.nameSize), color: nameColor, alignment: align, characterSpacing: h.nameTracking || 0 });
    const t1 = titleNode();
    if (t1) head.push({ ...t1, alignment: align, margin: [0, t.exact ? 0 : 2, 0, 0] });
    if (contact.length) head.push({ text: contact.join(h.contactSep), fontSize: fs(t.exact ? t.body : t.body - 0.5), color: contactColor, alignment: align, margin: [0, t.exact ? 1 : 4, 0, 0] });
  }
  if (onBand) {
    C.push({ table: { widths: ["*"], body: [[{ stack: head, fillColor: m.accent, margin: [16, 14, 16, 14] }]] }, layout: "noBorders", margin: [0, 0, 0, 2] });
  } else {
    C.push(...head);
    if (h.rule === "thin") C.push(line(W, 0.6, LIGHT, 7));
    if (h.rule === "thin-accent") C.push(line(W, 0.9, m.accent, 7));
    if (h.rule === "thick-accent") C.push(line(W, 2.4, m.accent, 8));
    if (h.rule === "double") C.push(line(W, 2.2, INK, 8, 0), line(W, 0.6, INK, 2));
  }

  /* ---- section heading ---- */
  function heading(label: string) {
    const text = (hd.case === "upper" ? label.toUpperCase() : label) + (hd.colon ? ":" : "");
    const base = { text, bold: true, fontSize: fs(hd.size), color: colorOf(hd.color, m), characterSpacing: hd.tracking || 0, alignment: hd.align || "left" };
    const out = [];
    if (hd.lineBeforeExperience && label === HEADINGS.clients) out.push(line(W, 0.6, INK, fs(hd.before)));
    if (hd.bar) {
      out.push({ table: { widths: ["*"], body: [[{ ...base, fillColor: BAR, margin: [6, 3, 6, 3] }]] }, layout: "noBorders", margin: [0, fs(hd.before), 0, fs(hd.after)] });
    } else if (hd.rule === "above") {
      out.push(line(W, hd.ruleWeight || 0.6, LIGHT, fs(hd.before), 4), { ...base, margin: [0, 0, 0, fs(hd.after)] });
    } else {
      const mt = hd.lineBeforeExperience && label === HEADINGS.clients ? fs(hd.before) : fs(hd.before);
      out.push({ ...base, margin: [0, mt, 0, hd.rule === "none" ? fs(hd.after) : 2] });
      if (hd.rule === "below") out.push(line(W, hd.ruleWeight || 0.8, "#2A2A2A", 0, fs(hd.after)));
      if (hd.rule === "below-accent") out.push(line(W, hd.ruleWeight || 0.8, m.accent, 0, fs(hd.after)));
      if (hd.rule === "below-short-accent") out.push(line(38, 2.2, m.accent, 1, fs(hd.after)));
    }
    return keep({ stack: out });
  }

  /* ---- bullets ---- */
  const bw = fs(t.body * 1.05);
  const bullet = (content) => ({
    columns: [{ width: bw, text: m.bullet, color: t.bulletAccent ? m.accent : INK, bold: m.bullet === "›", fontSize: m.font === "calibri" ? undefined : fs(t.body * 1.15) }, { width: "*", text: content }],
    columnGap: 2, margin: [fs(3), 0, 0, t.exact ? 0.5 : fs(1.6)]
  });

  /* ---- summary ---- */
  const summary = nonEmpty(data.summary);
  if (summary.length) { C.push(heading(HEADINGS.summary)); summary.forEach((s) => C.push(bullet(s))); }

  /* ---- skills ---- */
  const skills = (data.skills || []).filter((s) => (s.items || "").trim() || (s.cat || "").trim());
  if (skills.length) {
    C.push(heading(HEADINGS.skills));
    if (t.skills === "table") {
      const boxedHead = t.type === "boxed";
      C.push({
        table: { widths: ["30%", "*"], body: skills.map((s) => [{ text: s.cat || "", bold: true, fillColor: boxedHead ? BAR : undefined, color: boxedHead ? m.accent : INK }, { text: s.items }]) },
        layout: { hLineWidth: () => 0.6, vLineWidth: () => 0.6, hLineColor: () => (boxedHead ? "#B9BFCA" : "#000000"), vLineColor: () => (boxedHead ? "#B9BFCA" : "#000000"),
          paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => (boxedHead ? 2.5 : 1), paddingBottom: () => (boxedHead ? 2.5 : 1) },
        margin: [0, 2, 0, 2]
      });
    } else if (t.skills === "tabbed") {
      const lw = fs(118);
      skills.forEach((s) => C.push(s.cat
        ? { columns: [{ width: lw, text: s.cat, bold: true, color: t.type === "boxed" ? m.accent : INK }, { width: "*", text: s.items }], columnGap: 8, margin: [0, 0, 0, fs(2)] }
        : { text: s.items, margin: [0, 0, 0, fs(2)] }));
    } else {
      const rows = skills.map((s) => (s.cat ? { text: [{ text: s.cat + ": ", bold: true }, s.items] } : { text: s.items }));
      if (t.skills === "bullets") rows.forEach((r) => C.push(bullet(r.text)));
      else rows.forEach((r) => C.push({ ...r, margin: [0, 0, 0, fs(1.6)] }));
    }
  }

  /* ---- clients ---- */
  const clients = data.clients || [];
  if (clients.length) {
    const expHeading = heading(HEADINGS.clients);
    clients.forEach((c, i) => {
      const head = [];
      const roleColor = t.roleAccent ? m.accent : INK;
      if (t.client === "harvard") {
        head.push(rightRow({ text: c.client || c.role, bold: true }, { text: c.dates, color: INK }));
        const loc = c.location ? { text: c.location, color: MUTED } : "";
        if (c.role && c.client) head.push(rightRow({ text: c.role, color: roleColor, bold: !!t.roleAccent }, loc));
        else if (c.location) head.push(rightRow("", loc));
      } else if (t.client === "rolefirst") {
        head.push(rightRow({ text: c.role || c.client, bold: true, color: m.accent, fontSize: fs(t.body + 0.5) }, { text: c.dates, bold: true }));
        if (c.role && c.client) head.push({ text: [{ text: c.client, bold: true }, c.location ? { text: ", " + c.location, color: MUTED } : ""] });
      } else if (t.client === "oneline") {
        const left = [{ text: c.client, bold: true }];
        if (c.role) left.push({ text: "  |  " + c.role });
        if (c.location) left.push({ text: "  |  " + c.location, color: MUTED });
        head.push(rightRow({ text: left }, { text: c.dates, bold: true }));
      } else if (t.client === "stacked") {
        head.push({ text: c.role || c.client, bold: true, fontSize: fs(t.body + 1.5), color: INK });
        const meta = [c.role ? c.client : "", c.location, c.dates].filter(Boolean).join("  ·  ");
        if (meta) head.push({ text: meta, color: m.accent, margin: [0, 1, 0, 0] });
      } else if (t.client === "labels") {
        head.push(rightRow({ text: "CLIENT: " + joinLoc(c), bold: true }, { text: c.dates, bold: true }));
        if (c.role) head.push({ text: "ROLE: " + c.role, bold: true });
      } else if (t.client === "labels-classic") {
        head.push(rightRow({ text: [{ text: "Client: ", color: m.accent }, joinLoc(c)], bold: true }, { text: c.dates, bold: true }));
        if (c.role) head.push({ text: [{ text: "Role: ", bold: true, color: m.accent }, c.role] });
      }
      const desc = nonEmpty(c.description), resp = nonEmpty(c.responsibilities);
      const respLabel = t.respLabel !== "none" ? { text: "Responsibilities:", bold: t.respLabel === "bold", margin: [0, t.exact ? 0 : 3, 0, t.exact ? 6 : 2] } : null;
      // Keep the client header with the first thing below it.
      if (desc.length) head.push({ text: desc[0], margin: [0, 3, 0, 2] });
      else if (resp.length) { if (respLabel) head.push(respLabel); head.push(bullet(resp[0])); }
      const topGap = i ? fs(t.clientGap) : 0;
      const block = { stack: head, margin: [0, t.clientDivider && i ? 0 : 0, 0, 1] };
      if (t.clientDivider && i) C.push(line(W, 0.5, LIGHT, topGap, fs(t.clientGap * 0.6)));
      if (i === 0) C.push(keep({ stack: [expHeading, block] }));
      else C.push(keep({ ...block, margin: [0, t.clientDivider ? 0 : topGap, 0, 1] }));
      desc.slice(1).forEach((d) => C.push({ text: d, margin: [0, 1, 0, 2] }));
      if (resp.length) {
        if (desc.length) { if (respLabel) C.push(keep(respLabel)); C.push(bullet(resp[0])); }
        resp.slice(1).forEach((r) => C.push(bullet(r)));
      }
      if (c.environment) C.push({ text: [{ text: "Environment: ", bold: true, color: t.envLabelAccent ? m.accent : INK }, c.environment], margin: [0, t.exact ? 6 : fs(3), 0, 0] });
    });
  }

  /* ---- education ---- */
  const edu = nonEmpty(data.education);
  if (edu.length) { C.push(heading(HEADINGS.education)); edu.forEach((e) => C.push({ text: e, margin: [0, 0, 0, 2] })); }

  return {
    pageSize: m.a4 ? "A4" : "LETTER",
    pageMargins: [m.margin, m.margin, m.margin, m.margin],
    info: { title: (data.name || "Resume") + " - Resume" },
    defaultStyle: { font: m.pdfFont, fontSize: m.body, lineHeight: m.line, color: INK },
    content: C,
    pageBreakBefore: (node, following) => {
      if (node.headlineLevel !== 1) return false;
      const g = String(node.id || "").split("_")[0];
      return following.filter((n) => String(n.id || "").split("_")[0] !== g).length === 0;
    }
  };
}

/* ==================================================================== Word */
export function docxDoc(data: ResumeData, t: Template, opts?: RenderOptions): docxLib.Document {
  const D = docxLib;
  const m = metrics(t, opts);
  const tw = (pt) => Math.round(pt * 20);
  const hp = (pt) => Math.round(pt * 2);
  const fs = (n: number) => round(n * m.k);
  const textW = tw(m.pageW - 2 * m.margin);
  const hex = (c: string) => c.replace("#", "");
  const accent = hex(m.accent);
  const h = t.header, hd = t.heading;
  const lineSp = Math.round(240 * m.line);
  const P = [];
  const para = (runs, o: any = {}) => new D.Paragraph({ children: runs, spacing: { after: 0, line: lineSp, ...(o.spacing || {}) }, ...(o.extra || {}) });
  const run = (text, o: any = {}) => new D.TextRun({ text, font: m.wordFont, ...o });
  const rightTab = [{ type: D.TabStopType.RIGHT, position: textW }];
  const border = (style, size, color, space = 1) => ({ style, size, color, space });
  const S1 = D.BorderStyle.SINGLE;

  /* ---- header ---- */
  const onBand = !!h.band;
  const name = data.name || "";
  const nameRun = run(name, { bold: h.nameBold, size: hp(fs(h.nameSize)), color: onBand ? "FFFFFF" : hex(colorOf(h.nameColor, m)), allCaps: h.nameCase === "upper", characterSpacing: h.nameTracking ? Math.round(h.nameTracking * 20) : undefined });
  const titleRun = () => {
    if (!data.title) return null;
    const caps = h.titleStyle.startsWith("caps");
    let color = onBand ? "E6ECF5" : hex(INK);
    if (h.titleStyle === "accent") color = onBand ? "FFFFFF" : accent;
    if (h.titleStyle === "muted") color = onBand ? "D5DEEB" : hex(MUTED);
    if (caps) color = onBand ? "FFFFFF" : h.titleStyle === "caps-accent" ? accent : hex(MUTED);
    return run(data.title, { size: hp(fs(h.titleSize)), color, bold: h.titleStyle === "bold" || caps, allCaps: caps, characterSpacing: caps ? 32 : undefined });
  };
  const contact = nonEmpty(data.contact);
  const cColor = onBand ? "D5DEEB" : h.contactMuted ? hex(MUTED) : hex(INK);
  const al = h.align === "center" ? D.AlignmentType.CENTER : D.AlignmentType.LEFT;
  // Boxed band: shading plus same-colour borders, which Word uses as inner padding and joins into one box.
  const bandEdge = { style: S1, size: 6, color: accent, space: 10 };
  const band = onBand ? { shading: { type: D.ShadingType.CLEAR, fill: accent, color: "auto" }, border: { top: bandEdge, bottom: bandEdge, left: bandEdge, right: bandEdge }, indent: { left: 220, right: 220 } } : {};
  const headParas = [];
  if (h.align === "split") {
    const left = [nameRun, titleRun()].filter(Boolean);
    const n = Math.max(left.length, contact.length);
    for (let i = 0; i < n; i++) {
      const runs = [];
      if (left[i]) runs.push(left[i]);
      if (contact[i]) runs.push(run("\t" + contact[i], { size: hp(fs(t.body - 0.5)), color: cColor }));
      headParas.push(para(runs, { extra: { tabStops: rightTab, ...band } }));
    }
  } else if (h.titleInline) {
    const tr = titleRun();
    headParas.push(para([nameRun, ...(tr ? [run("  |  ", { size: hp(fs(h.titleSize)), color: hex(MUTED) }), tr] : [])], { extra: { alignment: al, ...band } }));
    if (contact.length) headParas.push(para([run(contact.join(h.contactSep), { size: hp(fs(t.body - 0.5)), color: cColor })], { extra: { alignment: al, ...band }, spacing: { before: 60 } }));
  } else {
    headParas.push(para([nameRun], { extra: { alignment: al, ...band }, spacing: onBand ? { before: 0 } : {} }));
    const tr = titleRun();
    if (tr) headParas.push(para([tr], { extra: { alignment: al, ...band }, spacing: { before: t.exact ? 0 : 40 } }));
    if (contact.length) headParas.push(para([run(contact.join(h.contactSep), { size: hp(fs(t.exact ? t.body : t.body - 0.5)), color: cColor })], { extra: { alignment: al, ...band }, spacing: { before: t.exact ? 20 : 80 } }));
  }
  if (onBand) {
    P.push(...headParas);
    P.push(para([run("", { size: 4 })], { spacing: { line: 200, lineRule: D.LineRuleType.EXACT } }));
  } else {
    P.push(...headParas);
    const ruleBorder = h.rule === "thin" ? border(S1, 4, hex(LIGHT), 1) : h.rule === "thin-accent" ? border(S1, 6, accent, 1)
      : h.rule === "thick-accent" ? border(S1, 18, accent, 1) : h.rule === "double" ? border(D.BorderStyle.DOUBLE, 6, hex(INK), 1) : null;
    // A thin empty line carries the rule under the header.
    if (ruleBorder) P.push(para([run("", { size: 4 })], { extra: { border: { bottom: ruleBorder } }, spacing: { before: 60, line: 120, lineRule: D.LineRuleType.EXACT } }));
  }

  /* ---- headings ---- */
  function heading(label: string) {
    const text = (hd.case === "upper" ? label.toUpperCase() : label) + (hd.colon ? ":" : "");
    const r = run(text, { bold: true, size: hp(fs(hd.size)), color: hex(colorOf(hd.color, m)), characterSpacing: hd.tracking ? Math.round(hd.tracking * 20) : undefined });
    const extra: any = { keepNext: true, keepLines: true, alignment: hd.align === "center" ? D.AlignmentType.CENTER : D.AlignmentType.LEFT };
    let before = tw(fs(hd.before)), after = tw(fs(hd.after));
    if (hd.lineBeforeExperience && label === HEADINGS.clients) { extra.border = { top: border(S1, 6, "000000", 8) }; before += 120; }
    if (hd.bar) { extra.shading = { type: D.ShadingType.CLEAR, fill: hex(BAR), color: "auto" }; extra.indent = { left: 0 }; }
    if (hd.rule === "below") extra.border = { bottom: border(S1, Math.round((hd.ruleWeight || 0.8) * 8), "2A2A2A", 2) };
    if (hd.rule === "below-accent") extra.border = { bottom: border(S1, Math.round((hd.ruleWeight || 0.8) * 8), accent, 2) };
    if (hd.rule === "above") extra.border = { top: border(S1, 4, hex(LIGHT), 6) };
    const out = [para([r], { extra, spacing: { before, after: hd.rule === "below-short-accent" ? 0 : after } })];
    if (hd.rule === "below-short-accent") out.push(para([run("", { size: 4 })], { spacing: { after, line: 120, lineRule: D.LineRuleType.EXACT }, extra: { keepNext: true, indent: { right: textW - tw(38) }, border: { bottom: border(S1, 18, accent, 1) } } }));
    return out;
  }

  /* ---- bullets ---- */
  const bulletPara = (runs, last = false) => para(Array.isArray(runs) ? runs : [run(runs)], { extra: { numbering: { reference: "bul", level: 0 } }, spacing: { after: t.exact ? 10 : tw(fs(1.6)) } });

  const summary = nonEmpty(data.summary);
  if (summary.length) { P.push(...heading(HEADINGS.summary)); summary.forEach((s) => P.push(bulletPara(s))); }

  /* ---- skills ---- */
  const skills = (data.skills || []).filter((s) => (s.items || "").trim() || (s.cat || "").trim());
  if (skills.length) {
    P.push(...heading(HEADINGS.skills));
    if (t.skills === "table") {
      const boxed = t.type === "boxed";
      const b = { style: S1, size: 4, color: boxed ? "B9BFCA" : "000000" };
      const cw = Math.round(textW * 0.3);
      const cellM = { top: boxed ? 40 : 10, bottom: boxed ? 40 : 10, left: 90, right: 90 };
      P.push(new D.Table({
        width: { size: textW, type: D.WidthType.DXA }, columnWidths: [cw, textW - cw],
        borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b },
        rows: skills.map((s) => new D.TableRow({ children: [
          new D.TableCell({ width: { size: cw, type: D.WidthType.DXA }, margins: cellM, shading: boxed ? { type: D.ShadingType.CLEAR, fill: hex(BAR), color: "auto" } : undefined,
            children: [para([run(s.cat || "", { bold: true, color: boxed ? accent : undefined })])] }),
          new D.TableCell({ width: { size: textW - cw, type: D.WidthType.DXA }, margins: cellM, children: [para([run(s.items)])] })
        ] }))
      }));
    } else if (t.skills === "tabbed") {
      const lw = tw(fs(118) + 8);
      skills.forEach((s) => P.push(s.cat
        ? para([run(s.cat, { bold: true, color: t.type === "boxed" ? accent : undefined }), run("\t" + s.items)], { extra: { tabStops: [{ type: D.TabStopType.LEFT, position: lw }], indent: { left: lw, hanging: lw } }, spacing: { after: tw(fs(2)) } })
        : para([run(s.items)], { spacing: { after: tw(fs(2)) } })));
    } else {
      skills.forEach((s) => {
        const runs = s.cat ? [run(s.cat + ": ", { bold: true }), run(s.items)] : [run(s.items)];
        P.push(t.skills === "bullets" ? bulletPara(runs) : para(runs, { spacing: { after: tw(fs(1.6)) } }));
      });
    }
  }

  /* ---- clients ---- */
  const clients = data.clients || [];
  if (clients.length) {
    P.push(...heading(HEADINGS.clients));
    clients.forEach((c, i) => {
      const keepNext = { keepNext: true, keepLines: true };
      const gap = i ? tw(fs(t.clientGap)) : 0;
      const firstExtra: any = { ...keepNext, tabStops: rightTab };
      if (t.clientDivider && i) firstExtra.border = { top: border(S1, 4, hex(LIGHT), 8) };
      const first = (runs) => para(runs, { extra: firstExtra, spacing: { before: gap } });
      const row = (runs) => para(runs, { extra: { ...keepNext, tabStops: rightTab } });
      const roleColor = t.roleAccent ? accent : undefined;
      if (t.client === "harvard") {
        P.push(first([run(c.client || c.role, { bold: true }), run("\t" + (c.dates || ""))]));
        if (c.role && c.client) P.push(row([run(c.role, { color: roleColor, bold: !!t.roleAccent }), run(c.location ? "\t" + c.location : "", { color: hex(MUTED) })]));
        else if (c.location) P.push(row([run("\t" + c.location, { color: hex(MUTED) })]));
      } else if (t.client === "rolefirst") {
        P.push(first([run(c.role || c.client, { bold: true, color: accent, size: hp(fs(t.body + 0.5)) }), run("\t" + (c.dates || ""), { bold: true })]));
        if (c.role && c.client) P.push(row([run(c.client, { bold: true }), run(c.location ? ", " + c.location : "", { color: hex(MUTED) })]));
      } else if (t.client === "oneline") {
        P.push(first([run(c.client, { bold: true }), run(c.role ? "  |  " + c.role : ""), run(c.location ? "  |  " + c.location : "", { color: hex(MUTED) }), run("\t" + (c.dates || ""), { bold: true })]));
      } else if (t.client === "stacked") {
        P.push(first([run(c.role || c.client, { bold: true, size: hp(fs(t.body + 1.5)) })]));
        const meta = [c.role ? c.client : "", c.location, c.dates].filter(Boolean).join("  ·  ");
        if (meta) P.push(row([run(meta, { color: accent })]));
      } else if (t.client === "labels") {
        P.push(first([run("CLIENT: " + joinLoc(c), { bold: true }), run("\t" + (c.dates || ""), { bold: true })]));
        if (c.role) P.push(row([run("ROLE: " + c.role, { bold: true })]));
      } else if (t.client === "labels-classic") {
        P.push(first([run("Client: ", { bold: true, color: accent }), run(joinLoc(c), { bold: true }), run("\t" + (c.dates || ""), { bold: true })]));
        if (c.role) P.push(row([run("Role: ", { bold: true, color: accent }), run(c.role)]));
      }
      nonEmpty(c.description).forEach((d) => P.push(para([run(d)], { spacing: { before: 40, after: 40 } })));
      const resp = nonEmpty(c.responsibilities);
      if (resp.length) {
        if (t.respLabel !== "none") P.push(para([run("Responsibilities:", { bold: t.respLabel === "bold" })], { extra: { keepNext: true }, spacing: { before: t.exact ? 0 : 40, after: t.exact ? 120 : 40 } }));
        resp.forEach((r) => P.push(bulletPara(r)));
      }
      if (c.environment) P.push(para([run("Environment: ", { bold: true, color: t.envLabelAccent ? accent : undefined }), run(c.environment)], { spacing: { before: t.exact ? 120 : tw(fs(3)) } }));
    });
  }

  /* ---- education ---- */
  const edu = nonEmpty(data.education);
  if (edu.length) { P.push(...heading(HEADINGS.education)); edu.forEach((e) => P.push(para([run(e)], { spacing: { after: 40 } }))); }

  const bChar = m.bullet;
  return new D.Document({
    creator: data.name || "",
    title: (data.name || "Resume") + " - Resume",
    styles: { default: { document: { run: { font: m.wordFont, size: hp(m.body), color: hex(INK) } } } },
    numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: D.LevelFormat.BULLET, text: bChar, alignment: D.AlignmentType.LEFT,
      style: { paragraph: { indent: { left: tw(fs(t.body * 1.05) + fs(3) + 2), hanging: tw(fs(t.body * 1.05)) } }, run: { font: m.wordFont, color: t.bulletAccent ? accent : undefined, bold: bChar === "›" } } }] }] },
    sections: [{
      properties: { page: { size: m.a4 ? { width: 11906, height: 16838 } : { width: 12240, height: 15840 },
        margin: { top: tw(m.margin), bottom: tw(m.margin), left: tw(m.margin), right: tw(m.margin) } } },
      children: P
    }]
  });
}
