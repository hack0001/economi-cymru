import { wales, profiles, ranks, SOURCES as S, LAS } from './data.mjs';
import { ROUTES, SITE_NAME } from './config.mjs';
import { countyCouncil } from './councilpages.mjs';
import { esc, last, sum, num, gbp, bn, mn, pct, slugify, T, stat, chart, table, srcLink } from './lib.mjs';

export const href = (key, lang) => ROUTES[key][lang === 'cy' ? 1 : 0];
export const countyHref = (p, lang) => (lang === 'cy' ? `/cy/siroedd/${slugify(p.cy)}/` : `/counties/${p.slug}/`);
const nm = (p, lang) => (lang === 'cy' ? p.cy : p.en);
const src = (k) => srcLink(S[k]);
const F = wales.fiscal;
const N = F.years.length - 1; // index of 2024-25
const fy = F.years;
const GV = wales.gva;
const GN = GV.years.length - 1; // 2024
const CTN = wales.ct.years.length - 1; // 2026-27
const APN = wales.aps.periods.length - 1; // Jun 2026

// ---------- Key figures (computed, never typed by hand) ----------
export const K = {
  rev: F.revTotal[N], exp: F.expTotal[N], gap: F.nfbTotal[N], gapPH: F.ph.NFB_PH.Wales[N], ukPH: F.ph.NFB_PH.UK[N],
  revPH: F.ph.REV_PH.Wales[N], revPHuk: F.ph.REV_PH.UK[N], expPH: F.ph.EXP_PH.Wales[N], expPHuk: F.ph.EXP_PH.UK[N],
  share: F.ukShare[N], above: F.aboveShare[N], gap99: F.nfbTotal[0],
  gva: last(GV.m), gvaPH: last(GV.ph), gvaIdx: last(GV.idx), gvaIdx98: GV.idx[0],
  ct: last(wales.ct.v), ctPrev: wales.ct.v[CTN - 1], ct97: wales.ct.v[3],
  emp: last(wales.aps.E), empUK: last(wales.apsUK.E), un: last(wales.aps.U), unUK: last(wales.apsUK.U), inact: last(wales.aps.I), inactUK: last(wales.apsUK.I),
  tradeExp: last(wales.trade.annual).exp, tradeImp: last(wales.trade.annual).imp,
  budget: 27700, block: 22100,
};

const IND_CY = {
  'Manufacturing': 'Gweithgynhyrchu', 'Real estate activities': 'Eiddo tiriog', "Owner-occupiers' imputed rental": 'Rhent tybiannol perchen-feddianwyr',
  'Human health and social work activities': 'Iechyd a gwaith cymdeithasol', 'Public administration and defence; compulsory social security': 'Gweinyddiaeth gyhoeddus ac amddiffyn',
  'Wholesale and retail trade, repair of motor vehicles': 'Cyfanwerthu a manwerthu', 'Construction': 'Adeiladu', 'Education': 'Addysg', 'Financial and insurance activities': 'Cyllid ac yswiriant',
  'Professional, scientific and technical activities': 'Proffesiynol, gwyddonol a thechnegol', 'Administrative and support service activities': 'Gweinyddol a chymorth', 'Accomodation and food service activities': 'Llety a bwyd',
  'Information and communication': 'Gwybodaeth a chyfathrebu', 'Transportation and storage': 'Trafnidiaeth a storio', 'Electricity, gas, steam and air-conditioning supply': 'Trydan a nwy',
  'Water supply; sewerage, waste management': 'Dŵr, carthffosiaeth a gwastraff', 'Agriculture, forestry and fishing': 'Amaeth, coedwigaeth a physgota', 'Arts, entertainment and recreation': 'Celfyddydau ac adloniant',
  'Other service activities': 'Gwasanaethau eraill', 'Mining and quarrying': 'Mwyngloddio a chwarela', 'Activities of Households': 'Gweithgareddau aelwydydd',
  'Transport Equipment': 'Offer trafnidiaeth', 'Manufacture of basic metals': 'Metelau sylfaenol (gan gynnwys dur)', 'Food products, beverages and tobacco': 'Bwyd, diod a thybaco',
  'Manufacture of coke, refined petroleum and chemicals': 'Petrolewm a chemegau', 'Computer, electronic and optical products': 'Cyfrifiaduron ac electroneg', 'Manufacture of pharmaceutical products': 'Fferyllol',
};
const IND_EN_SHORT = {
  'Wholesale and retail trade, repair of motor vehicles': 'Wholesale & retail', 'Public administration and defence; compulsory social security': 'Public administration & defence',
  'Human health and social work activities': 'Health & social work', 'Professional, scientific and technical activities': 'Professional & scientific', 'Administrative and support service activities': 'Admin & support services',
  'Accomodation and food service activities': 'Hotels, cafés & restaurants', 'Electricity, gas, steam and air-conditioning supply': 'Electricity & gas', 'Water supply; sewerage, waste management': 'Water & waste',
  'Financial and insurance activities': 'Finance & insurance', 'Real estate activities': 'Real estate (incl. imputed rent)', "Owner-occupiers' imputed rental": 'Imputed rent (owner-occupiers)', 'Information and communication': 'Information & communication',
  'Transportation and storage': 'Transport & storage', 'Agriculture, forestry and fishing': 'Agriculture, forestry & fishing', 'Arts, entertainment and recreation': 'Arts & recreation', 'Manufacture of basic metals': 'Basic metals (incl. steel)',
  'Manufacture of coke, refined petroleum and chemicals': 'Oil refining & chemicals', 'Food products, beverages and tobacco': 'Food & drink', 'Computer, electronic and optical products': 'Electronics', 'Manufacture of pharmaceutical products': 'Pharmaceuticals', 'Transport Equipment': 'Transport equipment (aerospace, vehicles)',
};
const indName = (k, lang) => (lang === 'cy' ? IND_CY[k] || k : IND_EN_SHORT[k] || k);

// ============================================================ HOME
export function home(lang) {
  const t = T(lang);
  const fund = Object.fromEntries(wales.budget.funding.map((f) => [f.name, f.v]));
  const tot = fund.TOTAL;
  const seg = [
    { v: fund['Block grant (resource DEL + capital after tax adjustments)'], c: 'var(--c1)', l: t('Block grant from the UK Government, set through the Barnett formula', 'Grant bloc gan Lywodraeth y DU, wedi’i bennu drwy fformiwla Barnett') },
    { v: fund['Welsh rates of income tax'], c: 'var(--c2)', l: t('Welsh rates of income tax', 'Cyfraddau treth incwm Cymru') },
    { v: fund['Non-domestic (business) rates'], c: 'var(--c3)', l: t('Business rates', 'Ardrethi busnes'), tiny: true },
    { v: fund['Land transaction tax'] + fund['Landfill disposals tax'] + fund['Capital borrowing'], c: 'var(--c8)', l: t('Land and landfill taxes, and borrowing', 'Trethi tir a thirlenwi, a benthyca') },
  ];
  const per100 = (v) => Math.round((v / tot) * 100);
  const topics = [
    ['funding', t('Where the Welsh Government’s money comes from', 'O ble daw arian Llywodraeth Cymru'), t('The budget, the Barnett formula and Welsh taxes, with a calculator.', 'Y gyllideb, fformiwla Barnett a threthi Cymru, gyda chyfrifiannell.'), bn(K.budget), t('budget 2026-27', 'cyllideb 2026-27')],
    ['finances', t('Tax raised and money spent in Wales', 'Treth a godir ac arian a werir yng Nghymru'), t('Revenue, spending and the gap between them every year since 1999.', 'Refeniw, gwariant a’r bwlch rhyngddynt bob blwyddyn ers 1999.'), bn(K.gap), t('gap in 2024-25', 'bwlch yn 2024-25')],
    ['economy', t('What Wales earns its living from', 'Sut mae Cymru’n ennill ei bywoliaeth'), t('Output by industry since 1998, and which areas produce the most.', 'Allbwn fesul diwydiant ers 1998, a pha ardaloedd sy’n cynhyrchu fwyaf.'), bn(K.gva), t('output in 2024', 'allbwn yn 2024')],
    ['trade', t('Exports and imports', 'Allforion a mewnforion'), t('What Wales sells abroad, what it buys and who it trades with.', 'Beth mae Cymru’n ei werthu dramor, beth mae’n ei brynu a gyda phwy.'), '£' + num(K.tradeExp, 1) + 'bn', t('goods exports 2025', 'allforion nwyddau 2025')],
    ['councils', t('Council spending', 'Gwariant cynghorau'), t('Where every pound of council money goes, line by line, for all 22 councils.', 'I ble mae pob punt o arian cynghorau yn mynd, fesul llinell, ar gyfer pob un o’r 22 cyngor.'), '£9.83bn', t('net, 2025-26', 'net, 2025-26')],
    ['counciltax', t('Council tax', 'Treth gyngor'), t('Band D bills for all 22 councils, and how they have risen since 1996.', 'Biliau Band D ar gyfer pob un o’r 22 cyngor, a sut maen nhw wedi codi ers 1996.'), gbp(K.ct), t('average band D', 'band D cyfartalog')],
    ['jobs', t('Jobs and unemployment', 'Swyddi a diweithdra'), t('Employment, unemployment and inactivity in every county.', 'Cyflogaeth, diweithdra ac anweithgarwch ym mhob sir.'), pct(K.emp), t('employment rate', 'cyfradd cyflogaeth')],
    ['incomes', t('Wages and household income', 'Cyflogau ac incwm aelwydydd'), t('Pay and disposable income by county, compared with the UK.', 'Cyflog ac incwm gwario fesul sir, o’i gymharu â’r DU.'), gbp(last(wales.earn.data.Wales)), t('median weekly pay', 'cyflog wythnosol canolrifol')],
    ['counties', t('The 22 counties', 'Y 22 sir'), t('A profile of each local authority, with rankings.', 'Proffil o bob awdurdod lleol, gyda safleoedd.'), '22', t('local authorities', 'awdurdod lleol')],
  ];
  const body = `
<section class="hero"><div class="wrap">
<h1>${t('How the Welsh economy works, in official figures', 'Sut mae economi Cymru’n gweithio, mewn ffigurau swyddogol')}</h1>
<p class="lede">${t('Where Wales’ public money comes from, what the country earns and trades, and how its 22 counties compare. Every number is taken from official statistics and linked to its source.', 'O ble daw arian cyhoeddus Cymru, beth mae’r wlad yn ei ennill a’i fasnachu, a sut mae ei 22 sir yn cymharu. Daw pob rhif o ystadegau swyddogol ac mae wedi’i gysylltu â’i ffynhonnell.')}</p>
<div class="money">
<p class="money-title">${t(`How each £100 of the Welsh Government’s ${bn(tot)} budget is funded, 2026-27`, `Sut caiff pob £100 o gyllideb ${bn(tot)} Llywodraeth Cymru ei ariannu, 2026-27`)}</p>
<div class="money-bar" role="img" aria-label="${esc(seg.map((x) => `${x.l}: £${per100(x.v)}`).join('; '))}">${seg.map((x) => `<span style="flex:${x.v};background:${x.c}"></span>`).join('')}</div>
<div class="money-key">${seg.map((x) => `<div${x.tiny ? ' class="k-tiny"' : ''} style="border-top-color:${x.c}"><b>£${per100(x.v)}</b>${x.l}</div>`).join('')}</div>
<p class="money-note">${t('Source: Welsh Government Final Budget 2026-27.', 'Ffynhonnell: Cyllideb Derfynol Llywodraeth Cymru 2026-27.')} <a href="${href('funding', lang)}">${t('How the Barnett formula works', 'Sut mae fformiwla Barnett yn gweithio')}</a></p>
</div>
</div></section>
<div class="wrap">
<div class="stats">
${stat(t('Size of the economy in 2024 (gross value added)', 'Maint yr economi yn 2024 (gwerth ychwanegol gros)'), bn(K.gva), t(`${pct(K.gvaIdx)} of the UK average per person`, `${pct(K.gvaIdx)} o gyfartaledd y DU y pen`))}
${stat(t('Public spending above revenue raised, 2024-25', 'Gwariant cyhoeddus uwchlaw’r refeniw a godwyd, 2024-25'), bn(K.gap), t(`${gbp(K.gapPH)} per person, against ${gbp(K.ukPH)} for the UK`, `${gbp(K.gapPH)} y pen, o’i gymharu â ${gbp(K.ukPH)} i’r DU`))}
${stat(t('People aged 16–64 in work', 'Pobl 16–64 oed mewn gwaith'), pct(K.emp), t(`UK ${pct(K.empUK)}, year to June 2026`, `DU ${pct(K.empUK)}, blwyddyn hyd Mehefin 2026`))}
${stat(t('Goods exported in 2025', 'Nwyddau a allforiwyd yn 2025'), '£' + num(K.tradeExp, 1) + 'bn', t(`Imports £${num(K.tradeImp, 1)}bn`, `Mewnforion £${num(K.tradeImp, 1)}bn`))}
</div>
<h2>${t('Explore the economy', 'Archwilio’r economi')}</h2>
<ul class="topics">${topics.map(([k, h, d, f, fl]) => `<li><a href="${href(k, lang)}"><span class="t-title">${h}</span><span class="t-desc">${d}</span><span class="t-fig">${f}<small>${fl}</small></span></a></li>`).join('')}</ul>
<h2>${t('How the 22 counties compare', 'Sut mae’r 22 sir yn cymharu')}</h2>
<p>${t('Choose a measure. Each square is a local authority, placed roughly where it sits on the map of Wales. Select a county to see its profile.', 'Dewiswch fesur. Mae pob sgwâr yn awdurdod lleol, wedi’i osod yn fras lle mae ar fap Cymru. Dewiswch sir i weld ei phroffil.')}</p>
${tm(lang)}
<h2>${t('Output per person has stayed at about three-quarters of the UK level', 'Mae allbwn y pen wedi aros tua thri chwarter lefel y DU')}</h2>
<p>${t('Gross value added per person in Wales, as a percentage of the UK average. The figure has moved within a narrow band since 1998.', 'Gwerth ychwanegol gros y pen yng Nghymru, fel canran o gyfartaledd y DU. Mae’r ffigur wedi symud o fewn band cul ers 1998.')}</p>
${chart({ lang, legend: false, title: t('GVA per person, Wales as a percentage of the UK average, 1998 to 2024', 'GYC y pen, Cymru fel canran o gyfartaledd y DU, 1998 i 2024'), sub: t('UK average = 100', 'Cyfartaledd y DU = 100'), source: src('gvaLA'),
    cfg: { type: 'line', labels: GV.years, series: [{ name: 'Wales', values: GV.idx }], fmt: { dec: 1 }, min: 60, max: 80 } })}
<h2>${t('How this site works', 'Sut mae’r wefan hon yn gweithio')}</h2>
<p>${t('The site reports what the official numbers say and how they have changed. It does not argue for any party or policy. Where a figure depends on how it is measured, the method is explained next to it, with a link to the original source.', 'Mae’r wefan yn adrodd yr hyn y mae’r rhifau swyddogol yn ei ddweud a sut maen nhw wedi newid. Nid yw’n dadlau dros unrhyw blaid na pholisi. Lle mae ffigur yn dibynnu ar sut y caiff ei fesur, caiff y dull ei egluro wrth ei ymyl, gyda dolen i’r ffynhonnell wreiddiol.')} <a href="${href('about', lang)}">${t('About this site', 'Am y wefan hon')}</a></p>
</div>`;
  return {
    title: t('Wales Economy Explained: facts and data on the Welsh economy', 'Economi Cymru wedi’i Egluro: ffeithiau a data am economi Cymru'),
    desc: t(`Official data on the Welsh economy: the ${bn(K.budget)} Welsh budget and Barnett formula, tax and spending, GVA by industry, exports, council tax and jobs in all 22 counties.`, `Data swyddogol am economi Cymru: cyllideb ${bn(K.budget)}, fformiwla Barnett, treth a gwariant, GYC fesul diwydiant, allforion, treth gyngor a swyddi ym mhob un o’r 22 sir.`),
    body, noWrap: true,
  };
}
const tm = (lang) => tileMap(lang, ['gvaTotal', 'gvaPH', 'gdhi', 'earn', 'ct', 'emp']);

