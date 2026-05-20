# WikiproyectoLGBTWeb

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) and is currently built with Angular CLI version 21.2.

## Prerequisites

Angular 21 requires Node.js `>= v20.19` or `>= v22.12`. Run `npm install` to install dependencies.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Server-side rendering (SSR)

This application is served with SSR. After building, run `npm run serve:ssr:Wikiproyecto-LGBT-web` to start the Node/Express server (`dist/wikiproyecto-lgbt-web/server/server.mjs`).

## Deployment

Deployment is **not** done from this repo's tooling — it runs through a local script, `~/bin/sync-lgbt` (kept outside the repo, on the maintainer's machine). The script:

1. Pins Node to `22.12.0` (`nvm use 22.12.0`) and runs `ng build`.
2. Rsyncs `dist/wikiproyecto-lgbt-web/` (both `browser/` and `server/`) to the Toolforge tool `wmlgbt-es-web` at `login.toolforge.org:/data/project/wmlgbt-es-web/www/js/dist`.
3. SSHes into Toolforge and restarts the web service with `./start_webservice.sh`.

Because the app is SSR, the Node service on Toolforge must be running — it is **not** served as static files (the `browser/` output ships only `index.csr.html`, no static `index.html`).

### Crawler filtering

To keep crawlers from running up the SSR cost on Toolforge, the Express server (`src/bot-filter.ts`, wired into `server.ts`) detects bots by `User-Agent` (via [`isbot`](https://github.com/omrilotan/isbot)) and serves them the lightweight `index.csr.html` shell instead of a full server-side render. Search engines (Googlebot, Bingbot, …) and social link-preview fetchers are allow-listed in `bot-filter.ts` and still get the full SSR render, so indexing and link unfurling are unaffected. Real assets (JS/CSS/images) are always served normally. Adjust the `ALLOWED_CRAWLERS` list in `src/bot-filter.ts` to let more crawlers through.

## Linting

Run `ng lint` to lint the TypeScript and templates, and `npm run stylelint` to lint the SCSS stylesheets.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
