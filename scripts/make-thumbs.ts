// Regenerates public/thumbs/*.png from the sample resume. Needs `pdftoppm` (poppler-utils).
// Run: npx tsx scripts/make-thumbs.ts
import { writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { renderPdf } from "../lib/render";
import { TEMPLATES, SAMPLE } from "../lib/templates";
(async () => {
  mkdirSync("public/thumbs", { recursive: true });
  for (const t of TEMPLATES) {
    const pdf = await renderPdf(SAMPLE, t.id);
    writeFileSync(`/tmp/thumb-${t.id}.pdf`, pdf);
    execSync(`pdftoppm -png -r 110 -f 1 -l 1 -x 0 -y 0 -W 935 -H 800 -singlefile /tmp/thumb-${t.id}.pdf public/thumbs/${t.id}`);
  }
  console.log("thumbnails written");
})();
