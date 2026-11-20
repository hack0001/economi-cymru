# Wales Economy Explained · Economi Cymru wedi’i Egluro

A bilingual (English / Cymraeg) static site that explains the Welsh economy using official statistics only:
Welsh Government budget and the Barnett formula, tax raised vs money spent in Wales, GVA by industry,
trade, council tax, jobs, incomes, and a profile page for each of the 22 local authorities.

- **No framework, no dependencies.** `node src/build.mjs` writes plain HTML to `dist/` in well under a second.
- **Charts** are a ~10 KB vanilla-JS SVG kit (`static/js/charts.js`): line, bar, horizontal bar, stacked, a tile map of the 22 counties, sortable tables and a Barnett calculator. Every chart also has an HTML data table, so the numbers can be crawled and read without JavaScript.
- **SEO:** unique titles and descriptions, canonical URLs, `hreflang` en-GB/cy-GB pairs, Dataset and Breadcrumb JSON-LD, sitemap with language alternates, Open Graph images, fast static pages.

## Deploy on Cloudflare

1. Push this repo to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Import a repository → pick `economi-cymru`.
3. Leave **Build command** blank (or `npm run build`) and **Deploy command** as `npx wrangler deploy`. `wrangler.jsonc` builds the site and serves the `dist` folder, so there is no output directory to set.
4. After the first deploy, copy the `…workers.dev` address Cloudflare shows and put it in `SITE_URL` in `src/config.mjs`, then commit and push. Do the same when you get a custom domain.
5. In Google Search Console, add the site and submit `/sitemap.xml`.

`static/_headers` sets long-lived caching for the hashed files in `/assets/` and security headers on every page.

## Updating the data

Each file in `raw/` is an extract from one official dataset. Its first line names the source. Edit or replace the figures, run `npm run build` and check the pages. All headline numbers in the text are computed from these files, never typed by hand, so the pages update automatically.

| File | Source |
|---|---|
| `raw/fiscal.txt` | ONS Country and regional public sector finances (annual, usually spring/summer) |
| `raw/gva_la_2024.txt`, `raw/pop_la.txt`, `raw/gva_industry.txt` | ONS regional GDP/GVA by local authority and industry (annual, September). `raw/gva_la.txt` is the older StatsWales extract, kept for reference |
| `raw/bres.txt` | ONS Business Register and Employment Survey via Nomis (annual, autumn) |
| `raw/business_counts.txt` | ONS UK Business Counts, local units by size, via Nomis (annual, autumn) |
| `raw/employers.txt` | Named employers: one line each, with sources. Add a company by adding a line |
| `raw/council_tax.txt` | Welsh Government council tax levels (annual, March) |
| `raw/aps.txt` | ONS Annual Population Survey via StatsWales (quarterly) |
| `raw/trade.txt` | HMRC Regional Trade Statistics, `api.uktradeinfo.com` (quarterly) |
| `raw/income.txt` | ONS ASHE and regional GDHI via StatsWales (annual) |
| `raw/budget.txt` | Welsh Government Final Budget, HMRC, IFS |

## Colour schemes

`static/js/theme.js` adds a temporary picker (bottom right) with four schemes defined in `static/css/site.css` under `html[data-theme=...]`. Once you have chosen, delete the picker code in `theme.js` (or the script tag in `src/build.mjs`) and move the chosen variables into `:root`.

## Local preview

```
npm run build
npm run serve
```
