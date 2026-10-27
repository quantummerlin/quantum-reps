const SVG_NS = 'http://www.w3.org/2000/svg';
const DOT = 6;

export function scalePoints(values, width, height, pad = 8) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const stepX = values.length > 1 ? (width - 2 * pad) / (values.length - 1) : 0;
  return values.map((value, index) => ({
    x: values.length > 1 ? pad + index * stepX : width / 2,
    y: max === min ? height / 2 : height - pad - ((value - min) / (max - min)) * (height - 2 * pad),
  }));
}

function node(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  return el;
}

export function lineChart(values, { width = 320, height = 120, dots = true, label = 'Chart' } = {}) {
  const svg = node('svg', {
    viewBox: `0 0 ${width} ${height}`, class: 'chart', role: 'img', 'aria-label': label, 'shape-rendering': 'crispEdges',
  });
  for (const y of [8, height / 2, height - 8]) {
    svg.append(node('line', { x1: 0, x2: width, y1: y, y2: y, stroke: '#5A5A8A', 'stroke-opacity': 0.3, 'stroke-width': 1 }));
  }
  const points = scalePoints(values, width, height);
  if (points.length > 1) {
    svg.append(node('polyline', {
      points: points.map((p) => `${p.x},${p.y}`).join(' '),
      fill: 'none', stroke: '#39FF14', 'stroke-width': 2, 'stroke-linejoin': 'miter',
    }));
  }
  const best = Math.max(...values);
  points.forEach((p, index) => {
    const isLast = index === points.length - 1;
    if (!dots && !isLast) return;
    svg.append(node('rect', {
      x: p.x - DOT / 2, y: p.y - DOT / 2, width: DOT, height: DOT,
      fill: values[index] === best ? '#FFD400' : '#39FF14',
    }));
  });
  return svg;
}
