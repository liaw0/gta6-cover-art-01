// The cover engine: draws a multi-panel GTA-style poster cover onto a canvas at
// any size, from the studio's state. Every panel gets its own photo, zoom and
// position; the grade, the title block, the grain and the vignette are drawn on
// top. All lettering is drawn with canvas system fonts, in our own words.
import { GRADES, LAYOUTS } from './presets.js';

/** The rects of each panel for a layout, with a white comic gutter between them. */
export function layoutPanelRects(layout, width, height) {
  const gutter = Math.max(6, Math.round(width * 0.008));
  const m = gutter;
  const innerW = width - m * 2;
  const innerH = height - m * 2;
  const col = (x, y, w, h) => ({ x, y, width: w, height: h });
  if (layout === 'hero') {
    const heroW = Math.round(innerW * 0.62);
    const sideX = m + heroW + gutter;
    const sideW = width - m - sideX;
    const cellH = (innerH - gutter * 2) / 3;
    return [
      col(m, m, heroW, innerH),
      col(sideX, m, sideW, cellH),
      col(sideX, m + cellH + gutter, sideW, cellH),
      col(sideX, m + (cellH + gutter) * 2, sideW, cellH),
    ];
  }
  if (layout === 'grid') {
    const cellW = (innerW - gutter) / 2;
    const cellH = (innerH - gutter) / 2;
    return [
      col(m, m, cellW, cellH),
      col(m + cellW + gutter, m, cellW, cellH),
      col(m, m + cellH + gutter, cellW, cellH),
      col(m + cellW + gutter, m + cellH + gutter, cellW, cellH),
    ];
  }
  if (layout === 'stripes') {
    const heroH = Math.round(innerH * 0.68);
    const stripY = m + heroH + gutter;
    const stripH = height - m - stripY;
    const cellW = (innerW - gutter * 2) / 3;
    return [
      col(m, m, innerW, heroH),
      col(m, stripY, cellW, stripH),
      col(m + cellW + gutter, stripY, cellW, stripH),
      col(m + (cellW + gutter) * 2, stripY, cellW, stripH),
    ];
  }
  if (layout === 'nine') {
    const cellW = (innerW - gutter * 2) / 3;
    const cellH = (innerH - gutter * 2) / 3;
    const rects = [];
    for (let row = 0; row < 3; row++) {
      for (let c = 0; c < 3; c++) {
        rects.push(col(m + c * (cellW + gutter), m + row * (cellH + gutter), cellW, cellH));
      }
    }
    return rects;
  }
  return [col(m, m, innerW, innerH)];
}

/** Draws one photo into a panel rect, cover-fit, with a zoom and a pan offset. */
export function drawPhotoIntoPanel(ctx, photo, rect, zoom, offsetX, offsetY) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  if (!photo) {
    const shade = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height);
    shade.addColorStop(0, '#3a2340');
    shade.addColorStop(1, '#1c1024');
    ctx.fillStyle = shade;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.max(14, rect.width * 0.05)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.width / 2, rect.y + rect.height / 2);
    ctx.restore();
    return;
  }
  const base = Math.max(rect.width / photo.naturalWidth, rect.height / photo.naturalHeight);
  const scale = base * (zoom || 1);
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const dx = rect.x + (rect.width - pw) / 2 + (offsetX || 0) * rect.width;
  const dy = rect.y + (rect.height - ph) / 2 + (offsetY || 0) * rect.height;
  ctx.drawImage(photo, dx, dy, pw, ph);
  ctx.restore();
}

function fitTitleFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", "Archivo Black", system-ui, sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size = Math.floor(size * 0.92);
    ctx.font = `900 ${size}px "Arial Black", "Archivo Black", system-ui, sans-serif`;
  }
  return size;
}

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  noiseTile = document.createElement('canvas');
  noiseTile.width = 128;
  noiseTile.height = 128;
  const nctx = noiseTile.getContext('2d');
  const data = nctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 96);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  return noiseTile;
}

