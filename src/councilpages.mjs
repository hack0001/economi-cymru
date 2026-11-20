// Council spending pages: Wales-wide forensic breakdown and a per-county section.
import { profiles, LAS, SOURCES as S } from './data.mjs';
import { ROUTES } from './config.mjs';
import { esc, last, num, gbp, bn, pct, slugify, T, stat, chart, table, srcLink } from './lib.mjs';
import { council as C, eduPhase } from './councils.mjs';

const href = (key, lang) => ROUTES[key][lang === 'cy' ? 1 : 0];
const countyHref = (p, lang) => (lang === 'cy' ? `/cy/siroedd/${slugify(p.cy)}/` : `/counties/${p.slug}/`);
const nm = (p, lang) => (lang === 'cy' ? p.cy : p.en);
const src = (k) => srcLink(S[k]);
const W = C.tree.wales, WF = C.flat.wales, WP = C.pop.wales;
const ph = (k, slug) => (k * 1000) / C.pop[slug]; // £k -> £ per person
const m = (k) => { if (!k) return '–'; const v = k / 1000; return (v < 0 ? '−£' : '£') + num(Math.abs(v), Math.abs(v) < 10 ? 1 : 0) + 'm'; };
const FY = '2025-26';
const yi = C.years.indexOf('2008-09');
const YRS = C.years.slice(yi);
const node = (slug, id) => { const f = (n) => (n.id === id ? n : (n.ch || []).map(f).find(Boolean)); return f(C.tree[slug]); };

// Highest and lowest council per person for a given tree id
const spread = (id) => {
  const v = profiles.map((p) => ({ p, v: (C.flat[p.slug][id] ?? 0) * 1000 / C.pop[p.slug] })).sort((a, b) => b.v - a.v);
  return { hi: v[0], lo: last(v) };
};

// ---------- The drill-down tree ----------
function tree(slug, lang) {
  const t = T(lang);
  const wales = slug === 'wales';
  const total = C.tree[slug].v;
  const row = (n, depth, parentV) => {
    const share = parentV > 0 ? Math.max(0, Math.min(100, (n.v / parentV) * 100)) : 0;
    const cells = `<span class="tn-n">${esc(lang === 'cy' ? n.cy : n.en)}</span><span class="tn-v">${m(n.v)}</span><span class="tn-p">${gbp(ph(n.v, slug))}</span>${wales
      ? (() => { if (n.other) return '<span class="tn-w"></span>'; const s = spread(n.id); return `<span class="tn-w">${nm(s.hi.p, lang)} ${gbp(s.hi.v)}</span>`; })()
      : `<span class="tn-w">${n.other ? '' : gbp(((WF[n.id] ?? 0) * 1000) / WP)}</span>`}<span class="tn-bar" aria-hidden="true"><i style="width:${share.toFixed(1)}%"></i></span>`;
    if (!n.ch) return `<div class="tn leaf d${depth}${n.other ? ' other' : ''}">${cells}</div>`;
    return `<details class="tn d${depth}"><summary>${cells}</summary>${n.ch.map((c) => row(c, depth + 1, n.v)).join('')}</details>`;
  };
  return `<div class="tree" data-total="${total}">
<div class="tn tn-head"><span class="tn-n">${t('Service', 'Gwasanaeth')}</span><span class="tn-v">${t(`Net spend ${FY}`, `Gwariant net ${FY}`)}</span><span class="tn-p">${t('Per person', 'Y pen')}</span><span class="tn-w">${wales ? t('Highest council per person', 'Cyngor uchaf y pen') : t('Wales per person', 'Cymru y pen')}</span><span class="tn-bar">${t('Share of the level above', 'Cyfran o’r lefel uwch')}</span></div>
${C.tree[slug].ch.map((c) => row(c, 0, total)).join('')}
<div class="tn tn-total"><span class="tn-n">${t('Total net service spending', 'Cyfanswm gwariant net ar wasanaethau')}</span><span class="tn-v">${m(total)}</span><span class="tn-p">${gbp(ph(total, slug))}</span><span class="tn-w">${wales ? '' : gbp((W.v * 1000) / WP)}</span><span class="tn-bar"></span></div>
</div>
<p class="tree-help">${t('Select any line with a + to open it. “Net” means after fees, charges and income the service earns itself; a negative figure means a service brought in more than it cost.', 'Dewiswch unrhyw linell â + i’w hagor. Mae “net” yn golygu ar ôl ffioedd, taliadau ac incwm y mae’r gwasanaeth yn ei ennill ei hun; mae ffigur negyddol yn golygu bod gwasanaeth wedi dod â mwy i mewn nag a gostiodd.')}</p>`;
}