// ---------- Tile map ----------
function tileMap(lang, keys) {
  const t = T(lang);
  const M = {
    gvaTotal: { label: t('Economic output (GVA), 2024', 'Allbwn economaidd (GYC), 2024'), get: (p) => last(p.gva.m), fmt: { prefix: '£', suffix: 'm' }, note: t('Measured where people work.', 'Wedi’i fesur lle mae pobl yn gweithio.') },
    gvaPH: { label: t('GVA per person, 2024', 'GYC y pen, 2024'), get: (p) => last(p.gva.ph), fmt: { prefix: '£' }, note: t('Workplace-based: commuting raises figures for job centres such as Cardiff.', 'Yn seiliedig ar weithle: mae cymudo’n codi ffigurau canolfannau swyddi fel Caerdydd.') },
    ct: { label: t('Band D council tax, 2026-27', 'Treth gyngor Band D, 2026-27'), get: (p) => last(p.ct.v), fmt: { prefix: '£' }, invert: true, note: t('Includes county, community council and police elements.', 'Yn cynnwys elfennau’r sir, y cyngor cymuned a’r heddlu.') },
    emp: { label: t('Employment rate 16–64, year to June 2026', 'Cyfradd cyflogaeth 16–64, blwyddyn hyd Mehefin 2026'), get: (p) => last(p.aps.E), fmt: { suffix: '%', dec: 1 }, note: t('Survey estimate – small areas have wide margins of error.', 'Amcangyfrif arolwg – mae gan ardaloedd bach ymylon gwall eang.') },
    inact: { label: t('Economic inactivity 16–64, year to June 2026', 'Anweithgarwch economaidd 16–64, blwyddyn hyd Mehefin 2026'), get: (p) => last(p.aps.I), fmt: { suffix: '%', dec: 1 }, invert: true },
    gdhi: { label: t('Disposable household income per person, 2024', 'Incwm gwario aelwydydd y pen, 2024'), get: (p) => last(p.gdhi.v), fmt: { prefix: '£' }, note: t('Measured where people live.', 'Wedi’i fesur lle mae pobl yn byw.') },
    earn: { label: t('Median full-time weekly pay, 2026', 'Cyflog wythnosol canolrifol amser llawn, 2026'), get: (p) => last(p.earn), fmt: { prefix: '£' }, note: t('Measured where people work. Provisional.', 'Wedi’i fesur lle mae pobl yn gweithio. Dros dro.') },
  };
  const short = (p) => { const n = nm(p, lang); const map = { 'Isle of Anglesey': 'Anglesey', 'Neath Port Talbot': 'Neath PT', 'Rhondda Cynon Taf': 'RCT', 'Vale of Glamorgan': 'Vale of Glam.', 'Castell-nedd Port Talbot': 'Castell-nedd', 'Pen-y-bont ar Ogwr': 'Pen-y-bont', 'Merthyr Tydfil': 'Merthyr', 'Merthyr Tudful': 'Merthyr', 'Monmouthshire': 'Monmouth', 'Carmarthenshire': 'Carmarthen', 'Pembrokeshire': 'Pembroke', 'Denbighshire': 'Denbigh', 'Sir Gaerfyrddin': 'Sir Gâr', 'Sir Ddinbych': 'Sir Ddinbych', 'Blaenau Gwent': 'Blaenau Gwent', 'Bro Morgannwg': 'Bro Morg.' }; return map[n] || n; };
  const cfg = {
    highest: t('Highest', 'Uchaf'), lowest: t('Lowest', 'Isaf'),
    metrics: keys.map((k) => ({ label: M[k].label, fmt: M[k].fmt, invert: M[k].invert, note: M[k].note, values: Object.fromEntries(profiles.map((p) => [p.slug, M[k].get(p)])) })),
    tiles: profiles.map((p) => ({ slug: p.slug, name: nm(p, lang), short: short(p), col: p.tile[0], row: p.tile[1], href: countyHref(p, lang) })),
  };
  return `<div class="tilemap"><div><div class="controls"><label>${t('Measure', 'Mesur')} <select>${keys.map((k, i) => `<option value="${i}">${esc(M[k].label)}</option>`).join('')}</select></label></div><div class="tiles"></div></div><aside class="tile-side"></aside><script type="application/json" class="cfg">${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script></div>
<p class="src">${t('Sources', 'Ffynonellau')}: ${src('gvaLA')}; ${src('ct')}; ${src('aps')}; ${src('gdhi')}; ${src('ashe')}.</p>`;
}

// ============================================================ FUNDING / BARNETT
export function funding(lang) {
  const t = T(lang);
  const B = wales.budget;
  const fundName = { 'Block grant (resource DEL + capital after tax adjustments)': t('Block grant from UK Government', 'Grant bloc gan Lywodraeth y DU'), 'Welsh rates of income tax': t('Welsh rates of income tax', 'Cyfraddau treth incwm Cymru'), 'Non-domestic (business) rates': t('Business rates', 'Ardrethi annomestig (busnes)'), 'Land transaction tax': t('Land transaction tax', 'Treth trafodiadau tir'), 'Landfill disposals tax': t('Landfill disposals tax', 'Treth gwarediadau tirlenwi'), 'Capital borrowing': t('Borrowing', 'Benthyca') };
  const fund = B.funding.filter((f) => f.name !== 'TOTAL');
  const spendCy = { 'Health and Social Care': 'Iechyd a Gofal Cymdeithasol', 'Housing and Local Government': 'Tai a Llywodraeth Leol', 'Education': 'Addysg', 'Transport': 'Trafnidiaeth', 'Climate Change and Rural Affairs': 'Newid Hinsawdd a Materion Gwledig', 'Economy, Energy and Planning': 'Economi, Ynni a Chynllunio', 'Central Services and Administration': 'Gwasanaethau Canolog a Gweinyddu', 'Social Justice': 'Cyfiawnder Cymdeithasol' };
  const body = `
<p class="lede">${t(`In 2026-27 the Welsh Government has ${bn(K.budget)} to spend. About four-fifths of it – ${bn(K.block)} – arrives as a block grant from the UK Government, whose size changes each year through the Barnett formula. The rest comes from taxes now set in Wales, plus a small amount of borrowing.`, `Yn 2026-27 mae gan Lywodraeth Cymru ${bn(K.budget)} i’w wario. Daw tua phedair rhan o bump ohono – ${bn(K.block)} – fel grant bloc gan Lywodraeth y DU, a chaiff ei faint ei newid bob blwyddyn drwy fformiwla Barnett. Daw’r gweddill o drethi a bennir bellach yng Nghymru, ynghyd â swm bach o fenthyca.`)}</p>
<div class="stats">
${stat(t('Total funding 2026-27', 'Cyfanswm cyllid 2026-27'), bn(K.budget), t('Final Budget, January 2026', 'Cyllideb Derfynol, Ionawr 2026'))}
${stat(t('Block grant', 'Grant bloc'), bn(K.block), t(`${pct((K.block / K.budget) * 100, 0)} of the total`, `${pct((K.block / K.budget) * 100, 0)} o’r cyfanswm`))}
${stat(t('Welsh rates of income tax', 'Cyfraddau treth incwm Cymru'), bn(3977), t('10p in each band, set by the Senedd', '10c ym mhob band, wedi’i bennu gan y Senedd'))}
${stat(t('Net gain from tax devolution', 'Enillion net o ddatganoli trethi'), mn(524), t('Devolved taxes minus block grant adjustments', 'Trethi datganoledig llai addasiadau i’r grant bloc'))}
</div>
${chart({ lang, title: t('Where the Welsh Government’s 2026-27 funding comes from', 'O ble daw cyllid Llywodraeth Cymru ar gyfer 2026-27'), sub: t('£ million', '£ miliwn'), source: src('budget2627'),
    cfg: { type: 'hbar', labels: fund.map((f) => fundName[f.name] || f.name), series: [{ name: '£m', values: fund.map((f) => f.v) }], fmt: { prefix: '£', suffix: 'm' } }, legend: false,
    table: table({ head: [t('Source', 'Ffynhonnell'), '£m', '%'], rows: fund.map((f) => [fundName[f.name] || f.name, { v: f.v, t: num(f.v) }, { v: f.v, t: pct((f.v / K.budget) * 100) }]) }) })}

<h2>${t('How the Barnett formula works', 'Sut mae fformiwla Barnett yn gweithio')}</h2>
<p>${t('The Barnett formula does not set the whole Welsh budget from scratch each year. It only decides how much the block grant <em>changes</em>. When the UK Government changes spending in England on something that is devolved in Wales – such as health, schools or local councils – Wales gets a share of that change.', 'Nid yw fformiwla Barnett yn pennu’r gyllideb Gymreig gyfan o’r newydd bob blwyddyn. Dim ond penderfynu faint mae’r grant bloc yn <em>newid</em> y mae. Pan fydd Llywodraeth y DU yn newid gwariant yn Lloegr ar rywbeth sydd wedi’i ddatganoli yng Nghymru – fel iechyd, ysgolion neu gynghorau lleol – mae Cymru’n cael cyfran o’r newid hwnnw.')}</p>
<p>${t('The share is worked out by multiplying three things together, plus an extra factor for Wales agreed in 2016:', 'Caiff y gyfran ei chyfrifo drwy luosi tri pheth gyda’i gilydd, ynghyd â ffactor ychwanegol i Gymru a gytunwyd yn 2016:')}</p>
<ol class="steps">
<li>${t('<strong>The change in UK Government spending</strong> on the English programme.', '<strong>Y newid yng ngwariant Llywodraeth y DU</strong> ar y rhaglen yn Lloegr.')}</li>
<li>${t('<strong>The comparability percentage</strong> – how much of that department’s work is devolved in Wales (for example, close to 100% for health).', '<strong>Y ganran gymaroldeb</strong> – faint o waith yr adran honno sydd wedi’i ddatganoli yng Nghymru (er enghraifft, bron 100% ar gyfer iechyd).')}</li>
<li>${t('<strong>The population proportion</strong> – Wales’ population as a share of England’s: 5.49% at Spending Review 2025.', '<strong>Y gyfran poblogaeth</strong> – poblogaeth Cymru fel cyfran o boblogaeth Lloegr: 5.49% yn Adolygiad Gwariant 2025.')}</li>
<li>${t('<strong>A needs-based factor</strong> of 105%, added under the 2016 fiscal framework because Wales’ needs per person are assessed as higher than England’s.', '<strong>Ffactor yn seiliedig ar angen</strong> o 105%, a ychwanegwyd o dan fframwaith cyllidol 2016 am fod anghenion Cymru y pen yn cael eu hasesu’n uwch nag yn Lloegr.')}</li>
</ol>
<div class="calc barnett"><h3>${t('Barnett calculator', 'Cyfrifiannell Barnett')}</h3>
<div class="inputs"><label>${t('Change in UK Government spending on a programme in England, £ million', 'Newid yng ngwariant Llywodraeth y DU ar raglen yn Lloegr, £ miliwn')}<input type="number" name="amt" value="1000" step="50"></label>
<label>${t('Share of that programme devolved in Wales (comparability)', 'Cyfran o’r rhaglen honno sydd wedi’i datganoli yng Nghymru (cymaroldeb)')}: <span class="comp-out">100%</span><input type="range" name="comp" min="0" max="100" value="100"></label></div>
<div class="result"><span>${t('Change to the Welsh block grant', 'Newid i’r grant bloc Cymreig')}</span><output>–</output></div>
<p class="src">${t('Calculated as change × comparability × 5.49% × 1.05. Source', 'Wedi’i gyfrifo fel newid × cymaroldeb × 5.49% × 1.05. Ffynhonnell')}: ${src('sofp')}</p></div>

<p>${t('The Welsh Government decides for itself how to spend the block grant. A Barnett share that arrives because of extra English health spending does not have to be spent on health in Wales.', 'Llywodraeth Cymru sy’n penderfynu sut i wario’r grant bloc. Nid oes rhaid gwario cyfran Barnett sy’n cyrraedd oherwydd gwariant iechyd ychwanegol yn Lloegr ar iechyd yng Nghymru.')}</p>

<div class="note"><p><strong>${t('Is the block grant “money from English taxpayers”?', 'Ai “arian gan drethdalwyr Lloegr” yw’r grant bloc?')}</strong></p>
<p>${t('Not exactly. The block grant is paid from the UK Treasury, which is funded by taxpayers across the whole UK – including people and businesses in Wales – and by UK-wide borrowing. Official statistics do not label any part of it as coming from one nation’s taxpayers. What can be measured is how much tax is raised in Wales compared with how much public money is spent on Wales. We show that on the', 'Ddim yn union. Telir y grant bloc gan Drysorlys y DU, a ariennir gan drethdalwyr ar draws y DU gyfan – gan gynnwys pobl a busnesau yng Nghymru – a chan fenthyca ar draws y DU. Nid yw ystadegau swyddogol yn labelu unrhyw ran ohono fel arian gan drethdalwyr un genedl. Yr hyn y gellir ei fesur yw faint o dreth a godir yng Nghymru o’i gymharu â faint o arian cyhoeddus a werir ar Gymru. Rydym yn dangos hynny ar y dudalen')} <a href="${href('finances', lang)}">${t('tax and spending page', 'treth a gwariant')}</a>.</p></div>

<h2>${t('How the Welsh budget has grown since devolution', 'Sut mae’r gyllideb Gymreig wedi tyfu ers datganoli')}</h2>
<p>${t('The first budget of the National Assembly, for 1999-2000, was planned at £7.8bn. The funding available for 2026-27 is £27.7bn. These are cash figures: prices have also roughly doubled over the period, so the real-terms rise is smaller.', 'Cynlluniwyd cyllideb gyntaf y Cynulliad Cenedlaethol, ar gyfer 1999-2000, ar £7.8bn. Y cyllid sydd ar gael ar gyfer 2026-27 yw £27.7bn. Ffigurau arian parod yw’r rhain: mae prisiau hefyd wedi dyblu’n fras dros y cyfnod, felly mae’r cynnydd mewn termau real yn llai.')}</p>
${chart({ lang, title: t('Welsh budget at selected points, £bn (cash)', 'Y gyllideb Gymreig ar adegau dethol, £bn (arian parod)'), sub: t('Headline totals as published at the time; definitions differ slightly between years – see table.', 'Cyfansymiau pennawd fel y’u cyhoeddwyd ar y pryd; mae’r diffiniadau’n amrywio ychydig rhwng blynyddoedd – gweler y tabl.'), source: `${src('hansard1998')}; ${src('budget2627')}`,
    cfg: { type: 'bar', labels: B.headline.map((h) => h.year), series: [{ name: '£bn', values: B.headline.map((h) => h.v) }], fmt: { prefix: '£', suffix: 'bn', dec: 1 } }, legend: false,
    table: table({ head: [t('Year', 'Blwyddyn'), '£bn', t('Measure', 'Mesur'), t('Source', 'Ffynhonnell')], sortable: false, rows: B.headline.map((h) => [h.year, num(h.v, 1), h.label, h.source]) }) })}
<p>${t('According to the Institute for Fiscal Studies, Welsh Government day-to-day funding grew strongly in real terms in the first decade of devolution, fell by about 5.6% between 2010-11 and 2017-18, and by 2025-26 was 15.0% higher in real terms than in 2010-11 (9.6% higher per person).', 'Yn ôl y Sefydliad Astudiaethau Cyllid, tyfodd cyllid bob dydd Llywodraeth Cymru’n gryf mewn termau real yn negawd cyntaf datganoli, gostyngodd tua 5.6% rhwng 2010-11 a 2017-18, ac erbyn 2025-26 roedd 15.0% yn uwch mewn termau real nag yn 2010-11 (9.6% yn uwch y pen).')} <span class="src">(${src('ifs')})</span></p>

<h2>${t('Funding per person compared with England', 'Cyllid y pen o’i gymharu â Lloegr')}</h2>
<p>${t('The IFS estimates that in 2024-25 the Welsh Government received UK Government funding per person equal to 124.5% of what was spent per person on comparable services in England (126.8% including devolved tax revenue). The independent Holtham Commission estimated in 2010 that Wales’ relative need was 114–117% of England’s.', 'Mae’r IFS yn amcangyfrif bod Llywodraeth Cymru wedi derbyn cyllid y pen gan Lywodraeth y DU yn 2024-25 a oedd yn hafal i 124.5% o’r hyn a wariwyd y pen ar wasanaethau cymaradwy yn Lloegr (126.8% gan gynnwys refeniw trethi datganoledig). Amcangyfrifodd Comisiwn annibynnol Holtham yn 2010 fod angen cymharol Cymru yn 114–117% o angen Lloegr.')}</p>
${chart({ lang, title: t('Welsh Government funding per person as % of comparable spending in England', 'Cyllid Llywodraeth Cymru y pen fel % o wariant cymaradwy yn Lloegr'), source: src('ifs'), legend: false,
    cfg: { type: 'bar', labels: B.rel.map((r) => r.name), series: [{ name: '%', values: B.rel.map((r) => r.v) }], fmt: { suffix: '%', dec: 1 }, min: 100, max: 130 } })}

<h2>${t('Devolved taxes', 'Trethi datganoledig')}</h2>
<p>${t('Since 2018 Wales has had its own land transaction tax (replacing stamp duty) and landfill disposals tax, collected by the Welsh Revenue Authority. Since April 2019 the Senedd has set Welsh rates of income tax: 10p of each band goes to the Welsh Government. When a tax is devolved, the block grant is cut by a “block grant adjustment” so Wales gains only if its revenues grow faster than the equivalent in England and Northern Ireland.', 'Ers 2018 mae gan Gymru ei threth trafodiadau tir ei hun (yn lle treth stamp) a threth gwarediadau tirlenwi, a gesglir gan Awdurdod Cyllid Cymru. Ers Ebrill 2019 mae’r Senedd wedi pennu cyfraddau treth incwm Cymru: mae 10c o bob band yn mynd i Lywodraeth Cymru. Pan gaiff treth ei datganoli, caiff y grant bloc ei leihau gan “addasiad grant bloc” felly dim ond os yw ei refeniw’n tyfu’n gyflymach na’r cyfwerth yn Lloegr a Gogledd Iwerddon y mae Cymru’n elwa.')}</p>
${table({ head: [t('Tax, 2026-27', 'Treth, 2026-27'), t('Revenue £m', 'Refeniw £m'), t('Block grant cut £m', 'Toriad grant bloc £m'), t('Net £m', 'Net £m')], sortable: false, rows: [
    [t('Welsh rates of income tax', 'Cyfraddau treth incwm Cymru'), num(3977), num(-3493), num(3977 - 3493)],
    [t('Land transaction tax', 'Treth trafodiadau tir'), num(399), num(-381), num(399 - 381)],
    [t('Landfill disposals tax', 'Treth gwarediadau tirlenwi'), num(37), num(-14), num(37 - 14)],
  ] })}
<p class="src">${t('Includes reconciliations for earlier years. Business rates (£1,101m) are fully retained in Wales with no block grant adjustment. Source', 'Yn cynnwys cysoniadau ar gyfer blynyddoedd cynharach. Caiff ardrethi busnes (£1,101m) eu cadw’n llawn yng Nghymru heb addasiad grant bloc. Ffynhonnell')}: ${src('budget2627')}</p>

<h2>${t('What the money is spent on', 'Ar beth y caiff yr arian ei wario')}</h2>
${chart({ lang, title: t('Welsh Government spending plans by department, 2026-27', 'Cynlluniau gwario Llywodraeth Cymru fesul adran, 2026-27'), sub: t('Resource and capital, £ million', 'Refeniw a chyfalaf, £ miliwn'), source: src('budget2627'), legend: false,
    cfg: { type: 'hbar', labels: B.spend.map((s) => t(s.name, spendCy[s.name])), series: [{ name: '£m', values: B.spend.map((s) => s.v) }], fmt: { prefix: '£', suffix: 'm' } } })}
<p>${t('More than half of the budget goes on health and social care. Most of the housing and local government line is passed to Wales’ 22 councils, which also raise council tax.', 'Mae mwy na hanner y gyllideb yn mynd ar iechyd a gofal cymdeithasol. Caiff y rhan fwyaf o’r llinell tai a llywodraeth leol ei throsglwyddo i 22 cyngor Cymru, sydd hefyd yn codi treth gyngor.')} <a href="${href('counciltax', lang)}">${t('See council tax by county', 'Gweler treth gyngor fesul sir')}</a>.</p>
`;
  return {
    title: t('Welsh Government budget and the Barnett formula explained', 'Cyllideb Llywodraeth Cymru a fformiwla Barnett wedi’u hegluro'),
    h1: t('Where the Welsh Government’s money comes from', 'O ble daw arian Llywodraeth Cymru'),
    desc: t(`The ${bn(K.budget)} Welsh budget for 2026-27: ${bn(K.block)} block grant via the Barnett formula, Welsh income tax and other devolved taxes. Includes a Barnett calculator and history since 1999.`, `Cyllideb Cymru o ${bn(K.budget)} ar gyfer 2026-27: grant bloc o ${bn(K.block)} drwy fformiwla Barnett, treth incwm Cymru a threthi datganoledig eraill. Gyda chyfrifiannell Barnett a hanes ers 1999.`),
    body, dataset: true,
  };
}

