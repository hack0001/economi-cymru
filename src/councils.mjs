// Council (local authority) revenue spending: forensic breakdown from Welsh Government revenue outturn 2025-26.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { profiles, LAS } from './data.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rd = (f) => readFileSync(path.join(root, 'raw', f), 'utf8').split('\n').filter((l) => l.trim());
const NAME_FIX = { 'Total Unitary Authorities': 'Wales' };
const slugOf = Object.fromEntries(LAS.map((l) => [l.en, l.slug]));
slugOf.Wales = 'wales';

function readLeaf(file) {
  const out = {};
  for (const l of rd(file)) {
    if (l.startsWith('#')) continue;
    const [a, v] = l.split('|');
    out[slugOf[NAME_FIX[a] || a]] = v.split(',').map(Number);
  }
  return out;
}
const SOC = readLeaf('council_social.txt');
const EDU = readLeaf('council_edu.txt');
const RD = readLeaf('council_roads.txt');

// Main revenue outturn file: 42 service lines | TSE gross,income,net | financing
const RO = {};
for (const l of rd('council_ro.txt')) {
  if (l.startsWith('#')) continue;
  const [a, s, tse, fin] = l.split('|');
  const f = fin.split(',').map(Number);
  RO[slugOf[a]] = {
    s: s.split(',').map(Number),
    tse: tse.split(',').map(Number),
    fin: { cc: f[0], fire: f[1], parks: f[2], police: f[3], levies: f[4], nce: f[5], mrp: f[6], interest: f[7], pfi: f[8], leasing: f[9], capRev: f[10], gre: f[11], grants: -f[12], nre: f[13], budget: f[14], rsg: -f[15], ndr: -f[16], ct: f[17] },
  };
}

// Trend file
const TR = { years: [], la: {}, groups: {} };
{
  let inGroups = false;
  for (const l of rd('council_ro_trend.txt')) {
    if (l.startsWith('YEARS')) { TR.years = l.slice(6).split(','); continue; }
    if (l.startsWith('#GROUPS')) { inGroups = true; continue; }
    if (l.startsWith('#')) continue;
    const [a, v] = l.split('|');
    if (inGroups) TR.groups[a] = v.split(',').map(Number);
    else TR.la[slugOf[a]] = v.split(',').map(Number);
  }
}

// ---------- The spending tree ----------
// Leaf refs: ['ro', i] | ['soc', i] | ['edu', i] | ['rd', i]. Parent nodes with `ro` take their total from the main file;
// children that don't add up exactly get an "other / not allocated" balancing line.
const L = (en, cy, ref) => ({ en, cy, ref });
const N = (id, en, cy, ch, ref) => ({ id, en, cy, ch, ref });

const socRange = (a, b, names) => names.map((n, i) => L(n[0], n[1], ['soc', a + i]));
const PLACE_CARE = [['Assessment and care management', 'Asesu a rheoli gofal'], ['Nursing home placements', 'Lleoliadau cartrefi nyrsio'], ['Residential care placements', 'Lleoliadau gofal preswyl'], ['Supported and other accommodation', 'Llety â chymorth a llety arall'], ['Direct payments', 'Taliadau uniongyrchol'], ['Home care', 'Gofal cartref'], ['Day care', 'Gofal dydd']];

