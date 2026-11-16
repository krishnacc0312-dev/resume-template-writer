// @ts-nocheck -- ported layout code; inputs are typed at the exports.
/* eslint-disable @typescript-eslint/no-explicit-any */
// Resume templates: one data model -> PDF definition (pdfmake) and Word document (docx).
import * as docxLib from "docx";
import type { ResumeData } from "./types";
import { TEMPLATES, type Template } from "./templateMeta";
export { TEMPLATES };
export type { Template };




  

  const HEADINGS = {
    summary: "Professional Summary",
    skills: "Technical Skills",
    clients: "Professional Experience",
    education: "Education"
  };

  function metrics(t) {
    const compact = !!t.compact, airy = !!t.airy;
    return {
      margin: compact ? 40 : 50,          // pt
      body: compact ? 10 : 11,            // pt
      name: compact ? 18 : 20,
      title: compact ? 11.5 : 12.5,
      contact: compact ? 9.5 : 10,
      heading: compact ? 11.5 : 12.5,
      secBefore: airy ? 14 : compact ? 7 : 10,
      afterHead: airy ? 6 : compact ? 3 : 4,
      clientGap: airy ? 10 : compact ? 5 : 8,
      line: compact ? 1.08 : 1.15,
      color: t.color || "#1A1A1A"
    };
  }
  const PAGE_W = 612, PAGE_H = 792;

  function nonEmpty(a) { return (a || []).filter(function (x) { return x && String(x).trim(); }); }
  function joinLoc(c) { return c.location ? c.client + ", " + c.location : c.client; }

  /* ---------------- PDF (pdfmake) ---------------- */
  let grpSeq = 0;
  function keep(node) {
    // Mark a node and everything inside it as one keep-with-next group.
    const id = ++grpSeq; let k = 0;
    (function tag(n) {
      if (!n || typeof n !== "object") return;
      n.id = "kg" + id + "_" + (k++);
      (n.stack || []).forEach(tag);
      (n.columns || []).forEach(tag);
    })(node);
    node.headlineLevel = 1;
    return node;
  }
  export function pdfDef(data: ResumeData, t: Template): any {
    const m = metrics(t), W = PAGE_W - 2 * m.margin;
    const C = [];
    const center = t.hdr === "center";

    // Header
    if (t.hdr === "inline") {
      const parts = [{ text: (data.name || "").toUpperCase(), bold: true, fontSize: m.name, color: m.color }];
      if (data.title) parts.push({ text: "  |  " + data.title, fontSize: m.title });
      C.push({ text: parts, margin: [0, 0, 0, 2] });
    } else {
      C.push({ text: (data.name || "").toUpperCase(), bold: true, fontSize: m.name, color: m.color, alignment: center ? "center" : "left" });
      if (data.title) C.push({ text: data.title, fontSize: m.title, alignment: center ? "center" : "left", margin: [0, 1, 0, 0] });
    }
    const contact = nonEmpty(data.contact);
    if (contact.length) C.push({ text: contact.join("  |  "), fontSize: m.contact, color: "#444444", alignment: center ? "center" : "left", margin: [0, 2, 0, 0] });

    function heading(label) {
      const up = label.toUpperCase();
      const base = { text: up, bold: true, fontSize: m.heading, color: m.color, margin: [0, m.secBefore, 0, 1] };
      const out = [];
      if (t.h === "caps") {
        base.alignment = "center"; base.characterSpacing = 1.2;
        out.push(base, { canvas: [{ type: "line", x1: 0, y1: 1, x2: W, y2: 1, lineWidth: 0.5, lineColor: "#555555" }], margin: [0, 0, 0, m.afterHead] });
      } else if (t.h === "rule") {
        out.push(base, { canvas: [{ type: "line", x1: 0, y1: 1, x2: W, y2: 1, lineWidth: 1.2, lineColor: "#222222" }], margin: [0, 0, 0, m.afterHead] });
      } else if (t.h === "thin") {
        out.push(base, { canvas: [{ type: "line", x1: 0, y1: 1, x2: W, y2: 1, lineWidth: 0.5, lineColor: "#999999" }], margin: [0, 0, 0, m.afterHead] });
      } else if (t.h === "accent") {
        out.push(base, { canvas: [{ type: "line", x1: 0, y1: 1, x2: 36, y2: 1, lineWidth: 2, lineColor: m.color }], margin: [0, 0, 0, m.afterHead] });
      } else {
        base.margin = [0, m.secBefore, 0, m.afterHead];
        out.push(base);
      }
      // One unit so the heading and its rule stay with the content below them.
      return [keep({ stack: out })];
    }
    function bullets(items) { return { ul: items.map(function (s) { return { text: s, margin: [0, 0, 0, 1] }; }), margin: [0, 0, 0, 2] }; }
    function rightRow(left, right) {
      return { columns: [{ width: "*", text: left }, { width: "auto", text: right || "" }], columnGap: 10 };
    }

    // Summary
    const summary = nonEmpty(data.summary);
    if (summary.length) { C.push.apply(C, heading(HEADINGS.summary)); C.push(bullets(summary)); }

    // Skills
    const skills = (data.skills || []).filter(function (s) { return (s.items || "").trim() || (s.cat || "").trim(); });
    if (skills.length) {
      C.push.apply(C, heading(HEADINGS.skills));
      const rows = skills.map(function (s) {
        return s.cat ? { text: [{ text: s.cat + ": ", bold: true }, s.items], margin: [0, 0, 0, 1] } : { text: s.items, margin: [0, 0, 0, 1] };
      });
      if (t.sk === "bullets") C.push({ ul: rows, margin: [0, 0, 0, 2] });
      else C.push.apply(C, rows);
    }

    // Clients
    const clients = data.clients || [];
    if (clients.length) {
      C.push.apply(C, heading(HEADINGS.clients));
      clients.forEach(function (c, i) {
        const head = [];
        const lbl = "Client: ";
        if (t.cl === "right") {
          head.push(rightRow({ text: lbl + joinLoc(c), bold: true }, { text: c.dates, bold: true }));
          if (c.role) head.push({ text: "Role: " + c.role, italics: true });
        } else if (t.cl === "below") {
          head.push({ text: lbl + joinLoc(c), bold: true });
          if (c.role) head.push({ text: c.role, italics: true });
          if (c.dates) head.push({ text: c.dates, color: "#555555" });
        } else if (t.cl === "caps") {
          head.push(rightRow({ text: joinLoc({ client: (c.client || "").toUpperCase(), location: c.location }), bold: true }, { text: c.dates, bold: true }));
          if (c.role) head.push({ text: c.role, italics: true });
        } else if (t.cl === "oneline") {
          head.push({ text: [joinLoc(c), c.role, c.dates].filter(Boolean).join("  |  "), bold: true });
        } else if (t.cl === "rolefirst") {
          head.push(rightRow({ text: c.role || "", bold: true }, { text: c.dates, bold: true }));
          head.push({ text: lbl + joinLoc(c), italics: true });
        }
        const desc = nonEmpty(c.description), resp = nonEmpty(c.responsibilities);
        // Keep the client header with what follows it (description or the Responsibilities label).
        if (desc.length) head.push({ text: desc[0], margin: [0, 2, 0, 2] });
        else if (resp.length) head.push({ text: "Responsibilities:", margin: [0, 2, 0, 1] });
        C.push(keep({ stack: head, margin: [0, i ? m.clientGap : 0, 0, 1] }));
        desc.slice(1).forEach(function (d) { C.push({ text: d, margin: [0, 1, 0, 2] }); });
        if (resp.length) {
          if (desc.length) C.push(keep({ text: "Responsibilities:", margin: [0, 1, 0, 1] }));
          C.push(bullets(resp));
        }
        if (c.environment) C.push({ text: [{ text: "Environment: ", bold: true }, c.environment], margin: [0, 1, 0, 0] });
      });
    }

    // Education
    const edu = nonEmpty(data.education);
    if (edu.length) {
      C.push.apply(C, heading(HEADINGS.education));
      edu.forEach(function (e) { C.push({ text: e, margin: [0, 0, 0, 2] }); });
    }

    return {
      pageSize: "LETTER",
      pageMargins: [m.margin, m.margin, m.margin, m.margin],
      info: { title: (data.name || "Resume") + " - Resume" },
      defaultStyle: { font: "Carlito", fontSize: m.body, lineHeight: m.line, color: "#1A1A1A" },
      content: C,
      pageBreakBefore: function (node, followingOnPage) {
        // Keep headings and client headers with the content after them.
        if (node.headlineLevel !== 1) return false;
        const g = String(node.id || "").split("_")[0];
        return followingOnPage.filter(function (n) { return String(n.id || "").split("_")[0] !== g; }).length === 0;
      }
    };
  }

  /* ---------------- Word (docx) ---------------- */
  export function docxDoc(data: ResumeData, t: Template): docxLib.Document {
    const D = docxLib;
    const m = metrics(t);
    const tw = function (pt) { return Math.round(pt * 20); };
    const hp = function (pt) { return Math.round(pt * 2); };
    const textW = tw(PAGE_W - 2 * m.margin);
    const color = m.color.replace("#", "");
    const center = t.hdr === "center";
    const P = [];
    const line = Math.round(240 * m.line);

    function para(runs, opts) {
      opts = opts || {};
      return new D.Paragraph(Object.assign({ children: runs, spacing: Object.assign({ after: 0, line: line }, opts.spacing || {}) }, opts.extra || {}));
    }
    function run(text, o) { return new D.TextRun(Object.assign({ text: text, font: "Calibri" }, o || {})); }

    // Header
    if (t.hdr === "inline") {
      const runs = [run(data.name || "", { bold: true, size: hp(m.name), color: color, allCaps: true })];
      if (data.title) runs.push(run("  |  " + data.title, { size: hp(m.title) }));
      P.push(para(runs, { spacing: { after: 40 } }));
    } else {
      const al = center ? D.AlignmentType.CENTER : D.AlignmentType.LEFT;
      P.push(para([run(data.name || "", { bold: true, size: hp(m.name), color: color, allCaps: true })], { extra: { alignment: al } }));
      if (data.title) P.push(para([run(data.title, { size: hp(m.title) })], { extra: { alignment: al }, spacing: { before: 20 } }));
    }
    const contact = nonEmpty(data.contact);
    if (contact.length) P.push(para([run(contact.join("  |  "), { size: hp(m.contact), color: "444444" })], { extra: { alignment: center ? D.AlignmentType.CENTER : D.AlignmentType.LEFT }, spacing: { before: 40 } }));

    function heading(label) {
      const ro = { bold: true, size: hp(m.heading), color: color, allCaps: true };
      const extra = { keepNext: true, keepLines: true };
      const spacing = { before: tw(m.secBefore), after: tw(m.afterHead) };
      if (t.h === "caps") { ro.characterSpacing = 24; extra.alignment = D.AlignmentType.CENTER; extra.border = { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: "555555", space: 1 } }; }
      else if (t.h === "rule") extra.border = { bottom: { style: D.BorderStyle.SINGLE, size: 10, color: "222222", space: 1 } };
      else if (t.h === "thin") extra.border = { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: "999999", space: 1 } };
      if (t.h === "accent") {
        return [
          para([run(label, ro)], { extra: extra, spacing: { before: tw(m.secBefore), after: 0 } }),
          para([run("", { size: 4 })], { spacing: { after: tw(m.afterHead), line: 120, lineRule: D.LineRuleType ? D.LineRuleType.EXACT : undefined }, extra: { keepNext: true, indent: { right: textW - tw(36) }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 16, color: color, space: 1 } } } })
        ];
      }
      return [para([run(label, ro)], { extra: extra, spacing: spacing })];
    }
    function bullet(text, after) {
      return para([run(text)], { extra: { numbering: { reference: "bul", level: 0 } }, spacing: { after: after == null ? 20 : after } });
    }
    function bulletRuns(runs) {
      return para(runs, { extra: { numbering: { reference: "bul", level: 0 } }, spacing: { after: 20 } });
    }
    const rightTab = [{ type: D.TabStopType.RIGHT, position: textW }];

    const summary = nonEmpty(data.summary);
    if (summary.length) { P.push.apply(P, heading(HEADINGS.summary)); summary.forEach(function (s) { P.push(bullet(s)); }); }

    const skills = (data.skills || []).filter(function (s) { return (s.items || "").trim() || (s.cat || "").trim(); });
    if (skills.length) {
      P.push.apply(P, heading(HEADINGS.skills));
      skills.forEach(function (s) {
        const runs = s.cat ? [run(s.cat + ": ", { bold: true }), run(s.items)] : [run(s.items)];
        P.push(t.sk === "bullets" ? bulletRuns(runs) : para(runs, { spacing: { after: 20 } }));
      });
    }

    const clients = data.clients || [];
    if (clients.length) {
      P.push.apply(P, heading(HEADINGS.clients));
      clients.forEach(function (c, i) {
        const before = i ? tw(m.clientGap) : 0;
        const keep = { keepNext: true, keepLines: true };
        const first = function (runs, extra) { const o = { extra: Object.assign({}, keep, extra || {}), spacing: { before: before } }; return para(runs, o); };
        if (t.cl === "right") {
          P.push(first([run("Client: " + joinLoc(c), { bold: true }), run("\t" + (c.dates || ""), { bold: true })], { tabStops: rightTab }));
          if (c.role) P.push(para([run("Role: " + c.role, { italics: true })], { extra: keep }));
        } else if (t.cl === "below") {
          P.push(first([run("Client: " + joinLoc(c), { bold: true })]));
          if (c.role) P.push(para([run(c.role, { italics: true })], { extra: keep }));
          if (c.dates) P.push(para([run(c.dates, { color: "555555" })], { extra: keep }));
        } else if (t.cl === "caps") {
          P.push(first([run(joinLoc({ client: (c.client || "").toUpperCase(), location: c.location }), { bold: true }), run("\t" + (c.dates || ""), { bold: true })], { tabStops: rightTab }));
          if (c.role) P.push(para([run(c.role, { italics: true })], { extra: keep }));
        } else if (t.cl === "oneline") {
          P.push(first([run([joinLoc(c), c.role, c.dates].filter(Boolean).join("  |  "), { bold: true })]));
        } else if (t.cl === "rolefirst") {
          P.push(first([run(c.role || "", { bold: true }), run("\t" + (c.dates || ""), { bold: true })], { tabStops: rightTab }));
          P.push(para([run("Client: " + joinLoc(c), { italics: true })], { extra: keep }));
        }
        nonEmpty(c.description).forEach(function (d) { P.push(para([run(d)], { spacing: { before: 20, after: 40 } })); });
        const resp = nonEmpty(c.responsibilities);
        if (resp.length) {
          P.push(para([run("Responsibilities:")], { extra: { keepNext: true }, spacing: { before: 20, after: 20 } }));
          resp.forEach(function (r) { P.push(bullet(r)); });
        }
        if (c.environment) P.push(para([run("Environment: ", { bold: true }), run(c.environment)], { spacing: { before: 20 } }));
      });
    }

    const edu = nonEmpty(data.education);
    if (edu.length) {
      P.push.apply(P, heading(HEADINGS.education));
      edu.forEach(function (e) { P.push(para([run(e)], { spacing: { after: 40 } })); });
    }

    return new D.Document({
      creator: data.name || "",
      title: (data.name || "Resume") + " - Resume",
      styles: { default: { document: { run: { font: "Calibri", size: hp(m.body), color: "1A1A1A" } } } },
      numbering: {
        config: [{
          reference: "bul",
          levels: [{ level: 0, format: D.LevelFormat.BULLET, text: "•", alignment: D.AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 240 } }, run: { font: "Calibri" } } }]
        }]
      },
      sections: [{
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: tw(m.margin), bottom: tw(m.margin), left: tw(m.margin), right: tw(m.margin) } } },
        children: P
      }]
    });
  }

  /* ---------------- Sample data for thumbnails ---------------- */
  export const SAMPLE: ResumeData = {
    name: "Alex Morgan",
    title: "Senior Full Stack Developer",
    contact: ["Dallas, TX", "(555) 010-2233", "alex.morgan@email.com", "linkedin.com/in/alexmorgan"],
    summary: [
      "10+ years of experience designing and building full stack web applications using React, Angular, Node.js, Java and Spring Boot.",
      "Strong experience in microservices architecture, RESTful APIs and event-driven systems using Kafka.",
      "Hands-on with AWS and Azure; CI/CD using Jenkins, GitHub Actions, Docker and Kubernetes.",
      "Experienced in Agile/Scrum delivery, code reviews and mentoring developers."
    ],
    skills: [
      { cat: "Frontend", items: "React, Angular, TypeScript, Redux, HTML5, CSS3" },
      { cat: "Backend", items: "Node.js, Java, Spring Boot, Express, GraphQL" },
      { cat: "Cloud & DevOps", items: "AWS, Azure, Docker, Kubernetes, Jenkins" },
      { cat: "Databases", items: "PostgreSQL, MongoDB, Oracle, Redis" }
    ],
    clients: [
      { client: "Northwind Financial", location: "Dallas, TX", role: "Senior Full Stack Developer", dates: "Jan 2022 – Present",
        responsibilities: ["Developed React and TypeScript front-end modules with reusable component libraries.", "Built Spring Boot microservices and REST APIs deployed on AWS EKS.", "Implemented Kafka event streaming for real-time loan status updates."],
        environment: "React, TypeScript, Java 17, Spring Boot, Kafka, AWS, PostgreSQL" },
      { client: "Contoso Health", location: "Chicago, IL", role: "Full Stack Developer", dates: "Mar 2019 – Dec 2021",
        responsibilities: ["Built Angular dashboards and Node.js APIs for patient scheduling.", "Automated deployments using Jenkins and Docker."],
        environment: "Angular, Node.js, Express, MongoDB, Azure, Jenkins" }
    ],
    education: ["Master of Science in Computer Science, University of Texas at Dallas, 2014"]
  };

  