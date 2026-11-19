// Fixed scenes for screenshots: ?shot=cover draws one exported cover full frame,
// ?shot=editor shows the studio with photos loaded. The query picks the layout,
// grade, size, caption and which sample photos fill the panels, then
// window.__shotReady is set once the cover is painted.
import { drawCoverArt } from './cover.js';
import { SAMPLES, SIZES } from './presets.js';

const canvas = document.getElementById('preview');

async function loadSamplePhotos(query, addPhotoFromUrl) {
  const wanted = (query.get('photos') || 'boulevard,pier').split(',').filter(Boolean);
  const loaded = [];
  for (const key of wanted) {
    const sample = SAMPLES[key];
    if (!sample) continue;
    loaded.push(await addPhotoFromUrl(sample.src, sample.label));
  }
  return loaded;
}

export async function runShotScene(query, state, api) {
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const loaded = await loadSamplePhotos(query, api.addPhotoFromUrl);
  state.layout = query.get('layout') || 'hero';
  state.grade = query.get('grade') || 'sunset';
  state.size = query.get('size') || 'wide';
  state.title = query.get('title') || 'VICE COAST';
  state.subtitle = query.get('subtitle') || 'Neon nights, big dreams';
  state.stars = Number(query.get('stars') || '4');

  const assign = (query.get('assign') || '').split(',').map(Number).filter((n) => !Number.isNaN(n));
  state.panels = [];
  const count = { hero: 4, grid: 4, stripes: 4, nine: 9, full: 1 }[state.layout] || 4;
  for (let i = 0; i < count; i++) {
    const photo = assign[i] !== undefined ? loaded[assign[i] % loaded.length] : loaded[i % loaded.length];
    state.panels.push({ photo, zoom: 1, offsetX: 0, offsetY: 0 });
  }
  state.selectedPanel = 0;

  api.renderLayoutChoices();
  api.renderGradeChoices();
  api.renderSizeChoices();
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('stars').value = String(state.stars);

  if (shot === 'cover') {
    const size = SIZES[state.size];
    const w = Number(query.get('w') || size.width);
    const h = Number(query.get('h') || size.height);
    canvas.width = w;
    canvas.height = h;
    drawCoverArt(canvas, state);
  } else {
    api.redrawCover();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
