# Vice Coast — GTA-style Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/liaw0/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/liaw0/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

[Enter the bounty on make.fun](https://make.fun/c/gta6-cover-art-01) · [make.fun](https://make.fun/?ref=ajkq5baq)

## What it is

A free offline web app that turns any photo and a caption into a multi-panel
poster cover in the style of GTA 6's posters, exported as a PNG to share. Photos
never leave the machine: everything runs in the browser from static files.

**What it does**

- **Any photo** — upload your own photos (or try the two built-in samples), then
  click a panel to pick its photo, drag to move it, scroll to zoom, or use the
  per-panel zoom slider. One photo can fill every panel, or each panel can hold
  a different one.
- **Five layouts** — Hero + three, a four-panel grid, Hero + strip, a nine-panel
  poster wall, and a full-bleed single photo.
- **Five colour grades** — Sunset, Neon Night, Vice Gold, Teal Noir and Miami
  Pink, each washing the cover in its own sky gradient with a sun glow.
- **Lettering** — a bold gradient title with a neon underline, an italic
  subtitle, an invented "VICE COAST" badge and a five-star heat meter, plus
  halftone dots, film grain and a vignette for the printed-poster feel.
- **Fast and easy** — a photo to a PNG in a few taps, in the three common post
  sizes: 1080 × 1080, 1080 × 1350 and 1920 × 1080, one at a time or all three
  at once.

Everything in the app is its own: no Rockstar Games logo, artwork or font —
the lettering is drawn with canvas system fonts and the titles are invented.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request: `app/` is plain static files.

## Check it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json`.
`main.ts` first runs a pre-flight check — `app/index.html` must exist, at most
4 screenshots of at most 256 KiB each, and the dossier text under its 160 KiB
cap — and refuses loudly before writing anything if the entry cannot pass.

## Hand in

`main.ts` (Node 22, standard library only) is the hand-in program: it copies
`app/` and `screenshots/` into `/output` (or `MAKEFUN_OUTPUT_DIR`) and writes
`/output/dossier.json` with the vendored make.fun library.

---

Entered on [make.fun](https://make.fun/bounty/gta6-cover-art-01) — referral code
`sa8zecbn`.
