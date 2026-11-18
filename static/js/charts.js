/* Wales Economy Explained — tiny dependency-free chart kit (line, bar, hbar, stack, tile map). */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const PALETTE = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7', '--c8'];
  const color = (i, c) => (c ? (c.startsWith('--') ? css(c) : c) : css(PALETTE[i % PALETTE.length]));
  const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const LANG = document.documentElement.lang.startsWith('cy') ? 'cy-GB' : 'en-GB';

  function fmt(v, f = {}) {
    if (v == null || Number.isNaN(v)) return '–';
    let n = v, suf = f.suffix || '';
    if (f.compact && Math.abs(v) >= 1000) { n = v / 1000; suf = (f.compactSuffix || 'bn') + suf; }
    const s = n.toLocaleString(LANG, { minimumFractionDigits: f.dec ?? 0, maximumFractionDigits: f.dec ?? 0 });
    return (n < 0 ? '−' : '') + (f.prefix || '') + s.replace('-', '') + suf;
  }
  function niceTicks(min, max, count = 5) {
    if (min === max) { max = min + 1; }
    const span = max - min, step0 = span / count, mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) || 10 * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, t = [];
    for (let v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(10));
    return t;
  }

  function Chart(box, cfg) {
    this.box = box; this.cfg = cfg; this.view = 0; this.hidden = new Set();
    const fig = box.closest('figure');
    this.legend = fig && fig.querySelector('.legend');
    this.seg = fig && fig.querySelector('.seg');
    this.tip = document.createElement('div'); this.tip.className = 'tip'; box.appendChild(this.tip);
    if (this.seg && cfg.views) {
      this.seg.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => {
        this.view = i; this.seg.querySelectorAll('button').forEach((x, j) => x.setAttribute('aria-pressed', j === i)); this.hidden.clear(); this.render();
      }));
    }
    new ResizeObserver(() => this.render()).observe(box);
  }
  Chart.prototype.data = function () { const c = this.cfg; return c.views ? Object.assign({}, c, c.views[this.view]) : c; };
  Chart.prototype.renderLegend = function (d) {
    if (!this.legend) return;
    this.legend.innerHTML = '';
    if (d.series.length < 2 && d.type !== 'stack') return;
    d.series.forEach((s, i) => {
      const b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-pressed', !this.hidden.has(i));
      b.innerHTML = `<i style="background:${color(i, s.color)}"></i>${s.name}`;
      b.onclick = () => { this.hidden.has(i) ? this.hidden.delete(i) : this.hidden.add(i); this.render(); };
      this.legend.appendChild(b);
    });
  };
  Chart.prototype.render = function () {
    const d = this.data(); const W = Math.max(300, this.box.clientWidth); this.renderLegend(d);
    const old = this.box.querySelector('svg'); if (old) old.remove();
    if (d.type === 'hbar') return this.hbar(d, W);
    const H = d.height || Math.round(Math.min(420, Math.max(260, W * 0.5)));
    const m = { t: 14, r: 14, b: 34, l: 56 };
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': d.aria || '' });
    this.box.insertBefore(svg, this.tip);
    const vis = d.series.map((s, i) => ({ ...s, i })).filter((s) => !this.hidden.has(s.i));
    const L = d.labels, n = L.length;
    let lo = 0, hi = 0;
    if (d.type === 'stack') {
      for (let k = 0; k < n; k++) { let p = 0, q = 0; vis.forEach((s) => { const v = s.values[k] || 0; v >= 0 ? (p += v) : (q += v); }); hi = Math.max(hi, p); lo = Math.min(lo, q); }
    } else {
      vis.forEach((s) => s.values.forEach((v) => { if (v != null) { hi = Math.max(hi, v); lo = Math.min(lo, v); } }));
      if (d.type === 'line' && !d.zero) { const all = vis.flatMap((s) => s.values.filter((v) => v != null)); if (all.length) { lo = Math.min(...all); hi = Math.max(...all); const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad; if (lo > 0 && lo < hi * 0.35) lo = 0; } }
    }
    if (d.min != null) lo = d.min; if (d.max != null) hi = d.max;
    const ticks = niceTicks(lo, hi, 5); lo = ticks[0]; hi = ticks[ticks.length - 1];
    const tl = Math.max(...ticks.map((t) => fmt(t, d.fmt).length)); m.l = Math.max(40, tl * 7.2 + 12);
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const y = (v) => m.t + ih - ((v - lo) / (hi - lo)) * ih;
    const band = iw / n, x = (k) => m.l + band * k + band / 2;
    const g = el('g', { class: 'grid' }, svg);
    ticks.forEach((t) => { el('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t) }, g); const tx = el('text', { x: m.l - 8, y: y(t) + 4, 'text-anchor': 'end' }, svg); tx.textContent = fmt(t, d.fmt); });
    if (lo < 0) el('line', { class: 'zero', x1: m.l, x2: W - m.r, y1: y(0), y2: y(0) }, svg);
    const every = Math.ceil(n / Math.floor(iw / (Math.max(...L.map((l) => String(l).length)) * 7 + 12)));
    L.forEach((l, k) => { if (k !== n - 1 && (k % every || n - 1 - k < every * 0.8)) return; const tx = el('text', { x: x(k), y: H - 12, 'text-anchor': 'middle' }, svg); tx.textContent = l; });

    if (d.type === 'line') {
      vis.forEach((s) => {
        let dstr = '', pen = false;
        s.values.forEach((v, k) => { if (v == null) { pen = false; return; } dstr += (pen ? 'L' : 'M') + x(k).toFixed(1) + ' ' + y(v).toFixed(1); pen = true; });
        el('path', { d: dstr, fill: 'none', stroke: color(s.i, s.color), 'stroke-width': s.width || 2.5, 'stroke-linejoin': 'round', 'stroke-dasharray': s.dash || '' }, svg);
        if (n <= 30) s.values.forEach((v, k) => { if (v != null && (k === n - 1)) el('circle', { cx: x(k), cy: y(v), r: 3.5, fill: color(s.i, s.color) }, svg); });
      });
    } else if (d.type === 'bar') {
      const gw = band * 0.78, bw = gw / Math.max(1, vis.length); const base = lo > 0 ? lo : hi < 0 ? hi : 0;
      vis.forEach((s, j) => s.values.forEach((v, k) => { if (v == null) return; const x0 = m.l + band * k + (band - gw) / 2 + j * bw; el('rect', { x: x0, width: Math.max(1, bw - 1), y: Math.min(y(v), y(base)), height: Math.abs(y(v) - y(base)), rx: 2, fill: color(s.i, (s.colors && s.colors[k]) || s.color) }, svg); }));
    } else if (d.type === 'stack') {
      const bw = band * 0.78;
      for (let k = 0; k < n; k++) { let p = 0, q = 0; vis.forEach((s) => { const v = s.values[k] || 0; const b0 = v >= 0 ? p : q, b1 = b0 + v; v >= 0 ? (p = b1) : (q = b1); el('rect', { x: m.l + band * k + (band - bw) / 2, width: bw, y: Math.min(y(b0), y(b1)), height: Math.abs(y(b1) - y(b0)), fill: color(s.i, s.color) }, svg); }); }
    }
    // hover layer
    const hl = el('line', { y1: m.t, y2: m.t + ih, stroke: css('--ink-2'), 'stroke-dasharray': '3 3', opacity: 0 }, svg);
    const ov = el('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent' }, svg);
    const move = (ev) => {
      const r = svg.getBoundingClientRect(), px = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) * (W / r.width);
      const k = Math.max(0, Math.min(n - 1, Math.floor((px - m.l) / band)));
      hl.setAttribute('x1', x(k)); hl.setAttribute('x2', x(k)); hl.setAttribute('opacity', d.type === 'line' ? 0.6 : 0);
      let html = `<b>${L[k]}</b>`;
      vis.forEach((s) => { html += `<br><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${color(s.i, s.color)}"></i> ${vis.length > 1 || d.type === 'stack' ? s.name + ': ' : ''}${fmt(s.values[k], s.fmt || d.fmt)}`; });
      if (d.type === 'stack' && d.showTotal) html += `<br><b>${d.totalLabel || 'Total'}: ${fmt(vis.reduce((a, s) => a + (s.values[k] || 0), 0), d.fmt)}</b>`;
      this.tip.innerHTML = html; this.tip.style.opacity = 1;
      const left = (x(k) / W) * r.width; this.tip.style.left = Math.min(r.width - 80, Math.max(80, left)) + 'px'; this.tip.style.top = (m.t / H) * r.height + 40 + 'px';
    };
    ov.addEventListener('mousemove', move); ov.addEventListener('touchstart', move, { passive: true });
    ov.addEventListener('mouseleave', () => { this.tip.style.opacity = 0; hl.setAttribute('opacity', 0); });
  };
  Chart.prototype.hbar = function (d, W) {
    const s = d.series[0]; const rows = d.labels.map((l, k) => ({ l, v: s.values[k], c: (s.colors && s.colors[k]) || null, href: d.links && d.links[k] }));
    if (d.sort !== false) rows.sort((a, b) => (b.v ?? -Infinity) - (a.v ?? -Infinity));
    const rh = 26, maxCh = Math.max(...rows.map((r) => r.l.length)), labW = Math.min(W * 0.42, maxCh * 6.6 + 10), valW = 74, fitCh = Math.floor((labW - 10) / 6.6);
    rows.forEach((r) => { r.full = r.l; if (r.l.length > fitCh) r.l = r.l.slice(0, fitCh - 1).trimEnd() + '…'; });
    const H = rows.length * rh + 8; const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': d.aria || '' }); this.box.insertBefore(svg, this.tip);
    const vals = rows.map((r) => r.v).filter((v) => v != null); const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals); const iw = W - labW - valW;
    const x = (v) => labW + ((v - lo) / (hi - lo || 1)) * iw;
    rows.forEach((r, i) => {
      const yy = 4 + i * rh; const parent = r.href ? el('a', { href: r.href }, svg) : svg;
      const t = el('text', { x: labW - 8, y: yy + rh / 2 + 4, 'text-anchor': 'end' }, parent); t.textContent = r.l; if (r.full !== r.l) { const tt = el('title', {}, t); tt.textContent = r.full; }
      if (r.v == null) { const na = el('text', { x: labW + 4, y: yy + rh / 2 + 4 }, parent); na.textContent = d.naLabel || 'n/a'; return; }
      const hlRow = d.highlight && d.highlight.includes(r.full);
      el('rect', { x: Math.min(x(0), x(r.v)), y: yy + 4, width: Math.max(1, Math.abs(x(r.v) - x(0))), height: rh - 8, rx: 3, fill: hlRow ? css('--c5') : color(0, r.c || s.color) }, parent);
      const vt = el('text', { x: Math.max(x(0), x(r.v)) + 6, y: yy + rh / 2 + 4, style: 'fill:' + css('--ink') + ';font-weight:600' }, parent); vt.textContent = fmt(r.v, d.fmt);
      if (hlRow) t.setAttribute('style', 'font-weight:700;fill:' + css('--ink'));
    });
    if (lo < 0) el('line', { class: 'zero', x1: x(0), x2: x(0), y1: 0, y2: H }, svg);
  };

  // ---------- Tile map ----------
  function TileMap(root, cfg) {
    const sel = root.querySelector('select'); const holder = root.querySelector('.tiles'); const side = root.querySelector('.tile-side');
    const draw = () => {
      const m = cfg.metrics[sel ? +sel.value : 0]; const vals = Object.values(m.values).filter((v) => v != null);
      const lo = Math.min(...vals), hi = Math.max(...vals);
      const c0 = [230, 242, 236], c1 = m.invert ? [181, 23, 43] : [10, 107, 60];
      const col = (v) => { if (v == null) return css('--line'); const t = (v - lo) / (hi - lo || 1); return `rgb(${c0.map((a, i) => Math.round(a + (c1[i] - a) * t)).join(',')})`; };
      const S = 76, cols = 7, rows = 6; const svg = el('svg', { viewBox: `0 0 ${cols * S} ${rows * S}`, role: 'img', 'aria-label': m.label });
      cfg.tiles.forEach((t) => {
        const v = m.values[t.slug]; const a = el('a', { href: t.href }, svg); const tt = el('title', {}, a); tt.textContent = `${t.name}: ${fmt(v, m.fmt)}`;
        el('rect', { x: t.col * S + 2, y: t.row * S + 2, width: S - 4, height: S - 4, rx: 8, fill: col(v) }, a);
        const dark = v != null && (v - lo) / (hi - lo || 1) > 0.55;
        const words = t.short.split(' '); words.forEach((w, i) => { const tx = el('text', { x: t.col * S + S / 2, y: t.row * S + S / 2 - 6 + i * 12 - (words.length - 1) * 6, 'text-anchor': 'middle', fill: dark ? '#fff' : '#16201b' }, a); tx.textContent = w; });
        const vt = el('text', { x: t.col * S + S / 2, y: t.row * S + S / 2 + 18 + (words.length - 1) * 6, 'text-anchor': 'middle', fill: dark ? '#fff' : '#16201b', style: 'font-weight:400' }, a); vt.textContent = fmt(v, Object.assign({}, m.fmt, { compactTile: true }));
      });
      holder.innerHTML = ''; holder.appendChild(svg);
      if (side) {
        const sorted = cfg.tiles.map((t) => ({ n: t.name, v: m.values[t.slug], h: t.href })).filter((r) => r.v != null).sort((a, b) => b.v - a.v);
        side.innerHTML = `<div class="scale" style="background:linear-gradient(90deg,${col(lo)},${col(hi)})"></div><div class="scale-labels"><span>${fmt(lo, m.fmt)}</span><span>${fmt(hi, m.fmt)}</span></div>
          <p class="meta" style="margin-top:12px">${cfg.highest}</p><ol style="padding-left:20px;margin:4px 0">${sorted.slice(0, 3).map((r) => `<li><a href="${r.h}">${r.n}</a> – ${fmt(r.v, m.fmt)}</li>`).join('')}</ol>
          <p class="meta">${cfg.lowest}</p><ol style="padding-left:20px;margin:4px 0">${sorted.slice(-3).reverse().map((r) => `<li><a href="${r.h}">${r.n}</a> – ${fmt(r.v, m.fmt)}</li>`).join('')}</ol>
          ${m.note ? `<p class="src">${m.note}</p>` : ''}`;
      }
    };
    if (sel) sel.addEventListener('change', draw);
    draw();
    window.addEventListener('resize', () => {}, { passive: true });
  }

  // ---------- Sortable tables ----------
  function sortable(table) {
    table.querySelectorAll('th[data-sort]').forEach((th, ci) => {
      th.tabIndex = 0;
      const go = () => {
        const idx = [...th.parentNode.children].indexOf(th); const tb = table.tBodies[0]; const rows = [...tb.rows];
        const dir = th.getAttribute('aria-sort') === 'descending' ? 1 : -1;
        table.querySelectorAll('th').forEach((h) => h.removeAttribute('aria-sort')); th.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
        const val = (r) => { const c = r.cells[idx]; const v = c.dataset.v; return v !== undefined ? (v === '' ? -Infinity * dir : +v) : c.textContent.trim().toLowerCase(); };
        rows.sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * dir; }); rows.forEach((r) => tb.appendChild(r));
      };
      th.addEventListener('click', go); th.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    });
  }

  // ---------- Barnett calculator ----------
  function barnett(root) {
    const amt = root.querySelector('[name=amt]'), comp = root.querySelector('[name=comp]'), compOut = root.querySelector('.comp-out'), out = root.querySelector('output');
    const P = 0.0549, N = 1.05;
    const upd = () => { const a = +amt.value || 0, c = +comp.value / 100; compOut.textContent = comp.value + '%'; out.textContent = fmt(a * c * P * N, { prefix: '£', suffix: 'm', dec: 1 }); };
    amt.addEventListener('input', upd); comp.addEventListener('input', upd); upd();
  }

  function init() {
    document.querySelectorAll('.chart-box').forEach((b) => { const s = b.parentNode.querySelector('script.cfg'); if (s) new Chart(b, JSON.parse(s.textContent)); });
    document.querySelectorAll('.tilemap').forEach((t) => { const s = t.querySelector('script.cfg'); if (s) TileMap(t, JSON.parse(s.textContent)); });
    document.querySelectorAll('table.sortable').forEach(sortable);
    document.querySelectorAll('.calc.barnett').forEach(barnett);
    const mb = document.querySelector('.menu-btn'); if (mb) mb.addEventListener('click', () => { const n = document.querySelector('nav.main'); n.classList.toggle('open'); mb.setAttribute('aria-expanded', n.classList.contains('open')); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