// Funding sources for an area (£k)
const funding = (slug) => {
  const f = C.ro[slug].fin;
  return [
    { k: 'rsg', en: 'Revenue support grant (Welsh Government)', cy: 'Grant cynnal refeniw (Llywodraeth Cymru)', v: f.rsg },
    { k: 'grants', en: 'Specific grants (Welsh and UK governments)', cy: 'Grantiau penodol (llywodraethau Cymru a’r DU)', v: f.grants },
    { k: 'ct', en: 'Council tax payers', cy: 'Talwyr y dreth gyngor', v: f.ct },
    { k: 'fees', en: 'Fees, charges and other income', cy: 'Ffioedd, taliadau ac incwm arall', v: -C.ro[slug].tse[1] },
    { k: 'ndr', en: 'Business rates (shared out nationally)', cy: 'Ardrethi busnes (wedi’u rhannu’n genedlaethol)', v: f.ndr },
  ];
};

const GROUPS = [
  ['schools', 'Schools', 'Ysgolion', '--c1'], ['social_adults', 'Adult social care', 'Gofal cymdeithasol oedolion', '--c2'], ['social_children', 'Children’s social care', 'Gofal cymdeithasol plant', '--c3'], ['housing', 'Housing', 'Tai', '--c4'],
  ['waste', 'Waste', 'Gwastraff', '--c5'], ['roads_transport', 'Roads and transport', 'Ffyrdd a thrafnidiaeth', '--c6'], ['culture_leisure', 'Culture and leisure', 'Diwylliant a hamdden', '--c7'], ['central', 'Central services', 'Gwasanaethau canolog', '--c8'],
  ['env_reg', 'Environment and regulation', 'Amgylchedd a rheoleiddio', '--c2'], ['planning_econ', 'Planning and economy', 'Cynllunio a’r economi', '--c3'], ['edu_other', 'Other education', 'Addysg arall', '--c4'],
];

const COMPARE = [
  ['education.schools', 'Schools', 'Ysgolion'], ['social.older', 'Older people’s care', 'Gofal pobl hŷn'], ['social.adults', 'Care for adults 18–64', 'Gofal oedolion 18–64'], ['social.children', 'Children’s services', 'Gwasanaethau plant'],
  ['housing', 'Housing', 'Tai'], ['waste', 'Waste and environment', 'Gwastraff a’r amgylchedd'], ['roads', 'Roads and transport', 'Ffyrdd a thrafnidiaeth'], ['culture', 'Culture and leisure', 'Diwylliant a hamdden'], ['planning', 'Planning and economy', 'Cynllunio a’r economi'], ['central', 'Running the council', 'Rhedeg y cyngor'],
];

// All leaf lines in Wales, largest first
const leaves = (n, out = [], path = []) => { if (!n.ch) { if (!n.other) out.push({ ...n, path }); } else n.ch.forEach((c) => leaves(c, out, n.en ? [...path, n] : path)); return out; };

