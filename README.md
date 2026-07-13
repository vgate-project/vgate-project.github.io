# vgate-project.github.io

The official product landing page and documentation site for **[VGate](https://github.com/vgate-project)** — a self-hosted, open-source VLESS proxy management system.

This site is built with [VitePress](https://vitepress.dev) and is published to GitHub Pages at:

> https://vgate-project.github.io/vgate-project.github.io/

## Repository layout

```
vgate-project.github.io/
├── docs/                      # VitePress source
│   ├── .vitepress/
│   │   ├── config.ts          # Site + nav + sidebar config
│   │   └── theme/             # Custom theme (brand colors, styles)
│   ├── public/
│   │   └── favicon.svg
│   ├── assets/
│   │   └── screenshots/       # UI screenshots embedded in the docs
│   ├── guide/                 # What is VGate, features, architecture, concepts, use cases
│   ├── components/            # Manager, Server, Admin Console, User Portal
│   ├── operations/            # Deployment, config reference, API, security, FAQ
│   └── index.md               # Landing page
├── package.json
└── .gitignore
```

## Local development

Requires Node.js 18+.

```bash
npm install
npm run docs:dev
```

Then open http://localhost:5173/vgate-project.github.io/.

## Build & preview

```bash
npm run docs:build     # outputs docs/.vitepress/dist
npm run docs:preview   # serve the built site locally
```

## Deploying to GitHub Pages

The site is configured with `base: '/vgate-project.github.io/'` so it works under the
project sub-path. Build the site and publish the contents of `docs/.vitepress/dist`:

```bash
npm run docs:build
```

A typical GitHub Actions workflow (`.github/workflows/deploy.yml`) would:

1. Checkout the repo
2. Setup Node 18
3. `npm install`
4. `npm run docs:build`
5. Upload `docs/.vitepress/dist` as a Pages artifact

## License

AGPL-3.0. See [LICENSE](LICENSE).
