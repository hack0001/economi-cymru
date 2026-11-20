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

// ---------- GVA and population by local authority (ONS, Sept 2026: 1998-2024) ----------
const GVA_YEARS = range(1998, 2024);
const popRaw = {}, gvaRaw = {}, laInd = {};
for (const line of raw('pop_la.txt')) { if (line.startsWith('#')) continue; const [k, v] = line.split('|'); popRaw[k] = nums(v); }
let inInd = false;
for (const line of raw('gva_la_2024.txt')) {
  if (line.startsWith('#INDUSTRY')) { inInd = true; continue; }
  if (line.startsWith('#')) continue;
  const p = line.split('|');
  if (inInd) laInd[p[0]] = { v: nums(p[1]), t23: Number(p[2]), real: nums(p[3]) };
  else gvaRaw[p[0]] = nums(p[1]);
}
const IND_CODES = ['Total', 'AB', 'C', 'DE', 'F', 'G', 'H', 'I', 'J', 'K', 'L', '68IMP', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
const ukPH = popRaw.UKG.map((g, i) => Math.round((g * 1e6) / popRaw.UKP[i]));
const mk = (m, pop) => { const ph = m.map((g, i) => Math.round((g * 1e6) / pop[i])); return { m, ph, idx: ph.map((v, i) => +((v / ukPH[i]) * 100).toFixed(1)), pop }; };
const gvaLA = { 'UK excluding Extra-Regio': { m: popRaw.UKG, ph: ukPH, idx: ukPH.map(() => 100), pop: popRaw.UKP }, Wales: mk(popRaw.WG, popRaw.WP) };
for (const k of Object.keys(gvaRaw)) gvaLA[k] = mk(gvaRaw[k], popRaw[k]);
const sumArr = (arrs) => arrs[0].map((_, i) => arrs.reduce((a, b) => a + b[i], 0));

for (const r of ['North Wales', 'Mid Wales', 'South West Wales', 'South East Wales']) { const ls = LAS.filter((l) => l.region === r); gvaLA[r] = mk(sumArr(ls.map((l) => gvaRaw[l.en])), sumArr(ls.map((l) => popRaw[l.en]))); }

// ---------- Business structure ----------
const SECTIONS = 'A B C D E F G H I J K L M N O P Q R S'.split(' ');
const bres = {}, ukbc = {};
for (const line of raw('bres.txt')) { if (line.startsWith('#')) continue; const [a, v, t15] = line.split('|'); const n = nums(v); bres[a] = { s: Object.fromEntries(SECTIONS.map((k, i) => [k, n[i]])), tot: n[19], tot15: Number(t15) }; }
for (const line of raw('business_counts.txt')) { if (line.startsWith('#')) continue; const [a, v] = line.split('|'); const n = nums(v); ukbc[a] = { total: n[0], b: n.slice(1, 10), priv: n[10], pub: n[11] }; }
const employers = raw('employers.txt').filter((l) => !l.startsWith('#')).map((l) => { const p = l.split('|'); return { slug: p[0], name: p[1], ch: p[2], county: p[3], sector: { en: p[4], cy: p[5] }, wales: { en: p[6], cy: p[7] }, figs: { en: p[8], cy: p[9] }, src: p[10].split(' ') }; });

// ---------- GVA by industry ----------
const publicEmp = { nhs: [], nhsOther: [], cs: [] };
for (const l of raw('public_employers.txt')) {
  if (l.startsWith('#NHSWALES ')) { l.slice(10).split(';').forEach((x) => { const [n, v] = x.split('|'); publicEmp.nhsOther.push({ name: n, head: +v }); }); continue; }
  if (l.startsWith('#')) continue;
  const p = l.split('|');
  if (p.length === 4 && /Health Board/.test(p[0])) publicEmp.nhs.push({ name: p[0], head: +p[1], fte: +p[2], counties: p[3].split(',') });
  else if (p.length === 4) publicEmp.cs.push({ area: p[0], total: +p[1], bodies: p[2].split(';').map((b) => { const [n, v] = b.split('='); return { name: n, head: +v }; }), counties: p[3].split(',') });
}
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
  const pop2024 = last(g.pop);
  const a = aps[la.en];
  const c = ct[la.en];
  return {
    ...la,
    gva: { years: GVA_YEARS, m: g.m, ph: g.ph, idx: g.idx },
    pop2024,
    ct: { years: CT_YEARS, v: c, comp: ctComp[la.en] },
    aps: { periods: APS_PERIODS, E: a.E, I: a.I, U: a.U, Ulow: a.Ulow, EL: a.EL },
    earn: earn[la.en],
    gdhi: gdhi[la.en],
    ind: laInd[la.en], bres: bres[la.en], ukbc: ukbc[la.en], employers: employers.filter((e) => e.county === la.slug), nhs: publicEmp.nhs.find((b) => b.counties.includes(la.slug)), cs: publicEmp.cs.find((c) => c.counties.includes(la.slug)),
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
  bres: bres['Wales'], ukbc: ukbc['Wales'], employers, publicEmp,
};
export { SECTIONS, IND_CODES };

export const SOURCES = {
  gvaLA: { en: 'ONS, Regional gross domestic product: local authorities, 1998 to 2024 (September 2026)', url: 'https://www.ons.gov.uk/economy/grossdomesticproductgdp/datasets/regionalgrossdomesticproductlocalauthorities' },
  gvaLAind: { en: 'ONS, Regional gross value added (balanced) by industry: local authorities, Wales (September 2026)', url: 'https://www.ons.gov.uk/economy/grossdomesticproductgdp/datasets/regionalgrossvalueaddedbalancedbyindustrylocalauthoritiesbyitl1region' },
  bres: { en: 'ONS Business Register and Employment Survey 2024, via Nomis', url: 'https://www.nomisweb.co.uk/datasets/newbres6pub' },
  bresWG: { en: 'Welsh Government, Business Register and Employment Survey: 2024', url: 'https://www.gov.wales/business-register-and-employment-survey-2024-html' },
  ukbc: { en: 'ONS UK Business Counts: local units by employment size band, 2026, via Nomis', url: 'https://www.nomisweb.co.uk/datasets/idbrlu' },
  ch: { en: 'Companies House, company filing histories', url: 'https://find-and-update.company-information.service.gov.uk/' },
  gvaInd: { en: 'ONS, Regional gross value added (balanced) by industry: all ITL regions (September 2026)', url: 'https://www.ons.gov.uk/economy/grossvalueaddedgva/datasets/nominalandrealregionalgrossvalueaddedbalancedbyindustry' },
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
  ro: { en: 'Welsh Government, Detailed summary of revenue outturn expenditure by authority and service, 2002-03 to 2025-26 (StatsWales)', url: 'https://stats.gov.wales/en-GB/b483d2c5-e60e-4dfb-b03a-49df9e1931a0' },
  roSoc: { en: 'Welsh Government, Social services revenue outturn expenditure by authority and client group (StatsWales)', url: 'https://stats.gov.wales/en-GB/b93670e2-ddc5-472b-a26b-bf58cf12a40e' },
  roEdu: { en: 'Welsh Government, Education revenue outturn expenditure by authority and service (StatsWales)', url: 'https://stats.gov.wales/en-GB/c696855c-2139-4f34-8463-78899be3288d' },
  roRoads: { en: 'Welsh Government, Roads and transport revenue outturn expenditure by authority and service (StatsWales)', url: 'https://stats.gov.wales/en-GB/475612f0-9e2f-4966-9fcd-b790b5a81b1f' },
  nhsStaff: { en: 'Welsh Government, Staff directly employed by the NHS by staff group and organisation (StatsWales), 30 June 2026', url: 'https://stats.gov.wales/en-GB/1998488a-cd5a-4133-843a-4e894df47249' },
  csStats: { en: 'Cabinet Office, Civil Service Statistics data browser 2025: civil servants by organisation and area', url: 'https://civil-service-statistics.jdac.service.cabinetoffice.gov.uk/data_browser_2025/Organisation/Region_ITL3/index.html' },
  gdpQ: { en: 'Welsh Government, Regional GDP: July to September 2025', url: 'https://www.gov.wales/node/77954' },
};
