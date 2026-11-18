// Parses the raw extracts in /raw into structured data used by the site.
// Every raw file starts with a "# Source:" line naming the official dataset it came from.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = (f) => readFileSync(path.join(root, 'raw', f), 'utf8').split('\n').filter((l) => l.trim());
const nums = (s) => s.split(',').map((v) => (v === '' || v === 'x' ? null : v.endsWith('~') ? Number(v.slice(0, -1)) : Number(v)));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ---------- Local authorities ----------
export const LAS = [
  // slug, English, Welsh, region, tile [col,row] for the tile map
  ['isle-of-anglesey', 'Isle of Anglesey', 'Ynys Môn', 'North Wales', [1, 0]],
  ['gwynedd', 'Gwynedd', 'Gwynedd', 'North Wales', [1, 1]],
  ['conwy', 'Conwy', 'Conwy', 'North Wales', [2, 0]],
  ['denbighshire', 'Denbighshire', 'Sir Ddinbych', 'North Wales', [3, 0]],
  ['flintshire', 'Flintshire', 'Sir y Fflint', 'North Wales', [4, 0]],
  ['wrexham', 'Wrexham', 'Wrecsam', 'North Wales', [4, 1]],
  ['powys', 'Powys', 'Powys', 'Mid Wales', [3, 2]],
  ['ceredigion', 'Ceredigion', 'Ceredigion', 'Mid Wales', [2, 2]],
  ['pembrokeshire', 'Pembrokeshire', 'Sir Benfro', 'South West Wales', [0, 3]],
  ['carmarthenshire', 'Carmarthenshire', 'Sir Gaerfyrddin', 'South West Wales', [1, 3]],
  ['swansea', 'Swansea', 'Abertawe', 'South West Wales', [1, 4]],
  ['neath-port-talbot', 'Neath Port Talbot', 'Castell-nedd Port Talbot', 'South West Wales', [2, 3]],
  ['bridgend', 'Bridgend', 'Pen-y-bont ar Ogwr', 'South East Wales', [2, 4]],
  ['vale-of-glamorgan', 'Vale of Glamorgan', 'Bro Morgannwg', 'South East Wales', [3, 5]],
  ['cardiff', 'Cardiff', 'Caerdydd', 'South East Wales', [4, 5]],
  ['rhondda-cynon-taf', 'Rhondda Cynon Taf', 'Rhondda Cynon Taf', 'South East Wales', [3, 4]],
  ['merthyr-tydfil', 'Merthyr Tydfil', 'Merthyr Tudful', 'South East Wales', [3, 3]],
  ['caerphilly', 'Caerphilly', 'Caerffili', 'South East Wales', [4, 4]],
  ['blaenau-gwent', 'Blaenau Gwent', 'Blaenau Gwent', 'South East Wales', [4, 3]],
  ['torfaen', 'Torfaen', 'Torfaen', 'South East Wales', [5, 3]],
  ['monmouthshire', 'Monmouthshire', 'Sir Fynwy', 'South East Wales', [6, 3]],
  ['newport', 'Newport', 'Casnewydd', 'South East Wales', [5, 4]],
].map(([slug, en, cy, region, tile]) => ({ slug, en, cy, region, tile }));
const byName = Object.fromEntries(LAS.map((l) => [l.en, l]));
byName['Denbigshire'] = byName['Denbighshire']; // spelling used in one StatsWales table

// ---------- GVA by local authority (1998-2023) ----------
const GVA_YEARS = range(1998, 2023);
const gvaLA = {};
for (const line of raw('gva_la.txt')) {
  if (line.startsWith('#')) continue;
  const [area, m, ph, idx] = line.split('|');
  gvaLA[area] = { m: nums(m), ph: nums(ph), idx: nums(idx) };
}

// ---------- GVA by industry ----------
const industry = { W: {}, UK: {} };
for (const line of raw('gva_industry.txt')) {
  if (line.startsWith('#')) continue;
  const [geo, name, vals] = line.split('|');
  industry[geo][name] = nums(vals);
}

