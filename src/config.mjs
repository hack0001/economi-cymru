// Site-wide settings.
// SITE_URL is the public address of the site (no trailing slash). It is only used to build the
// canonical links, Welsh/English alternate links and sitemap that Google reads.
// Put the address Cloudflare gives you here (e.g. https://economi-cymru.<you>.workers.dev),
// and change it again when you buy a domain.
export const SITE_URL = process.env.SITE_URL || 'https://economi-cymru.empty-moon-8f78.workers.dev';
export const SITE_NAME = { en: 'Wales Economy Explained', cy: 'Economi Cymru wedi’i Egluro' };
export const TAGLINE = {
  en: 'Facts and official data on the economy of Wales – no spin.',
  cy: 'Ffeithiau a data swyddogol am economi Cymru – heb sbin.',
};
export const UPDATED = '2026-11-20';

// Route table: key -> [english path, welsh path]
export const ROUTES = {
  home: ['/', '/cy/'],
  funding: ['/welsh-government-budget/', '/cy/cyllideb-llywodraeth-cymru/'],
  finances: ['/public-finances/', '/cy/cyllid-cyhoeddus/'],
  economy: ['/economy/', '/cy/economi/'],
  trade: ['/trade/', '/cy/masnach/'],
  counciltax: ['/council-tax/', '/cy/treth-gyngor/'],
  business: ['/business/', '/cy/busnes/'],
  councils: ['/council-spending/', '/cy/gwariant-cynghorau/'],
  jobs: ['/jobs/', '/cy/swyddi/'],
  incomes: ['/incomes/', '/cy/incwm/'],
  counties: ['/counties/', '/cy/siroedd/'],
  sources: ['/sources/', '/cy/ffynonellau/'],
  about: ['/about/', '/cy/amdanom/'],
};
export const NAV = ['funding', 'finances', 'economy', 'business', 'trade', 'councils', 'jobs', 'incomes', 'counties'];
export const NAV_LABEL = {
  home: ['Home', 'Hafan'],
  funding: ['Budget & Barnett', 'Cyllideb a Barnett'],
  finances: ['Tax & spending', 'Treth a gwariant'],
  economy: ['Economy', 'Economi'],
  trade: ['Trade', 'Masnach'],
  counciltax: ['Council tax', 'Treth gyngor'],
  business: ['Business', 'Busnes'],
  councils: ['Councils', 'Cynghorau'],
  jobs: ['Jobs', 'Swyddi'],
  incomes: ['Incomes', 'Incwm'],
  counties: ['Counties', 'Siroedd'],
  sources: ['Sources', 'Ffynonellau'],
  about: ['About', 'Amdanom'],
};