export const TREE = [
  N('education', 'Education', 'Addysg', [
    N('schools', 'Schools', 'Ysgolion', [
      L('Day-to-day budgets delegated to schools (staff, running costs)', 'Cyllidebau dydd-i-ddydd a ddirprwyir i ysgolion (staff, costau rhedeg)', ['edu', 5]),
      L('Home-to-school transport', 'Cludiant o’r cartref i’r ysgol', ['edu', 13]),
      L('Additional learning needs – held centrally for schools', 'Anghenion dysgu ychwanegol – a ddelir yn ganolog ar gyfer ysgolion', ['edu', 6]),
      L('Additional learning needs – council services', 'Anghenion dysgu ychwanegol – gwasanaethau’r cyngor', ['edu', 10]),
      L('School meals and catering', 'Prydau a darpariaeth arlwyo ysgolion', ['edu', 7]),
      L('Strategic management (education department)', 'Rheolaeth strategol (adran addysg)', ['edu', 14]),
      L('Access to education (admissions, attendance, welfare)', 'Mynediad i addysg (derbyn, presenoldeb, lles)', ['edu', 12]),
      L('School improvement', 'Gwella ysgolion', ['edu', 11]),
      L('Other central school budget', 'Cyllideb ysgolion ganolog arall', ['edu', 9]),
      L('Pupils educated in other councils’ areas (net)', 'Disgyblion a addysgir yn ardaloedd cynghorau eraill (net)', ['edu', 8]),
      L('Other council spending on schools', 'Gwariant arall y cyngor ar ysgolion', ['edu', 15]),
    ], ['ro', 0]),
    N('nonschool', 'Education outside schools', 'Addysg y tu allan i ysgolion', [
      L('Youth service', 'Gwasanaeth ieuenctid', ['edu', 18]), L('Adult education', 'Addysg oedolion', ['edu', 17]), L('Under-5 provision outside schools', 'Darpariaeth dan 5 y tu allan i ysgolion', ['edu', 16]), L('Home-to-college transport', 'Cludiant o’r cartref i’r coleg', ['edu', 19]),
    ], ['ro', 1]),
  ]),
  N('social', 'Social services', 'Gwasanaethau cymdeithasol', [
    N('older', 'Older people (65+)', 'Pobl hŷn (65+)', [...socRange(21, 7, PLACE_CARE), L('Equipment and adaptations', 'Offer ac addasiadau', ['soc', 28]), L('Meals', 'Prydau', ['soc', 29]), L('Other services', 'Gwasanaethau eraill', ['soc', 30])], ['ro', 7]),
    N('children', 'Children and families', 'Plant a theuluoedd', [
      N('lac', 'Children looked after', 'Plant sy’n derbyn gofal', [
        L('Residential care', 'Gofal preswyl', ['soc', 1]), L('Fostering', 'Maethu', ['soc', 2]), L('Placed with family and friends', 'Wedi’u lleoli gyda theulu a ffrindiau', ['soc', 3]), L('Education of children looked after', 'Addysg plant sy’n derbyn gofal', ['soc', 4]), L('Leaving care support', 'Cymorth gadael gofal', ['soc', 5]), L('Adoption', 'Mabwysiadu', ['soc', 6]), L('Special guardianship support', 'Cymorth gwarcheidiaeth arbennig', ['soc', 7]), L('Unaccompanied asylum-seeking children', 'Plant sy’n ceisio lloches ar eu pen eu hunain', ['soc', 8]), L('Other looked-after services', 'Gwasanaethau derbyn gofal eraill', ['soc', 9]),
      ]),
      L('Social work, including child protection', 'Gwaith cymdeithasol, gan gynnwys amddiffyn plant', ['soc', 18]),
      L('Flying Start, children’s centres and early years', 'Dechrau’n Deg, canolfannau plant a’r blynyddoedd cynnar', ['soc', 0]),
      L('Targeted family support', 'Cymorth i deuluoedd wedi’i dargedu', ['soc', 13]),
      L('Youth justice', 'Cyfiawnder ieuenctid', ['soc', 15]),
      L('Services for young people', 'Gwasanaethau i bobl ifanc', ['soc', 20]),
      L('Commissioning and strategy', 'Comisiynu a strategaeth', ['soc', 19]),
      L('Short breaks for disabled children', 'Seibiannau byr i blant anabl', ['soc', 11]),
      L('Other support for disabled children', 'Cymorth arall i blant anabl', ['soc', 12]),
      L('Direct payments', 'Taliadau uniongyrchol', ['soc', 10]),
      L('Universal family support', 'Cymorth cyffredinol i deuluoedd', ['soc', 14]),
      L('Asylum seekers’ children’s services', 'Gwasanaethau plant ceiswyr lloches', ['soc', 16]),
      L('Other children’s and family services', 'Gwasanaethau plant a theuluoedd eraill', ['soc', 17]),
    ], ['ro', 5]),
    N('adults', 'Adults aged 18–64', 'Oedolion 18–64 oed', [
      N('ld', 'Learning disabilities', 'Anableddau dysgu', [...socRange(40, 7, PLACE_CARE), L('Other services', 'Gwasanaethau eraill', ['soc', 47])]),
      N('pd', 'Physical disabilities', 'Anableddau corfforol', [...socRange(31, 7, PLACE_CARE), L('Equipment and adaptations', 'Offer ac addasiadau', ['soc', 38]), L('Other services', 'Gwasanaethau eraill', ['soc', 39])]),
      N('mh', 'Mental health', 'Iechyd meddwl', [...socRange(48, 7, PLACE_CARE), L('Other services', 'Gwasanaethau eraill', ['soc', 55])]),
      N('oa', 'Other adults', 'Oedolion eraill', [L('Assessment and care management', 'Asesu a rheoli gofal', ['soc', 56]), L('Substance misuse', 'Camddefnyddio sylweddau', ['soc', 57]), L('Asylum seekers – lone adults', 'Ceiswyr lloches – oedolion ar eu pen eu hunain', ['soc', 58]), L('Other adult services', 'Gwasanaethau oedolion eraill', ['soc', 59])]),
    ], ['ro', 8]),
    L('Adult services strategy', 'Strategaeth gwasanaethau oedolion', ['ro', 6]),
  ]),
  N('housing', 'Housing', 'Tai', [
    L('Housing (council fund), including housing benefit', 'Tai (cronfa’r cyngor), gan gynnwys budd-dal tai', ['ro', 32]),
    L('Other housing, including homelessness', 'Tai arall, gan gynnwys digartrefedd', ['ro', 33]),
  ]),
  N('waste', 'Waste and the local environment', 'Gwastraff a’r amgylchedd lleol', [
    L('Waste collection and disposal', 'Casglu a gwaredu gwastraff', ['ro', 22]), L('Street cleaning', 'Glanhau strydoedd', ['ro', 17]), L('Environmental health', 'Iechyd yr amgylchedd', ['ro', 16]), L('Trading standards', 'Safonau masnach', ['ro', 21]), L('Community safety (CCTV, antisocial behaviour)', 'Diogelwch cymunedol (teledu cylch cyfyng, ymddygiad gwrthgymdeithasol)', ['ro', 18]), L('Flood defence and land drainage', 'Amddiffyn rhag llifogydd a draenio tir', ['ro', 19]), L('Environmental initiatives', 'Mentrau amgylcheddol', ['ro', 26]), L('Coast protection', 'Diogelu’r arfordir', ['ro', 15]), L('Cemeteries and crematoria', 'Mynwentydd ac amlosgfeydd', ['ro', 14]), L('Agriculture and fisheries', 'Amaethyddiaeth a physgodfeydd', ['ro', 20]),
  ]),
  N('roads', 'Roads and transport', 'Ffyrdd a thrafnidiaeth', [
    N('highways', 'Highways and roads', 'Priffyrdd a ffyrdd', [
      L('Routine maintenance, environment and safety', 'Cynnal a chadw arferol, yr amgylchedd a diogelwch', ['rd', 5]), L('Street lighting, including energy', 'Goleuadau stryd, gan gynnwys ynni', ['rd', 7]), L('Resurfacing and structural repairs – minor roads', 'Ailwynebu ac atgyweirio strwythurol – ffyrdd llai', ['rd', 3]), L('Resurfacing and structural repairs – principal roads', 'Ailwynebu ac atgyweirio strwythurol – prif ffyrdd', ['rd', 2]), L('Bridges and culverts', 'Pontydd a chwlfertau', ['rd', 4]), L('Winter gritting', 'Graeanu yn y gaeaf', ['rd', 6]), L('Road safety and school crossing patrols', 'Diogelwch ar y ffyrdd a hebryngwyr croesfannau ysgol', ['rd', 10]), L('Traffic management', 'Rheoli traffig', ['rd', 8]), L('Co-ordination of street works', 'Cydlynu gwaith stryd', ['rd', 12]), L('New road construction', 'Adeiladu ffyrdd newydd', ['rd', 1]), L('Bus lane enforcement (net)', 'Gorfodi lonydd bysiau (net)', ['rd', 9]), L('Parking (net – negative means a surplus)', 'Parcio (net – mae negyddol yn golygu gwarged)', ['rd', 11]),
    ]),
    N('publictransport', 'Public transport', 'Trafnidiaeth gyhoeddus', [
      L('Support for bus and other services', 'Cymorth i fysiau a gwasanaethau eraill', ['rd', 14]), L('Concessionary fares (free bus passes)', 'Teithio rhatach (pasys bws am ddim)', ['rd', 13]), L('Airports, harbours and toll facilities', 'Meysydd awyr, harbyrau a chyfleusterau tollau', ['rd', 15]),
    ]),
    L('Transport planning, policy and strategy', 'Cynllunio, polisi a strategaeth trafnidiaeth', ['rd', 0]),
  ]),
  N('culture', 'Culture, leisure and tourism', 'Diwylliant, hamdden a thwristiaeth', [
    L('Sport and leisure centres', 'Chwaraeon a chanolfannau hamdden', ['ro', 11]), L('Parks and open spaces', 'Parciau a mannau agored', ['ro', 12]), L('Libraries', 'Llyfrgelloedd', ['ro', 10]), L('Museums, arts and heritage', 'Amgueddfeydd, y celfyddydau a threftadaeth', ['ro', 9]), L('Tourism', 'Twristiaeth', ['ro', 13]),
  ]),
  N('planning', 'Planning and economic development', 'Cynllunio a datblygu economaidd', [
    L('Economic development', 'Datblygu economaidd', ['ro', 29]), L('Community development', 'Datblygu cymunedol', ['ro', 30]), L('Planning applications (development control)', 'Ceisiadau cynllunio (rheoli datblygu)', ['ro', 24]), L('Planning policy', 'Polisi cynllunio', ['ro', 25]), L('Building control', 'Rheoli adeiladu', ['ro', 23]), L('Business support', 'Cymorth busnes', ['ro', 27]), L('Economic research', 'Ymchwil economaidd', ['ro', 28]),
  ]),
  N('central', 'Running the council and other services', 'Rhedeg y cyngor a gwasanaethau eraill', [
    L('Corporate and democratic core (councillors, chief executive, audit)', 'Craidd corfforaethol a democrataidd (cynghorwyr, prif weithredwr, archwilio)', ['ro', 39]), L('Other central costs', 'Costau canolog eraill', ['ro', 41]), L('Non-distributed costs (e.g. past pension costs)', 'Costau heb eu dosbarthu (e.e. costau pensiwn y gorffennol)', ['ro', 40]), L('Collecting council tax and business rates', 'Casglu’r dreth gyngor ac ardrethi busnes', ['ro', 34]), L('Other central services (elections, registrars, emergency planning)', 'Gwasanaethau canolog eraill (etholiadau, cofrestryddion, cynllunio at argyfwng)', ['ro', 35]), L('Coroners and courts', 'Crwneriaid a llysoedd', ['ro', 31]), L('National parks (council share)', 'Parciau cenedlaethol (cyfran y cyngor)', ['ro', 38]),
  ]),
];

