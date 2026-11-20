// A history of the Welsh economy: what Wales has lived from, and the evidence for each change.
import { wales, SOURCES as S } from './data.mjs';
import { ROUTES } from './config.mjs';
import { esc, num, pct, T, stat, chart, table, srcLink } from './lib.mjs';

const href = (key, lang) => ROUTES[key][lang === 'cy' ? 1 : 0];
const a = (s) => srcLink(s);

// Sources used on this page
const H = {
  orme: { en: 'Williams & Le Carlier de Veslud, Boom and bust in Bronze Age Britain: the Great Orme mine (Antiquity, 2019)', url: 'https://dx.doi.org/10.15184%2Faqy.2019.130' },
  dolau: { en: 'National Trust, Dolaucothi Gold Mines', url: 'https://www.nationaltrust.org.uk/dolaucothi-gold-mines' },
  wool: { en: 'Aberystwyth University, Unravelling British wool (Newtown and the flannel trade)', url: 'https://www.aber.ac.uk/en/news/archive/2018/11/title-218668-en.html' },
  drovers: { en: 'Colyer, Welsh cattle drovers in the nineteenth century (National Library of Wales Journal, 1975)', url: 'https://www.genuki.org.uk/big/wal/Archives/NLWJournals/CattleDrovers3' },
  parys: { en: 'People’s Collection Wales, Parys Mountain copper mines', url: 'https://peoplescollection.wales/node/606560' },
  copper: { en: 'Evans & Saunders, A world of copper: globalizing the Industrial Revolution, 1830–70 (Journal of Global History, 2015)', url: 'https://www.cambridge.org/core/journals/journal-of-global-history/article/world-of-copper-globalizing-the-industrial-revolution-183070/EBB5DBC55A5D6938A371A6D40D4CB4F0' },
  iron: { en: 'People’s Collection Wales, The iron industry in Wales', url: 'https://peoplescollection.wales/collections/1302176' },
  dowlais: { en: 'Coflein (Royal Commission on the Ancient and Historical Monuments of Wales), Dowlais Ironworks', url: 'https://coflein.gov.uk/en/site/34084/' },
  tin: { en: 'Grace’s Guide, The basic industries of Great Britain: tinplate', url: 'https://gracesguide.co.uk/The_Basic_Industries_of_Great_Britain_by_Aberconway:_Chapter_IXX' },
  slate: { en: 'Hwb (Welsh Government), Quarries of north Wales', url: 'https://hwb.gov.wales/api/storage/75e70125-7b2e-43d5-8130-38bb02c0dd06/QuarriesofNorthWales2.pdf' },
  coal1913: { en: 'Hansard, Coal industry statistics, 19 March 1934 (output 1913)', url: 'https://api.parliament.uk/historic-hansard/commons/1934/mar/19/statistics' },
  coal1920s: { en: 'Hansard, South Wales and Monmouthshire coal output and employment, 1 November 1938', url: 'https://api.parliament.uk/historic-hansard/commons/1938/nov/01/south-wales-and-monmouthshire' },
  coalWilliams: { en: 'Williams, The South Wales coalfield: history and regeneration', url: 'https://sgul.repo.nii.ac.jp/record/1608/files/SJ-18-2-037.pdf' },
  cardiff: { en: 'Amgueddfa Cymru – Museum Wales, Cardiff: coal and shipping metropolis of the world', url: 'https://museum.wales/articles/1034/Cardiff--Coal-and-Shipping-Metropolis-of-the-World' },
  cardiffHeritage: { en: 'Cardiff Bay Heritage, Commerce (Coal and Shipping Exchange)', url: 'https://cardiffbayheritage.org.uk/commerce' },
  rhondda: { en: 'Agor, Migration and the South Wales coalfield', url: 'https://agor.org.uk/cwm/themes/Life/society/migration.asp' },
  burton: { en: 'Swansea University, Richard Burton Archives: strikes and disputes', url: 'https://libguides.swansea.ac.uk/richardburtonarchives/strikes' },
  depression: { en: 'WJEC, Life in Wales during the Depression', url: 'https://resource.download.wjec.co.uk/vtc/2023-24/mfw/mfw23-24_8-34/pdf/en/1-6-2_life-in-wales-during-the-depression.pdf' },
  britannica: { en: 'Encyclopaedia Britannica, Wales: the 20th century', url: 'https://www.britannica.com/place/Wales/The-20th-century' },
  ncb: { en: 'Archives Hub, National Coal Board South Western Division records', url: 'https://archiveshub.ac.uk/search/archives/a3b5cf6c-8bcf-39da-ad88-72ec75db80e2' },
  ncbMuseum: { en: 'Amgueddfa Cymru – Museum Wales, The National Coal Board in south Wales', url: 'https://museum.wales/blog/?cat=4126' },
  abbey: { en: 'History & Policy (Bleddyn Penny), The city of steel: Port Talbot', url: 'https://historyandpolicy.org/opinion-articles/articles/the-city-of-steel/' },
  abbeyCoflein: { en: 'Coflein, Abbey Works, Margam steelworks', url: 'https://www.coflein.gov.uk/en/site/91392' },
  miners1984: { en: 'Hansard, Coal industry employees, 12 March 1984', url: 'https://api.parliament.uk/historic-hansard/written_answers/1984/mar/12/coal-industry-employees' },
  manu: { en: 'Hansard, Manufacturing employment in Wales 1979 and 1992, 6 November 1992', url: 'https://api.parliament.uk/historic-hansard/written-answers/1992/nov/06/manufacturing' },
  manu86: { en: 'Hansard, Labour statistics, 18 April 1988', url: 'https://api.parliament.uk/historic-hansard/written-answers/1988/apr/18/labour-statistics-1' },
  fdi: { en: 'Hansard, Inward investment, 2 December 1991', url: 'https://api.parliament.uk/historic-hansard/written_answers/1991/dec/02/inward-investment' },
  wda: { en: 'Gooberman & Boyns, The Welsh Development Agency: activities and impact, 1976 to 2006', url: 'https://core.ac.uk/download/444052439.pdf' },
  sony: { en: 'Young, Inward investment in Wales (Fraser of Allander Commentary, 1989)', url: 'https://strathprints.strath.ac.uk/51550/1/FEC_14_3_1989_YoungS.pdf' },
  obj1: { en: 'Hansard, EU structural funds, 9 December 1998', url: 'https://api.parliament.uk/historic-hansard/commons/1998/dec/09/eu-structural-funds' },
  tower: { en: 'Coflein, Tower Colliery', url: 'https://coflein.gov.uk/en/site/91586' },
  talbot: { en: 'Senedd Research, One year on: how has the blast furnaces closing affected Port Talbot?', url: 'https://research.senedd.wales/research-articles/one-year-on-how-has-the-blast-furnaces-closing-affected-port-talbot/' },
  census: { en: 'Great Britain Historical GIS Project, A Vision of Britain through Time: Wales, simplified industrial structure 1841–2011', url: 'https://visionofbritain.org.uk/unit/13146123/cube/IND_SECTOR_GEN' },
};

