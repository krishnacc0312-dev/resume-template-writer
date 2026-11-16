import { readFileSync } from "fs";
import { extractAny } from "../lib/extract";
import { parseResume } from "../lib/parser";
import { verify } from "../lib/verify";
(async () => {
  const f = process.argv[2];
  const { lines, source } = await extractAny(f, readFileSync(f));
  const r = parseResume(lines, source);
  if (process.argv[3] === "roles") r.lines.forEach((l, i) => console.log(`L${i + 1} [${r.roles[i]}] ${l}`));
  console.log(JSON.stringify(r.data, null, 1));
  console.log("OTHER", JSON.stringify(r.other)); console.log("UNPLACED", r.unplaced);
  const v = verify(r.data, r.lines, r.roles);
  console.log("VERIFY", v.ok, v.placed + "/" + v.total, "missing:", v.missing, "changed:", v.changed);
})();
