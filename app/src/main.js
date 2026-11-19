// Wires the cover studio: photo uploads, per-panel crop and position, layout and
// grade choices, the caption, and PNG export in the three post sizes. A `?shot=`
// query instead sets up a fixed scene for a screenshot (see shots.js).
import { drawCoverArt, layoutPanelRects } from './cover.js';
import { GRADES, LAYOUTS, SAMPLES, SIZES } from './presets.js';
import { runShotScene } from './shots.js';

const canvas = document.getElementById('preview');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');

const state = {
  layout: 'hero',
  grade: 'sunset',
  size: 'wide',
  title: 'VICE COAST',
  subtitle: 'Neon nights, big dreams',
  stars: 4,
  photos: [],
  photoNames: [],
  panels: [],
  selectedPanel: 0,
};

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function ensurePanels() {
  while (state.panels.length < panelCount()) {
    state.panels.push({ photo: state.panels.length, zoom: 1, offsetX: 0, offsetY: 0 });
  }
  state.panels.length = panelCount();
  if (state.selectedPanel >= panelCount()) state.selectedPanel = 0;
}

function sizePreviewCanvas() {
  const size = SIZES[state.size];
  const maxSide = 880;
  const scale = Math.min(maxSide / size.width, maxSide / size.height, 1);
  canvas.width = Math.round(size.width * scale);
  canvas.height = Math.round(size.height * scale);
}

export function redrawCover() {
  ensurePanels();
  sizePreviewCanvas();
  drawCoverArt(canvas, state);
  renderPanelList();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhotoFromUrl(url, name) {
  const img = await loadImage(url);
  state.photos.push(img);
  state.photoNames.push(name);
  return state.photos.length - 1;
}

async function addPhotoFile(file) {
  const index = await addPhotoFromUrl(URL.createObjectURL(file), file.name);
  return index;
}

function buildChoiceButtons(container, entries, current, onPick) {
  container.innerHTML = '';
  for (const [key, value] of Object.entries(entries)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice' + (key === current ? ' active' : '');
    button.textContent = value.label;
    button.addEventListener('click', () => onPick(key));
    container.appendChild(button);
  }
}

function renderLayoutChoices() {
  buildChoiceButtons(document.getElementById('layouts'), LAYOUTS, state.layout, (key) => {
    state.layout = key;
    renderLayoutChoices();
    redrawCover();
  });
}

function renderGradeChoices() {
  const container = document.getElementById('grades');
  container.innerHTML = '';
  for (const [key, grade] of Object.entries(GRADES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch' + (key === state.grade ? ' active' : '');
    button.textContent = grade.label;
    button.style.background = `linear-gradient(135deg, ${grade.sky[0]}, ${grade.sky[1]} 55%, ${grade.sky[2]})`;
    button.addEventListener('click', () => {
      state.grade = key;
      renderGradeChoices();
      redrawCover();
    });
    container.appendChild(button);
  }
}

function renderSizeChoices() {
  buildChoiceButtons(document.getElementById('sizes'), SIZES, state.size, (key) => {
    state.size = key;
    renderSizeChoices();
    redrawCover();
  });
}

function renderPanelList() {
  const list = document.getElementById('panels');
  list.innerHTML = '';
  ensurePanels();
  state.panels.forEach((panel, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === state.selectedPanel ? ' selected' : '');
    const name = document.createElement('span');
    name.textContent = `Panel ${i + 1} · ${state.photoNames[panel.photo] ?? 'no photo'}`;
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '2.5';
    zoom.step = '0.05';
    zoom.value = String(panel.zoom);
    zoom.setAttribute('aria-label', `Zoom panel ${i + 1}`);
    zoom.addEventListener('input', () => {
      panel.zoom = Number(zoom.value);
      redrawCover();
    });
    row.appendChild(name);
    row.appendChild(zoom);
    row.addEventListener('click', () => {
      state.selectedPanel = i;
      redrawCover();
    });
    list.appendChild(row);
  });
  const selected = state.panels[state.selectedPanel];
  const picker = document.getElementById('panel-photo');
  picker.innerHTML = '';
  state.photoNames.forEach((name, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `${i + 1}. ${name}`;
    picker.appendChild(option);
  });
  if (state.photos.length) picker.value = String(selected.photo);
  document.getElementById('selected-panel-label').textContent = `Panel ${state.selectedPanel + 1}`;
}

function pickPanelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  const rects = layoutPanelRects(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);
  return hit === -1 ? null : { index: hit, x, y };
}

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const hit = pickPanelAt(event.clientX, event.clientY);
  if (!hit) return;
  state.selectedPanel = hit.index;
  drag = { x: hit.x, y: hit.y, panel: state.panels[hit.index] };
  canvas.setPointerCapture(event.pointerId);
  redrawCover();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const hit = pickPanelAt(event.clientX, event.clientY);
  if (!hit) return;
  const panelRect = layoutPanelRects(state.layout, canvas.width, canvas.height)[state.selectedPanel];
  drag.panel.offsetX = Math.max(-0.5, Math.min(0.5, drag.panel.offsetX + (hit.x - drag.x) / panelRect.width));
  drag.panel.offsetY = Math.max(-0.5, Math.min(0.5, drag.panel.offsetY + (hit.y - drag.y) / panelRect.height));
  drag.x = hit.x;
  drag.y = hit.y;
  redrawCover();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const panel = state.panels[state.selectedPanel];
  panel.zoom = Math.max(1, Math.min(2.5, panel.zoom + (event.deltaY < 0 ? 0.1 : -0.1)));
  redrawCover();
}, { passive: false });