// ---------- Council tax ----------
let CT_YEARS = [];
const ct = {}, ctComp = {};
let inComp = false;
for (const line of raw('council_tax.txt')) {
  if (line.startsWith('#YEARS')) { CT_YEARS = line.slice(7).split(','); continue; }
  if (line.startsWith('#COMPOSITION')) { inComp = true; continue; }
  if (line.startsWith('#')) continue;
  const parts = line.split('|');
  if (inComp) ctComp[parts[0]] = { county: +parts[1], community: +parts[2], police: +parts[3] };
  else ct[parts[0]] = nums(parts[1]);
}

// ---------- Labour market (APS) ----------
const APS_PERIODS = [...range(2004, 2025).map(String), 'Jun 2026'];
const aps = {};
for (const line of raw('aps.txt')) {
  if (line.startsWith('#')) continue;
  const [area, k, vals] = line.split('|');
  aps[area] ??= {};
  aps[area][k] = k === 'EL' ? Number(vals) : nums(vals);
  if (k === 'U') aps[area].Ulow = vals.split(',').map((v) => v.endsWith('~'));
}

// ---------- Fiscal ----------
const FISCAL_YEARS = range(1999, 2024).map((y) => `${y}-${String(y + 1).slice(2)}`);
const fiscal = { ph: {}, rev: [], exp: [] };
for (const line of raw('fiscal.txt')) {
  if (line.startsWith('#')) continue;
  const p = line.split('|');
  if (['NFB_PH', 'REV_PH', 'EXP_PH', 'POP'].includes(p[0])) { fiscal.ph[p[0]] ??= {}; fiscal.ph[p[0]][p[1]] = nums(p[2]); }
  else if (p[0] === 'REV') fiscal.rev.push({ name: p[1], v: nums(p[2]) });
  else if (p[0] === 'EXP') fiscal.exp.push({ name: p[1], v: nums(p[2]) });
}
const popW = fiscal.ph.POP.Wales;
const revTotal = fiscal.ph.REV_PH.Wales.map((v, i) => Math.round((v * popW[i]) / 1e6));
const expTotal = fiscal.ph.EXP_PH.Wales.map((v, i) => Math.round((v * popW[i]) / 1e6));
const nfbTotal = fiscal.ph.NFB_PH.Wales.map((v, i) => Math.round((v * popW[i]) / 1e6));
// Population share of the UK-wide deficit, and the part of Wales' gap above that share
const ukShare = fiscal.ph.NFB_PH.UK.map((v, i) => Math.round((v * popW[i]) / 1e6));
const aboveShare = nfbTotal.map((v, i) => v - ukShare[i]);

// ---------- Trade ----------
const trade = { annual: [], exp: [], imp: [], expP: [], impP: [] };
let sec = '';
for (const line of raw('trade.txt')) {
  if (line.startsWith('#ANNUAL')) { sec = 'annual'; continue; }
  if (line.startsWith('#EXPORTS')) { sec = 'exp'; continue; }
  if (line.startsWith('#IMPORTS')) { sec = 'imp'; continue; }
  if (line.startsWith('#EXPORT PARTNERS')) { sec = 'expP'; continue; }
  if (line.startsWith('#IMPORT PARTNERS')) { sec = 'impP'; continue; }
  if (line.startsWith('#')) continue;
  const p = line.split('|');
  if (sec === 'annual') trade.annual.push({ year: +p[0], exp: +p[1], imp: +p[2] });
  else if (sec === 'exp' || sec === 'imp') { const [a, b] = p[1].split(',').map(Number); trade[sec].push({ name: p[0], y2013: a, y2025: b }); }
  else trade[sec].push({ name: p[0], v: +p[1] });
}

