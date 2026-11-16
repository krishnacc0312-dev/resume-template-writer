import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { extractAny } from "../lib/extract";
import { parseResume } from "../lib/parser";
import { verify } from "../lib/verify";

const fx = (f: string) => path.join(__dirname, "fixtures", f);
async function parse(f: string) {
  const { lines, source } = await extractAny(f, readFileSync(fx(f)));
  return parseResume(lines, source);
}

const cases: Record<string, { name: string; clients: [string, string, string, string][]; skills: number; summary: number; education: number }> = {
  priya: { name: "PRIYA RAMAN", skills: 4, summary: 4, education: 1, clients: [
    ["Charles Schwab", "Westlake, TX", "Sr. Full Stack Developer", "Aug 2021 – Present"],
    ["Humana", "Louisville, KY", "Full Stack Developer", "Jan 2018 – Jul 2021"],
    ["Infosys", "Hyderabad, India", "Java Developer", "Jun 2014 – Dec 2017"]] },
  chen: { name: "Michael Chen", skills: 5, summary: 1, education: 2, clients: [
    ["Capital One", "McLean, VA", "Senior Full Stack Engineer", "Feb 2021 – Present"],
    ["Walgreens", "Deerfield, IL", "Full Stack Developer", "May 2017 – Jan 2021"],
    ["Tata Consultancy Services", "Chennai, India", "Software Engineer", "Jun 2013 – Apr 2017"]] },
  sravan: { name: "SRAVAN KUMAR REDDY", skills: 4, summary: 4, education: 1, clients: [
    ["Bank of America", "Charlotte, NC", "Sr. Full Stack Developer", "Mar 2022 - Present"],
    ["Anthem Inc", "Atlanta, GA", "Full Stack Developer", "Jan 2019 - Feb 2022"],
    ["Wipro Technologies", "Hyderabad, India", "Java Developer", "Jul 2014 - Dec 2018"]] }
};

for (const [base, exp] of Object.entries(cases)) {
  for (const ext of ["docx", "pdf"]) {
    it(`${base}.${ext} parses into the five sections word for word`, async () => {
      const r = await parse(`${base}.${ext}`);
      expect(r.data.name).toBe(exp.name);
      expect(r.data.skills.length).toBe(exp.skills);
      expect(r.data.summary.length).toBe(exp.summary);
      expect(r.data.education.length).toBe(exp.education);
      expect(r.data.clients.map((c) => [c.client, c.location, c.role, c.dates])).toEqual(exp.clients);
      r.data.clients.forEach((c) => { expect(c.responsibilities.length).toBeGreaterThan(0); });
      const v = verify(r.data, r.lines, r.roles);
      expect(v.missing).toEqual([]);
      expect(v.changed).toEqual([]);
    });
  }
}

describe("plain text, role-first entries and numeric dates", () => {
  it("rao.txt", async () => {
    const r = await parse("rao.txt");
    expect(r.data.clients.map((c) => [c.client, c.location, c.role, c.dates])).toEqual([
      ["Walmart Global Tech", "Bentonville, AR", "Lead Software Engineer", "03/2019 - Till Date"],
      ["Verizon", "Basking Ridge, NJ", "Senior Java Developer", "06/2015 - 02/2019"]
    ]);
    expect(r.data.skills[0]).toEqual({ cat: "Programming Languages", items: "Java, JavaScript, TypeScript, Python" });
    expect(verify(r.data, r.lines, r.roles).ok).toBe(true);
  });
});