const OTHER = ['Other / not separately recorded', 'Arall / heb ei gofnodi ar wahân'];
const get = (slug, ref) => {
  const [k, i] = ref;
  const src = k === 'ro' ? RO[slug].s : k === 'soc' ? SOC[slug] : k === 'edu' ? EDU[slug] : RD[slug];
  return src[i];
};

// Evaluate the tree for one area. Values in £ thousand.
function evalNode(node, slug, path) {
  const id = path ? `${path}.${node.id || slugify(node.en)}` : node.id || slugify(node.en);
  if (!node.ch) return { id, en: node.en, cy: node.cy, v: get(slug, node.ref) };
  let ch = node.ch.map((c) => evalNode(c, slug, id));
  const sumCh = ch.reduce((a, c) => a + c.v, 0);
  let v = sumCh;
  if (node.ref) {
    v = get(slug, node.ref);
    const res = v - sumCh;
    if (Math.abs(res) >= 1) ch.push({ id: `${id}.other`, en: OTHER[0], cy: OTHER[1], v: res, other: true });
  }
  ch.sort((a, b) => (a.other ? 1 : b.other ? -1 : b.v - a.v));
  return { id, en: node.en, cy: node.cy, v, ch };
}
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);

export function spendTree(slug) {
  const ch = TREE.map((n) => evalNode(n, slug, '')).sort((a, b) => b.v - a.v);
  return { id: 'all', v: ch.reduce((a, c) => a + c.v, 0), ch };
}