document.getElementById('upload').addEventListener('change', async (event) => {
  const files = [...event.target.files];
  for (const file of files) await addPhotoFile(file);
  status.textContent = `${files.length} photo${files.length === 1 ? '' : 's'} added — click a panel, then pick its photo below.`;
  redrawCover();
});

document.getElementById('samples').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-sample]');
  if (!button) return;
  const sample = SAMPLES[button.dataset.sample];
  const index = await addPhotoFromUrl(sample.src, sample.label);
  state.panels.forEach((panel, i) => { if (!state.photos[panel.photo]) panel.photo = index; });
  status.textContent = `Sample photo "${sample.label}" loaded.`;
  redrawCover();
});

document.getElementById('panel-photo').addEventListener('change', (event) => {
  state.panels[state.selectedPanel].photo = Number(event.target.value);
  redrawCover();
});

document.getElementById('fill-all').addEventListener('click', () => {
  const photo = state.panels[state.selectedPanel].photo;
  state.panels.forEach((panel) => { panel.photo = photo; });
  status.textContent = 'Every panel now uses the selected photo.';
  redrawCover();
});

document.getElementById('center-photo').addEventListener('click', () => {
  const panel = state.panels[state.selectedPanel];
  panel.zoom = 1;
  panel.offsetX = 0;
  panel.offsetY = 0;
  redrawCover();
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redrawCover(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redrawCover(); });
document.getElementById('stars').addEventListener('change', (event) => {
  state.stars = Number(event.target.value);
  redrawCover();
});

function exportCover(sizeKey) {
  const size = SIZES[sizeKey];
  const offscreen = document.createElement('canvas');
  offscreen.width = size.width;
  offscreen.height = size.height;
  drawCoverArt(offscreen, state);
  offscreen.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${size.width}x${size.height}.png`;
    a.click();
    status.textContent = `Saved vice-coast-cover-${size.width}x${size.height}.png`;
  }, 'image/png');
}

document.getElementById('export').addEventListener('click', () => exportCover(state.size));
document.getElementById('export-all').addEventListener('click', () => {
  for (const key of Object.keys(SIZES)) exportCover(key);
  status.textContent = 'Exporting all three sizes…';
});

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  runShotScene(query, state, { addPhotoFromUrl, redrawCover, renderLayoutChoices, renderGradeChoices, renderSizeChoices });
} else {
  renderLayoutChoices();
  renderGradeChoices();
  renderSizeChoices();
  redrawCover();
}
