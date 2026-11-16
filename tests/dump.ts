import { readFileSync } from "fs";
import { extractAny } from "../lib/extract";
(async () => {
  const f = process.argv[2];
  const { lines } = await extractAny(f, readFileSync(f));
  lines.forEach((l, i) => console.log(`L${i + 1}${l.bullet ? " •" : ""}${l.bold ? " B" : ""}${l.heading ? " H" : ""}${l.cell ? ` [t${l.cell.table}r${l.cell.row}c${l.cell.col}]` : ""}${l.x != null ? ` x${l.x} s${l.size}` : ""}: ${l.text}${l.segments ? "   SEGS=" + JSON.stringify(l.segments) : ""}`));
})();
