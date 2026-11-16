import { describe, it, expect } from "vitest";
import { checkResume, mentions, parseRange } from "../lib/flags";
import type { ResumeData } from "../lib/types";

const base = (): ResumeData => ({
  name: "Test Person", title: "Senior Full Stack Developer", contact: ["test@example.com", "(555) 010-0000", "linkedin.com/in/test"],
  summary: ["10+ years of experience building web applications."],
  skills: [{ cat: "Languages", items: "Java, TypeScript" }],
  clients: [
    { client: "Acme Bank", location: "Dallas, TX", role: "Developer", dates: "Jan 2021 – Present", description: [], responsibilities: ["Built Spring Boot 3 services."], environment: "Java 17, Angular 15" },
    { client: "Old Corp", location: "Austin, TX", role: "Developer", dates: "Oct 2018 – Dec 2020", description: [], responsibilities: ["Upgraded services to Java 21 and Angular 17."], environment: "Java 8, Kubernetes" },
    { client: "First Co", location: "Chennai, India", role: "Developer", dates: "Jun 2013 - Aug 2018", description: [], responsibilities: ["Wrote Java 7 code."], environment: "Java 7" }
  ],
  education: []
});

describe("dates", () => {
  it("reads common formats", () => {
    expect(parseRange("May 2024 – Till Date", 100000)).toEqual([2024 * 12 + 4, 100000]);
    expect(parseRange("03/2019 - 02/2021")).toEqual([2019 * 12 + 2, 2021 * 12 + 1]);
    expect(parseRange("2016 - 2018")).toEqual([2016 * 12, 2018 * 12 + 11]);
    expect(parseRange("Sept 2015 to Present", 5)).toEqual([2015 * 12 + 8, 5]);
    expect(parseRange("whenever")).toBeNull();
  });
});

describe("technology mentions", () => {
  it("expands version lists and ignores 'years'", () => {
    const labels = mentions("Java 8/11/17, Angular (8/13), Java 1.8, 10 years of Java, Java 11 years").map((m) => m.label);
    expect(labels).toEqual(expect.arrayContaining(["Java 8", "Java 11", "Java 17", "Angular 8", "Angular 13", "Java"]));
    expect(mentions("JavaScript and lambda expressions").map((m) => m.label)).toEqual([]);
  });
});

describe("resume flags", () => {
  it("flags technology released after a client ended", () => {
    const r = checkResume(base(), 2026 * 12 + 10);
    const errs = r.tech.filter((f) => f.severity === "error").map((f) => f.title);
    expect(errs.some((t) => t.startsWith("Java 21 at Old Corp"))).toBe(true);
    expect(errs.some((t) => t.startsWith("Angular 17 at Old Corp"))).toBe(true);
    expect(errs.some((t) => t.includes("Acme Bank"))).toBe(false);
    expect(errs.some((t) => t.includes("First Co"))).toBe(false);
  });
  it("flags overlaps, gaps, order and experience claims", () => {
    const d = base();
    d.clients[1].dates = "Oct 2018 – Mar 2021";      // overlaps Acme Bank
    d.clients[2].dates = "Jun 2013 - Dec 2017";      // 9-month gap before Old Corp
    const t = checkResume(d, 2026 * 12 + 10).timeline.map((f) => f.title);
    expect(t.some((x) => x.includes("overlap"))).toBe(true);
    expect(t.some((x) => x.includes("gap between First Co and Old Corp"))).toBe(true);
    d.clients.reverse();
    expect(checkResume(d).timeline.some((f) => f.title.includes("reverse date order"))).toBe(true);
    const e = base(); e.summary = ["20+ years of experience."];
    expect(checkResume(e).timeline.some((f) => f.title.startsWith("Summary says 20+ years"))).toBe(true);
  });
  it("checks contact details and keywords", () => {
    const d = base(); d.contact = [];
    const a = checkResume(d).ats;
    expect(a.flags.some((f) => f.title.includes("No email"))).toBe(true);
    expect(a.notInSkills).toEqual(expect.arrayContaining(["Spring Boot", "Angular", "Kubernetes"]));
  });
});
