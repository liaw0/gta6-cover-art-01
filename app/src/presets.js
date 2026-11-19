// The choices the cover studio offers: five panel layouts, five Vice City colour
// grades and the three post sizes the bounty asks for. Nothing here names a game,
// a logo or a font from one: every title and grade below is invented here.
export const SIZES = {
  square: { label: 'Square · 1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait · 1080 x 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide · 1920 x 1080', width: 1920, height: 1080 },
};

export const LAYOUTS = {
  hero: { label: 'Hero + three', panels: 4, hint: 'One big moment, three small ones beside it' },
  grid: { label: 'Four panels', panels: 4, hint: 'A clean two-by-two comic grid' },
  stripes: { label: 'Hero + strip', panels: 4, hint: 'A wide hero over a strip of three' },
  nine: { label: 'Nine panels', panels: 9, hint: 'A busy nine-panel poster wall' },
  full: { label: 'Full bleed', panels: 1, hint: 'One photo edge to edge, title over it' },
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    sky: ['#ff9a3d', '#ff5e62', '#7b2f8b'],
    wash: 'rgba(255, 110, 60, 0.20)',
    accent: '#ffd166',
    title: ['#fff3d6', '#ffb347'],
  },
  neon: {
    label: 'Neon Night',
    sky: ['#ff2e88', '#7b2ff7', '#00e5ff'],
    wash: 'rgba(255, 46, 136, 0.18)',
    accent: '#00e5ff',
    title: ['#ffffff', '#ff7ad9'],
  },
  gold: {
    label: 'Vice Gold',
    sky: ['#ffd166', '#f4842b', '#8a4b1f'],
    wash: 'rgba(255, 190, 60, 0.20)',
    accent: '#fff3d6',
    title: ['#fff8e1', '#ffc233'],
  },
  teal: {
    label: 'Teal Noir',
    sky: ['#2de2c5', '#1b7f8e', '#0b2a4a'],
    wash: 'rgba(45, 226, 197, 0.16)',
    accent: '#2de2c5',
    title: ['#eafffb', '#7df0dd'],
  },
  miami: {
    label: 'Miami Pink',
    sky: ['#ff6ec7', '#c724b1', '#3d0a5e'],
    wash: 'rgba(255, 110, 199, 0.20)',
    accent: '#ff9de2',
    title: ['#ffe9f6', '#ff6ec7'],
  },
};

// The two sample photos the kit made for this bounty, free to use in screenshots.
export const SAMPLES = {
  boulevard: { label: 'Boulevard', src: 'samples/boulevard.jpg' },
  pier: { label: 'Pier', src: 'samples/pier.jpg' },
};
