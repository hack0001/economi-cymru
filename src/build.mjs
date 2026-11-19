// Static site generator: `node src/build.mjs` -> ./dist (deployed by Cloudflare Pages).
import { mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL, SITE_NAME, TAGLINE, ROUTES, NAV, NAV_LABEL, UPDATED } from './config.mjs';
import { profiles, SOURCES } from './data.mjs';
import { esc, T, slugify } from './lib.mjs';
import * as P from './pages.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, 'dist');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// ---------- Assets with content hashes (long-cache safe) ----------
const asset = (rel) => {
  const buf = readFileSync(path.join(root, 'static', rel));
  const h = createHash('sha256').update(buf).digest('hex').slice(0, 10);
  const ext = path.extname(rel), base = path.basename(rel, ext);
  const name = `/assets/${base}.${h}${ext}`;
  mkdirSync(path.join(out, 'assets'), { recursive: true });
  writeFileSync(path.join(out, name), buf);
  return name;
};
const CSS = asset('css/site.css');
const JS = asset('js/charts.js');
cpSync(path.join(root, 'static', 'fonts'), path.join(out, 'fonts'), { recursive: true });
for (const f of ['favicon.svg', 'og-en.png', 'og-cy.png', 'robots.txt', '_headers', '_redirects']) if (existsSync(path.join(root, 'static', f))) cpSync(path.join(root, 'static', f), path.join(out, f));

const pages = []; // for sitemap

function layout({ lang, key, page, enPath, cyPath, county }) {
  const t = T(lang);
  const selfPath = lang === 'cy' ? cyPath : enPath;
  const otherPath = lang === 'cy' ? enPath : cyPath;
  const url = SITE_URL + selfPath;
  const h1 = page.h1 || page.title;
  const nav = NAV.map((k) => `<a href="${ROUTES[k][lang === 'cy' ? 1 : 0]}"${k === key ? ' aria-current="page"' : ''}>${NAV_LABEL[k][lang === 'cy' ? 1 : 0]}</a>`).join('');
  const crumbs = [['home', NAV_LABEL.home[lang === 'cy' ? 1 : 0]], ...(page.crumbs || [])];
  const crumbHtml = key === 'home' ? '' : `<nav class="crumbs" aria-label="${t('Breadcrumb', 'Briwsion')}">${crumbs.map(([k, l]) => `<a href="${ROUTES[k][lang === 'cy' ? 1 : 0]}">${esc(l)}</a>`).join(' › ')} › <span>${esc(h1)}</span></nav>`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [...crumbs.map(([k, l], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: SITE_URL + ROUTES[k][lang === 'cy' ? 1 : 0] })), ...(key === 'home' ? [] : [{ '@type': 'ListItem', position: crumbs.length + 1, name: h1, item: url }])] },
  ];
  if (key === 'home') ld.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME[lang], url: SITE_URL + (lang === 'cy' ? '/cy/' : '/'), inLanguage: lang === 'cy' ? 'cy-GB' : 'en-GB', description: TAGLINE[lang] });
  if (page.dataset) ld.push({ '@context': 'https://schema.org', '@type': 'Dataset', name: page.title, description: page.desc, url, inLanguage: lang === 'cy' ? 'cy-GB' : 'en-GB', dateModified: UPDATED, spatialCoverage: { '@type': 'Place', name: county ? `${county.en}, Wales` : 'Wales' }, isAccessibleForFree: true, license: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/', creator: { '@type': 'Organization', name: SITE_NAME.en, url: SITE_URL }, isBasedOn: Object.values(SOURCES).slice(0, 6).map((s) => s.url) });
  const og = `${SITE_URL}/og-${lang}.png`;
  const html = `<!doctype html>
<html lang="${lang === 'cy' ? 'cy' : 'en-GB'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title)}${key === 'home' ? '' : ' | ' + esc(SITE_NAME[lang])}</title>
<meta name="description" content="${esc(page.desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en-GB" href="${SITE_URL + enPath}">
<link rel="alternate" hreflang="cy-GB" href="${SITE_URL + cyPath}">
<link rel="alternate" hreflang="x-default" href="${SITE_URL + enPath}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(SITE_NAME[lang])}">
<meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${og}"><meta property="og:locale" content="${lang === 'cy' ? 'cy_GB' : 'en_GB'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14212b">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/newsreader-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/schibsted-grotesk-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${CSS}">
<script defer src="${JS}"></script>
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#main">${t('Skip to content', 'Neidio i’r cynnwys')}</a>
<header class="site"><div class="wrap">
<a class="brand" href="${lang === 'cy' ? '/cy/' : '/'}"><span class="dot" aria-hidden="true"></span>${esc(SITE_NAME[lang])}</a>
<button class="menu-btn" aria-expanded="false" aria-controls="nav">${t('Menu', 'Dewislen')}</button>
<nav class="main" id="nav" aria-label="${t('Main', 'Prif')}">${nav}</nav>
<a class="lang" href="${otherPath}" hreflang="${lang === 'cy' ? 'en' : 'cy'}" lang="${lang === 'cy' ? 'en' : 'cy'}">${lang === 'cy' ? 'English' : 'Cymraeg'}</a>
</div></header>
<main id="main">
${page.noWrap ? page.body : `<div class="wrap">${crumbHtml}<h1>${esc(h1)}</h1>${page.body}<p class="meta updated">${t('Figures last checked', 'Gwiriwyd y ffigurau ddiwethaf')} 18 ${t('November', 'Tachwedd')} 2026. <a href="${ROUTES.sources[lang === 'cy' ? 1 : 0]}">${t('All sources and methods', 'Pob ffynhonnell a dull')}</a></p></div>`}
</main>
<footer class="site"><div class="wrap cols">
<div><span class="f-brand">${esc(SITE_NAME[lang])}</span><span class="f-small">${esc(TAGLINE[lang])}</span></div>
<div>${['funding', 'finances', 'economy', 'trade'].map((k) => `<a href="${ROUTES[k][lang === 'cy' ? 1 : 0]}">${NAV_LABEL[k][lang === 'cy' ? 1 : 0]}</a>`).join('<br>')}</div>
<div>${['counciltax', 'jobs', 'incomes', 'counties'].map((k) => `<a href="${ROUTES[k][lang === 'cy' ? 1 : 0]}">${NAV_LABEL[k][lang === 'cy' ? 1 : 0]}</a>`).join('<br>')}</div>
<div><a href="${ROUTES.sources[lang === 'cy' ? 1 : 0]}">${NAV_LABEL.sources[lang === 'cy' ? 1 : 0]}</a><br><a href="${ROUTES.about[lang === 'cy' ? 1 : 0]}">${NAV_LABEL.about[lang === 'cy' ? 1 : 0]}</a><br><span class="f-small" style="display:block;margin-top:8px">${t('Contains public sector information licensed under the Open Government Licence v3.0.', 'Yn cynnwys gwybodaeth sector cyhoeddus a drwyddedir o dan y Drwydded Llywodraeth Agored v3.0.')}</span></div>
</div></footer>
</body></html>`;
  const file = path.join(out, selfPath, 'index.html');
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, html);
  pages.push({ path: selfPath, en: enPath, cy: cyPath });
}