// Census employment by sector, Wales (Great Britain Historical GIS Project)
const CENSUS = {
  years: ['1841', '1861', '1881', '1911', '1931', '1951', '1971', '1991', '2011'],
  rows: [
    ['agri', 'Agriculture', 'Amaethyddiaeth', '--c4', [111558, 150247, 88558, 118498, 94309, 86338, 44111, 36930, 23317]],
    ['mining', 'Mining and quarrying', 'Mwyngloddio a chwarela', '--c8', [42051, 54518, 85965, 252501, 204320, 132242, 50980, 7630, 2697]],
    ['manu', 'Manufacturing', 'Gweithgynhyrchu', '--c3', [64712, 97045, 114294, 194956, 144989, 275909, 302304, 225637, 144785]],
    ['uct', 'Utilities, construction and transport', 'Cyfleustodau, adeiladu a thrafnidiaeth', '--c6', [30058, 48294, 62503, 149674, 124022, 177045, 172963, 153559, 181295]],
    ['cons', 'Shops, hotels and personal services', 'Siopau, gwestai a gwasanaethau personol', '--c5', [87322, 77538, 122985, 214290, 234294, 212169, 175501, 250416, 351839]],
    ['bus', 'Business and financial services', 'Gwasanaethau busnes ac ariannol', '--c7', [5174, 7620, 10615, 31039, 20159, 21882, 42369, 104748, 192394]],
    ['pub', 'Public services', 'Gwasanaethau cyhoeddus', '--c2', [5496, 9660, 16243, 43083, 75283, 132863, 161703, 271733, 430037]],
  ],
};
const censusTot = CENSUS.years.map((_, i) => CENSUS.rows.reduce((s, r) => s + r[4][i], 0));
const cShare = (key, i) => (CENSUS.rows.find((r) => r[0] === key)[4][i] / censusTot[i]) * 100;

