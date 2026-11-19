// Vice Coast, a gta6-cover-art-01 entry (Node 22, standard library only).
//
// The entry is the studio under app/: plain static files a desktop browser loads
// offline — app/index.html plus its ES modules, no library and no network request.
// This program hands it in: it copies app/ and screenshots/ from beside this file
// into /output (or MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the vendored make.fun library, which is the summary
// the judge reads.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Check it with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The gate's own caps, from the kit's reference/gate.json: the dossier text is
// capped at 160 KiB, at most 4 screenshots of 256 KiB each, app/ at most 993 files
// and 48 MiB in all, every app/ path at most 1000 bytes. An entry over any of
// those is refused by the scorer, so the program refuses it here first.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