// ============================================================ PUBLIC FINANCES
export function finances(lang) {
  const t = T(lang);
  const yrs = fy.map((y) => y.replace('-', '–'));
  const revItems = F.rev.slice().sort((a, b) => b.v[3] - a.v[3]).slice(0, 10);
  const revCy = { 'Income Tax': 'Treth incwm', 'Value added tax': 'TAW', 'Social Contributions (National Insurance)': 'Yswiriant Gwladol', 'Council Tax': 'Treth gyngor', 'Corporation Tax': 'Treth gorfforaeth', 'Gross Operating Surplus': 'Gwarged gweithredu gros', 'Interest and Dividends': 'Llog a difidendau', 'Fuel Duties': 'Toll tanwydd', 'Business rates (market sector)': 'Ardrethi busnes', 'Tobacco Duties': 'Toll tybaco', 'Alcohol Duties': 'Toll alcohol', 'Environmental Levies': 'Ardollau amgylcheddol', 'Insurance Premium Tax': 'Treth premiwm yswiriant', 'Stamp duty land tax': 'Treth dir y dreth stamp', 'Vehicle excise duties (households+businesses)': 'Treth cerbydau', 'Capital gains tax': 'Treth enillion cyfalaf' };
  const expCy = { 'Social protection': 'Diogelu cymdeithasol (budd-daliadau a phensiynau)', 'Health': 'Iechyd', 'General public services (incl. debt interest)': 'Gwasanaethau cyhoeddus cyffredinol (gan gynnwys llog dyled)', 'Education': 'Addysg', 'Economic affairs (incl. transport)': 'Materion economaidd (gan gynnwys trafnidiaeth)', 'Defence': 'Amddiffyn', 'Public order and safety': 'Trefn gyhoeddus a diogelwch', 'Housing and community amenities': 'Tai ac amwynderau cymunedol', 'Environment protection': 'Diogelu’r amgylchedd', 'Recreation, culture and religion': 'Hamdden a diwylliant', 'Accounting adjustments': 'Addasiadau cyfrifyddu' };
  const expItems = F.exp.filter((e) => !['TOTAL', 'Identifiable total', 'EU transactions'].includes(e.name)).sort((a, b) => b.v[3] - a.v[3]);
  const expEn = { 'Social protection': 'Social protection (benefits & pensions)' };
  const body = `
<p class="lede">${t(`In 2024-25 an estimated ${bn(K.rev)} of tax and other public revenue was raised in Wales, while ${bn(K.exp)} of public spending was attributed to Wales. The difference – the “net fiscal balance” – was ${bn(K.gap)}, or ${gbp(K.gapPH)} per person.`, `Yn 2024-25 amcangyfrifir bod ${bn(K.rev)} o dreth a refeniw cyhoeddus arall wedi’i godi yng Nghymru, tra bod ${bn(K.exp)} o wariant cyhoeddus wedi’i briodoli i Gymru. Y gwahaniaeth – y “balans cyllidol net” – oedd ${bn(K.gap)}, neu ${gbp(K.gapPH)} y pen.`)}</p>
<div class="stats">
${stat(t('Revenue raised in Wales', 'Refeniw a godwyd yng Nghymru'), bn(K.rev), t(`${gbp(K.revPH)} per person (UK ${gbp(K.revPHuk)})`, `${gbp(K.revPH)} y pen (DU ${gbp(K.revPHuk)})`))}
${stat(t('Public spending for Wales', 'Gwariant cyhoeddus ar gyfer Cymru'), bn(K.exp), t(`${gbp(K.expPH)} per person (UK ${gbp(K.expPHuk)})`, `${gbp(K.expPH)} y pen (DU ${gbp(K.expPHuk)})`))}
${stat(t('Net fiscal balance 2024-25', 'Balans cyllidol net 2024-25'), '−' + bn(K.gap).slice(0), t(`${gbp(K.gapPH)} per person`, `${gbp(K.gapPH)} y pen`))}
${stat(t('UK as a whole', 'Y DU gyfan'), '−' + gbp(K.ukPH), t('Net fiscal balance per person', 'Balans cyllidol net y pen'))}
</div>
${chart({ lang, title: t('Public revenue and spending in Wales, 1999-00 to 2024-25', 'Refeniw a gwariant cyhoeddus yng Nghymru, 1999-00 i 2024-25'), sub: t('£ million, cash. Spending includes Wales’ share of UK-wide costs such as defence and debt interest.', '£ miliwn, arian parod. Mae gwariant yn cynnwys cyfran Cymru o gostau ar draws y DU fel amddiffyn a llog dyled.'), source: src('crpsf'),
    views: [t('Total £m', 'Cyfanswm £m'), t('Per person £', 'Y pen £')],
    cfg: { type: 'line', labels: yrs, zero: true, views: [
      { series: [{ name: t('Spending', 'Gwariant'), values: F.expTotal, color: '--c5' }, { name: t('Revenue', 'Refeniw'), values: F.revTotal, color: '--c1' }], fmt: { prefix: '£', suffix: 'm' } },
      { series: [{ name: t('Wales spending', 'Gwariant Cymru'), values: F.ph.EXP_PH.Wales, color: '--c5' }, { name: t('Wales revenue', 'Refeniw Cymru'), values: F.ph.REV_PH.Wales, color: '--c1' }, { name: t('UK spending', 'Gwariant y DU'), values: F.ph.EXP_PH.UK, color: '--c5', dash: '5 4', width: 1.5 }, { name: t('UK revenue', 'Refeniw y DU'), values: F.ph.REV_PH.UK, color: '--c1', dash: '5 4', width: 1.5 }], fmt: { prefix: '£' } },
    ] },
    table: table({ head: [t('Year', 'Blwyddyn'), t('Revenue £m', 'Refeniw £m'), t('Spending £m', 'Gwariant £m'), t('Gap £m', 'Bwlch £m'), t('Gap per person', 'Bwlch y pen')], rows: fy.map((y, i) => [y, { v: F.revTotal[i], t: num(F.revTotal[i]) }, { v: F.expTotal[i], t: num(F.expTotal[i]) }, { v: F.nfbTotal[i], t: num(F.nfbTotal[i]) }, { v: F.ph.NFB_PH.Wales[i], t: gbp(F.ph.NFB_PH.Wales[i]) }]).reverse() }) })}

<h2>${t('The gap per person: Wales, Scotland, England and the UK', 'Y bwlch y pen: Cymru, yr Alban, Lloegr a’r DU')}</h2>
<p>${t('Every nation of the UK, and the UK as a whole, has spent more than it raised in most recent years – the difference is covered by government borrowing. The gap per person in Wales has been larger than the UK average throughout the period.', 'Mae pob un o wledydd y DU, a’r DU gyfan, wedi gwario mwy nag a gododd yn y rhan fwyaf o’r blynyddoedd diweddar – caiff y gwahaniaeth ei dalu drwy fenthyca gan y llywodraeth. Mae’r bwlch y pen yng Nghymru wedi bod yn fwy na chyfartaledd y DU drwy gydol y cyfnod.')}</p>
${chart({ lang, title: t('Net fiscal balance per person (spending minus revenue), £', 'Balans cyllidol net y pen (gwariant llai refeniw), £'), sub: t('Positive = spending higher than revenue. North Sea revenue allocated geographically.', 'Positif = gwariant yn uwch na refeniw. Refeniw Môr y Gogledd wedi’i ddyrannu’n ddaearyddol.'), source: src('crpsf'),
    cfg: { type: 'line', labels: yrs, zero: true, series: [{ name: t('Wales', 'Cymru'), values: F.ph.NFB_PH.Wales }, { name: t('Scotland', 'Yr Alban'), values: F.ph.NFB_PH.Scotland }, { name: t('England', 'Lloegr'), values: F.ph.NFB_PH.England }, { name: 'UK', values: F.ph.NFB_PH.UK, dash: '5 4' }], fmt: { prefix: '£' } } })}

<h2>${t('How much of the gap is above Wales’ share of the UK deficit?', 'Faint o’r bwlch sydd uwchlaw cyfran Cymru o ddiffyg y DU?')}</h2>
<p>${t(`Because the UK as a whole runs a deficit, part of Wales’ gap is simply its population share of UK borrowing. In 2024-25 the UK gap was ${gbp(K.ukPH)} per person; applied to Wales’ population that is ${bn(K.share)}. The remaining ${bn(K.above)} is the amount by which Wales’ gap exceeded its population share – in effect, the net transfer from the rest of the UK that year.`, `Gan fod gan y DU gyfan ddiffyg, mae rhan o fwlch Cymru yn ddim ond ei chyfran poblogaeth o fenthyca’r DU. Yn 2024-25 roedd bwlch y DU yn ${gbp(K.ukPH)} y pen; o’i gymhwyso i boblogaeth Cymru mae hynny’n ${bn(K.share)}. Y ${bn(K.above)} sy’n weddill yw’r swm yr oedd bwlch Cymru’n uwch na’i chyfran poblogaeth – i bob pwrpas, y trosglwyddiad net o weddill y DU y flwyddyn honno.`)}</p>
${chart({ lang, title: t('Wales’ net fiscal balance split into population share of UK deficit and the amount above it, £m', 'Balans cyllidol net Cymru wedi’i rannu’n gyfran poblogaeth o ddiffyg y DU a’r swm uwch ei ben, £m'), sub: t('Our calculation from ONS figures: population share = UK gap per person × Wales population.', 'Ein cyfrifiad o ffigurau’r ONS: cyfran poblogaeth = bwlch y DU y pen × poblogaeth Cymru.'), source: src('crpsf'),
    cfg: { type: 'stack', labels: yrs, showTotal: true, totalLabel: t('Total gap', 'Cyfanswm y bwlch'), series: [{ name: t('Population share of UK deficit', 'Cyfran poblogaeth o ddiffyg y DU'), values: F.ukShare, color: '--c8' }, { name: t('Above population share', 'Uwchlaw cyfran poblogaeth'), values: F.aboveShare, color: '--c2' }], fmt: { prefix: '£', suffix: 'm' } } })}
<div class="note"><p>${t('This transfer comes from taxpayers and borrowing across the rest of the UK – England, Scotland and Northern Ireland together – not from England alone. In practice it is mostly England, which makes up about 84% of the UK population. Several English regions, such as the North East, also spend more per person than they raise.', 'Daw’r trosglwyddiad hwn gan drethdalwyr a benthyca ar draws gweddill y DU – Lloegr, yr Alban a Gogledd Iwerddon gyda’i gilydd – nid gan Loegr yn unig. Yn ymarferol Lloegr yw’r rhan fwyaf ohono, gan ei bod yn cynnwys tua 84% o boblogaeth y DU. Mae sawl rhanbarth yn Lloegr, fel y Gogledd-ddwyrain, hefyd yn gwario mwy y pen nag y maent yn ei godi.')}</p></div>

<h2>${t('Where the revenue comes from', 'O ble daw’r refeniw')}</h2>
<p>${t('Most tax paid in Wales is UK tax collected by HMRC – VAT, income tax and National Insurance – rather than taxes controlled by the Senedd.', 'Trethi’r DU a gesglir gan CThEF yw’r rhan fwyaf o’r dreth a delir yng Nghymru – TAW, treth incwm ac Yswiriant Gwladol – yn hytrach na threthi a reolir gan y Senedd.')}</p>
${chart({ lang, title: t('Largest sources of public revenue in Wales, 2024-25, £m', 'Ffynonellau mwyaf refeniw cyhoeddus yng Nghymru, 2024-25, £m'), source: src('crpsf'), legend: false,
    cfg: { type: 'hbar', labels: revItems.map((r) => t(r.name, revCy[r.name] || r.name)), series: [{ name: '£m', values: revItems.map((r) => r.v[3]) }], fmt: { prefix: '£', suffix: 'm' } },
    table: table({ head: [t('Revenue', 'Refeniw'), '1999-00', '2009-10', '2019-20', '2024-25'], rows: F.rev.map((r) => [t(r.name, revCy[r.name] || r.name), ...r.v.map((v) => ({ v, t: num(v) }))]) }) })}

<h2>${t('Where the spending goes', 'Ble mae’r gwariant yn mynd')}</h2>
<p>${t('The biggest item is social protection – mainly state pensions and benefits paid by the UK Government. Only part of total spending for Wales is controlled by the Welsh Government.', 'Yr eitem fwyaf yw diogelu cymdeithasol – pensiynau’r wladwriaeth a budd-daliadau a delir gan Lywodraeth y DU yn bennaf. Dim ond rhan o gyfanswm y gwariant ar gyfer Cymru a reolir gan Lywodraeth Cymru.')}</p>
${chart({ lang, title: t('Public spending for Wales by function, 2024-25, £m', 'Gwariant cyhoeddus ar gyfer Cymru fesul swyddogaeth, 2024-25, £m'), source: src('crpsf'), legend: false,
    cfg: { type: 'hbar', labels: expItems.map((e) => t(expEn[e.name] || e.name, expCy[e.name] || e.name)), series: [{ name: '£m', values: expItems.map((e) => e.v[3]) }], fmt: { prefix: '£', suffix: 'm' } },
    table: table({ head: [t('Function', 'Swyddogaeth'), '1999-00', '2009-10', '2019-20', '2024-25'], rows: F.exp.filter((e) => e.name !== 'Identifiable total').map((e) => [t(e.name, expCy[e.name] || e.name), ...e.v.map((v) => ({ v, t: num(v) }))]) }) })}

<h2>${t('About these figures', 'Am y ffigurau hyn')}</h2>
<details><summary>${t('What does “net fiscal balance” mean?', 'Beth yw ystyr “balans cyllidol net”?')}</summary><p>${t('It is total public sector spending for the benefit of a country or region minus the public revenue raised there. It is not the same as government borrowing: Wales cannot borrow to cover it, and the Welsh Government’s own budget must balance.', 'Dyma gyfanswm y gwariant sector cyhoeddus er budd gwlad neu ranbarth llai’r refeniw cyhoeddus a godir yno. Nid yw’r un peth â benthyca gan y llywodraeth: ni all Cymru fenthyca i’w dalu, a rhaid i gyllideb Llywodraeth Cymru ei hun fantoli.')}</p></details>
<details><summary>${t('Why is spending per person higher in Wales?', 'Pam mae gwariant y pen yn uwch yng Nghymru?')}</summary><p>${t(`In 2024-25 public spending per person was ${gbp(K.expPH)} in Wales and ${gbp(K.expPHuk)} across the UK. The ONS tables show the largest item is social protection, which includes pensions and benefits. This site does not attempt to explain the causes; the Institute for Fiscal Studies and Cardiff University’s Wales Fiscal Analysis publish detailed analysis.`, `Yn 2024-25 roedd gwariant cyhoeddus y pen yn ${gbp(K.expPH)} yng Nghymru a ${gbp(K.expPHuk)} ar draws y DU. Mae tablau’r ONS yn dangos mai diogelu cymdeithasol yw’r eitem fwyaf, sy’n cynnwys pensiynau a budd-daliadau. Nid yw’r wefan hon yn ceisio egluro’r achosion; mae’r Sefydliad Astudiaethau Cyllid a Dadansoddi Cyllidol Cymru Prifysgol Caerdydd yn cyhoeddi dadansoddiad manwl.`)}</p></details>
<details><summary>${t('How reliable are these estimates?', 'Pa mor ddibynadwy yw’r amcangyfrifon hyn?')}</summary><p>${t('Many UK taxes are not collected by region, so the ONS allocates them using surveys and other data. Spending such as defence is shared out by population. The figures are official statistics but should be treated as estimates, and earlier years are revised in each edition.', 'Ni chaiff llawer o drethi’r DU eu casglu fesul rhanbarth, felly mae’r ONS yn eu dyrannu gan ddefnyddio arolygon a data arall. Caiff gwariant fel amddiffyn ei rannu yn ôl poblogaeth. Ystadegau swyddogol yw’r ffigurau ond dylid eu trin fel amcangyfrifon, a chaiff blynyddoedd cynharach eu diwygio ym mhob rhifyn.')}</p></details>
`;
  return {
    title: t(`Wales tax and spending: the ${bn(K.gap)} fiscal gap explained`, `Treth a gwariant Cymru: y bwlch cyllidol o ${bn(K.gap)} wedi’i egluro`),
    h1: t('Tax raised and money spent in Wales', 'Treth a godir ac arian a werir yng Nghymru'),
    desc: t(`ONS figures: ${bn(K.rev)} raised and ${bn(K.exp)} spent in Wales in 2024-25, a gap of ${bn(K.gap)} (${gbp(K.gapPH)} per person). Every year since 1999, compared with the UK.`, `Ffigurau’r ONS: ${bn(K.rev)} wedi’i godi a ${bn(K.exp)} wedi’i wario yng Nghymru yn 2024-25, bwlch o ${bn(K.gap)} (${gbp(K.gapPH)} y pen). Pob blwyddyn ers 1999, o’i gymharu â’r DU.`),
    body, dataset: true,
  };
}