// Coal: saleable output in South Wales and Monmouthshire (million tons) and people employed
const COAL_OUT = { years: ['1840', '1854', '1874', '1913', '1920', '1923', '1926', '1927', '1933', '1947', '1970'], v: [4.5, 8.5, 16.5, 56.8, 46.2, 54.3, 20.3, 46.3, 34.4, 21, 13] };
const COAL_JOBS = { years: ['1874', '1913', '1920', '1925', '1927', '1936', '1960', '1970', '1984'], v: [73000, 233134, 271161, 217809, 194100, 130000, 106000, 60000, 20286] };

export function history(lang) {
  const t = T(lang);
  const I = wales.industry.W, tot = I['All industries'];
  const N = tot.length - 1;
  const manuGva = [(I['Manufacturing'][0] / tot[0]) * 100, (I['Manufacturing'][N] / tot[N]) * 100];
  const finGva = [(I['Financial and insurance activities'][0] / tot[0]) * 100, (I['Financial and insurance activities'][N] / tot[N]) * 100];
  const healthGva = [(I['Human health and social work activities'][0] / tot[0]) * 100, (I['Human health and social work activities'][N] / tot[N]) * 100];
  const B = wales.bres;
  const bresManu = (B.s.C / B.tot) * 100, bresHealth = (B.s.Q / B.tot) * 100, bresMining = B.s.B;
  const last = CENSUS.years.length - 1;
  const i1911 = CENSUS.years.indexOf('1911');

  const era = (when, h, body, srcs) => `<li class="era"><p class="era-when">${when}</p><div><h3>${h}</h3>${body}<p class="src">${t('Evidence', 'Tystiolaeth')}: ${srcs.map(a).join('; ')}.</p></div></li>`;

  const body = `
<p class="lede">${t('What Wales lives from has changed completely more than once. Copper and gold were mined here thousands of years ago. For centuries afterwards most people farmed. In the 1800s Wales became one of the first industrial economies, built on copper, iron, tinplate, slate and coal. Today most people work in services. This page sets out what changed and when, with the evidence for each point.', 'Mae’r hyn y mae Cymru’n byw arno wedi newid yn llwyr fwy nag unwaith. Cloddiwyd copr ac aur yma filoedd o flynyddoedd yn ôl. Am ganrifoedd wedyn, ffermio oedd gwaith y rhan fwyaf o bobl. Yn y 1800au daeth Cymru yn un o’r economïau diwydiannol cyntaf, wedi’i hadeiladu ar gopr, haearn, tunplat, llechi a glo. Heddiw mae’r rhan fwyaf o bobl yn gweithio mewn gwasanaethau. Mae’r dudalen hon yn nodi beth newidiodd a phryd, gyda’r dystiolaeth ar gyfer pob pwynt.')}</p>
<div class="stats">
${stat(t('Mining and quarrying jobs, 1911', 'Swyddi mwyngloddio a chwarela, 1911'), pct(cShare('mining', i1911), 0), t(`${num(CENSUS.rows[1][4][i1911])} people – the largest single sector`, `${num(CENSUS.rows[1][4][i1911])} o bobl – y sector unigol mwyaf`))}
${stat(t('Mining and quarrying jobs, 2024', 'Swyddi mwyngloddio a chwarela, 2024'), num(bresMining), t('employee jobs, about 0.1% of the total', 'swyddi gweithwyr, tua 0.1% o’r cyfanswm'))}
${stat(t('Coal output at its peak, 1913', 'Cynnyrch glo ar ei anterth, 1913'), t('56.8m tons', '56.8m tunnell'), t('South Wales and Monmouthshire', 'De Cymru a Sir Fynwy'))}
${stat(t('Public services share of jobs, 2011', 'Cyfran swyddi gwasanaethau cyhoeddus, 2011'), pct(cShare('pub', last), 0), t(`up from ${pct(cShare('pub', i1911), 0)} in 1911`, `i fyny o ${pct(cShare('pub', i1911), 0)} yn 1911`))}
</div>

<h2>${t('How people in Wales earned a living, 1841 to 2011', 'Sut roedd pobl yng Nghymru yn ennill bywoliaeth, 1841 i 2011')}</h2>
<p>${t(`The census shows the whole shift in one picture. In 1841 farming was the biggest occupation, with ${pct(cShare('agri', 0), 0)} of workers. By 1911 mining and quarrying employed ${pct(cShare('mining', i1911), 0)}. By 2011 public services, shops and business services together employed ${pct(cShare('pub', last) + cShare('cons', last) + cShare('bus', last), 0)}, and mining had all but gone.`, `Mae’r cyfrifiad yn dangos y newid cyfan mewn un darlun. Yn 1841 ffermio oedd y prif waith, gyda ${pct(cShare('agri', 0), 0)} o weithwyr. Erbyn 1911 roedd mwyngloddio a chwarela yn cyflogi ${pct(cShare('mining', i1911), 0)}. Erbyn 2011 roedd gwasanaethau cyhoeddus, siopau a gwasanaethau busnes gyda’i gilydd yn cyflogi ${pct(cShare('pub', last) + cShare('cons', last) + cShare('bus', last), 0)}, a mwyngloddio bron wedi diflannu.`)}</p>
${chart({ lang, title: t('Share of workers by sector, Wales, census years 1841–2011', 'Cyfran y gweithwyr fesul sector, Cymru, blynyddoedd cyfrifiad 1841–2011'), sub: t('Per cent. Census definitions changed over time and the 1861 figures cover men aged 20 and over only, so treat the early years as a guide to the pattern.', 'Y cant. Newidiodd diffiniadau’r cyfrifiad dros amser ac mae ffigurau 1861 yn cwmpasu dynion 20 oed a hŷn yn unig, felly dylid trin y blynyddoedd cynnar fel arwydd o’r patrwm.'), source: a(H.census),
    cfg: { type: 'stack', labels: CENSUS.years, max: 100, series: CENSUS.rows.map(([k, en, cy, col]) => ({ name: lang === 'cy' ? cy : en, values: CENSUS.years.map((_, i) => Math.round(cShare(k, i) * 10) / 10), color: col })), fmt: { suffix: '%', dec: 1 } } })}
${table({ head: [t('Sector', 'Sector'), ...CENSUS.years],
    rows: CENSUS.rows.map(([k, en, cy, , v]) => [esc(lang === 'cy' ? cy : en), ...v.map((x) => ({ v: x, t: num(x) }))]).concat([[`<strong>${t('All recorded', 'Pawb a gofnodwyd')}</strong>`, ...censusTot.map((x) => ({ v: x, t: `<strong>${num(x)}</strong>` }))]]) })}
<p class="src">${t('Source', 'Ffynhonnell')}: ${a(H.census)}. ${t('Numbers of people in each sector as recorded at each census.', 'Nifer y bobl ym mhob sector fel y’u cofnodwyd ym mhob cyfrifiad.')}</p>

<h2>${t('Timeline: what Wales has lived from', 'Llinell amser: yr hyn y mae Cymru wedi byw arno')}</h2>
<ol class="eras">
${era(t('c. 1700–900 BC', 'c. 1700–900 CC'), t('Bronze Age copper on the Great Orme', 'Copr yr Oes Efydd ar y Gogarth'),
    `<p>${t('The mines under the Great Orme at Llandudno are among the largest prehistoric copper mines in Europe. Radiocarbon dates suggest they were worked for about eight centuries, with a boom between about 1600 and 1400 BC when Great Orme copper was traded across Britain and into Europe.', 'Mae’r mwyngloddiau o dan y Gogarth yn Llandudno ymhlith y mwyngloddiau copr cynhanesyddol mwyaf yn Ewrop. Mae dyddiadau radiocarbon yn awgrymu iddynt gael eu gweithio am tua wyth canrif, gyda ffyniant rhwng tua 1600 a 1400 CC pan fasnachwyd copr y Gogarth ar draws Prydain ac i Ewrop.')}</p>`, [H.orme])}
${era(t('AD 70s–300s', 'OC 70au–300au'), t('Roman gold at Dolaucothi', 'Aur Rhufeinig yn Nolaucothi'),
    `<p>${t('The Romans mined gold at Dolaucothi in Carmarthenshire, the only known Roman gold mine in Britain, using aqueducts to bring water for washing the ore.', 'Cloddiodd y Rhufeiniaid aur yn Nolaucothi yn Sir Gaerfyrddin, yr unig fwynglawdd aur Rhufeinig hysbys ym Mhrydain, gan ddefnyddio traphontydd dŵr i ddod â dŵr i olchi’r mwyn.')}</p>`, [H.dolau])}
${era(t('1100s–1800s', '1100au–1800au'), t('Sheep, wool and cattle', 'Defaid, gwlân a gwartheg'),
    `<p>${t('For most of recorded history Wales was a farming country. Cistercian monasteries from the 12th century built up a wool trade, and for centuries drovers walked Welsh cattle to markets in the English Midlands and London. In the 19th century Newtown and the mid Wales towns became centres of the flannel trade, where Pryce Pryce-Jones started one of the world’s first mail-order businesses in 1859. The trade declined as cheaper cloth arrived from northern England and America.', 'Am y rhan fwyaf o’r hanes a gofnodwyd, gwlad amaethyddol oedd Cymru. O’r 12fed ganrif adeiladodd mynachlogydd Sistersaidd fasnach wlân, ac am ganrifoedd cerddodd porthmyn wartheg Cymreig i farchnadoedd yng Nghanolbarth Lloegr a Llundain. Yn y 19eg ganrif daeth y Drenewydd a threfi canolbarth Cymru yn ganolfannau’r fasnach wlanen, lle dechreuodd Pryce Pryce-Jones un o fusnesau archebu drwy’r post cyntaf y byd yn 1859. Dirywiodd y fasnach wrth i frethyn rhatach gyrraedd o ogledd Lloegr ac America.')}</p>`, [H.wool, H.drovers])}
${era(t('1759–1850s', '1759–1850au'), t('Iron: Merthyr Tydfil', 'Haearn: Merthyr Tudful'),
    `<p>${t('The Dowlais ironworks, founded near Merthyr in 1759, grew into the largest ironworks in the world in the 19th century. By 1840 the 26 ironworks between Hirwaun and Pontypool produced 36.2% of Britain’s crude iron, much of it rolled into rails for the new railways. Merthyr became the largest town in Wales.', 'Tyfodd gwaith haearn Dowlais, a sefydlwyd ger Merthyr yn 1759, i fod yn waith haearn mwyaf y byd yn y 19eg ganrif. Erbyn 1840 roedd y 26 gwaith haearn rhwng Hirwaun a Phont-y-pŵl yn cynhyrchu 36.2% o haearn crai Prydain, llawer ohono wedi’i rolio’n gledrau ar gyfer y rheilffyrdd newydd. Daeth Merthyr yn dref fwyaf Cymru.')}</p>`, [H.dowlais, H.iron])}
${era(t('1760s–1840s', '1760au–1840au'), t('Copper: Parys Mountain and “Copperopolis”', 'Copr: Mynydd Parys a “Copperopolis”'),
    `<p>${t('By the 1780s the Parys Mountain mines on Anglesey were the largest copper mines in the world. The ore was shipped to Swansea, which became the centre of a global copper smelting industry; by the 1830s Swansea’s works were smelting ore brought from Chile, Cuba and Australia.', 'Erbyn y 1780au mwyngloddiau Mynydd Parys ar Ynys Môn oedd y mwyngloddiau copr mwyaf yn y byd. Cludwyd y mwyn i Abertawe, a ddaeth yn ganolfan diwydiant toddi copr byd-eang; erbyn y 1830au roedd gweithfeydd Abertawe yn toddi mwyn a ddygwyd o Chile, Ciwba ac Awstralia.')}</p>`, [H.parys, H.copper])}
${era(t('1830s–1890s', '1830au–1890au'), t('Tinplate: Llanelli and the American market', 'Tunplat: Llanelli a marchnad America'),
    `<p>${t('Tinplate, thin steel coated with tin for cans, was almost entirely a Welsh industry, centred on Glamorgan, Carmarthenshire and Monmouthshire. The United States bought nearly all its tinplate from Wales until the US raised its import tariff in 1890 and built up its own industry.', 'Roedd tunplat, dur tenau wedi’i orchuddio â thun ar gyfer caniau, bron yn gyfan gwbl yn ddiwydiant Cymreig, wedi’i ganoli ym Morgannwg, Sir Gaerfyrddin a Sir Fynwy. Prynodd yr Unol Daleithiau bron ei holl dunplat o Gymru nes i’r UDA godi ei thariff mewnforio yn 1890 ac adeiladu ei diwydiant ei hun.')}</p>`, [H.tin])}
${era('1850–1913', t('Coal: the steam coal boom', 'Glo: ffyniant y glo ager'),
    `<p>${t('Output from the South Wales coalfield doubled from 8.5 million tons in 1854 to 16.5 million in 1874, and reached 56.8 million tons in 1913. Cardiff’s coal exports rose from 2 million tonnes in 1862 to nearly 11 million in 1913, and the first £1 million cheque is reputed to have been written at its Coal Exchange in 1904. The Rhondda grew from 1,998 people in 1851 to 152,781 in 1911.', 'Dyblodd cynnyrch maes glo De Cymru o 8.5 miliwn tunnell yn 1854 i 16.5 miliwn yn 1874, gan gyrraedd 56.8 miliwn tunnell yn 1913. Cododd allforion glo Caerdydd o 2 filiwn tunnell yn 1862 i bron 11 miliwn yn 1913, a dywedir mai yn ei Chyfnewidfa Lo yr ysgrifennwyd y siec £1 miliwn gyntaf yn 1904. Tyfodd y Rhondda o 1,998 o bobl yn 1851 i 152,781 yn 1911.')}</p>`, [H.coalWilliams, H.coal1913, H.cardiff, H.cardiffHeritage, H.rhondda])}
${era('1898', t('Slate reaches its peak', 'Llechi yn cyrraedd eu hanterth'),
    `<p>${t('Slate from Penrhyn, Dinorwig, Nantlle and Blaenau Ffestiniog roofed the growing towns of the industrial age. The industry peaked in 1898 with 17,000 men producing 485,000 tonnes of slate. A long strike at Penrhyn in 1900–03 and the First World War began its decline.', 'Llechi o’r Penrhyn, Dinorwig, Dyffryn Nantlle a Blaenau Ffestiniog oedd yn toi trefi cynyddol yr oes ddiwydiannol. Cyrhaeddodd y diwydiant ei anterth yn 1898 gyda 17,000 o ddynion yn cynhyrchu 485,000 tunnell o lechi. Dechreuodd ei ddirywiad gyda streic hir yn y Penrhyn yn 1900–03 a’r Rhyfel Byd Cyntaf.')}</p>`, [H.slate])}
${era('1920s–1930s', t('Depression and emigration', 'Dirwasgiad ac allfudo'),
    `<p>${t('Coal employment peaked at 271,161 in 1920. Export markets collapsed after the First World War: between 1921 and 1936, 241 mines in south Wales closed and the number of miners fell to about 130,000. In 1932 over 42% of men in Wales who were eligible to work were unemployed, and about 430,000 people left Wales between the wars.', 'Cyrhaeddodd cyflogaeth glo ei hanterth o 271,161 yn 1920. Chwalodd marchnadoedd allforio ar ôl y Rhyfel Byd Cyntaf: rhwng 1921 a 1936 caeodd 241 o byllau yn ne Cymru a gostyngodd nifer y glowyr i tua 130,000. Yn 1932 roedd dros 42% o ddynion yng Nghymru a oedd yn gymwys i weithio yn ddi-waith, a gadawodd tua 430,000 o bobl Gymru rhwng y rhyfeloedd.')}</p>`, [H.coal1920s, H.burton, H.depression, H.britannica])}
${era('1947–1970s', t('Nationalisation, steel and new factories', 'Gwladoli, dur a ffatrïoedd newydd'),
    `<p>${t('The coal industry was nationalised on 1 January 1947, when the South Western Division of the National Coal Board took over 220 collieries. The Abbey steelworks at Port Talbot opened in 1951 and by 1961 employed over 18,000 people, making it the largest steelworks in Europe. Coal kept shrinking: there were 106,000 miners in south Wales in 1960 and 60,000 in 1970.', 'Gwladolwyd y diwydiant glo ar 1 Ionawr 1947, pan gymerodd Adran De-orllewin y Bwrdd Glo Cenedlaethol 220 o lofeydd. Agorodd gwaith dur Abbey ym Mhort Talbot yn 1951 ac erbyn 1961 roedd yn cyflogi dros 18,000 o bobl, gan ei wneud y gwaith dur mwyaf yn Ewrop. Parhaodd glo i grebachu: roedd 106,000 o lowyr yn ne Cymru yn 1960 a 60,000 yn 1970.')}</p>`, [H.ncb, H.abbey, H.abbeyCoflein, H.ncbMuseum])}
${era('1979–1990s', t('Deindustrialisation and inward investment', 'Dad-ddiwydiannu a buddsoddi o’r tu allan'),
    `<p>${t('In June 1979, 30.5% of employees in Wales worked in manufacturing; by June 1992 it was 23.1%. Between 1979 and 1986 manufacturing lost 112,000 employee jobs. In February 1984, just before the year-long miners’ strike, the south Wales coalfield had 20,286 workers on colliery books. At the same time overseas firms arrived, beginning with Sony in 1972, and from 1976 the Welsh Development Agency promoted Wales to investors; in 1990–91 Wales won almost 18% of the foreign investment projects coming to the UK.', 'Ym mis Mehefin 1979, roedd 30.5% o weithwyr cyflogedig yng Nghymru yn gweithio ym maes gweithgynhyrchu; erbyn Mehefin 1992 roedd yn 23.1%. Rhwng 1979 a 1986 collodd gweithgynhyrchu 112,000 o swyddi gweithwyr. Ym mis Chwefror 1984, ychydig cyn streic y glowyr a barhaodd flwyddyn, roedd gan faes glo de Cymru 20,286 o weithwyr ar lyfrau’r glofeydd. Ar yr un pryd cyrhaeddodd cwmnïau tramor, gan ddechrau gyda Sony yn 1972, ac o 1976 bu Awdurdod Datblygu Cymru yn hyrwyddo Cymru i fuddsoddwyr; yn 1990–91 enillodd Cymru bron 18% o’r prosiectau buddsoddi tramor a ddaeth i’r DU.')}</p>`, [H.manu, H.manu86, H.miners1984, H.wda, H.sony, H.fdi])}
${era('1999–2008', t('Devolution, EU funds and the last deep mine', 'Datganoli, arian yr UE a’r pwll dwfn olaf'),
    `<p>${t('The National Assembly for Wales opened in 1999. Because output per person in West Wales and the Valleys was 71% of the EU average, below the 75% threshold, the area qualified for the highest level of EU regional funding (Objective 1) from 2000. Tower Colliery, the last deep coal mine in Wales, closed on 25 January 2008.', 'Agorodd Cynulliad Cenedlaethol Cymru yn 1999. Gan fod cynnyrch y pen yng Ngorllewin Cymru a’r Cymoedd yn 71% o gyfartaledd yr UE, islaw’r trothwy o 75%, roedd yr ardal yn gymwys ar gyfer y lefel uchaf o gyllid rhanbarthol yr UE (Amcan 1) o 2000. Caeodd Glofa’r Tŵr, y pwll glo dwfn olaf yng Nghymru, ar 25 Ionawr 2008.')}</p>`, [H.obj1, H.tower])}
${era('2024', t('The end of blast-furnace steel', 'Diwedd dur ffwrnais chwyth'),
    `<p>${t('On 30 September 2024 the last blast furnace at Port Talbot closed, ending more than 100 years of primary steelmaking in the town. An electric arc furnace that melts scrap is due to replace it by the end of 2027.', 'Ar 30 Medi 2024 caeodd y ffwrnais chwyth olaf ym Mhort Talbot, gan ddod â mwy na 100 mlynedd o wneud dur cynradd yn y dref i ben. Mae disgwyl i ffwrnais arc drydan sy’n toddi sgrap gymryd ei lle erbyn diwedd 2027.')}</p>`, [H.talbot])}
${era(t('Today', 'Heddiw'), t('A service economy with a manufacturing core', 'Economi gwasanaethau gyda chraidd gweithgynhyrchu'),
    `<p>${t(`Manufacturing still produces a larger share of output in Wales than in the UK as a whole, but its share fell from ${pct(manuGva[0])} in 1998 to ${pct(manuGva[1])} in 2024. Health and social work grew from ${pct(healthGva[0])} to ${pct(healthGva[1])}. In 2024, ${pct(bresHealth, 0)} of employee jobs were in health and social care and ${pct(bresManu, 0)} in manufacturing.`, `Mae gweithgynhyrchu yn dal i gynhyrchu cyfran fwy o allbwn yng Nghymru nag yn y DU gyfan, ond gostyngodd ei gyfran o ${pct(manuGva[0])} yn 1998 i ${pct(manuGva[1])} yn 2024. Tyfodd iechyd a gwaith cymdeithasol o ${pct(healthGva[0])} i ${pct(healthGva[1])}. Yn 2024, roedd ${pct(bresHealth, 0)} o swyddi gweithwyr ym maes iechyd a gofal cymdeithasol a ${pct(bresManu, 0)} ym maes gweithgynhyrchu.`)} <a href="${href('economy', lang)}">${t('See how the economy has changed since 1998', 'Gweler sut mae’r economi wedi newid ers 1998')}</a>.</p>`, [S.gvaInd, S.bres])}
</ol>

<h2>${t('The rise and fall of Welsh coal', 'Twf a chwymp glo Cymru')}</h2>
<div class="two">
${chart({ lang, legend: false, title: t('Coal output, South Wales coalfield', 'Cynnyrch glo, maes glo De Cymru'), sub: t('Million tons, selected years. Years are not evenly spaced; 1926 was the year of the General Strike and miners’ lockout.', 'Miliwn tunnell, blynyddoedd dethol. Nid yw’r blynyddoedd wedi’u gwasgaru’n gyfartal; 1926 oedd blwyddyn y Streic Gyffredinol a chloi allan y glowyr.'), source: `${a(H.coalWilliams)}; ${a(H.coal1913)}; ${a(H.coal1920s)}`,
    cfg: { type: 'bar', labels: COAL_OUT.years, series: [{ name: t('Million tons', 'Miliwn tunnell'), values: COAL_OUT.v, color: '--c8' }], fmt: { suffix: 'm', dec: 1 } } })}
${chart({ lang, legend: false, title: t('People employed in coal mining, south Wales', 'Pobl a gyflogwyd mewn mwyngloddio glo, de Cymru'), sub: t('Selected years. The 1984 figure is National Coal Board industrial workers in February, before the strike.', 'Blynyddoedd dethol. Ffigur 1984 yw gweithwyr diwydiannol y Bwrdd Glo Cenedlaethol ym mis Chwefror, cyn y streic.'), source: `${a(H.coalWilliams)}; ${a(H.coal1920s)}; ${a(H.burton)}; ${a(H.ncbMuseum)}; ${a(H.miners1984)}`,
    cfg: { type: 'bar', labels: COAL_JOBS.years, series: [{ name: t('People', 'Pobl'), values: COAL_JOBS.v, color: '--c3' }], fmt: {} } })}
</div>

<div class="note"><p><strong>${t('About this page', 'Am y dudalen hon')}</strong></p>
<p>${t('This page records what happened and when, not who was to blame. Historians disagree about the causes of many of these changes, and figures from the 19th century were collected differently from today’s, so the older numbers are best read as orders of magnitude. Every figure links to the source it came from.', 'Mae’r dudalen hon yn cofnodi beth ddigwyddodd a phryd, nid pwy oedd ar fai. Mae haneswyr yn anghytuno am achosion llawer o’r newidiadau hyn, a chasglwyd ffigurau’r 19eg ganrif yn wahanol i rai heddiw, felly mae’n well darllen yr hen rifau fel graddfa yn hytrach na union ffigurau. Mae pob ffigur yn cysylltu â’r ffynhonnell y daeth ohoni.')}</p></div>
`;
  return {
    title: t('History of the Welsh economy: from copper and coal to services', 'Hanes economi Cymru: o gopr a glo i wasanaethau'),
    h1: t('A history of the Welsh economy', 'Hanes economi Cymru'),
    desc: t('How Wales has earned its living from Bronze Age copper to coal, steel and services, with census data from 1841 to 2011, coal output and employment, and sources for every figure.', 'Sut mae Cymru wedi ennill ei bywoliaeth o gopr yr Oes Efydd i lo, dur a gwasanaethau, gyda data cyfrifiad o 1841 i 2011, cynnyrch a chyflogaeth glo, a ffynonellau ar gyfer pob ffigur.'),
    body, dataset: true,
  };
}
