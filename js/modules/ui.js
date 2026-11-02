const SVG_NS = 'http://www.w3.org/2000/svg';

// Simple outline icons on a 24px grid; colour comes from the surrounding text colour.
const ICONS = {
  dumbbell: ['M6.5 6.5v11', 'M17.5 6.5v11', 'M3.5 9v6', 'M20.5 9v6', 'M6.5 12h11'],
  program: [
    'M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z',
    'M8 6H6.5A1.5 1.5 0 0 0 5 7.5v12A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 17.5 6H16',
    'M9 12h6',
    'M9 16h4',
  ],
  calc: [
    'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
    'M8 7h8',
    'M8.5 12h.01', 'M12 12h.01', 'M15.5 12h.01',
    'M8.5 16h.01', 'M12 16h.01', 'M15.5 16h.01',
  ],
  settings: [
    'M4 7h9', 'M17 7h3', 'M4 17h3', 'M11 17h9',
    'M13 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
    'M7 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  ],
  trophy: [
    'M8 4h8v5a4 4 0 0 1-8 0z',
    'M8 6H5v1a3 3 0 0 0 3 3',
    'M16 6h3v1a3 3 0 0 1-3 3',
    'M12 13v4', 'M9 20h6', 'M10 17h4',
  ],
  up: ['M12 19V5', 'M6 11l6-6 6 6'],
  same: ['M6 12h12'],
  warn: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17h.01'],
  baseline: ['M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0'],
  delete: ['M5 7h14', 'M10 7V5h4v2', 'M7 7l1 12h8l1-12', 'M10 11v5', 'M14 11v5'],
};

export function icon(name, px = 24) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const attrs = {
    viewBox: '0 0 24 24',
    width: px,
    height: px,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 1.75,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: 'icon',
    'aria-hidden': 'true',
  };
  for (const [key, value] of Object.entries(attrs)) svg.setAttribute(key, value);
  for (const d of ICONS[name] ?? []) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
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