// Flatten to a map id -> value for comparisons
export function flat(tree, out = {}) { out[tree.id] = tree.v; (tree.ch || []).forEach((c) => flat(c, out)); return out; }

const popOf = Object.fromEntries(profiles.map((p) => [p.slug, p.pop2024]));
popOf.wales = profiles.reduce((a, p) => a + p.pop2024, 0);

export const PHASES = [['Primary', 'Cynradd', 1], ['Secondary', 'Uwchradd', 2], ['Special', 'Arbennig', 3], ['All-through', 'Pob oed', 4], ['Nursery', 'Meithrin', 0]];
export const eduPhase = (slug) => PHASES.map(([en, cy, i]) => ({ en, cy, v: EDU[slug][i] }));

export const council = {
  years: TR.years, trend: TR.la, groups: TR.groups, ro: RO, pop: popOf,
  tree: Object.fromEntries(['wales', ...LAS.map((l) => l.slug)].map((s) => [s, spendTree(s)])),
};
council.flat = Object.fromEntries(Object.entries(council.tree).map(([s, t]) => [s, flat(t)]));

// Sanity check: tree total must match total service expenditure (net)
for (const s of Object.keys(council.tree)) {
  const d = council.tree[s].v - RO[s].tse[2];
  if (Math.abs(d) > 10) throw new Error(`Council tree for ${s} is off by ${d}`);
}