// ---------- Income ----------
const EARN_YEARS = ['2012', '2016', '2020', '2024', '2025', '2026'];
const GDHI_YEARS = ['1998', '2008', '2014', '2019', '2023', '2024'];
const earn = {}, gdhi = {};
let isG = false;
for (const line of raw('income.txt')) {
  if (line.startsWith('# GDHI')) { isG = true; continue; }
  if (line.startsWith('#')) continue;
  const p = line.split('|');
  if (isG) gdhi[p[0]] = { v: nums(p[1]), idx: Number(p[2]) };
  else earn[p[0] === 'Denbigshire' ? 'Denbighshire' : p[0]] = nums(p[1]);
}

// ---------- Budget ----------
const budget = { headline: [], funding: [], bga: [], spend: [], rel: [] };
let bsec = '';
for (const line of raw('budget.txt')) {
  if (line.startsWith('#HEADLINE')) { bsec = 'headline'; continue; }
  if (line.startsWith('#FUNDING')) { bsec = 'funding'; continue; }
  if (line.startsWith('#BGA')) { bsec = 'bga'; continue; }
  if (line.startsWith('#SPENDING')) { bsec = 'spend'; continue; }
  if (line.startsWith('#RELATIVE')) { bsec = 'rel'; continue; }
  if (line.startsWith('#')) { bsec = ''; continue; }
  const p = line.split('|');
  if (bsec === 'headline') budget.headline.push({ year: p[0], v: +p[1], label: p[2], source: p[3] });
  else if (bsec) budget[bsec].push({ name: p[0], v: +p[1] });
}

// ---------- Derived per-LA profile ----------
const last = (a) => a[a.length - 1];
const idxOf = (arr, y) => arr.indexOf(y);
export function laProfile(la) {
  const g = gvaLA[la.en];
  const pop2023 = Math.round((last(g.m) * 1e6) / last(g.ph));
  const a = aps[la.en];
  const c = ct[la.en];
  return {
    ...la,
    gva: { years: GVA_YEARS, m: g.m, ph: g.ph, idx: g.idx },
    pop2023,
    ct: { years: CT_YEARS, v: c, comp: ctComp[la.en] },
    aps: { periods: APS_PERIODS, E: a.E, I: a.I, U: a.U, Ulow: a.Ulow, EL: a.EL },
    earn: earn[la.en],
    gdhi: gdhi[la.en],
  };
}

export const profiles = LAS.map(laProfile);

// Rankings (1 = highest)
function rank(key, get, desc = true) {
  const vals = profiles.map((p) => ({ slug: p.slug, v: get(p) })).filter((x) => x.v != null);
  vals.sort((a, b) => (desc ? b.v - a.v : a.v - b.v));
  const out = {};
  vals.forEach((x, i) => (out[x.slug] = i + 1));
  return out;
}
export const ranks = {
  gvaTotal: rank('gvaTotal', (p) => last(p.gva.m)),
  gvaPH: rank('gvaPH', (p) => last(p.gva.ph)),
  ct: rank('ct', (p) => last(p.ct.v)),
  emp: rank('emp', (p) => last(p.aps.E)),
  inact: rank('inact', (p) => last(p.aps.I)),
  earn: rank('earn', (p) => last(p.earn)),
  gdhi: rank('gdhi', (p) => last(p.gdhi.v)),
};

export const wales = {
  gva: { years: GVA_YEARS, ...gvaLA['Wales'] },
  ukGva: gvaLA['UK excluding Extra-Regio'],
  regions: Object.fromEntries(['North Wales', 'Mid Wales', 'South West Wales', 'South East Wales'].map((r) => [r, gvaLA[r]])),
  industry, ct: { years: CT_YEARS, v: ct['Wales'], comp: ctComp['Wales'] },
  aps: { periods: APS_PERIODS, ...aps['Wales'] }, apsUK: aps['United Kingdom'],
  fiscal: { years: FISCAL_YEARS, ph: fiscal.ph, revTotal, expTotal, nfbTotal, ukShare, aboveShare, rev: fiscal.rev, exp: fiscal.exp },
  trade, earn: { years: EARN_YEARS, data: earn }, gdhi: { years: GDHI_YEARS, data: gdhi }, budget,
};