// ============================================================ ECONOMY (GVA by industry)
export function economy(lang) {
  const t = T(lang);
  const I = wales.industry.W, U = wales.industry.UK;
  const total = I['All industries'];
  const main = ['Manufacturing', 'Real estate activities', 'Human health and social work activities', 'Public administration and defence; compulsory social security', 'Wholesale and retail trade, repair of motor vehicles', 'Construction', 'Education', 'Financial and insurance activities', 'Professional, scientific and technical activities', 'Administrative and support service activities', 'Accomodation and food service activities', 'Transportation and storage', 'Information and communication', 'Electricity, gas, steam and air-conditioning supply', 'Water supply; sewerage, waste management', 'Agriculture, forestry and fishing', 'Other service activities', 'Arts, entertainment and recreation', 'Mining and quarrying', 'Activities of Households'];
  const share = (k, i) => (I[k][i] / total[i]) * 100;
  const ukShare = (k, j) => (U[k][j] / U['All industries'][j]) * 100; // j: 0=1998,1=2008,2=2018,3=2024
  const sorted = main.slice().sort((a, b) => I[b][GN] - I[a][GN]);
  const top = sorted[0];
  const lineKeys = ['Manufacturing', 'Human health and social work activities', 'Real estate activities', 'Public administration and defence; compulsory social security', 'Wholesale and retail trade, repair of motor vehicles', 'Financial and insurance activities'];
  const manuSub = ['Transport Equipment', 'Food products, beverages and tobacco', 'Manufacture of pharmaceutical products', 'Computer, electronic and optical products', 'Manufacture of coke, refined petroleum and chemicals', 'Manufacture of basic metals'];
  const reg = wales.regions;
  const body = `
<p class="lede">${t(`Wales produced ${bn(K.gva)} of gross value added (GVA) in 2024 – the value of the goods and services made here. Measured by output, manufacturing is still Wales’ single biggest industry at ${pct(share(top, GN))} of the economy, down from ${pct(share(top, 0))} in 1998. Health and social work has gained the most ground, rising from ${pct(share('Human health and social work activities', 0))} to ${pct(share('Human health and social work activities', GN))} of output.`, `Cynhyrchodd Cymru ${bn(K.gva)} o werth ychwanegol gros (GYC) yn 2024 – gwerth y nwyddau a’r gwasanaethau a wneir yma. Wedi’i fesur yn ôl allbwn, gweithgynhyrchu yw diwydiant unigol mwyaf Cymru o hyd, sef ${pct(share(top, GN))} o’r economi, i lawr o ${pct(share(top, 0))} yn 1998. Iechyd a gwaith cymdeithasol sydd wedi ennill y mwyaf o dir, gan godi o ${pct(share('Human health and social work activities', 0))} i ${pct(share('Human health and social work activities', GN))} o’r allbwn.`)}</p>
<div class="stats">
${stat(t('GVA 2024', 'GYC 2024'), bn(K.gva), t(`${bn(GV.m[0])} in 1998 (cash)`, `${bn(GV.m[0])} yn 1998 (arian parod)`))}
${stat(t('GVA per person', 'GYC y pen'), gbp(K.gvaPH), t(`${pct(K.gvaIdx)} of UK average (1998: ${pct(K.gvaIdx98)})`, `${pct(K.gvaIdx)} o gyfartaledd y DU (1998: ${pct(K.gvaIdx98)})`))}
${stat(t('Largest industry by output', 'Diwydiant mwyaf yn ôl allbwn'), t('Manufacturing', 'Gweithgynhyrchu'), t(`${bn(I[top][GN])}, or ${pct(share(top, GN))} of the economy (UK ${pct(ukShare(top, 3))})`, `${bn(I[top][GN])}, neu ${pct(share(top, GN))} o’r economi (DU ${pct(ukShare(top, 3))})`))}
${stat(t('Health & social work', 'Iechyd a gwaith cymdeithasol'), bn(I['Human health and social work activities'][GN]), t(`${pct(share('Human health and social work activities', GN))} of GVA (1998: ${pct(share('Human health and social work activities', 0))})`, `${pct(share('Human health and social work activities', GN))} o GYC (1998: ${pct(share('Human health and social work activities', 0))})`))}
</div>
${chart({ lang, title: t('Wales’ economy by industry, 2024', 'Economi Cymru fesul diwydiant, 2024'), sub: t('Gross value added, £ million', 'Gwerth ychwanegol gros, £ miliwn'), source: src('gvaInd'), legend: false,
    cfg: { type: 'hbar', labels: sorted.map((k) => indName(k, lang)), series: [{ name: '£m', values: sorted.map((k) => I[k][GN]) }], fmt: { prefix: '£', suffix: 'm' } },
    table: table({ head: [t('Industry', 'Diwydiant'), t('2024 £m', '2024 £m'), t('Share of Wales', 'Cyfran Cymru'), t('Share of UK', 'Cyfran y DU'), t('Share in 1998', 'Cyfran yn 1998')], rows: sorted.map((k) => [indName(k, lang), { v: I[k][GN], t: num(I[k][GN]) }, { v: share(k, GN), t: pct(share(k, GN)) }, { v: ukShare(k, 3), t: pct(ukShare(k, 3)) }, { v: share(k, 0), t: pct(share(k, 0)) }]) }) })}
<div class="note"><p>${t('“Real estate” includes <strong>imputed rent</strong> – an estimate of the rent home-owners would pay to live in their own homes. It is part of official GVA but is not cash income. In 2024 it was', '“Eiddo tiriog” yn cynnwys <strong>rhent tybiannol</strong> – amcangyfrif o’r rhent y byddai perchnogion tai yn ei dalu i fyw yn eu cartrefi eu hunain. Mae’n rhan o GYC swyddogol ond nid yw’n incwm arian parod. Yn 2024 roedd yn')} ${bn(I["Owner-occupiers' imputed rental"][GN])}.</p></div>

<h2>${t('How the mix has changed since 1998', 'Sut mae’r cymysgedd wedi newid ers 1998')}</h2>
${chart({ lang, title: t('Share of Welsh GVA by industry, 1998–2024', 'Cyfran o GYC Cymru fesul diwydiant, 1998–2024'), sub: t('% of total gross value added. Click legend items to hide them.', '% o gyfanswm gwerth ychwanegol gros. Cliciwch eitemau’r allwedd i’w cuddio.'), source: src('gvaInd'),
    views: [t('% share', '% cyfran'), t('£ million', '£ miliwn')],
    cfg: { type: 'line', labels: GV.years, views: [
      { series: lineKeys.map((k) => ({ name: indName(k, lang), values: GV.years.map((_, i) => +share(k, i).toFixed(1)) })), fmt: { suffix: '%', dec: 1 }, zero: true },
      { series: lineKeys.map((k) => ({ name: indName(k, lang), values: I[k] })), fmt: { prefix: '£', suffix: 'm' }, zero: true },
    ] } })}

<h2>${t('Inside manufacturing', 'Y tu mewn i weithgynhyrchu')}</h2>
<p>${t('Manufacturing in Wales covers aerospace (such as wing-making in Flintshire), vehicle parts, food and drink, electronics, oil refining in Pembrokeshire and steel. The ONS publishes these sub-sectors separately:', 'Mae gweithgynhyrchu yng Nghymru yn cynnwys awyrofod (fel gwneud adenydd yn Sir y Fflint), rhannau cerbydau, bwyd a diod, electroneg, puro olew yn Sir Benfro a dur. Mae’r ONS yn cyhoeddi’r is-sectorau hyn ar wahân:')}</p>
${chart({ lang, title: t('Selected manufacturing sub-sectors, Wales, £m', 'Is-sectorau gweithgynhyrchu dethol, Cymru, £m'), source: src('gvaInd'),
    cfg: { type: 'line', labels: GV.years, zero: true, series: manuSub.map((k) => ({ name: indName(k, lang), values: I[k] })), fmt: { prefix: '£', suffix: 'm' } } })}

<h2>${t('Output per person compared with the UK', 'Allbwn y pen o’i gymharu â’r DU')}</h2>
<p>${t(`GVA per person in Wales was ${pct(K.gvaIdx)} of the UK average in 2024, compared with ${pct(K.gvaIdx98)} in 1998. Per-person GVA is affected by the share of people who are of working age and by commuting, so household income (shown on the`, `Roedd GYC y pen yng Nghymru yn ${pct(K.gvaIdx)} o gyfartaledd y DU yn 2024, o’i gymharu â ${pct(K.gvaIdx98)} yn 1998. Effeithir ar GYC y pen gan gyfran y bobl o oedran gweithio a chan gymudo, felly mae incwm aelwydydd (a ddangosir ar y dudalen`)} <a href="${href('incomes', lang)}">${t('incomes page', 'incwm')}</a>${t(') is often a better guide to living standards.', ') yn aml yn well canllaw i safonau byw.')}</p>
${chart({ lang, title: t('GVA per person, £ (cash)', 'GYC y pen, £ (arian parod)'), source: src('gvaLA'),
    cfg: { type: 'line', labels: GV.years, series: [{ name: 'UK', values: wales.ukGva.ph, dash: '5 4' }, { name: t('Wales', 'Cymru'), values: GV.ph }, { name: t('South East Wales', 'De-ddwyrain Cymru'), values: reg['South East Wales'].ph, width: 1.5 }, { name: t('North Wales', 'Gogledd Cymru'), values: reg['North Wales'].ph, width: 1.5 }, { name: t('South West Wales', 'De-orllewin Cymru'), values: reg['South West Wales'].ph, width: 1.5 }, { name: t('Mid Wales', 'Canolbarth Cymru'), values: reg['Mid Wales'].ph, width: 1.5 }], fmt: { prefix: '£' } } })}
<h2>${t('Which areas generate the most?', 'Pa ardaloedd sy’n cynhyrchu fwyaf?')}</h2>
<p>${t(`Cardiff produces more output than any other county – ${bn(last(profiles.find((p) => p.slug === 'cardiff').gva.m))} in 2024, about ${pct((last(profiles.find((p) => p.slug === 'cardiff').gva.m) / K.gva) * 100, 0)} of Wales’ total.`, `Caerdydd sy’n cynhyrchu mwy o allbwn nag unrhyw sir arall – ${bn(last(profiles.find((p) => p.slug === 'cardiff').gva.m))} yn 2024, tua ${pct((last(profiles.find((p) => p.slug === 'cardiff').gva.m) / K.gva) * 100, 0)} o gyfanswm Cymru.`)} <a href="${href('counties', lang)}">${t('Compare all 22 counties', 'Cymharu pob un o’r 22 sir')}</a>.</p>
${chart({ lang, title: t('GVA by county, 2024, £m', 'GYC fesul sir, 2024, £m'), source: src('gvaLA'), legend: false,
    cfg: { type: 'hbar', labels: profiles.map((p) => nm(p, lang)), links: profiles.map((p) => countyHref(p, lang)), series: [{ name: '£m', values: profiles.map((p) => last(p.gva.m)) }], fmt: { prefix: '£', suffix: 'm' } } })}
<p class="meta">${t('Latest quarterly estimate: in July–September 2025 manufacturing contributed £3.3bn (15%) of Welsh GDP of £22.1bn (experimental statistics).', 'Amcangyfrif chwarterol diweddaraf: yng Ngorffennaf–Medi 2025 cyfrannodd gweithgynhyrchu £3.3bn (15%) o CMC Cymru o £22.1bn (ystadegau arbrofol).')} ${src('gdpQ')}</p>
`;
  return {
    title: t('Wales’ biggest industries: GVA by sector since 1998', 'Diwydiannau mwyaf Cymru: GYC fesul sector ers 1998'),
    h1: t('What Wales earns its living from', 'Sut mae Cymru’n ennill ei bywoliaeth'),
    desc: t(`Manufacturing is Wales’ largest industry at ${pct(share(top, GN))} of a ${bn(K.gva)} economy (2024). Interactive charts of every sector since 1998, manufacturing sub-sectors and output by county.`, `Gweithgynhyrchu yw diwydiant mwyaf Cymru, sef ${pct(share(top, GN))} o economi ${bn(K.gva)} (2024). Siartiau rhyngweithiol o bob sector ers 1998, is-sectorau gweithgynhyrchu ac allbwn fesul sir.`),
    body, dataset: true,
  };
}

// ============================================================ TRADE
export function trade(lang) {
  const t = T(lang);
  const TR = wales.trade;
  const cyC = { 'United States': 'Unol Daleithiau', Germany: 'Yr Almaen', Ireland: 'Iwerddon', France: 'Ffrainc', Netherlands: 'Yr Iseldiroedd', Belgium: 'Gwlad Belg', China: 'Tsieina', Spain: 'Sbaen', Canada: 'Canada', India: 'India', Libya: 'Libya', Turkey: 'Twrci' };
  const cyP = { 'Power generating machinery & equipment': 'Peiriannau cynhyrchu pŵer (e.e. peiriannau awyrennau)', 'Petroleum & petroleum products (oil)': 'Petrolewm a chynhyrchion olew', 'Other transport equipment (mainly aircraft & parts)': 'Offer trafnidiaeth arall (awyrennau a rhannau yn bennaf)', 'Iron & steel': 'Haearn a dur', 'Electrical machinery & appliances': 'Peiriannau a chyfarpar trydanol', 'Medicinal & pharmaceutical products': 'Cynhyrchion meddyginiaethol a fferyllol', 'Chemical materials & products': 'Deunyddiau a chynhyrchion cemegol', 'Specialised industrial machinery': 'Peiriannau diwydiannol arbenigol', 'Road vehicles': 'Cerbydau ffordd', 'Non-ferrous metals': 'Metelau anfferrus', 'Scientific & controlling instruments': 'Offerynnau gwyddonol', 'Electric current': 'Trydan', 'Other transport equipment': 'Offer trafnidiaeth arall', 'Miscellaneous manufactured articles': 'Nwyddau gweithgynhyrchu amrywiol', 'General industrial machinery': 'Peiriannau diwydiannol cyffredinol' };
  const enP = { 'Power generating machinery & equipment': 'Power generating machinery (e.g. aero engines)' };
  const yrs = TR.annual.map((a) => a.year);
  const body = `
<p class="lede">${t(`Wales exported £${num(K.tradeExp, 1)}bn of goods to other countries in 2025 and imported £${num(K.tradeImp, 1)}bn. Its biggest exports are power-generating machinery such as aircraft engines, aircraft and parts, and oil products; its biggest import is oil and petroleum products.`, `Allforiodd Cymru werth £${num(K.tradeExp, 1)}bn o nwyddau i wledydd eraill yn 2025 a mewnforiodd werth £${num(K.tradeImp, 1)}bn. Ei hallforion mwyaf yw peiriannau cynhyrchu pŵer fel peiriannau awyrennau, awyrennau a rhannau, a chynhyrchion olew; ei mewnforyn mwyaf yw olew a chynhyrchion petrolewm.`)}</p>
<div class="stats">
${stat(t('Goods exports 2025', 'Allforion nwyddau 2025'), '£' + num(K.tradeExp, 1) + 'bn', t(`2013: £${num(TR.annual[0].exp, 1)}bn`, `2013: £${num(TR.annual[0].exp, 1)}bn`))}
${stat(t('Goods imports 2025', 'Mewnforion nwyddau 2025'), '£' + num(K.tradeImp, 1) + 'bn', t(`2013: £${num(TR.annual[0].imp, 1)}bn`, `2013: £${num(TR.annual[0].imp, 1)}bn`))}
${stat(t('Top export market', 'Prif farchnad allforio'), t('United States', 'Unol Daleithiau'), `£${num(TR.expP[0].v / 1000, 1)}bn`)}
${stat(t('Exports to the EU', 'Allforion i’r UE'), '£10.7bn', t('in 2025 – more than half of the total (Senedd Research)', 'yn 2025 – mwy na hanner y cyfanswm (Ymchwil y Senedd)'))}
</div>
${chart({ lang, title: t('Welsh goods exports and imports, 2013–2025, £bn', 'Allforion a mewnforion nwyddau Cymru, 2013–2025, £bn'), sub: t('Trade with countries outside the UK. Excludes services and trade with the rest of the UK.', 'Masnach â gwledydd y tu allan i’r DU. Ac eithrio gwasanaethau a masnach â gweddill y DU.'), source: src('rts'),
    cfg: { type: 'bar', labels: yrs, series: [{ name: t('Exports', 'Allforion'), values: TR.annual.map((a) => a.exp), color: '--c1' }, { name: t('Imports', 'Mewnforion'), values: TR.annual.map((a) => a.imp), color: '--c2' }], fmt: { prefix: '£', suffix: 'bn', dec: 1 } },
    table: table({ head: [t('Year', 'Blwyddyn'), t('Exports £bn', 'Allforion £bn'), t('Imports £bn', 'Mewnforion £bn'), t('Balance £bn', 'Balans £bn')], rows: TR.annual.map((a) => [String(a.year), { v: a.exp, t: num(a.exp, 2) }, { v: a.imp, t: num(a.imp, 2) }, { v: a.exp - a.imp, t: num(a.exp - a.imp, 2) }]).reverse() }) })}
<div class="two">
${chart({ lang, title: t('Top goods exports, 2025, £m', 'Prif allforion nwyddau, 2025, £m'), source: src('rts'), legend: false, views: ['2025', '2013'],
    cfg: { type: 'hbar', labels: TR.exp.map((e) => t(enP[e.name] || e.name, cyP[e.name] || e.name)), views: [{ series: [{ name: '2025', values: TR.exp.map((e) => e.y2025) }] }, { series: [{ name: '2013', values: TR.exp.map((e) => e.y2013) }] }], series: [], fmt: { prefix: '£', suffix: 'm' } } })}
${chart({ lang, title: t('Top goods imports, 2025, £m', 'Prif fewnforion nwyddau, 2025, £m'), source: src('rts'), legend: false, views: ['2025', '2013'],
    cfg: { type: 'hbar', labels: TR.imp.map((e) => t(enP[e.name] || e.name, cyP[e.name] || e.name)), views: [{ series: [{ name: '2025', values: TR.imp.map((e) => e.y2025) }] }, { series: [{ name: '2013', values: TR.imp.map((e) => e.y2013) }] }], series: [], fmt: { prefix: '£', suffix: 'm' } } })}
</div>
<div class="two">
${chart({ lang, title: t('Where Welsh exports go, 2025, £m', 'I ble mae allforion Cymru’n mynd, 2025, £m'), source: src('rts'), legend: false, cfg: { type: 'hbar', labels: TR.expP.map((c) => t(c.name, cyC[c.name] || c.name)), series: [{ name: '£m', values: TR.expP.map((c) => c.v) }], fmt: { prefix: '£', suffix: 'm' } } })}
${chart({ lang, title: t('Where Welsh imports come from, 2025, £m', 'O ble daw mewnforion Cymru, 2025, £m'), source: src('rts'), legend: false, cfg: { type: 'hbar', labels: TR.impP.map((c) => t(c.name, cyC[c.name] || c.name)), series: [{ name: '£m', values: TR.impP.map((c) => c.v), color: '--c2' }], fmt: { prefix: '£', suffix: 'm' } } })}
</div>
<h2>${t('Things to know about these figures', 'Pethau i’w gwybod am y ffigurau hyn')}</h2>
<ul>
<li>${t('They cover <strong>goods only</strong>. The Welsh Government notes that services make up roughly 30% of Welsh exports, based on experimental ONS estimates.', 'Maent yn cwmpasu <strong>nwyddau yn unig</strong>. Mae Llywodraeth Cymru’n nodi bod gwasanaethau’n cyfrif am tua 30% o allforion Cymru, yn seiliedig ar amcangyfrifon arbrofol yr ONS.')}</li>
<li>${t('They exclude sales to England, Scotland and Northern Ireland, which are not recorded as trade.', 'Nid ydynt yn cynnwys gwerthiannau i Loegr, yr Alban a Gogledd Iwerddon, nad ydynt yn cael eu cofnodi fel masnach.')}</li>
<li>${t('Oil and fuel prices affect the totals from year to year, for example in 2022. HMRC corrected oil and gas export figures from 2021 onwards in January 2026.', 'Mae prisiau olew a thanwydd yn effeithio ar y cyfansymiau o flwyddyn i flwyddyn, er enghraifft yn 2022. Cywirodd CThEF ffigurau allforio olew a nwy o 2021 ymlaen ym mis Ionawr 2026.')}</li>
<li>${t('Trade is allocated to Wales by where the business that trades is based, and the latest quarters are provisional.', 'Caiff masnach ei dyrannu i Gymru yn ôl lle mae’r busnes sy’n masnachu wedi’i leoli, ac mae’r chwarteri diweddaraf yn rhai dros dro.')}</li>
</ul>
<p class="src">${t('See also', 'Gweler hefyd')}: ${src('tradeWG')}</p>
`;
  return {
    title: t('Welsh exports and imports: what Wales trades and with whom', 'Allforion a mewnforion Cymru: beth mae Cymru’n ei fasnachu a gyda phwy'),
    h1: t('Wales’ exports and imports', 'Allforion a mewnforion Cymru'),
    desc: t(`Wales exported £${num(K.tradeExp, 1)}bn of goods in 2025. Top exports, imports and trading partners, with HMRC data from 2013.`, `Allforiodd Cymru werth £${num(K.tradeExp, 1)}bn o nwyddau yn 2025. Prif allforion, mewnforion a phartneriaid masnachu, gyda data CThEF o 2013.`),
    body, dataset: true,
  };
}

// ============================================================ COUNCIL TAX
export function counciltax(lang) {
  const t = T(lang);
  const yrs = wales.ct.years;
  const from = 3; // 1996-97 (first year of current councils)
  const rows = profiles.map((p) => { const v = p.ct.v; const prev = v[v.length - 2]; return { p, v: last(v), prev, ch: ((last(v) - prev) / prev) * 100, c: p.ct.comp, ten: v[v.length - 11] }; });
  const hi = rows.slice().sort((a, b) => b.v - a.v);
  const bands = [['A', 6], ['B', 7], ['C', 8], ['D', 9], ['E', 11], ['F', 13], ['G', 15], ['H', 18], ['I', 21]];
  const body = `
<p class="lede">${t(`The average band D council tax in Wales for 2026-27 is ${gbp(K.ct)}, up ${pct(((K.ct - K.ctPrev) / K.ctPrev) * 100)} on the year. The highest is in ${nm(hi[0].p, lang)} (${gbp(hi[0].v)}) and the lowest in ${nm(last(hi).p, lang)} (${gbp(last(hi).v)}).`, `Y dreth gyngor band D gyfartalog yng Nghymru ar gyfer 2026-27 yw ${gbp(K.ct)}, cynnydd o ${pct(((K.ct - K.ctPrev) / K.ctPrev) * 100)} ar y flwyddyn. Mae’r uchaf yn ${nm(hi[0].p, lang)} (${gbp(hi[0].v)}) a’r isaf yn ${nm(last(hi).p, lang)} (${gbp(last(hi).v)}).`)}</p>
<div class="stats">
${stat(t('Wales average band D', 'Band D cyfartalog Cymru'), gbp(K.ct), '2026-27')}
${stat(t('Highest', 'Uchaf'), gbp(hi[0].v), nm(hi[0].p, lang))}
${stat(t('Lowest', 'Isaf'), gbp(last(hi).v), nm(last(hi).p, lang))}
${stat(t('Wales average in 1996-97', 'Cyfartaledd Cymru yn 1996-97'), gbp(K.ct97), t('first year of the 22 councils', 'blwyddyn gyntaf y 22 cyngor'))}
</div>
${chart({ lang, title: t('Band D council tax by county, 2026-27', 'Treth gyngor Band D fesul sir, 2026-27'), sub: t('£ per year, including police and community council elements. Wales average highlighted in table.', '£ y flwyddyn, gan gynnwys elfennau’r heddlu a’r cyngor cymuned.'), source: src('ct'), legend: false,
    cfg: { type: 'hbar', labels: profiles.map((p) => nm(p, lang)), links: profiles.map((p) => countyHref(p, lang)), series: [{ name: '£', values: profiles.map((p) => last(p.ct.v)), color: '--c5' }], fmt: { prefix: '£' } } })}
<h2>${t('Every county compared', 'Cymharu pob sir')}</h2>
<p>${t('Click a column heading to sort. Band D is the standard comparison; most homes in Wales are in lower bands.', 'Cliciwch bennawd colofn i drefnu. Band D yw’r gymhariaeth safonol; mae’r rhan fwyaf o gartrefi yng Nghymru mewn bandiau is.')}</p>
${table({ head: [t('County', 'Sir'), t('Band D 2026-27', 'Band D 2026-27'), t('Change on year', 'Newid ar y flwyddyn'), t('10 years ago (2016-17)', '10 mlynedd yn ôl (2016-17)'), t('Council', 'Cyngor'), t('Police', 'Heddlu'), t('Community', 'Cymuned')], rows: hi.map((r) => [`<a href="${countyHref(r.p, lang)}">${nm(r.p, lang)}</a>`, { v: r.v, t: gbp(r.v) }, { v: r.ch, t: pct(r.ch) }, { v: r.ten, t: gbp(r.ten) }, { v: r.c.county, t: gbp(r.c.county) }, { v: r.c.police, t: gbp(r.c.police) }, { v: r.c.community, t: gbp(r.c.community) }]).concat([[`<strong>${t('Wales', 'Cymru')}</strong>`, { v: K.ct, t: `<strong>${gbp(K.ct)}</strong>` }, { v: ((K.ct - K.ctPrev) / K.ctPrev) * 100, t: pct(((K.ct - K.ctPrev) / K.ctPrev) * 100) }, { v: wales.ct.v[CTN - 10], t: gbp(wales.ct.v[CTN - 10]) }, { v: wales.ct.comp.county, t: gbp(wales.ct.comp.county) }, { v: wales.ct.comp.police, t: gbp(wales.ct.comp.police) }, { v: wales.ct.comp.community, t: gbp(wales.ct.comp.community) }]]) })}
<h2>${t('How council tax has risen over time', 'Sut mae’r dreth gyngor wedi codi dros amser')}</h2>
${chart({ lang, title: t('Average band D council tax, Wales, 1993-94 to 2026-27 (£, cash)', 'Treth gyngor band D gyfartalog, Cymru, 1993-94 i 2026-27 (£, arian parod)'), source: src('ct'), legend: false,
    cfg: { type: 'bar', labels: yrs, series: [{ name: t('Wales', 'Cymru'), values: wales.ct.v }], fmt: { prefix: '£' } } })}
${chart({ lang, title: t('Band D council tax in selected counties, £', 'Treth gyngor Band D mewn siroedd dethol, £'), sub: t('Highest, lowest and largest counties', 'Siroedd uchaf, isaf a mwyaf'), source: src('ct'),
    cfg: { type: 'line', labels: yrs.slice(from), series: [hi[0], hi[1], ...rows.filter((r) => ['cardiff', 'swansea', 'rhondda-cynon-taf'].includes(r.p.slug))].map((r) => ({ name: nm(r.p, lang), values: r.p.ct.v.slice(from) })).concat([{ name: t('Wales', 'Cymru'), values: wales.ct.v.slice(from), dash: '5 4' }]), fmt: { prefix: '£' } } })}
<h2>${t('What each band pays', 'Faint mae pob band yn ei dalu')}</h2>
<p>${t('Bills for other bands are a fixed fraction of band D – from 6/9 for band A to 21/9 for band I. Based on the Wales average:', 'Mae biliau bandiau eraill yn ffracsiwn sefydlog o fand D – o 6/9 ar gyfer band A i 21/9 ar gyfer band I. Yn seiliedig ar gyfartaledd Cymru:')}</p>
${table({ head: [t('Band', 'Band'), t('Ratio to D', 'Cymhareb i D'), t('Average bill 2026-27', 'Bil cyfartalog 2026-27')], sortable: false, rows: bands.map(([b, r]) => [b, `${r}/9`, gbp((K.ct * r) / 9)]) })}
<p class="src">${t('Wales has nine bands (A–I) based on 2003 property values. See also', 'Mae gan Gymru naw band (A–I) yn seiliedig ar werthoedd eiddo 2003. Gweler hefyd')}: ${src('ctRelease')}</p>
`;
  return {
    title: t(`Council tax in Wales 2026-27: band D for all 22 councils`, `Treth gyngor yng Nghymru 2026-27: band D ar gyfer pob un o’r 22 cyngor`),
    h1: t('Council tax in Wales by county', 'Treth gyngor yng Nghymru fesul sir'),
    desc: t(`Average band D council tax in Wales is ${gbp(K.ct)} in 2026-27. Highest: ${hi[0].p.en} ${gbp(hi[0].v)}. Lowest: ${last(hi).p.en} ${gbp(last(hi).v)}. Compare every council and see how bills have changed since 1996.`, `Treth gyngor band D gyfartalog yng Nghymru yw ${gbp(K.ct)} yn 2026-27. Uchaf: ${hi[0].p.cy} ${gbp(hi[0].v)}. Isaf: ${last(hi).p.cy} ${gbp(last(hi).v)}. Cymharwch bob cyngor a gweld sut mae biliau wedi newid ers 1996.`),
    body, dataset: true,
  };
}

// ============================================================ JOBS
export function jobs(lang) {
  const t = T(lang);
  const per = wales.aps.periods.map((p) => (p === 'Jun 2026' ? t('Jun 2026', 'Meh 2026') : p));
  const uLatest = profiles.map((p) => ({ p, v: last(p.aps.U) })).filter((x) => x.v != null).sort((a, b) => b.v - a.v);
  const eSorted = profiles.map((p) => ({ p, v: last(p.aps.E) })).sort((a, b) => b.v - a.v);
  const body = `
<p class="lede">${t(`In the year to June 2026, ${pct(K.emp)} of people aged 16 to 64 in Wales were in work, compared with ${pct(K.empUK)} across the UK. The unemployment rate was ${pct(K.un)} (UK ${pct(K.unUK)}). Wales has a higher share of people who are neither working nor looking for work – ${pct(K.inact)}, against ${pct(K.inactUK)} for the UK.`, `Yn y flwyddyn hyd Mehefin 2026, roedd ${pct(K.emp)} o bobl 16 i 64 oed yng Nghymru mewn gwaith, o’i gymharu â ${pct(K.empUK)} ar draws y DU. Y gyfradd ddiweithdra oedd ${pct(K.un)} (DU ${pct(K.unUK)}). Mae gan Gymru gyfran uwch o bobl nad ydynt yn gweithio nac yn chwilio am waith – ${pct(K.inact)}, o’i gymharu â ${pct(K.inactUK)} ar gyfer y DU.`)}</p>
<div class="stats">
${stat(t('Employment rate 16–64', 'Cyfradd cyflogaeth 16–64'), pct(K.emp), `UK ${pct(K.empUK)}`)}
${stat(t('Unemployment rate 16+', 'Cyfradd diweithdra 16+'), pct(K.un), `UK ${pct(K.unUK)}`)}
${stat(t('Economic inactivity 16–64', 'Anweithgarwch economaidd 16–64'), pct(K.inact), `UK ${pct(K.inactUK)}`)}
${stat(t('People in work', 'Pobl mewn gwaith'), num(wales.aps.EL / 1e6, 2) + 'm', t('aged 16+', '16 oed a throsodd'))}
</div>
${chart({ lang, title: t('Employment, unemployment and inactivity rates, Wales and UK', 'Cyfraddau cyflogaeth, diweithdra ac anweithgarwch, Cymru a’r DU'), sub: t('Years ending December, then year ending June 2026', 'Blynyddoedd yn gorffen ym mis Rhagfyr, yna’r flwyddyn yn gorffen ym mis Mehefin 2026'), source: src('aps'),
    views: [t('Employment', 'Cyflogaeth'), t('Unemployment', 'Diweithdra'), t('Inactivity', 'Anweithgarwch')],
    cfg: { type: 'line', labels: per, fmt: { suffix: '%', dec: 1 }, views: [
      { series: [{ name: t('Wales', 'Cymru'), values: wales.aps.E }, { name: 'UK', values: wales.apsUK.E, dash: '5 4' }] },
      { series: [{ name: t('Wales', 'Cymru'), values: wales.aps.U }, { name: 'UK', values: wales.apsUK.U, dash: '5 4' }], zero: true },
      { series: [{ name: t('Wales', 'Cymru'), values: wales.aps.I }, { name: 'UK', values: wales.apsUK.I, dash: '5 4' }] },
    ] } })}
<h2>${t('Employment by county', 'Cyflogaeth fesul sir')}</h2>
<p>${t(`Highest employment rates in the year to June 2026: ${eSorted.slice(0, 3).map((x) => `${nm(x.p, lang)} (${pct(x.v)})`).join(', ')}. Lowest: ${eSorted.slice(-3).reverse().map((x) => `${nm(x.p, lang)} (${pct(x.v)})`).join(', ')}.`, `Cyfraddau cyflogaeth uchaf yn y flwyddyn hyd Mehefin 2026: ${eSorted.slice(0, 3).map((x) => `${nm(x.p, lang)} (${pct(x.v)})`).join(', ')}. Isaf: ${eSorted.slice(-3).reverse().map((x) => `${nm(x.p, lang)} (${pct(x.v)})`).join(', ')}.`)}</p>
${chart({ lang, title: t('Employment rate, ages 16–64, year to June 2026', 'Cyfradd cyflogaeth, 16–64 oed, blwyddyn hyd Mehefin 2026'), source: src('aps'), legend: false,
    cfg: { type: 'hbar', labels: profiles.map((p) => nm(p, lang)), links: profiles.map((p) => countyHref(p, lang)), series: [{ name: '%', values: profiles.map((p) => last(p.aps.E)) }], fmt: { suffix: '%', dec: 1 } } })}
<h2>${t('Unemployment by county', 'Diweithdra fesul sir')}</h2>
<p>${t(`Unemployment is hard to measure for small areas because the survey sample is small. Of the counties with published estimates for the year to June 2026, the highest rate was in ${nm(uLatest[0].p, lang)} (${pct(uLatest[0].v)}) and the lowest in ${nm(last(uLatest).p, lang)} (${pct(last(uLatest).v)}). Estimates for ${22 - uLatest.length} counties are not published because samples were too small.`, `Mae’n anodd mesur diweithdra ar gyfer ardaloedd bach gan fod sampl yr arolwg yn fach. O’r siroedd ag amcangyfrifon cyhoeddedig ar gyfer y flwyddyn hyd Mehefin 2026, roedd y gyfradd uchaf yn ${nm(uLatest[0].p, lang)} (${pct(uLatest[0].v)}) a’r isaf yn ${nm(last(uLatest).p, lang)} (${pct(last(uLatest).v)}). Ni chyhoeddir amcangyfrifon ar gyfer ${22 - uLatest.length} sir oherwydd bod y samplau’n rhy fach.`)}</p>
${chart({ lang, title: t('Unemployment rate, 16+, year to June 2026', 'Cyfradd diweithdra, 16+, blwyddyn hyd Mehefin 2026'), sub: t('Low-reliability estimates; counties without a bar have suppressed data.', 'Amcangyfrifon dibynadwyedd isel; mae data wedi’i atal ar gyfer siroedd heb far.'), source: src('aps'), legend: false,
    cfg: { type: 'hbar', naLabel: t('not published', 'heb ei gyhoeddi'), labels: profiles.map((p) => nm(p, lang)), links: profiles.map((p) => countyHref(p, lang)), series: [{ name: '%', values: profiles.map((p) => last(p.aps.U)), color: '--c2' }], fmt: { suffix: '%', dec: 1 } } })}
${table({ head: [t('County', 'Sir'), t('Employment %', 'Cyflogaeth %'), t('Unemployment %', 'Diweithdra %'), t('Inactivity %', 'Anweithgarwch %'), t('In work (16+)', 'Mewn gwaith (16+)'), t('Employment 2008', 'Cyflogaeth 2008')], rows: profiles.map((p) => [`<a href="${countyHref(p, lang)}">${nm(p, lang)}</a>`, { v: last(p.aps.E), t: pct(last(p.aps.E)) }, { v: last(p.aps.U) ?? '', t: last(p.aps.U) == null ? '–' : pct(last(p.aps.U)) }, { v: last(p.aps.I), t: pct(last(p.aps.I)) }, { v: p.aps.EL, t: num(p.aps.EL) }, { v: p.aps.E[4], t: pct(p.aps.E[4]) }]) })}
<div class="note warn"><p>${t('The Office for Statistics Regulation has temporarily suspended the accredited status of Annual Population Survey labour market estimates because of falling sample sizes. County figures can move by several points from one year to the next for this reason alone.', 'Mae’r Swyddfa Rheoleiddio Ystadegau wedi atal statws achrededig amcangyfrifon marchnad lafur yr Arolwg Blynyddol o’r Boblogaeth dros dro oherwydd maint samplau sy’n gostwng. Gall ffigurau sirol symud sawl pwynt o un flwyddyn i’r llall am y rheswm hwn yn unig.')}</p></div>
<p class="src">${t('See also', 'Gweler hefyd')}: ${src('apsRelease')}</p>
`;
  return {
    title: t('Employment and unemployment in Wales by county (2026)', 'Cyflogaeth a diweithdra yng Nghymru fesul sir (2026)'),
    h1: t('Jobs and unemployment in Wales', 'Swyddi a diweithdra yng Nghymru'),
    desc: t(`Wales employment rate ${pct(K.emp)} (UK ${pct(K.empUK)}), unemployment ${pct(K.un)}, year to June 2026. See which of the 22 counties have the highest and lowest rates, with trends since 2004.`, `Cyfradd cyflogaeth Cymru ${pct(K.emp)} (DU ${pct(K.empUK)}), diweithdra ${pct(K.un)}, blwyddyn hyd Mehefin 2026. Gweld pa rai o’r 22 sir sydd â’r cyfraddau uchaf ac isaf, gyda thueddiadau ers 2004.`),
    body, dataset: true,
  };
}

// ============================================================ INCOMES
export function incomes(lang) {
  const t = T(lang);
  const E = wales.earn.data, G = wales.gdhi.data;
  const gs = profiles.map((p) => ({ p, v: last(p.gdhi.v) })).sort((a, b) => b.v - a.v);
  const es = profiles.map((p) => ({ p, v: last(p.earn) })).sort((a, b) => b.v - a.v);
  const body = `
<p class="lede">${t(`The typical full-time employee working in Wales earned ${gbp(last(E.Wales), 2)} a week in 2026, compared with ${gbp(last(E['United Kingdom']), 2)} across the UK. Disposable household income – what households have to spend or save after taxes and benefits – was ${gbp(last(G.Wales.v))} per person in 2024, or ${pct(G.Wales.idx)} of the UK average.`, `Enillodd y gweithiwr amser llawn nodweddiadol sy’n gweithio yng Nghymru ${gbp(last(E.Wales), 2)} yr wythnos yn 2026, o’i gymharu â ${gbp(last(E['United Kingdom']), 2)} ar draws y DU. Roedd incwm gwario aelwydydd – yr hyn sydd gan aelwydydd i’w wario neu ei gynilo ar ôl trethi a budd-daliadau – yn ${gbp(last(G.Wales.v))} y pen yn 2024, neu ${pct(G.Wales.idx)} o gyfartaledd y DU.`)}</p>
<div class="stats">
${stat(t('Median full-time weekly pay 2026', 'Cyflog wythnosol canolrifol amser llawn 2026'), gbp(last(E.Wales), 2), `UK ${gbp(last(E['United Kingdom']), 2)} (${pct((last(E.Wales) / last(E['United Kingdom'])) * 100)})`)}
${stat(t('Household income per person 2024', 'Incwm aelwydydd y pen 2024'), gbp(last(G.Wales.v)), `UK ${gbp(last(G.UK.v))}`)}
${stat(t('Highest household income', 'Incwm aelwydydd uchaf'), nm(gs[0].p, lang), gbp(gs[0].v) + t(' per person', ' y pen'))}
${stat(t('Highest workplace pay', 'Cyflog gweithle uchaf'), nm(es[0].p, lang), gbp(es[0].v, 2) + t(' a week', ' yr wythnos'))}
</div>
${chart({ lang, title: t('Gross disposable household income per person by county, 2024', 'Incwm gwario gros aelwydydd y pen fesul sir, 2024'), sub: t('£ per person, by where people live', '£ y pen, yn ôl lle mae pobl yn byw'), source: src('gdhi'), legend: false,
    cfg: { type: 'hbar', labels: profiles.map((p) => nm(p, lang)), links: profiles.map((p) => countyHref(p, lang)), series: [{ name: '£', values: profiles.map((p) => last(p.gdhi.v)) }], fmt: { prefix: '£' } } })}
${chart({ lang, title: t('Household income per person, £, 1998–2024', 'Incwm aelwydydd y pen, £, 1998–2024'), source: src('gdhi'),
    cfg: { type: 'bar', labels: wales.gdhi.years, series: [{ name: 'UK', values: G.UK.v, color: '--c8' }, { name: t('Wales', 'Cymru'), values: G.Wales.v }, { name: t('Scotland', 'Yr Alban'), values: G.Scotland.v, color: '--c3' }, { name: t('Northern Ireland', 'Gogledd Iwerddon'), values: G['Northern Ireland'].v, color: '--c4' }], fmt: { prefix: '£' } } })}
<h2>${t('Pay by county', 'Cyflog fesul sir')}</h2>
<p>${t('Earnings are measured where people work, so they show the pay of jobs located in each county. Small samples mean county figures can change sharply year to year.', 'Caiff enillion eu mesur lle mae pobl yn gweithio, felly maent yn dangos cyflog swyddi sydd wedi’u lleoli ym mhob sir. Mae samplau bach yn golygu y gall ffigurau sirol newid yn sydyn o flwyddyn i flwyddyn.')}</p>
${chart({ lang, title: t('Median gross weekly pay, full-time employees, 2026 (provisional)', 'Cyflog wythnosol gros canolrifol, gweithwyr amser llawn, 2026 (dros dro)'), source: src('ashe'), legend: false,
    cfg: { type: 'hbar', labels: profiles.map((p) => nm(p, lang)), links: profiles.map((p) => countyHref(p, lang)), series: [{ name: '£', values: profiles.map((p) => last(p.earn)), color: '--c3' }], fmt: { prefix: '£', dec: 0 } } })}
${table({ head: [t('County', 'Sir'), t('Weekly pay 2026', 'Cyflog wythnosol 2026'), t('Weekly pay 2016', 'Cyflog wythnosol 2016'), t('Household income per person 2024', 'Incwm aelwydydd y pen 2024'), t('Index UK=100', 'Mynegai DU=100')], rows: profiles.map((p) => [`<a href="${countyHref(p, lang)}">${nm(p, lang)}</a>`, { v: last(p.earn), t: gbp(last(p.earn), 2) }, { v: p.earn[1], t: gbp(p.earn[1], 2) }, { v: last(p.gdhi.v), t: gbp(last(p.gdhi.v)) }, { v: p.gdhi.idx, t: num(p.gdhi.idx, 1) }]) })}
`;
  return {
    title: t('Wages and household income in Wales by county', 'Cyflogau ac incwm aelwydydd yng Nghymru fesul sir'),
    h1: t('Wages and household income in Wales', 'Cyflogau ac incwm aelwydydd yng Nghymru'),
    desc: t(`Median full-time pay in Wales is ${gbp(last(E.Wales), 2)} a week (2026). Household income per person ${gbp(last(G.Wales.v))} (2024). Compare all 22 counties.`, `Cyflog amser llawn canolrifol yng Nghymru yw ${gbp(last(E.Wales), 2)} yr wythnos (2026). Incwm aelwydydd y pen ${gbp(last(G.Wales.v))} (2024). Cymharwch bob un o’r 22 sir.`),
    body, dataset: true,
  };
}

// ============================================================ COUNTIES INDEX
export function counties(lang) {
  const t = T(lang);
  const body = `
<p class="lede">${t('Wales has 22 local authorities (counties and county boroughs). Choose one for its economic profile, or compare them all below.', 'Mae gan Gymru 22 awdurdod lleol (siroedd a bwrdeistrefi sirol). Dewiswch un i weld ei phroffil economaidd, neu cymharwch nhw i gyd isod.')}</p>
<div class="county-grid">${profiles.slice().sort((a, b) => nm(a, lang).localeCompare(nm(b, lang), 'cy')).map((p) => `<a href="${countyHref(p, lang)}">${nm(p, lang)}<small>${lang === 'cy' ? p.en : p.cy}</small></a>`).join('')}</div>
<h2>${t('Map of key measures', 'Map o fesurau allweddol')}</h2>
${tileMap(lang, ['gvaTotal', 'gvaPH', 'gdhi', 'earn', 'ct', 'emp', 'inact'])}
<h2>${t('Compare all counties', 'Cymharu pob sir')}</h2>
${table({ head: [t('County', 'Sir'), t('Population 2024', 'Poblogaeth 2024'), t('GVA £m 2024', 'GYC £m 2024'), t('GVA per person', 'GYC y pen'), t('Household income per person', 'Incwm aelwydydd y pen'), t('Band D 2026-27', 'Band D 2026-27'), t('Employment %', 'Cyflogaeth %')], rows: profiles.map((p) => [`<a href="${countyHref(p, lang)}">${nm(p, lang)}</a>`, { v: p.pop2024, t: num(p.pop2024) }, { v: last(p.gva.m), t: num(last(p.gva.m)) }, { v: last(p.gva.ph), t: gbp(last(p.gva.ph)) }, { v: last(p.gdhi.v), t: gbp(last(p.gdhi.v)) }, { v: last(p.ct.v), t: gbp(last(p.ct.v)) }, { v: last(p.aps.E), t: pct(last(p.aps.E)) }]) })}
<p class="src">${t('Population: ONS mid-2024 estimates as used in its regional GDP tables.', 'Poblogaeth: amcangyfrifon canol 2024 yr ONS fel y’u defnyddir yn ei thablau CMC rhanbarthol.')} ${t('Sources', 'Ffynonellau')}: ${src('gvaLA')}; ${src('gdhi')}; ${src('ct')}; ${src('aps')}</p>`;
  return {
    title: t('Welsh counties compared: economy, council tax, jobs and income', 'Siroedd Cymru wedi’u cymharu: economi, treth gyngor, swyddi ac incwm'),
    h1: t('The 22 counties of Wales', '22 sir Cymru'),
    desc: t('Compare all 22 Welsh local authorities on economic output, household income, wages, council tax and employment, with a profile page for each.', 'Cymharwch bob un o 22 awdurdod lleol Cymru ar allbwn economaidd, incwm aelwydydd, cyflogau, treth gyngor a chyflogaeth, gyda thudalen proffil ar gyfer pob un.'),
    body, dataset: true,
  };
}

// ============================================================ COUNTY PROFILE
export function county(p, lang) {
  const t = T(lang);
  const n = nm(p, lang);
  const g = p.gva, R = ranks;
  const share = (last(g.m) / K.gva) * 100;
  const ctv = last(p.ct.v), ctPrev = p.ct.v[p.ct.v.length - 2];
  const rk = (r, total = 22) => t(`${ord(r)} of ${total}`, `${r} o ${total}`);
  const per = p.aps.periods.map((x) => (x === 'Jun 2026' ? t('Jun 2026', 'Meh 2026') : x));
  const uL = last(p.aps.U);
  const same = profiles.filter((q) => q.region === p.region && q.slug !== p.slug);
  const regionCy = { 'North Wales': 'Gogledd Cymru', 'Mid Wales': 'Canolbarth Cymru', 'South West Wales': 'De-orllewin Cymru', 'South East Wales': 'De-ddwyrain Cymru' };
  const body = `
<p class="lede">${t(`${n} is one of Wales’ 22 local authorities, in ${p.region}. Its economy produced ${bn(last(g.m))} of output in 2024 – ${pct(share)} of Wales’ total – and its band D council tax for 2026-27 is ${gbp(ctv)}.`, `Mae ${n} yn un o 22 awdurdod lleol Cymru, yn ${regionCy[p.region]}. Cynhyrchodd ei heconomi ${bn(last(g.m))} o allbwn yn 2024 – ${pct(share)} o gyfanswm Cymru – a’i threth gyngor band D ar gyfer 2026-27 yw ${gbp(ctv)}.`)}</p>
<div class="stats">
${stat(t('Economic output (GVA), 2024', 'Allbwn economaidd (GYC), 2024'), bn(last(g.m), 2), t(`${pct(share)} of the Welsh total, ranked ${rk(R.gvaTotal[p.slug])}`, `${pct(share)} o gyfanswm Cymru, safle ${rk(R.gvaTotal[p.slug])}`))}
${stat(t('Output per person', 'Allbwn y pen'), gbp(last(g.ph)), t(`${num(last(g.idx), 1)}% of the UK average, ranked ${rk(R.gvaPH[p.slug])}`, `${num(last(g.idx), 1)}% o gyfartaledd y DU, safle ${rk(R.gvaPH[p.slug])}`))}
${stat(t('Household income per person, 2024', 'Incwm aelwydydd y pen, 2024'), gbp(last(p.gdhi.v)), t(`${num(p.gdhi.idx, 1)}% of the UK average, ranked ${rk(R.gdhi[p.slug])}`, `${num(p.gdhi.idx, 1)}% o gyfartaledd y DU, safle ${rk(R.gdhi[p.slug])}`))}
${stat(t('Band D council tax, 2026-27', 'Treth gyngor Band D, 2026-27'), gbp(ctv), t(`Up ${pct(((ctv - ctPrev) / ctPrev) * 100)} on last year; ${ordWord(R.ct[p.slug], lang)}`, `Cynnydd o ${pct(((ctv - ctPrev) / ctPrev) * 100)} ar y llynedd; ${ordWord(R.ct[p.slug], lang)}`))}
${stat(t('Employment rate, ages 16–64', 'Cyfradd cyflogaeth, 16–64 oed'), pct(last(p.aps.E)), t(`Wales ${pct(K.emp)}, ranked ${rk(R.emp[p.slug])}`, `Cymru ${pct(K.emp)}, safle ${rk(R.emp[p.slug])}`))}
${stat(t('Unemployment rate, ages 16+', 'Cyfradd diweithdra, 16+ oed'), uL == null ? t('Not published', 'Heb ei gyhoeddi') : pct(uL), uL == null ? t('Survey sample too small', 'Sampl yr arolwg yn rhy fach') : t(`Wales ${pct(K.un)}. Low-reliability estimate`, `Cymru ${pct(K.un)}. Amcangyfrif dibynadwyedd isel`))}
${stat(t('Median full-time weekly pay, 2026', 'Cyflog wythnosol canolrifol amser llawn, 2026'), gbp(last(p.earn), 2), t(`Jobs based here. Wales ${gbp(last(wales.earn.data.Wales), 2)}`, `Swyddi yma. Cymru ${gbp(last(wales.earn.data.Wales), 2)}`))}
${stat(t('Population (2024)', 'Poblogaeth (2024)'), num(Math.round(p.pop2024 / 100) * 100), t(`${num(p.aps.EL)} people in work (16+)`, `${num(p.aps.EL)} o bobl mewn gwaith (16+)`))}
</div>
${chart({ lang, title: t(`Economic output in ${n}, 1998–2024`, `Allbwn economaidd yn ${n}, 1998–2024`), source: src('gvaLA'), views: [t('Total £m', 'Cyfanswm £m'), t('Per person vs Wales & UK', 'Y pen o’i gymharu â Chymru a’r DU')],
    cfg: { type: 'line', labels: g.years, zero: true, views: [
      { series: [{ name: n, values: g.m }], fmt: { prefix: '£', suffix: 'm' } },
      { series: [{ name: n, values: g.ph }, { name: t('Wales', 'Cymru'), values: wales.gva.ph, dash: '5 4', width: 1.5 }, { name: 'UK', values: wales.ukGva.ph, dash: '2 3', width: 1.5 }], fmt: { prefix: '£' } },
    ] } })}
${chart({ lang, title: t(`Band D council tax in ${n}, £`, `Treth gyngor Band D yn ${n}, £`), source: src('ct'),
    cfg: { type: 'line', labels: p.ct.years.slice(3), series: [{ name: n, values: p.ct.v.slice(3), color: '--c5' }, { name: t('Wales average', 'Cyfartaledd Cymru'), values: wales.ct.v.slice(3), dash: '5 4', width: 1.5, color: '--c8' }], fmt: { prefix: '£' } } })}
<p>${t(`For 2026-27, ${gbp(p.ct.comp.county)} of the band D bill goes to the county council, ${gbp(p.ct.comp.police)} to the police and ${gbp(p.ct.comp.community)} on average to community or town councils.`, `Ar gyfer 2026-27, mae ${gbp(p.ct.comp.county)} o’r bil band D yn mynd i’r cyngor sir, ${gbp(p.ct.comp.police)} i’r heddlu a ${gbp(p.ct.comp.community)} ar gyfartaledd i gynghorau cymuned neu dref.`)}</p>
${chart({ lang, title: t(`Employment rate in ${n}, ages 16–64`, `Cyfradd cyflogaeth yn ${n}, 16–64 oed`), sub: t('Survey estimates; single-year movements may not be significant.', 'Amcangyfrifon arolwg; efallai na fydd symudiadau un flwyddyn yn arwyddocaol.'), source: src('aps'),
    cfg: { type: 'line', labels: per, series: [{ name: n, values: p.aps.E }, { name: t('Wales', 'Cymru'), values: wales.aps.E, dash: '5 4', width: 1.5, color: '--c8' }], fmt: { suffix: '%', dec: 1 } } })}
${countyBusiness(p, lang)}
${countyCouncil(p, lang)}
<h2>${t(`Other counties in ${p.region}`, `Siroedd eraill yn ${regionCy[p.region]}`)}</h2>
<div class="county-grid">${same.map((q) => `<a href="${countyHref(q, lang)}">${nm(q, lang)}<small>${t('Output', 'Allbwn')} ${bn(last(q.gva.m))}, band D ${gbp(last(q.ct.v))}</small></a>`).join('')}</div>
<p><a href="${href('counties', lang)}">${t('Compare all 22 counties ', 'Cymharu pob un o’r 22 sir ')}</a></p>
<details><summary>${t('Notes on these figures', 'Nodiadau ar y ffigurau hyn')}</summary><ul>
<li>${t('GVA and pay are measured where people work; household income is measured where people live. Counties with many commuters out (or in) can look very different on each measure.', 'Caiff GYC a chyflog eu mesur lle mae pobl yn gweithio; caiff incwm aelwydydd ei fesur lle mae pobl yn byw. Gall siroedd â llawer o gymudwyr yn mynd allan (neu’n dod i mewn) edrych yn wahanol iawn ar bob mesur.')}</li>
<li>${t('GVA figures are in cash terms (not adjusted for inflation). 2024 figures are provisional.', 'Mae ffigurau GYC mewn termau arian parod (heb eu haddasu ar gyfer chwyddiant). Mae ffigurau 2024 yn rhai dros dro.')}</li>
<li>${t('Rankings are among the 22 Welsh local authorities, 1 = highest.', 'Safleoedd ymhlith 22 awdurdod lleol Cymru, 1 = uchaf.')}</li></ul></details>
`;
  return {
    title: t(`${p.en} economy: GVA, council tax, jobs and income`, `Economi ${p.cy}: GYC, treth gyngor, swyddi ac incwm`),
    h1: t(`${p.en}: economy in numbers`, `${p.cy}: yr economi mewn ffigurau`),
    desc: t(`${p.en} in data: ${bn(last(g.m))} economy (2024), band D council tax ${gbp(ctv)} (2026-27), employment rate ${pct(last(p.aps.E))}, household income ${gbp(last(p.gdhi.v))} per person. Trends and rankings.`, `${p.cy} mewn data: economi ${bn(last(g.m))} (2024), treth gyngor band D ${gbp(ctv)} (2026-27), cyfradd cyflogaeth ${pct(last(p.aps.E))}, incwm aelwydydd ${gbp(last(p.gdhi.v))} y pen. Tueddiadau a safleoedd.`),
    body, dataset: true, crumbs: [['counties', t('Counties', 'Siroedd')]],
  };
}
const ordWord = (r, lang) => (lang === 'cy' ? (r === 1 ? 'yr uchaf yng Nghymru' : r === 22 ? 'yr isaf yng Nghymru' : `${r} o 22 (1 = uchaf)`) : r === 1 ? 'the highest in Wales' : r === 22 ? 'the lowest in Wales' : `${ord(r)} highest of 22`);
const ord = (n) => n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');

// ============================================================ SOURCES & ABOUT
export function sources(lang) {
  const t = T(lang);
  const body = `<p class="lede">${t('Every chart on this site is built from the official datasets below. Figures were extracted on 18 November 2026; earlier years are often revised when new editions are published.', 'Mae pob siart ar y wefan hon wedi’i hadeiladu o’r setiau data swyddogol isod. Echdynnwyd y ffigurau ar 18 Tachwedd 2026; caiff blynyddoedd cynharach eu diwygio’n aml pan gyhoeddir rhifynnau newydd.')}</p>
<ul class="sources-list">${Object.values(S).map((s) => `<li>${srcLink(s)}</li>`).join('')}</ul>
<h2>${t('Definitions', 'Diffiniadau')}</h2>
<dl>
<dt><strong>${t('Gross value added (GVA)', 'Gwerth ychwanegol gros (GYC)')}</strong></dt><dd>${t('The value of goods and services produced, minus the cost of inputs. GDP is GVA plus taxes on products, minus subsidies.', 'Gwerth y nwyddau a’r gwasanaethau a gynhyrchir, llai cost mewnbynnau. CMC yw GYC ynghyd â threthi ar gynhyrchion, llai cymorthdaliadau.')}</dd>
<dt><strong>${t('Net fiscal balance', 'Balans cyllidol net')}</strong></dt><dd>${t('Public spending for a country or region minus public revenue raised there.', 'Gwariant cyhoeddus ar gyfer gwlad neu ranbarth llai’r refeniw cyhoeddus a godir yno.')}</dd>
<dt><strong>${t('Block grant', 'Grant bloc')}</strong></dt><dd>${t('The main funding the UK Government gives the Welsh Government, changed each year by the Barnett formula.', 'Y prif gyllid y mae Llywodraeth y DU yn ei roi i Lywodraeth Cymru, a newidir bob blwyddyn gan fformiwla Barnett.')}</dd>
<dt><strong>${t('Economic inactivity', 'Anweithgarwch economaidd')}</strong></dt><dd>${t('People not in work and not looking for work – for example students, carers, people who are long-term sick or retired early.', 'Pobl nad ydynt mewn gwaith ac nad ydynt yn chwilio am waith – er enghraifft myfyrwyr, gofalwyr, pobl sy’n sâl yn hirdymor neu sydd wedi ymddeol yn gynnar.')}</dd>
<dt><strong>${t('Gross disposable household income (GDHI)', 'Incwm gwario gros aelwydydd (GDHI)')}</strong></dt><dd>${t('Money households have available to spend or save after taxes, National Insurance and pension contributions, including benefits received.', 'Arian sydd gan aelwydydd ar gael i’w wario neu ei gynilo ar ôl trethi, Yswiriant Gwladol a chyfraniadau pensiwn, gan gynnwys budd-daliadau a dderbynnir.')}</dd>
</dl>`;
  return { title: t('Sources and methods', 'Ffynonellau a dulliau'), h1: t('Sources and methods', 'Ffynonellau a dulliau'), desc: t('The official ONS, HMRC, HM Treasury and Welsh Government datasets behind every chart on Wales Economy Explained.', 'Setiau data swyddogol yr ONS, CThEF, Trysorlys EF a Llywodraeth Cymru y tu ôl i bob siart ar Economi Cymru wedi’i Egluro.'), body };
}
export function about(lang) {
  const t = T(lang);
  const body = `<p class="lede">${t('Wales Economy Explained is an independent website that makes official statistics about the Welsh economy easy to find, read and share.', 'Gwefan annibynnol yw Economi Cymru wedi’i Egluro sy’n ei gwneud hi’n hawdd dod o hyd i ystadegau swyddogol am economi Cymru, eu darllen a’u rhannu.')}</p>
<h2>${t('Principles', 'Egwyddorion')}</h2><ul>
<li>${t('<strong>Facts, not opinions.</strong> We report what the data shows and how it has changed. We do not campaign for or against any party, policy or constitutional position.', '<strong>Ffeithiau, nid barn.</strong> Rydym yn adrodd yr hyn y mae’r data’n ei ddangos a sut mae wedi newid. Nid ydym yn ymgyrchu o blaid nac yn erbyn unrhyw blaid, polisi na safbwynt cyfansoddiadol.')}</li>
<li>${t('<strong>Official sources only.</strong> Figures come from the ONS, HMRC, HM Treasury, the Welsh Government and the Welsh Revenue Authority, with context from the IFS and Senedd Research.', '<strong>Ffynonellau swyddogol yn unig.</strong> Daw’r ffigurau o’r ONS, CThEF, Trysorlys EF, Llywodraeth Cymru ac Awdurdod Cyllid Cymru, gyda chyd-destun gan yr IFS ac Ymchwil y Senedd.')}</li>
<li>${t('<strong>Show the method.</strong> Where we calculate something ourselves, we say so and explain how.', '<strong>Dangos y dull.</strong> Lle rydym yn cyfrifo rhywbeth ein hunain, rydym yn dweud hynny ac yn egluro sut.')}</li>
<li>${t('<strong>Bilingual.</strong> Every page is available in Welsh and English.', '<strong>Dwyieithog.</strong> Mae pob tudalen ar gael yn Gymraeg ac yn Saesneg.')}</li></ul>
<p>${t('Spotted an error or a newer figure? Please let us know so we can correct it.', 'Wedi sylwi ar gamgymeriad neu ffigur mwy diweddar? Rhowch wybod i ni er mwyn i ni ei gywiro.')}</p>
<p class="meta">${t('Data last updated', 'Diweddarwyd y data ddiwethaf')}: 18 ${t('November', 'Tachwedd')} 2026. ${t('Contains public sector information licensed under the Open Government Licence v3.0.', 'Yn cynnwys gwybodaeth sector cyhoeddus a drwyddedir o dan y Drwydded Llywodraeth Agored v3.0.')}</p>`;
  return { title: t('About this site', 'Am y wefan hon'), h1: t('About Wales Economy Explained', 'Am Economi Cymru wedi’i Egluro'), desc: t('An independent, non-partisan, bilingual guide to official data on the Welsh economy.', 'Canllaw annibynnol, amhleidiol a dwyieithog i ddata swyddogol am economi Cymru.'), body };
}

// ============================================================ BUSINESS
const SEC = {
  A: ['Agriculture, forestry & fishing', 'Amaeth, coedwigaeth a physgota'], B: ['Mining & quarrying', 'Mwyngloddio a chwarela'], C: ['Manufacturing', 'Gweithgynhyrchu'],
  D: ['Energy supply', 'Cyflenwi ynni'], E: ['Water & waste', 'Dŵr a gwastraff'], F: ['Construction', 'Adeiladu'], G: ['Retail, wholesale & motor trade', 'Manwerthu, cyfanwerthu a moduron'],
  H: ['Transport & storage', 'Trafnidiaeth a storio'], I: ['Hotels, cafés & restaurants', 'Gwestai, caffis a bwytai'], J: ['Information & communication', 'Gwybodaeth a chyfathrebu'],
  K: ['Finance & insurance', 'Cyllid ac yswiriant'], L: ['Property', 'Eiddo'], M: ['Professional & scientific', 'Proffesiynol a gwyddonol'], N: ['Admin & support services', 'Gwasanaethau gweinyddol a chymorth'],
  O: ['Public administration & defence', 'Gweinyddiaeth gyhoeddus ac amddiffyn'], P: ['Education', 'Addysg'], Q: ['Health & social care', 'Iechyd a gofal cymdeithasol'],
  R: ['Arts & recreation', 'Celfyddydau a hamdden'], S: ['Other services', 'Gwasanaethau eraill'],
};
// GVA industry codes in gva_la_2024 (after Total): AB,C,DE,F,G,H,I,J,K,L,68IMP,M,N,O,P,Q,R,S,T
const GVA_SEC = { AB: ['Farming, forestry, fishing & mining', 'Ffermio, coedwigaeth, pysgota a mwyngloddio'], C: SEC.C, DE: ['Energy, water & waste', 'Ynni, dŵr a gwastraff'], F: SEC.F, G: SEC.G, H: SEC.H, I: SEC.I, J: SEC.J, K: SEC.K, L: ['Property (excl. imputed rent)', 'Eiddo (heb rent tybiannol)'], M: SEC.M, N: SEC.N, O: SEC.O, P: SEC.P, Q: SEC.Q, R: SEC.R, S: SEC.S };
const GVA_KEYS = ['AB', 'C', 'DE', 'F', 'G', 'H', 'I', 'J', 'K', 'L', '68IMP', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
const gvaSec = (p) => { const o = Object.fromEntries(GVA_KEYS.map((k, i) => [k, p.ind.v[i + 1]])); o.L = o.L - o['68IMP']; return o; };
const sname = (k, lang, map = SEC) => (lang === 'cy' ? map[k][1] : map[k][0]);
const topSec = (obj, map) => Object.entries(obj).filter(([k]) => map[k]).sort((a, b) => b[1] - a[1])[0][0];
const SIZE_LABELS = ['0–4', '5–9', '10–19', '20–49', '50–99', '100–249', '250–499', '500–999', '1,000+'];

function employersTable(list, lang) {
  const t = T(lang);
  if (!list.length) return '';
  return `<div class="emp-list">${list.map((e) => `<article class="emp">
<h3>${esc(e.name)}</h3>
<p class="emp-meta">${esc(e.sector[lang === 'cy' ? 'cy' : 'en'])}. ${t('Main Welsh site', 'Prif safle yng Nghymru')}: <a href="${countyHref(profiles.find((p) => p.slug === e.county), lang)}">${nm(profiles.find((p) => p.slug === e.county), lang)}</a></p>
<dl><dt>${t('In Wales', 'Yng Nghymru')}</dt><dd>${esc(e.wales[lang === 'cy' ? 'cy' : 'en'])}</dd>
<dt>${t('Whole company', 'Y cwmni cyfan')}</dt><dd>${esc(e.figs[lang === 'cy' ? 'cy' : 'en'])}</dd></dl>
<p class="src">${e.ch ? `${t('Companies House number', 'Rhif Tŷ’r Cwmnïau')} <a href="https://find-and-update.company-information.service.gov.uk/company/${e.ch}" rel="noopener">${e.ch}</a>. ` : ''}${t('Sources', 'Ffynonellau')}: ${e.src.map((u, i) => `<a href="${u}" rel="noopener">${new URL(u).hostname.replace('www.', '')}</a>`).join(', ')}</p>
</article>`).join('')}</div>`;
}

export function business(lang) {
  const t = T(lang);
  const PE = { nhsAll: wales.publicEmp.nhsOther.find((x) => x.name === 'ALL').head, nhsList: [...wales.publicEmp.nhs, ...wales.publicEmp.nhsOther.filter((x) => x.name !== 'ALL')].sort((a, b) => b.head - a.head) };
  const B = wales.bres, U = wales.ukbc;
  const secs = Object.keys(SEC);
  const big = U.b[6] + U.b[7] + U.b[8];
  const rows = profiles.map((p) => {
    const g = gvaSec(p); const tj = topSec(p.bres.s, SEC); const tg = topSec(g, GVA_SEC);
    return { p, jobs: p.bres.tot, ch: ((p.bres.tot - p.bres.tot15) / p.bres.tot15) * 100, tj, tjs: (p.bres.s[tj] / p.bres.tot) * 100, tg, tgs: (g[tg] / (p.ind.v[0] - g['68IMP'])) * 100, big: p.ukbc.b[6] + p.ukbc.b[7] + p.ukbc.b[8], manu: (p.bres.s.C / p.bres.tot) * 100, opq: ((p.bres.s.O + p.bres.s.P + p.bres.s.Q) / p.bres.tot) * 100 };
  });
  const body = `
<p class="lede">${t(`There were ${num(B.tot)} employee jobs in Wales in 2024, spread across ${num(U.total)} workplaces. Most workplaces are small: ${pct(((U.b[0] + U.b[1]) / U.total) * 100, 0)} have fewer than ten staff, and only ${num(big)} employ 250 people or more. Health and social care is the largest employer of any industry.`, `Roedd ${num(B.tot)} o swyddi gweithwyr yng Nghymru yn 2024, wedi’u gwasgaru ar draws ${num(U.total)} o weithleoedd. Mae’r rhan fwyaf o weithleoedd yn fach: mae gan ${pct(((U.b[0] + U.b[1]) / U.total) * 100, 0)} lai na deg aelod o staff, a dim ond ${num(big)} sy’n cyflogi 250 o bobl neu fwy. Iechyd a gofal cymdeithasol yw’r cyflogwr mwyaf o unrhyw ddiwydiant.`)}</p>
<div class="stats">
${stat(t('Employee jobs in Wales, 2024', 'Swyddi gweithwyr yng Nghymru, 2024'), num(B.tot / 1e6, 2) + 'm', t(`Up from ${num(B.tot15 / 1e6, 2)}m in 2015`, `I fyny o ${num(B.tot15 / 1e6, 2)}m yn 2015`))}
${stat(t('Jobs in the public sector', 'Swyddi yn y sector cyhoeddus'), '25.9%', t('Great Britain 18.8%', 'Prydain Fawr 18.8%'))}
${stat(t('Workplaces', 'Gweithleoedd'), num(U.total), t(`${num(U.b[8])} employ 1,000 or more people`, `Mae ${num(U.b[8])} yn cyflogi 1,000 neu fwy o bobl`))}
${stat(t('Largest industry by jobs', 'Diwydiant mwyaf yn ôl swyddi'), t('Health and care', 'Iechyd a gofal'), t(`${num(B.s.Q)} jobs, ${pct((B.s.Q / B.tot) * 100)} of the total`, `${num(B.s.Q)} o swyddi, ${pct((B.s.Q / B.tot) * 100)} o’r cyfanswm`))}
</div>
<p class="src">${t('Public-sector share', 'Cyfran y sector cyhoeddus')}: ${src('bresWG')}</p>

<h2>${t('What kind of work people do', 'Pa fath o waith mae pobl yn ei wneud')}</h2>
<p>${t('Employee jobs by industry, counted where the job is based. Self-employed people are not included.', 'Swyddi gweithwyr fesul diwydiant, wedi’u cyfrif lle mae’r swydd. Nid yw pobl hunangyflogedig wedi’u cynnwys.')}</p>
${chart({ lang, legend: false, title: t('Employee jobs in Wales by industry, 2024', 'Swyddi gweithwyr yng Nghymru fesul diwydiant, 2024'), source: src('bres'),
    cfg: { type: 'hbar', labels: secs.map((k) => sname(k, lang)), series: [{ name: t('Jobs', 'Swyddi'), values: secs.map((k) => B.s[k]) }], fmt: {} },
    table: table({ head: [t('Industry', 'Diwydiant'), t('Jobs', 'Swyddi'), t('Share', 'Cyfran')], rows: secs.map((k) => [sname(k, lang), { v: B.s[k], t: num(B.s[k]) }, { v: B.s[k] / B.tot, t: pct((B.s[k] / B.tot) * 100) }]) }) })}

<h2>${t('How each county makes its living', 'Sut mae pob sir yn ennill ei bywoliaeth')}</h2>
<p>${t('The largest industry in each county, measured two ways: by number of jobs, and by economic output (GVA). They often differ, because some industries produce a lot of output with relatively few staff. Output excludes imputed rent, the notional rent of owner-occupied homes. Select a heading to sort.', 'Y diwydiant mwyaf ym mhob sir, wedi’i fesur mewn dwy ffordd: yn ôl nifer y swyddi, ac yn ôl allbwn economaidd (GYC). Maen nhw’n aml yn wahanol, oherwydd bod rhai diwydiannau’n cynhyrchu llawer o allbwn gyda chymharol ychydig o staff. Nid yw’r allbwn yn cynnwys rhent tybiannol, sef rhent tybiedig cartrefi perchen-feddianwyr. Dewiswch bennawd i drefnu.')}</p>
${table({ head: [t('County', 'Sir'), t('Employee jobs 2024', 'Swyddi gweithwyr 2024'), t('Change since 2015', 'Newid ers 2015'), t('Largest by jobs', 'Mwyaf yn ôl swyddi'), t('Largest by output', 'Mwyaf yn ôl allbwn'), t('Manufacturing share of jobs', 'Cyfran swyddi gweithgynhyrchu'), t('Health, education and public admin share', 'Cyfran iechyd, addysg a gweinyddiaeth gyhoeddus'), t('Sites with 250+ staff', 'Safleoedd â 250+ o staff')],
    rows: rows.map((r) => [`<a href="${countyHref(r.p, lang)}">${nm(r.p, lang)}</a>`, { v: r.jobs, t: num(r.jobs) }, { v: r.ch, t: (r.ch > 0 ? '+' : '') + pct(r.ch) }, { v: r.tjs, t: `${sname(r.tj, lang)} (${pct(r.tjs, 0)})`, cls: 'l' }, { v: r.tgs, t: `${sname(r.tg, lang, GVA_SEC)} (${pct(r.tgs, 0)})`, cls: 'l' }, { v: r.manu, t: pct(r.manu) }, { v: r.opq, t: pct(r.opq) }, { v: r.big, t: num(r.big) }]) })}
<p class="src">${t('Sources', 'Ffynonellau')}: ${src('bres')}; ${src('gvaLAind')}; ${src('ukbc')}. ${t('Job counts are rounded by the ONS. Site counts are rounded to the nearest 5.', 'Caiff niferoedd swyddi eu talgrynnu gan yr ONS. Caiff niferoedd safleoedd eu talgrynnu i’r 5 agosaf.')}</p>
${chart({ lang, legend: false, title: t('Share of employee jobs in manufacturing, by county, 2024', 'Cyfran y swyddi gweithwyr mewn gweithgynhyrchu, fesul sir, 2024'), source: src('bres'),
    cfg: { type: 'hbar', labels: profiles.map((p) => nm(p, lang)), links: profiles.map((p) => countyHref(p, lang)), series: [{ name: '%', values: profiles.map((p) => +((p.bres.s.C / p.bres.tot) * 100).toFixed(1)) }], fmt: { suffix: '%', dec: 1 } } })}

<h2>${t('How big are Welsh workplaces?', 'Pa mor fawr yw gweithleoedd Cymru?')}</h2>
${chart({ lang, legend: false, title: t('Workplaces in Wales by number of staff, March 2026', 'Gweithleoedd yng Nghymru yn ôl nifer y staff, Mawrth 2026'), sub: t('Each workplace is a single site, such as a shop, office or factory', 'Mae pob gweithle’n safle unigol, fel siop, swyddfa neu ffatri'), source: src('ukbc'),
    cfg: { type: 'bar', labels: SIZE_LABELS, series: [{ name: t('Workplaces', 'Gweithleoedd'), values: U.b }], fmt: {} } })}

<h2>${t('Major employers', 'Cyflogwyr mawr')}</h2>
<p>${t('Some of the largest employers with a major base in Wales. Wherever possible the figures come from accounts filed at Companies House or from the company’s own results. Company accounts cover the whole company, which often includes sites outside Wales, so they do not show how much a company contributes in any one county.', 'Rhai o’r cyflogwyr mwyaf sydd â chanolfan fawr yng Nghymru. Lle bo modd, daw’r ffigurau o gyfrifon a ffeiliwyd yn Nhŷ’r Cwmnïau neu o ganlyniadau’r cwmni ei hun. Mae cyfrifon cwmni’n cwmpasu’r cwmni cyfan, sy’n aml yn cynnwys safleoedd y tu allan i Gymru, felly nid ydynt yn dangos faint mae cwmni’n ei gyfrannu mewn unrhyw sir.')}</p>
${employersTable(wales.employers, lang)}
<div class="note"><p><strong>${t('What the data cannot tell you', 'Yr hyn na all y data ei ddweud wrthych')}</strong></p>
<p>${t('HMRC does not publish how much tax any individual company pays, and company accounts report one tax figure for the whole company, wherever its staff work. So there is no official measure of how much tax a company pays in a particular part of Wales. Business rates are paid site by site, but councils do not publish individual bills; Valero’s figure for its Pembroke refinery is one of the few a company has published itself.', 'Nid yw CThEF yn cyhoeddi faint o dreth y mae unrhyw gwmni unigol yn ei thalu, ac mae cyfrifon cwmni’n adrodd un ffigur treth ar gyfer y cwmni cyfan, ble bynnag mae ei staff yn gweithio. Felly nid oes mesur swyddogol o faint o dreth y mae cwmni’n ei thalu mewn rhan benodol o Gymru. Telir ardrethi busnes fesul safle, ond nid yw cynghorau’n cyhoeddi biliau unigol; ffigur Valero ar gyfer ei burfa ym Mhenfro yw un o’r ychydig y mae cwmni wedi’i gyhoeddi ei hun.')}</p></div>

<h2>${t('The largest public-sector employers', 'Y cyflogwyr mwyaf yn y sector cyhoeddus')}</h2>
<p>${t(`In most counties the biggest single employer is public. NHS Wales directly employed ${num(PE.nhsAll)} people in June 2026, most of them in the seven health boards. The UK and Welsh governments employ civil servants in large offices such as the DVLA in Swansea, the Office for National Statistics in Newport and HMRC in Cardiff.`, `Yn y rhan fwyaf o siroedd, y cyflogwr unigol mwyaf yw un cyhoeddus. Roedd GIG Cymru yn cyflogi ${num(PE.nhsAll)} o bobl yn uniongyrchol ym mis Mehefin 2026, y rhan fwyaf ohonynt yn y saith bwrdd iechyd. Mae llywodraethau’r DU a Chymru yn cyflogi gweision sifil mewn swyddfeydd mawr fel y DVLA yn Abertawe, y Swyddfa Ystadegau Gwladol yng Nghasnewydd a CThEF yng Nghaerdydd.`)}</p>
${chart({ lang, legend: false, title: t('NHS Wales staff by organisation, June 2026', 'Staff GIG Cymru fesul sefydliad, Mehefin 2026'), sub: t('Headcount of staff directly employed. GPs and most dentists, pharmacists and opticians are independent contractors and are not included.', 'Nifer y staff a gyflogir yn uniongyrchol. Nid yw meddygon teulu a’r rhan fwyaf o ddeintyddion, fferyllwyr ac optegwyr, sy’n gontractwyr annibynnol, wedi’u cynnwys.'), source: src('nhsStaff'),
    cfg: { type: 'hbar', labels: PE.nhsList.map((x) => x.name), series: [{ name: t('Staff', 'Staff'), values: PE.nhsList.map((x) => x.head), color: '--c2' }], fmt: {} } })}
${table({ head: [t('Area', 'Ardal'), t('Civil servants, March 2025', 'Gweision sifil, Mawrth 2025'), t('Largest employers', 'Cyflogwyr mwyaf')],
    rows: wales.publicEmp.cs.map((c) => [esc(c.area), { v: c.total, t: num(c.total) }, { v: c.bodies[0].head, t: c.bodies.map((b) => `${esc(b.name)} (${num(b.head)})`).join(', '), cls: 'l' }]) })}
<p class="src">${t('Source', 'Ffynhonnell')}: ${src('csStats')}. ${t('Headcounts rounded to the nearest 5. Areas are the official statistical groupings of local authorities. Councils, universities and schools are also large employers but are not civil servants.', 'Niferoedd wedi’u talgrynnu i’r 5 agosaf. Yr ardaloedd yw’r grwpiau ystadegol swyddogol o awdurdodau lleol. Mae cynghorau, prifysgolion ac ysgolion hefyd yn gyflogwyr mawr ond nid ydynt yn weision sifil.')}</p>
`;
  return {
    title: t('Business in Wales: jobs by industry, workplaces and major employers', 'Busnes yng Nghymru: swyddi fesul diwydiant, gweithleoedd a chyflogwyr mawr'),
    h1: t('Business and employers in Wales', 'Busnes a chyflogwyr yng Nghymru'),
    desc: t(`${num(B.tot)} employee jobs and ${num(U.total)} workplaces in Wales. Jobs and output by industry in every county, workplace sizes and major employers, from ONS data and company accounts.`, `${num(B.tot)} o swyddi gweithwyr a ${num(U.total)} o weithleoedd yng Nghymru. Swyddi ac allbwn fesul diwydiant ym mhob sir, maint gweithleoedd a chyflogwyr mawr, o ddata’r ONS a chyfrifon cwmnïau.`),
    body, dataset: true,
  };
}

// County-level business section, inserted into each county page
export function countyBusiness(p, lang) {
  const t = T(lang);
  const n = nm(p, lang);
  const g = gvaSec(p);
  const secs = Object.keys(SEC);
  const gk = Object.keys(GVA_SEC);
  const tj = topSec(p.bres.s, SEC);
  const real = p.ind.real;
  return `
<h2>${t(`What ${n}’s economy is made of`, `O beth mae economi ${n} wedi’i gwneud`)}</h2>
<p>${t(`${n} had ${num(p.bres.tot)} employee jobs in 2024 (${num(p.bres.tot15)} in 2015). The largest employer by industry was ${sname(tj, lang).toLowerCase()}, with ${pct((p.bres.s[tj] / p.bres.tot) * 100, 0)} of jobs. After allowing for inflation, its economic output was ${pct(Math.abs(real[1] - real[0]) / real[0] * 100, 0)} ${real[1] >= real[0] ? 'higher' : 'lower'} in 2024 than in 2014.`, `Roedd gan ${n} ${num(p.bres.tot)} o swyddi gweithwyr yn 2024 (${num(p.bres.tot15)} yn 2015). Y cyflogwr mwyaf fesul diwydiant oedd ${sname(tj, lang).toLowerCase()}, gyda ${pct((p.bres.s[tj] / p.bres.tot) * 100, 0)} o’r swyddi. Ar ôl caniatáu ar gyfer chwyddiant, roedd ei hallbwn economaidd ${pct(Math.abs(real[1] - real[0]) / real[0] * 100, 0)} yn ${real[1] >= real[0] ? 'uwch' : 'is'} yn 2024 nag yn 2014.`)}</p>
<div class="two">
${chart({ lang, legend: false, title: t('Employee jobs by industry, 2024', 'Swyddi gweithwyr fesul diwydiant, 2024'), source: src('bres'),
    cfg: { type: 'hbar', labels: secs.map((k) => sname(k, lang)), series: [{ name: t('Jobs', 'Swyddi'), values: secs.map((k) => p.bres.s[k]) }], fmt: {} } })}
${chart({ lang, legend: false, title: t('Economic output by industry, 2024, £m', 'Allbwn economaidd fesul diwydiant, 2024, £m'), source: src('gvaLAind'),
    cfg: { type: 'hbar', labels: gk.map((k) => sname(k, lang, GVA_SEC)), series: [{ name: '£m', values: gk.map((k) => g[k]), color: '--c2' }], fmt: { prefix: '£', suffix: 'm' } } })}
</div>
${table({ sortable: false, head: [t('Workplace size (staff)', 'Maint gweithle (staff)'), ...SIZE_LABELS], rows: [[t('Number of workplaces, 2026', 'Nifer y gweithleoedd, 2026'), ...p.ukbc.b.map((v) => num(v))]] })}
<p class="src">${t('Source', 'Ffynhonnell')}: ${src('ukbc')}. ${t('Rounded to the nearest 5.', 'Wedi’u talgrynnu i’r 5 agosaf.')}</p>
<h3>${t(`Public-sector employers in ${n}`, `Cyflogwyr sector cyhoeddus yn ${n}`)}</h3>
<p>${t(`${n} is served by ${esc(p.nhs.name)}, which directly employed ${num(p.nhs.head)} people across ${p.nhs.counties.length === 1 ? 'the county' : `${p.nhs.counties.length} counties`} in June 2026. ${p.cs.counties.length === 1 ? `${n} had` : `The ${esc(p.cs.area)} area had`} ${num(p.cs.total)} civil servants in March 2025; the largest employers were ${p.cs.bodies.slice(0, 3).map((b) => `${esc(b.name)} (${num(b.head)})`).join(', ')}.`, `Gwasanaethir ${n} gan ${esc(p.nhs.name)}, a oedd yn cyflogi ${num(p.nhs.head)} o bobl yn uniongyrchol ar draws ${p.nhs.counties.length === 1 ? 'y sir' : `${p.nhs.counties.length} sir`} ym mis Mehefin 2026. Roedd gan ardal ${esc(p.cs.area)} ${num(p.cs.total)} o weision sifil ym mis Mawrth 2025; y cyflogwyr mwyaf oedd ${p.cs.bodies.slice(0, 3).map((b) => `${esc(b.name)} (${num(b.head)})`).join(', ')}.`)}</p>
<p class="src">${t('Sources', 'Ffynonellau')}: ${src('nhsStaff')}; ${src('csStats')}.</p>
${p.employers.length ? `<h3>${t(`Major employers based in ${n}`, `Cyflogwyr mawr yn ${n}`)}</h3>${employersTable(p.employers, lang)}` : ''}
<p><a href="${href('business', lang)}">${t('Compare business and jobs across all counties', 'Cymharu busnes a swyddi ar draws pob sir')}</a></p>`;
}
