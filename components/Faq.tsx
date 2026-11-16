"use client";
import { useState } from "react";

const QA = [
  ["Will my resume text change?", "No. Every word is copied exactly from your file. Only the layout changes. After converting, an accuracy check shows that every line made it into the new version, and highlights anything you edit yourself."],
  ["Do you use AI?", "No. The resume is read with fixed rules: section headings, date patterns, client and role lines, bullets and labels such as Responsibilities and Environment. The same file always gives the same result."],
  ["Do I need an account?", "No. There's no sign-up and no login. Open the site and start."],
  ["Is my resume stored anywhere?", "No. Your file is processed in memory to create the new version and is never saved on the server."],
  ["Which files can I upload?", "PDF and Word (.docx) files up to 4 MB, or you can paste the text. Scanned image PDFs have no text to read, so use the Word version for those."],
  ["What if something lands in the wrong section?", "Use Edit on the results page. You can fix any field, reorder items and move a line to another section before you download."],
  ["Are the templates ATS-friendly?", "Yes. They use standard section names, a single column and Calibri. Ten of them avoid tables and boxes entirely; sample 11 keeps its skills table, as in the resume it was copied from."],
  ["Which sections are included?", "Header, Summary, Skills, Clients (your work experience) and Education. Other sections, such as certifications, are listed after converting, and you can add any line back."]
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq">
      {QA.map(([q, a], i) => (
        <div key={i} className={"qa" + (open === i ? " open" : "")}>
          <button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? null : i)}>
            {q}<span className="chev" aria-hidden="true">⌄</span>
          </button>
          <div className="ans" id={`faq-${i}`} role="region"><div><p>{a}</p></div></div>
        </div>
      ))}
    </div>
  );
}