export const SOURCES = {
  gvaLA: { en: 'ONS Regional economic activity by GDP/GVA (balanced), via StatsWales: GVA by Welsh local authority and year', url: 'https://stats.gov.wales/en-GB/58788eaa-6713-4ced-abc2-4b9c3773002a' },
  gvaInd: { en: 'ONS Regional Accounts, via StatsWales: GVA by industry (SIC2007), area and year', url: 'https://stats.gov.wales/en-GB/8590163a-acc3-428d-b27f-aec45d408372' },
  ct: { en: 'Welsh Government, Composition of average band D council tax by billing authority (StatsWales)', url: 'https://stats.gov.wales/en-GB/3ca971eb-7d9b-4b79-89fa-6d7f77431aad' },
  ctRelease: { en: 'Welsh Government, Council tax levels: April 2026 to March 2027', url: 'https://www.gov.wales/council-tax-levels-april-2026-march-2027-html' },
  aps: { en: 'ONS Annual Population Survey, via StatsWales: summary of economic activity', url: 'https://stats.gov.wales/en-GB/3a324dc0-3594-447f-9b4a-1a08bb923bf8' },
  apsRelease: { en: 'Welsh Government, Labour market statistics (Annual Population Survey): year ending June 2026', url: 'https://www.gov.wales/node/79459' },
  crpsf: { en: 'ONS, Country and regional public sector finances: financial year ending 2025 (supplementary tables)', url: 'https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/datasets/countryandregionalpublicsectorfinancessupplementarytables' },
  cra: { en: 'HM Treasury, Country and regional analysis: November 2025', url: 'https://www.gov.uk/government/statistics/country-and-regional-analysis-2025/country-and-regional-analysis-november-2025' },
  rts: { en: 'HMRC, UK Regional Trade in Goods Statistics (uktradeinfo API)', url: 'https://www.uktradeinfo.com/trade-data/regional/' },
  tradeWG: { en: 'Welsh Government, Welsh international goods trade: April 2025 to March 2026', url: 'https://www.gov.wales/node/76916' },
  ashe: { en: 'ONS Annual Survey of Hours and Earnings, via StatsWales: median gross weekly earnings by Welsh local area (workplace)', url: 'https://stats.gov.wales/en-GB/c7f7fa3f-fbf3-41bc-998b-15e15e670751' },
  gdhi: { en: 'ONS Regional gross disposable household income, via StatsWales', url: 'https://stats.gov.wales/en-GB/90841eef-d28b-4971-9660-472e0bf0940a' },
  budget2627: { en: 'Welsh Government, Final Budget Report 2026-27 (January 2026)', url: 'https://www.gov.wales/sites/default/files/publications/2026-01/final-budget-2026-2027-report.pdf' },
  ifs: { en: 'Institute for Fiscal Studies, Recent changes and the future outlook for Welsh Government funding (2026)', url: 'https://ifs.org.uk/publications/recent-changes-and-future-outlook-welsh-government-funding' },
  sofp: { en: 'HM Treasury, Statement of Funding Policy (June 2025)', url: 'https://assets.publishing.service.gov.uk/media/684859e3d0ca5d7801e4e6f6/Statement_of_Funding_Policy.pdf' },
  hansard1998: { en: 'Hansard, Welsh Office spending plans written answer, 14 December 1998', url: 'https://api.parliament.uk/historic-hansard/written_answers/1998/dec/14/budget-statistics' },
  writ: { en: 'HMRC, Welsh Income Tax Outturn Statistics 2023 to 2024', url: 'https://www.gov.uk/government/statistics/welsh-income-tax-outturn-statistics-2023-to-2024' },
  senedd: { en: 'Senedd Research, Fiscal devolution in Wales', url: 'https://research.senedd.wales/financial-scrutiny/fiscal-devolution-in-wales/' },
  ifg: { en: 'Institute for Government, Barnett formula explainer', url: 'https://www.instituteforgovernment.org.uk/explainer/barnett-formula' },
  gdpQ: { en: 'Welsh Government, Regional GDP: July to September 2025', url: 'https://www.gov.wales/node/77954' },
};
