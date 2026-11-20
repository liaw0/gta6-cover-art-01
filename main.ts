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

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly, before anything is written, when the entry cannot pass the
// gate: the scorer refuses an entry over any of its caps, so refusing here
// first keeps a bad hand-in from ever reaching it.
function fail(message: string): never {
  throw new Error(`vice-coast pre-flight: ${message}`);
}

function preflight(): void {
  const indexHtml = join(repoRoot, 'app', 'index.html');
  if (!existsSync(indexHtml)) fail(`app/index.html is missing (${indexHtml})`);

  const shotsDir = join(repoRoot, 'screenshots');
  if (existsSync(shotsDir)) {
    const shots = readdirSync(shotsDir).filter((name) =>
      statSync(join(shotsDir, name)).isFile(),
    );
    if (shots.length > 4) {
      fail(`too many screenshots: ${shots.length} (at most 4)`);
    }
    for (const name of shots) {
      const bytes = statSync(join(shotsDir, name)).size;
      if (bytes > 262144) {
        fail(`screenshot ${name} is ${bytes} bytes (at most 262144)`);
      }
    }
  }
}

preflight();

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Build the dossier first and measure it before writing: the gate caps the
// dossier's text field (the "## App" block) at 160 KiB and the dossier as a
// whole at 4 MiB, so refuse it here instead of writing one the scorer
// would reject. buildDossier truncates the text to its cap itself; this
// check is the belt to its braces.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
const dossierBytes = dossier.length;
const dossierTextBytes = Buffer.byteLength(
  (JSON.parse(Buffer.from(dossier).toString('utf8')) as { text: string }).text,
  'utf8',
);
if (dossierTextBytes > 163840) {
  fail(`dossier text is ${dossierTextBytes} bytes (at most 163840)`);
}
if (dossierBytes > 4 * 1024 * 1024) {
  fail(`dossier is ${dossierBytes} bytes (at most ${4 * 1024 * 1024})`);
}
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// Build summary, printed after the dossier is written: what went into /output.
function countFiles(dir: string): number {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    total += statSync(path).isDirectory() ? countFiles(path) : 1;
  }
  return total;
}

const shotCount = existsSync(join(repoRoot, 'screenshots'))
  ? readdirSync(join(repoRoot, 'screenshots')).filter((name) =>
      statSync(join(repoRoot, 'screenshots', name)).isFile(),
    ).length
  : 0;
console.log(
  `vice-coast: wrote ${join(outputDir, 'dossier.json')} (${dossierBytes} bytes), ` +
    `${countFiles(join(outputDir, 'app'))} app files, ${shotCount} screenshots`,
);
