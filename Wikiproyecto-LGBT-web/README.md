# WikiproyectoLGBTWeb

Current version: **2.1.1** (defined in `package.json` and `src/version.ts`, shown in the site footer).

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

## Configuration & secrets

Server-side secrets live in a **gitignored `credentials.ts`** at the repo root. It is imported only by `server.ts`, so it never reaches the browser bundle (verified: none of these values appear in `dist/.../browser`). It must export:

- `credentials` — MariaDB/ToolsDB connection (`host`, `port`, `database`, `user`, `password`).
- `oauthCredentials` — MediaWiki OAuth (`session_secret`, `consumer_key`, `consumer_secret`).
- `contactEmail`, `toolUrl`, and `buildUserAgent()` — used to build the Wikimedia API `User-Agent`.
- `turnstileSecret` — Cloudflare Turnstile secret key (see *Contact form* below).

## Contact form (email + Cloudflare Turnstile)

The `/form` page submits to `POST /api/contact` (in `server.ts`), which:

1. **Sanitises and length-caps every field server-side** (the client-side `Validators` are UX only and can be bypassed), stripping CR/LF to prevent email-header injection.
2. **Verifies a Cloudflare Turnstile token** via `siteverify`.
3. **Sends** the message through the Toolforge SMTP relay (`mail.tools.wmcloud.org:25` — no auth, reachable only from inside Toolforge) using `nodemailer`: `From: wmlgbt-es-web@toolforge.org`, `Reply-To:` the submitter, `To: vic@wmlgbt.org`.

The Turnstile widget appears inside the confirmation modal; passing it auto-submits, and the same modal reports success/error.

**Keys.** The public **site key** is `TURNSTILE_PROD_SITE_KEY` in `src/app/form/components/form-main/form-main.component.ts`; the **secret key** is `turnstileSecret` in `credentials.ts`. In development (`ng serve` → `isDevMode()` is `true`) the app automatically uses Cloudflare's "always passes" test keys, so **no real keys are needed locally**. Production builds use the real keys.

**Server environment variables:**

- `MAIL_DRY_RUN=1` — log the email instead of sending it. Use it locally, since the relay is only reachable from Toolforge. **Leave unset in production** (the Toolforge `start_webservice.sh` does not set it, so production sends real mail).
- `TURNSTILE_SECRET` — optional override of `credentials.turnstileSecret` (precedence: env → `credentials.ts` → Cloudflare test secret). Handy for ops/testing.

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