const simple = { home: P.home, funding: P.funding, finances: P.finances, economy: P.economy, trade: P.trade, counciltax: P.counciltax, jobs: P.jobs, incomes: P.incomes, counties: P.counties, sources: P.sources, about: P.about };
for (const [key, fn] of Object.entries(simple)) {
  for (const lang of ['en', 'cy']) layout({ lang, key, page: fn(lang), enPath: ROUTES[key][0], cyPath: ROUTES[key][1] });
}
for (const p of profiles) {
  for (const lang of ['en', 'cy']) layout({ lang, key: 'counties', page: P.county(p, lang), enPath: P.countyHref(p, 'en'), cyPath: P.countyHref(p, 'cy'), county: p });
}

// ---------- 404 ----------
writeFileSync(path.join(out, '404.html'), `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · Heb ddod o hyd i’r dudalen</title><meta name="robots" content="noindex"><link rel="stylesheet" href="${CSS}"></head><body><main><div class="wrap"><h1>Page not found</h1><p><a href="/">Go to the home page</a></p><h1 lang="cy">Heb ddod o hyd i’r dudalen</h1><p lang="cy"><a href="/cy/">Ewch i’r hafan</a></p></div></main></body></html>`);

// ---------- Sitemap ----------
const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map((p) => `<url><loc>${SITE_URL + p.path}</loc><lastmod>${UPDATED}</lastmod><xhtml:link rel="alternate" hreflang="en-GB" href="${SITE_URL + p.en}"/><xhtml:link rel="alternate" hreflang="cy-GB" href="${SITE_URL + p.cy}"/><xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL + p.en}"/></url>`).join('\n')}
</urlset>`;
writeFileSync(path.join(out, 'sitemap.xml'), sm);
writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`Built ${pages.length} pages -> dist/`);
