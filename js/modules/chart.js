const SVG_NS = 'http://www.w3.org/2000/svg';
const LINE = '#4F8CFF';
const BEST = '#F5B84B';

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
  const svg = node('svg', { viewBox: `0 0 ${width} ${height}`, class: 'chart', role: 'img', 'aria-label': label });
  for (const y of [8, height / 2, height - 8]) {
    svg.append(node('line', { x1: 0, x2: width, y1: y, y2: y, stroke: '#FFFFFF', 'stroke-opacity': 0.06, 'stroke-width': 1 }));
  }
  const points = scalePoints(values, width, height);
  if (points.length > 1) {
    svg.append(node('polyline', {
      points: points.map((p) => `${p.x},${p.y}`).join(' '),
      fill: 'none', stroke: LINE, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
    }));
  }
  const best = Math.max(...values);
  points.forEach((p, index) => {
    const isLast = index === points.length - 1;
    if (!dots && !isLast) return;
    svg.append(node('circle', { cx: p.x, cy: p.y, r: 3, fill: values[index] === best ? BEST : LINE }));
  });
  return svg;
}
