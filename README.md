# Wales Economy Explained · Economi Cymru wedi’i Egluro

A bilingual (English / Cymraeg) static site that explains the Welsh economy using official statistics only:
Welsh Government budget and the Barnett formula, tax raised vs money spent in Wales, GVA by industry,
trade, council tax, jobs, incomes, and a profile page for each of the 22 local authorities.

- **No framework, no dependencies.** `node src/build.mjs` writes plain HTML to `dist/` in well under a second.
- **Charts** are a ~10 KB vanilla-JS SVG kit (`static/js/charts.js`): line, bar, horizontal bar, stacked, a tile map of the 22 counties, sortable tables and a Barnett calculator. Every chart also has an HTML data table, so the numbers can be crawled and read without JavaScript.
- **SEO:** unique titles and descriptions, canonical URLs, `hreflang` en-GB/cy-GB pairs, Dataset and Breadcrumb JSON-LD, sitemap with language alternates, Open Graph images, fast static pages.

## Deploy on Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings: **Framework preset** None · **Build command** `npm run build` · **Build output directory** `dist`.
4. Environment variable: `SITE_URL` = your domain with no trailing slash (for example `https://economi.cymru`). It is used for canonical URLs, hreflang and the sitemap.
5. Add your custom domain under the project’s **Custom domains** tab.
6. In Google Search Console, add the domain and submit `https://YOUR-DOMAIN/sitemap.xml`.

`static/_headers` sets long-lived caching for the hashed files in `/assets/` and security headers on every page.

## Updating the data

Each file in `raw/` is an extract from one official dataset. Its first line names the source. Edit or replace the figures, run `npm run build` and check the pages. All headline numbers in the text are computed from these files, never typed by hand, so the pages update automatically.

| File | Source |
|---|---|
| `raw/fiscal.txt` | ONS Country and regional public sector finances (annual, usually spring/summer) |
| `raw/gva_la.txt`, `raw/gva_industry.txt` | ONS Regional GVA via StatsWales (annual, spring) |
| `raw/council_tax.txt` | Welsh Government council tax levels (annual, March) |
| `raw/aps.txt` | ONS Annual Population Survey via StatsWales (quarterly) |
| `raw/trade.txt` | HMRC Regional Trade Statistics, `api.uktradeinfo.com` (quarterly) |
| `raw/income.txt` | ONS ASHE and regional GDHI via StatsWales (annual) |
| `raw/budget.txt` | Welsh Government Final Budget, HMRC, IFS |

## Local preview

```
npm run build
npm run serve
```
