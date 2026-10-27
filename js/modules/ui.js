const SVG_NS = 'http://www.w3.org/2000/svg';

const COLORS = {
  g: '#39FF14', c: '#00E5FF', y: '#FFD400', r: '#FF3B30', w: '#F4F4F4', p: '#5A5A8A', m: '#FF2E93',
};

// Stand-ins until assets/icon-<name>.png exist.
const BITMAPS = {
  trophy: ['yyyyyyyy', 'y.yyyy.y', 'y.yyyy.y', '.yyyyyy.', '..yyyy..', '...yy...', '...yy...', '..yyyy..'],
  up: ['...gg...', '..gggg..', '.gggggg.', 'gggggggg', '...gg...', '...gg...', '...gg...', '...gg...'],
  same: ['........', 'cccccccc', 'cccccccc', '........', '........', 'cccccccc', 'cccccccc', '........'],
  warn: ['...rr...', '...rr...', '..rrrr..', '..rwwr..', '.rrwwrr.', '.rrrrrr.', 'rrrwwrrr', 'rrrrrrrr'],
  baseline: ['pp......', 'pppp....', 'pppppp..', 'pppp....', 'pp......', 'p.......', 'p.......', 'p.......'],
  add: ['...gg...', '...gg...', '...gg...', 'gggggggg', 'gggggggg', '...gg...', '...gg...', '...gg...'],
  delete: ['..rrrr..', 'rrrrrrrr', '.rrrrrr.', '.r.rr.r.', '.r.rr.r.', '.r.rr.r.', '.rrrrrr.', '........'],
  dumbbell: ['........', 'g......g', 'gg....gg', 'gggggggg', 'gggggggg', 'gg....gg', 'g......g', '........'],
  program: ['..cccc..', '.cccccc.', 'c......c', 'c.cccc.c', 'c......c', 'c.cccc.c', 'c......c', 'cccccccc'],
  settings: ['...ww...', '.w.ww.w.', '..wwww..', 'ww....ww', 'ww....ww', '..wwww..', '.w.ww.w.', '...ww...'],
  calc: ['cccccccc', 'cwwwwwwc', 'cccccccc', 'cgcgcgcc', 'cccccccc', 'cgcgcgcc', 'cccccccc', 'cgcgcgcc'],
};

function placeholder(name, px) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 8 8');
  svg.setAttribute('width', px);
  svg.setAttribute('height', px);
  svg.setAttribute('class', 'icon');
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-hidden', 'true');
  (BITMAPS[name] ?? []).forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === '.') return;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', 1);
      rect.setAttribute('height', 1);
      rect.setAttribute('fill', COLORS[cell]);
      svg.append(rect);
    });
  });
  return svg;
}

export function icon(name, px = 24) {
  const img = new Image(px, px);
  img.className = 'icon';
  img.alt = '';
  img.addEventListener('error', () => img.replaceWith(placeholder(name, px)), { once: true });
  img.src = `assets/icon-${name}.png`;
  return img;
}

// Text children go through append(), so user input is never parsed as HTML.
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === false || value == null) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, value);
  }
  el.append(...children.flat().filter((child) => child != null && child !== false));
  return el;
}