export function councils(lang) {
  const t = T(lang);
  const tot = W.v;
  const f = C.ro.wales.fin;
  const fund = funding('wales');
  const fundTot = fund.reduce((a, x) => a + x.v, 0);
  const care = (WF['social'] / tot) * 100, edu = (WF['education'] / tot) * 100;
  const rows = profiles.map((p) => ({ p, v: C.tree[p.slug].v, ph: ph(C.tree[p.slug].v, p.slug), ct: (C.ro[p.slug].fin.ct / funding(p.slug).reduce((a, x) => a + x.v, 0)) * 100 })).sort((a, b) => b.ph - a.ph);
  const top = leaves(W).sort((a, b) => b.v - a.v).slice(0, 25);
  const debt = profiles.map((p) => { const x = C.ro[p.slug].fin; const d = x.mrp + x.interest + x.pfi + x.leasing; return { p, mrp: x.mrp, int: x.interest, pfi: x.pfi + x.leasing, d, dph: ph(d, p.slug), fire: x.fire, cc: x.cc }; });
  const phases = eduPhase('wales');
  const body = `
<p class="lede">${t(`Wales’ 22 councils spent ${bn(tot / 1000, 2)} running local services in ${FY} – ${gbp(ph(tot, 'wales'))} for every person, after the fees and charges services earn themselves. Education and social services together took ${pct(edu + care, 0)} of it. This page breaks that spending down line by line, for Wales and for every council.`, `Gwariodd 22 cyngor Cymru ${bn(tot / 1000, 2)} ar redeg gwasanaethau lleol yn ${FY} – ${gbp(ph(tot, 'wales'))} am bob person, ar ôl y ffioedd a’r taliadau y mae gwasanaethau’n eu hennill eu hunain. Cymerodd addysg a gwasanaethau cymdeithasol gyda’i gilydd ${pct(edu + care, 0)} ohono. Mae’r dudalen hon yn dadansoddi’r gwariant hwnnw fesul llinell, ar gyfer Cymru a phob cyngor.`)}</p>
<div class="stats">
${stat(t(`Net spending on services, ${FY}`, `Gwariant net ar wasanaethau, ${FY}`), bn(tot / 1000, 2), t(`${gbp(ph(tot, 'wales'))} per person`, `${gbp(ph(tot, 'wales'))} y pen`))}
${stat(t('Gross spending before income', 'Gwariant gros cyn incwm'), bn(C.ro.wales.tse[0] / 1000, 2), t(`Services earned ${bn(-C.ro.wales.tse[1] / 1000, 2)} from fees, charges and other income`, `Enillodd gwasanaethau ${bn(-C.ro.wales.tse[1] / 1000, 2)} o ffioedd, taliadau ac incwm arall`))}
${stat(t('Schools', 'Ysgolion'), bn(WF['education.schools'] / 1000, 2), t(`${pct((WF['education.schools'] / tot) * 100)} of net spending`, `${pct((WF['education.schools'] / tot) * 100)} o’r gwariant net`))}
${stat(t('Social services', 'Gwasanaethau cymdeithasol'), bn(WF['social'] / 1000, 2), t(`${pct(care)} of net spending`, `${pct(care)} o’r gwariant net`))}
</div>

<h2>${t('Where councils’ money comes from', 'O ble daw arian cynghorau')}</h2>
<p>${t(`Most council money comes from the Welsh Government, as a general grant councils can spend as they choose (the revenue support grant) and as specific grants tied to particular purposes. Council tax raised ${bn(f.ct / 1000, 2)}, about ${pct((f.ct / fundTot) * 100, 0)} of the total. Business rates are collected locally but pooled and shared out across Wales by population.`, `Daw’r rhan fwyaf o arian cynghorau gan Lywodraeth Cymru, fel grant cyffredinol y gall cynghorau ei wario fel y mynnant (y grant cynnal refeniw) ac fel grantiau penodol sydd ynghlwm wrth ddibenion penodol. Cododd y dreth gyngor ${bn(f.ct / 1000, 2)}, tua ${pct((f.ct / fundTot) * 100, 0)} o’r cyfanswm. Caiff ardrethi busnes eu casglu’n lleol ond eu cronni a’u rhannu ar draws Cymru yn ôl poblogaeth.`)}</p>
${chart({ lang, legend: false, title: t(`Council revenue funding by source, Wales, ${FY}`, `Cyllid refeniw cynghorau yn ôl ffynhonnell, Cymru, ${FY}`), sub: t('£ million. Specific grants include housing benefit funding from the UK government.', '£ miliwn. Mae grantiau penodol yn cynnwys cyllid budd-dal tai gan lywodraeth y DU.'), source: src('ro'),
    cfg: { type: 'hbar', labels: fund.map((x) => (lang === 'cy' ? x.cy : x.en)), series: [{ name: '£m', values: fund.map((x) => Math.round(x.v / 1000)) }], fmt: { prefix: '£', suffix: 'm' } } })}
${table({ head: [t('Council', 'Cyngor'), t('Funding per person', 'Cyllid y pen'), t('From council tax', 'O’r dreth gyngor'), t('Revenue support grant', 'Grant cynnal refeniw'), t('Specific grants', 'Grantiau penodol'), t('Fees and charges', 'Ffioedd a thaliadau'), t('Business rates', 'Ardrethi busnes')],
    rows: profiles.map((p) => { const fu = funding(p.slug); const tt = fu.reduce((a, x) => a + x.v, 0); const g = (k) => fu.find((x) => x.k === k).v; const c = (k) => ({ v: (g(k) / tt) * 100, t: pct((g(k) / tt) * 100, 0) }); return [`<a href="${countyHref(p, lang)}">${nm(p, lang)}</a>`, { v: ph(tt, p.slug), t: gbp(ph(tt, p.slug)) }, c('ct'), c('rsg'), c('grants'), c('fees'), c('ndr')]; }) })}
<p class="src">${t('Shares of total revenue funding. Councils also add to or draw on their reserves, so funding does not exactly equal spending in any year.', 'Cyfrannau o gyfanswm y cyllid refeniw. Mae cynghorau hefyd yn ychwanegu at eu cronfeydd wrth gefn neu’n tynnu arnynt, felly nid yw cyllid yn hafal i wariant yn union mewn unrhyw flwyddyn.')}</p>

<h2>${t('Where the money goes, line by line', 'I ble mae’r arian yn mynd, fesul llinell')}</h2>
<p>${t('Every service councils report to the Welsh Government, from schools down to individual budgets such as foster care, gritting and street lighting. The last column shows which council spends the most per person on each line.', 'Pob gwasanaeth y mae cynghorau’n ei adrodd i Lywodraeth Cymru, o ysgolion i lawr i gyllidebau unigol fel gofal maeth, graeanu a goleuadau stryd. Mae’r golofn olaf yn dangos pa gyngor sy’n gwario fwyaf y pen ar bob llinell.')}</p>
${tree('wales', lang)}
<p class="src">${t('Sources', 'Ffynonellau')}: ${src('ro')}; ${src('roEdu')}; ${src('roSoc')}; ${src('roRoads')}.</p>

<h2>${t('The 25 biggest individual budget lines', 'Y 25 llinell gyllideb unigol fwyaf')}</h2>
${chart({ lang, legend: false, title: t(`Largest detailed spending lines, all Welsh councils, ${FY}`, `Llinellau gwariant manwl mwyaf, holl gynghorau Cymru, ${FY}`), sub: t('£ million, net', '£ miliwn, net'), source: src('ro'),
    cfg: { type: 'hbar', labels: top.map((l) => { const parent = last(l.path); return (lang === 'cy' ? l.cy : l.en) + (parent && parent.id && !['housing', 'waste', 'culture', 'planning', 'central'].includes(parent.id) ? ` (${lang === 'cy' ? parent.cy : parent.en})` : ''); }), series: [{ name: '£m', values: top.map((l) => Math.round(l.v / 100) / 10) }], fmt: { prefix: '£', suffix: 'm', dec: 1 } } })}

<h2>${t('How councils compare', 'Sut mae cynghorau’n cymharu')}</h2>
<p>${t('Spending per person differs a lot between councils, partly because of choices and partly because of population, age profile, rurality and deprivation. Choose a service.', 'Mae gwariant y pen yn amrywio’n fawr rhwng cynghorau, yn rhannol oherwydd dewisiadau ac yn rhannol oherwydd poblogaeth, proffil oedran, gwledigrwydd ac amddifadedd. Dewiswch wasanaeth.')}</p>
${chart({ lang, legend: false, title: t(`Net spending per person by council, ${FY}`, `Gwariant net y pen fesul cyngor, ${FY}`), source: src('ro'), views: COMPARE.map((c) => (lang === 'cy' ? c[2] : c[1])),
    cfg: { type: 'hbar', labels: profiles.map((p) => nm(p, lang)), links: profiles.map((p) => countyHref(p, lang)), fmt: { prefix: '£' }, views: COMPARE.map(([id]) => ({ series: [{ name: '£', values: profiles.map((p) => Math.round(ph(C.flat[p.slug][id] ?? 0, p.slug))) }] })) } })}
${table({ head: [t('Council', 'Cyngor'), t('Total per person', 'Cyfanswm y pen'), ...COMPARE.map((c) => (lang === 'cy' ? c[2] : c[1]))],
    rows: rows.map((r) => [`<a href="${countyHref(r.p, lang)}">${nm(r.p, lang)}</a>`, { v: r.ph, t: gbp(r.ph) }, ...COMPARE.map(([id]) => { const v = ph(C.flat[r.p.slug][id] ?? 0, r.p.slug); return { v, t: gbp(v) }; })]).concat([[`<strong>${t('Wales', 'Cymru')}</strong>`, { v: ph(tot, 'wales'), t: `<strong>${gbp(ph(tot, 'wales'))}</strong>` }, ...COMPARE.map(([id]) => { const v = ph(WF[id], 'wales'); return { v, t: gbp(v) }; })]]) })}
<p class="src">${t('Per person figures use mid-2024 population estimates.', 'Mae ffigurau y pen yn defnyddio amcangyfrifon poblogaeth canol 2024.')}</p>

<h2>${t('Schools by type', 'Ysgolion yn ôl math')}</h2>
<p>${t(`Of the ${bn(WF['education.schools'] / 1000, 2)} spent on schools, ${bn(phases[0].v / 1000, 2)} went on primary schools and ${bn(phases[1].v / 1000, 2)} on secondary schools. These figures include each school’s share of central costs such as transport and additional learning needs.`, `O’r ${bn(WF['education.schools'] / 1000, 2)} a wariwyd ar ysgolion, aeth ${bn(phases[0].v / 1000, 2)} ar ysgolion cynradd a ${bn(phases[1].v / 1000, 2)} ar ysgolion uwchradd. Mae’r ffigurau hyn yn cynnwys cyfran pob ysgol o gostau canolog fel cludiant ac anghenion dysgu ychwanegol.`)}</p>
${table({ head: [t('Council', 'Cyngor'), ...eduPhase('wales').map((x) => (lang === 'cy' ? x.cy : x.en)), t('Delegated to schools’ own budgets', 'Wedi’i ddirprwyo i gyllidebau ysgolion'), t('Home-to-school transport', 'Cludiant i’r ysgol')],
    rows: [...profiles, null].map((p) => { const s = p ? p.slug : 'wales'; const name = p ? `<a href="${countyHref(p, lang)}">${nm(p, lang)}</a>` : `<strong>${t('Wales', 'Cymru')}</strong>`; const del = node(s, 'education.schools').ch.find((c) => c.en.startsWith('Day-to-day')); const tr = node(s, 'education.schools').ch.find((c) => c.en.startsWith('Home-to-school')); return [name, ...eduPhase(s).map((x) => ({ v: x.v, t: m(x.v) })), { v: del.v, t: m(del.v) }, { v: tr.v, t: m(tr.v) }]; }) })}
<p class="src">${t('Source', 'Ffynhonnell')}: ${src('roEdu')}. ${t('All-through schools teach both primary and secondary pupils. Some councils have none.', 'Mae ysgolion pob oed yn dysgu disgyblion cynradd ac uwchradd. Nid oes gan rai cynghorau unrhyw rai.')}</p>

<h2>${t('Debt, levies and payments to other bodies', 'Dyled, ardollau a thaliadau i gyrff eraill')}</h2>
<p>${t(`On top of services, councils set aside money to repay borrowing for buildings and roads (${bn(f.mrp / 1000, 2)} in ${FY}) and pay interest on it (${bn(f.interest / 1000, 2)}). They also pay levies to the three fire and rescue authorities (${bn(f.fire / 1000, 2)}), and collect precepts for town and community councils (${bn(f.cc / 1000, 2)}).`, `Ar ben gwasanaethau, mae cynghorau’n neilltuo arian i ad-dalu benthyca ar gyfer adeiladau a ffyrdd (${bn(f.mrp / 1000, 2)} yn ${FY}) ac yn talu llog arno (${bn(f.interest / 1000, 2)}). Maen nhw hefyd yn talu ardollau i’r tri awdurdod tân ac achub (${bn(f.fire / 1000, 2)}), ac yn casglu praeseptau ar gyfer cynghorau tref a chymuned (${bn(f.cc / 1000, 2)}).`)}</p>
${table({ head: [t('Council', 'Cyngor'), t('Debt repayment provision', 'Darpariaeth ad-dalu dyled'), t('Interest', 'Llog'), t('PFI and leasing', 'PFI a phrydlesu'), t('Debt costs per person', 'Costau dyled y pen'), t('Fire authority levy', 'Ardoll awdurdod tân'), t('Town and community councils', 'Cynghorau tref a chymuned')],
    rows: debt.map((d) => [`<a href="${countyHref(d.p, lang)}">${nm(d.p, lang)}</a>`, { v: d.mrp, t: m(d.mrp) }, { v: d.int, t: m(d.int) }, { v: d.pfi, t: m(d.pfi) }, { v: d.dph, t: gbp(d.dph) }, { v: d.fire, t: m(d.fire) }, { v: d.cc, t: m(d.cc) }]) })}

<h2>${t('How spending has changed since 2008-09', 'Sut mae gwariant wedi newid ers 2008-09')}</h2>
${chart({ lang, title: t('Net council spending by service, Wales, £ million (cash)', 'Gwariant net cynghorau fesul gwasanaeth, Cymru, £ miliwn (arian parod)'), sub: t('Not adjusted for inflation. Service definitions have changed slightly over time.', 'Heb ei addasu ar gyfer chwyddiant. Mae diffiniadau gwasanaethau wedi newid ychydig dros amser.'), source: src('ro'),
    views: [t('Largest services', 'Gwasanaethau mwyaf'), t('Other services', 'Gwasanaethau eraill')],
    cfg: { type: 'line', labels: YRS, fmt: { prefix: '£', suffix: 'm' }, views: [GROUPS.slice(0, 4), GROUPS.slice(4)].map((gs) => ({ series: gs.map(([k, en, cy, col]) => ({ name: lang === 'cy' ? cy : en, values: C.groups[k].slice(yi).map((v) => Math.round(v / 1000)), color: col })) })) } })}
${table({ head: [t('Council', 'Cyngor'), `2008-09`, `2015-16`, `2020-21`, FY, t('Change since 2008-09 (cash)', 'Newid ers 2008-09 (arian parod)')],
    rows: [...profiles, null].map((p) => { const s = p ? p.slug : 'wales'; const v = C.trend[s]; const at = (y) => v[C.years.indexOf(y)]; const ch = ((at(FY) - at('2008-09')) / at('2008-09')) * 100; return [p ? `<a href="${countyHref(p, lang)}">${nm(p, lang)}</a>` : `<strong>${t('Wales', 'Cymru')}</strong>`, ...['2008-09', '2015-16', '2020-21', FY].map((y) => ({ v: at(y), t: m(at(y)) })), { v: ch, t: '+' + pct(ch, 0) }]; }) })}
<p class="src">${t('Total net service spending, cash terms. Prices rose by roughly half over the same period, so a rise of less than about 50% is a fall after inflation.', 'Cyfanswm gwariant net ar wasanaethau, termau arian parod. Cododd prisiau tua hanner dros yr un cyfnod, felly mae cynnydd o lai na thua 50% yn ostyngiad ar ôl chwyddiant.')}</p>

<details><summary>${t('What these figures include and exclude', 'Beth mae’r ffigurau hyn yn ei gynnwys a’i hepgor')}</summary><ul>
<li>${t('These are revenue (day-to-day) spending figures from councils’ final outturn returns to the Welsh Government. Spending on new buildings, roads and equipment (capital) is not included.', 'Ffigurau gwariant refeniw (dydd-i-ddydd) yw’r rhain o ffurflenni alldro terfynol cynghorau i Lywodraeth Cymru. Nid yw gwariant ar adeiladau, ffyrdd ac offer newydd (cyfalaf) wedi’i gynnwys.')}</li>
<li>${t('Councils that own homes keep rents and the cost of managing them in a separate housing revenue account, which is not shown here. The housing line includes housing benefit paid to private and housing association tenants, which is largely funded by a UK government grant.', 'Mae cynghorau sy’n berchen ar gartrefi yn cadw rhenti a chost eu rheoli mewn cyfrif refeniw tai ar wahân, nad yw’n cael ei ddangos yma. Mae’r llinell dai yn cynnwys budd-dal tai a delir i denantiaid preifat a chymdeithasau tai, a ariennir yn bennaf gan grant gan lywodraeth y DU.')}</li>
<li>${t('Police and fire services are run by separate bodies. Police are funded mainly by the UK government and a council tax precept; fire authorities by levies on councils.', 'Caiff gwasanaethau heddlu a thân eu rhedeg gan gyrff ar wahân. Caiff yr heddlu eu hariannu’n bennaf gan lywodraeth y DU a phraesept treth gyngor; awdurdodau tân gan ardollau ar gynghorau.')}</li>
<li>${t('“Other / not separately recorded” lines are the difference between a total and the detailed lines beneath it in the source tables.', 'Llinellau “Arall / heb ei gofnodi ar wahân” yw’r gwahaniaeth rhwng cyfanswm a’r llinellau manwl oddi tano yn y tablau ffynhonnell.')}</li>
<li>${t('Councils classify some spending differently, so small lines are not always comparable between councils.', 'Mae cynghorau’n dosbarthu rhywfaint o wariant yn wahanol, felly nid yw llinellau bach bob amser yn gymaradwy rhwng cynghorau.')}</li>
</ul></details>
<p><a href="${href('counciltax', lang)}">${t('See council tax bills for every council', 'Gweler biliau treth gyngor pob cyngor')}</a></p>
`;
  return {
    title: t(`Council spending in Wales ${FY}: where every pound goes, by council`, `Gwariant cynghorau yng Nghymru ${FY}: i ble mae pob punt yn mynd, fesul cyngor`),
    h1: t('Council spending in Wales', 'Gwariant cynghorau yng Nghymru'),
    desc: t(`Welsh councils spent ${bn(tot / 1000, 2)} on services in ${FY}. A line-by-line breakdown of schools, social care, housing, waste, roads and more for all 22 councils, with funding sources, debt costs and trends since 2008.`, `Gwariodd cynghorau Cymru ${bn(tot / 1000, 2)} ar wasanaethau yn ${FY}. Dadansoddiad fesul llinell o ysgolion, gofal cymdeithasol, tai, gwastraff, ffyrdd a mwy ar gyfer pob un o’r 22 cyngor, gyda ffynonellau cyllid, costau dyled a thueddiadau ers 2008.`),
    body, dataset: true,
  };
}