/** Draws the sunset-or-neon title block across the foot of the cover. */
export function drawTitleBlock(ctx, width, height, state) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const bandH = Math.round(height * 0.24);
  const bandY = height - bandH;
  const band = ctx.createLinearGradient(0, bandY - bandH * 0.5, 0, height);
  band.addColorStop(0, 'rgba(16, 6, 28, 0)');
  band.addColorStop(0.45, 'rgba(16, 6, 28, 0.72)');
  band.addColorStop(1, 'rgba(16, 6, 28, 0.94)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY - bandH * 0.5, width, bandH * 1.5);

  // Halftone dots fading up out of the band.
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = grade.accent;
  const step = Math.max(9, Math.round(width / 110));
  for (let y = bandY; y < height; y += step) {
    const fade = 1 - (y - bandY) / bandH;
    for (let x = step / 2; x < width; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.6, step * 0.14 * fade + 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  const title = (state.title || '').trim().toUpperCase();
  const margin = Math.round(width * 0.045);
  if (title) {
    const size = fitTitleFont(ctx, title, width - margin * 2, Math.round(height * 0.105));
    const textY = bandY + bandH * 0.52;
    const fill = ctx.createLinearGradient(0, textY - size, 0, textY + size * 0.2);
    fill.addColorStop(0, grade.title[0]);
    fill.addColorStop(1, grade.title[1]);
    ctx.font = `900 ${size}px "Arial Black", "Archivo Black", system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20, 4, 32, 0.9)';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeText(title, margin, textY);
    ctx.fillStyle = fill;
    ctx.fillText(title, margin, textY);
    // A thin neon underline under the title.
    const underlineW = Math.min(ctx.measureText(title).width, width - margin * 2);
    const under = ctx.createLinearGradient(margin, 0, margin + underlineW, 0);
    under.addColorStop(0, grade.sky[0]);
    under.addColorStop(0.5, grade.sky[1]);
    under.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = under;
    ctx.fillRect(margin, textY + size * 0.16, underlineW, Math.max(3, size * 0.045));
  }

  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    const subSize = Math.max(13, Math.round(height * 0.026));
    ctx.font = `italic 700 ${subSize}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = subSize * 0.4;
    ctx.fillText(subtitle, margin, height - Math.round(height * 0.035));
    ctx.shadowBlur = 0;
  }
}

/** Draws the small invented studio badge and the five-star heat meter. */
export function drawBadgeAndStars(ctx, width, height, state) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const pad = Math.round(width * 0.03);
  const badgeH = Math.max(22, Math.round(height * 0.038));
  ctx.font = `800 ${Math.round(badgeH * 0.52)}px system-ui, sans-serif`;
  const label = 'VICE COAST';
  const badgeW = ctx.measureText(label).width + badgeH * 1.1;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(pad, pad, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = 'rgba(16, 6, 28, 0.82)';
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, badgeH * 0.05);
  ctx.strokeStyle = grade.accent;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, pad + badgeH * 0.55, pad + badgeH / 2 + 1);
  ctx.restore();

  const stars = Math.max(0, Math.min(5, state.stars ?? 4));
  const starSize = Math.max(16, Math.round(height * 0.028));
  const starGap = starSize * 0.25;
  const totalW = stars * 0 + 5 * starSize + 4 * starGap;
  let sx = width - pad - totalW;
  const sy = pad + badgeH / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${starSize}px system-ui, sans-serif`;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < stars ? grade.accent : 'rgba(255,255,255,0.35)';
    ctx.fillText('★', sx + starSize / 2, sy);
    sx += starSize + starGap;
  }
}

/** Draws the whole cover for the studio's state onto the canvas, at its own size. */
export function drawCoverArt(canvas, state) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = LAYOUTS[state.layout] ? state.layout : 'hero';

  // White comic gutters show through between the panels.
  ctx.fillStyle = '#fdf8f2';
  ctx.fillRect(0, 0, width, height);

  const rects = layoutPanelRects(layout, width, height);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    const photo = state.photos[panel.photo ?? i] || null;
    drawPhotoIntoPanel(ctx, photo, rect, panel.zoom ?? 1, panel.offsetX ?? 0, panel.offsetY ?? 0);
    ctx.strokeStyle = 'rgba(20, 4, 32, 0.55)';
    ctx.lineWidth = Math.max(2, width * 0.002);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  });

  // The grade: a sunset or neon sky washed over the whole cover, plus a sun glow.
  const sky = ctx.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  const glow = ctx.createRadialGradient(width * 0.82, height * 0.1, 0, width * 0.82, height * 0.1, width * 0.55);
  glow.addColorStop(0, grade.wash);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  drawTitleBlock(ctx, width, height, state);
  drawBadgeAndStars(ctx, width, height, state);

  // Film grain and a soft vignette, for the printed-poster feel.
  const tile = grainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(10,2,20,0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}
