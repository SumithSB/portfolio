# Sumith Bhandari, portfolio

Source for https://sumithsb.github.io/portfolio/, a one-page static site built with [Astro](https://astro.build).

## Run it

```sh
npm ci
npm run dev       # http://localhost:4321/portfolio/
npm run build     # static output in dist/
npm run preview   # serve dist/ at /portfolio/
```

Node 20 or newer.

## Where things live

- `src/pages/index.astro`: all page copy and sections
- `src/layouts/Base.astro`: head, meta tags, Open Graph and JSON-LD
- `src/styles/global.css`: the only stylesheet
- `src/scripts/site.ts`: interactions and motion ([Motion](https://motion.dev)); everything is skipped under reduced motion and the page reads fine without JavaScript
- `src/components/Trace.astro`: the request-tracing diagrams on the project sheets
- `public/media/`: Claude Anchor demo video and screenshots, Brainvault logo
- `public/fonts/`: Big Shoulders and Public Sans (latin subsets, SIL OFL)

The CV links appear automatically once `public/Sumith_Bhandari_CV.pdf` exists.

## Deploy

Every push to `main` runs `.github/workflows/deploy-pages.yml`: it installs, builds and publishes `dist/` to the `pages` branch, which GitHub Pages serves at `/portfolio/`.