// Section for each county page
export function countyCouncil(p, lang) {
  const t = T(lang);
  const n = nm(p, lang);
  const s = p.slug;
  const tot = C.tree[s].v;
  const pp = ph(tot, s), wp = ph(W.v, 'wales');
  const rk = profiles.map((q) => ({ q, v: ph(C.tree[q.slug].v, q.slug) })).sort((a, b) => b.v - a.v).findIndex((x) => x.q.slug === s) + 1;
  const fund = funding(s);
  const ft = fund.reduce((a, x) => a + x.v, 0);
  const ctShare = (C.ro[s].fin.ct / ft) * 100;
  // Lines where this council differs most from the Wales average per person (leaf level, material lines only)
  const diffs = leaves(C.tree[s]).map((l) => ({ l, d: ph(l.v, s) - ph(WF[l.id] ?? 0, 'wales') })).filter((x) => Math.abs(x.d) >= 15).sort((a, b) => b.d - a.d);
  const above = diffs.slice(0, 3), below = diffs.slice(-3).reverse().filter((x) => x.d < 0);
  const ln = (x) => { const par = last(x.l.path); return `${(lang === 'cy' ? x.l.cy : x.l.en).toLowerCase()}${par && par.id && par.id.includes('.') ? ` – ${(lang === 'cy' ? par.cy : par.en).toLowerCase()}` : ''} (${gbp(Math.abs(x.d))} ${x.d > 0 ? t('more', 'yn fwy') : t('less', 'yn llai')})`; };
  const v = C.trend[s];
  return `
<h2>${t(`How ${n} council spends its money`, `Sut mae cyngor ${n} yn gwario ei arian`)}</h2>
<p>${t(`${n} council spent ${m(tot)} on services in ${FY}, after fees and charges – ${gbp(pp)} per person, against ${gbp(wp)} across Wales (${ord(rk)} highest of 22). Council tax paid for ${pct(ctShare, 0)} of its funding.`, `Gwariodd cyngor ${n} ${m(tot)} ar wasanaethau yn ${FY}, ar ôl ffioedd a thaliadau – ${gbp(pp)} y pen, o’i gymharu â ${gbp(wp)} ar draws Cymru (${rk} o 22, 1 = uchaf). Talodd y dreth gyngor am ${pct(ctShare, 0)} o’i gyllid.`)}${above.length ? ' ' + t(`Compared with the Welsh average per person, it spends most above average on ${above.map(ln).join(', ')}`, `O’i gymharu â chyfartaledd Cymru y pen, mae’n gwario fwyaf uwchlaw’r cyfartaledd ar ${above.map(ln).join(', ')}`) + (below.length ? t(`, and furthest below on ${below.map(ln).join(', ')}.`, `, a fwyaf islaw ar ${below.map(ln).join(', ')}.`) : '.') : ''}</p>
${tree(s, lang)}
<div class="two">
${chart({ lang, legend: false, title: t(`Where ${n} council’s money comes from, ${FY}`, `O ble daw arian cyngor ${n}, ${FY}`), sub: '£ million', source: src('ro'),
    cfg: { type: 'hbar', labels: fund.map((x) => (lang === 'cy' ? x.cy : x.en)), series: [{ name: '£m', values: fund.map((x) => Math.round(x.v / 100) / 10), color: '--c2' }], fmt: { prefix: '£', suffix: 'm', dec: 1 } } })}
${chart({ lang, legend: false, title: t(`Net service spending, ${n} council, £m (cash)`, `Gwariant net ar wasanaethau, cyngor ${n}, £m (arian parod)`), source: src('ro'),
    cfg: { type: 'bar', labels: YRS, series: [{ name: '£m', values: v.slice(yi).map((x) => Math.round(x / 1000)) }], fmt: { prefix: '£', suffix: 'm' } } })}
</div>
<p class="src">${t(`Debt costs in ${FY}: ${m(C.ro[s].fin.mrp)} set aside to repay borrowing and ${m(C.ro[s].fin.interest)} in interest. Fire authority levy: ${m(C.ro[s].fin.fire)}.`, `Costau dyled yn ${FY}: ${m(C.ro[s].fin.mrp)} wedi’i neilltuo i ad-dalu benthyca a ${m(C.ro[s].fin.interest)} mewn llog. Ardoll awdurdod tân: ${m(C.ro[s].fin.fire)}.`)} ${t('Sources', 'Ffynonellau')}: ${src('ro')}; ${src('roSoc')}; ${src('roEdu')}; ${src('roRoads')}.</p>
<p><a href="${href('councils', lang)}">${t('Compare council spending across Wales', 'Cymharu gwariant cynghorau ar draws Cymru')}</a></p>`;
}
const ord = (n) => n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');
