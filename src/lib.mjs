// Shared helpers: formatting, HTML builders, page shell.
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const last = (a) => a[a.length - 1];
export const sum = (a) => a.reduce((x, y) => x + (y || 0), 0);
const nf = (d = 0) => new Intl.NumberFormat('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
export const num = (v, d = 0) => (v == null ? '–' : (v < 0 ? '−' : '') + nf(d).format(Math.abs(v)));
export const gbp = (v, d = 0) => (v == null ? '–' : (v < 0 ? '−£' : '£') + nf(d).format(Math.abs(v)));
export const bn = (m, d = 1) => (m == null ? '–' : (m < 0 ? '−£' : '£') + nf(d).format(Math.abs(m) / 1000) + 'bn'); // input £m
export const mn = (m) => gbp(m) + 'm';
export const pct = (v, d = 1) => (v == null ? '–' : nf(d).format(v) + '%');
export const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Language helper: L(lang)(en, cy)
export const T = (lang) => (en, cy) => (lang === 'cy' ? cy : en);

// ---------- Components ----------
export function stat(k, v, s) { return `<div class="stat"><div class="v">${v}</div><div class="k">${k}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`; }

let chartN = 0;
export function chart({ title, sub, cfg, source, table, views, legend = true, lang }) {
  const id = 'c' + ++chartN;
  const t = T(lang);
  const seg = views ? `<div class="seg" role="group" aria-label="${t('Chart view', 'Golwg siart')}">${views.map((v, i) => `<button type="button" aria-pressed="${i === 0}">${esc(v)}</button>`).join('')}</div>` : '';
  const tbl = table ? `<details><summary>${t('Show the data', 'Dangos y data')}</summary>${table}</details>` : '';
  return `<figure class="chart" id="${id}"><div class="chart-head"><div><figcaption>${title}</figcaption>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${seg}</div>${legend ? '<div class="legend"></div>' : ''}
<div class="chart-box"></div><script type="application/json" class="cfg">${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>
<div class="src">${t('Source', 'Ffynhonnell')}: ${source}</div>${tbl}</figure>`;
}

export function table({ head, rows, sortable = true, cls = '' }) {
  return `<div class="table-wrap"><table class="${sortable ? 'sortable' : ''} ${cls}"><thead><tr>${head.map((h, i) => `<th${sortable ? ' data-sort' : ''} scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => (typeof c === 'object' && c !== null ? `<td data-v="${c.v ?? ''}"${c.cls ? ` class="${c.cls}"` : ''}>${c.html ?? c.t}</td>` : i === 0 ? `<th scope="row" style="text-align:left;font-weight:500">${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
}

export const srcLink = (s, lang) => `<a href="${s.url}" rel="noopener">${esc(s.en)}</a>`;
