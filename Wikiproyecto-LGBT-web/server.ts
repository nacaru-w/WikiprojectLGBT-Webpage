import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REQUEST, RESPONSE } from './src/express.tokens';
import { filterUnwantedCrawlers } from './src/bot-filter';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import passport from 'passport';
import passportMediawiki from 'passport-mediawiki-oauth';

const MediaWikiStrategy = passportMediawiki.OAuthStrategy;
import { credentials, oauthCredentials, buildUserAgent, turnstileSecret } from './credentials';

import session from 'express-session';
// Declare type of Mediawiki session object so that it works with TypeScript
// See: https://stackoverflow.com/a/65805410
declare module "express-session" {
  interface Session {
    user?: any;
  }
}

async function getTable() {
  const connection = await mysql.createConnection(
    credentials
  );

  try {
    const [rows, _] = await connection.execute('select * FROM blog_posts');
    return rows
  } catch (error) {
    console.error('Error retrieving rows:', error);
    throw error;
  } finally {
    await connection.end();
  }

}

async function getRow(id: string) {
  const connection = await mysql.createConnection(
    credentials
  );

  try {
    const [rows, _] = await connection.execute('SELECT * FROM blog_posts WHERE id = ?', [id]);
    return rows;
  } catch (error) {
    console.error('Error retrieving row:', error);
    throw error;
  } finally {
    await connection.end();
  }

}

async function insertRow(date: string, author: string, title: string, content: string) {
  const connection = await mysql.createConnection(credentials);

  try {
    const [result] = await connection.execute(
      'INSERT INTO blog_posts (date, author, title, content) VALUES (?, ?, ?, ?)',
      [date, author, title, content]
    )
    return result
  } catch (error) {
    console.error('Error inserting row:', error);
    throw error;
  } finally {
    await connection.end();
  }

}

async function updateRow(date: string, author: string, title: string, content: string, id: string) {
  const connection = await mysql.createConnection(credentials);

  try {
    const [result] = await connection.execute(
      'UPDATE blog_posts SET date = ?, author = ?, title = ?, content = ? WHERE id = ?',
      [date, author, title, content, id]
    );
    return result;
  } catch (error) {
    console.error('Error updating row:', error);
    throw error;
  } finally {
    await connection.end();
  }

}

async function deleteRow(id: string) {
  const connection = await mysql.createConnection(credentials);

  try {
    const [result] = await connection.execute(
      'DELETE FROM blog_posts WHERE id = ?', [id]
    );
    return result;
  } catch (error) {
    console.error('Error deleting row', error)
    throw error;
  } finally {
    await connection.end();
  }

}

async function checkAdminStatus(username: string) {
  const connection = await mysql.createConnection(credentials);

  try {
    const [rows]: [any[], mysql.FieldPacket[]] = await connection.execute('SELECT 1 FROM administrators WHERE username = ? LIMIT 1', [username]);
    return rows.length > 0;
  } catch (error) {
    console.error('Error retrieving row:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Canonical match key for a MediaWiki title. MUST stay byte-for-byte identical
 * to normaliseTitle() in scripts/sync-lgbt-articles.mjs, otherwise the
 * IN (...) lookup against lgbt_tracked_articles won't match.
 */
function normaliseTitle(title: string): string {
  const t = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length === 0) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const XTOOLS_PROJECT = 'es.wikipedia.org';
const REQUEST_USER_AGENT = buildUserAgent();

function xtoolsTimestampToIso(ts: any): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(String(ts));
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
}

/**
 * Ask XTools for the article-namespace (ns 0) pages created by `username`,
 * returning a map of normalised title -> creation metadata. The XTools `pages`
 * field is a list wrapping the array of page objects, so we flatten it.
 */
async function fetchUserCreatedArticles(
  username: string,
): Promise<Map<string, { title: string; creationDate: string | null; sizeBytes: number | null }>> {
  const encoded = encodeURIComponent(username.replace(/ /g, '_'));
  const url = `https://xtools.wmcloud.org/api/user/pages/${XTOOLS_PROJECT}/${encoded}/0/noredirects/live`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': REQUEST_USER_AGENT },
    });
    if (!res.ok) throw new Error(`XTools API returned HTTP ${res.status}`);
    const json: any = await res.json();
    const groups = Array.isArray(json?.pages) ? json.pages : Object.values(json?.pages ?? {});
    const entries: any[] = groups.flat().filter((e: any) => e && typeof e === 'object' && e.page_title != null);
    const map = new Map<string, { title: string; creationDate: string | null; sizeBytes: number | null }>();
    for (const e of entries) {
      // A purely numeric title (e.g. the article "28") comes back from XTools as
      // a JSON number, so coerce before normalising to avoid a String-only crash.
      const norm = normaliseTitle(String(e.page_title));
      if (!norm || map.has(norm)) continue;
      map.set(norm, {
        title: String(e.full_page_title ?? e.page_title).replace(/_/g, ' '),
        creationDate: xtoolsTimestampToIso(e.timestamp),
        // Current article byte size, straight from this same XTools response
        // (`length`). We deliberately don't use the DB's size_bytes — that's
        // the talk-page size (the tracked list is ns-1 talk pages).
        sizeBytes: typeof e.length === 'number' ? e.length : null,
      });
    }
    return map;
  } finally {
    clearTimeout(timeout);
  }
}

/** Look up which of the given normalised titles are LGBT-tracked articles. */
async function getTrackedArticlesByNormTitles(normTitles: string[]) {
  if (normTitles.length === 0) return [];
  const connection = await mysql.createConnection(credentials);

  try {
    const placeholders = normTitles.map(() => '?').join(',');
    const [rows]: [any[], mysql.FieldPacket[]] = await connection.execute(
      `SELECT norm_title, display_title FROM lgbt_tracked_articles WHERE norm_title IN (${placeholders})`,
      normTitles,
    );
    return rows;
  } catch (error) {
    console.error('Error querying lgbt_tracked_articles:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Content-authorship of an article (who wrote how much of the current text),
 * scraped from XTools' authorship table. We proxy it here because that XTools
 * route sends no CORS headers, so the browser can't call it directly. The
 * `?format=wikitext` output is a stable wikitable: rank | [[User:Name]] | links
 * | characters | percentage.
 */
async function fetchArticleAuthorship(
  title: string,
): Promise<{ title: string; authors: { username: string; chars: number; percentage: number }[] }> {
  const page = encodeURIComponent(title); // XTools authorship route uses spaces (%20)
  const url = `https://xtools.wmcloud.org/authorship/${XTOOLS_PROJECT}/${page}/?format=wikitext`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': REQUEST_USER_AGENT } });
    if (!res.ok) throw new Error(`XTools authorship returned HTTP ${res.status}`);
    const wikitext = await res.text();
    const rowRe = /\|\s*\d+\s*\n\|\s*\[\[\s*User:([^|\]]+?)\s*(?:\|[^\]]*)?\]\][^\n]*\n\|[^\n]*\n\|\s*([\d,]+)\s*\n\|\s*([\d.]+)%/g;
    const authors: { username: string; chars: number; percentage: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = rowRe.exec(wikitext)) !== null) {
      authors.push({
        username: m[1].replace(/_/g, ' ').trim(),
        chars: Number.parseInt(m[2].replace(/,/g, ''), 10),
        percentage: Number.parseFloat(m[3]),
      });
    }
    return { title: title.replace(/_/g, ' '), authors };
  } finally {
    clearTimeout(timeout);
  }
}

async function isAuthorized(req: express.Request) {
  if (req?.session?.user) {
    console.log("Checking admin status for user", req.session.user.displayName)
    return checkAdminStatus(req.session.user.displayName)
  }

  console.log("Logged out user attempted to use protected endpoint")
  return false;
}

const unauthorizedError = { reason: "Not logged in or not authorized to perform this action" };

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const cors = require('cors');

app.use(session({
  secret: oauthCredentials.session_secret,
  saveUninitialized: true,
  resave: true
  // TODO: Add store backed by MariaDB using https://www.npmjs.com/package/express-mysql-session
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
  credentials: true
}));
app.use(express.json());

// Wikimedia Oauth
passport.use(new MediaWikiStrategy(
  {
    consumerKey: oauthCredentials.consumer_key,
    consumerSecret: oauthCredentials.consumer_secret,
  },
  function (token: string, tokenSecret: string, profile: any, done: any) {
    profile.oauth = {
      consumer_key: oauthCredentials.consumer_key,
      consumer_secret: oauthCredentials.consumer_secret,
      token: token,
      token_secret: tokenSecret
    };
    return done(null, profile);
  }
));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj: false | Express.User | null | undefined, done) {
  done(null, obj);
});

app.get("/login-mediawiki", function (req, res) {
  res.redirect(req.baseUrl + "/auth/mediawiki/callback");
});

app.get("/auth/mediawiki/callback", function (req, res, next) {
  passport.authenticate("mediawiki", function (err: any, user: any) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.redirect(req.baseUrl + "/login");
    }

    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      req.session.user = user;
      res.redirect(req.baseUrl + "/blog-admin");
    });
  })(req, res, next);
});

app.get("/logout", function (req, res) {
  delete req.session.user;
  res.redirect(req.baseUrl + "/");
});

app.get("/api/user", (req, res) => {
  if (req?.session?.user) {
    checkAdminStatus(req.session.user.displayName).then((isAdmin) => {
      res.json({
        displayName: req.session.user.displayName,
        isAdmin: isAdmin,
      })
    })
  } else {
    res.json({ reason: 'Not logged in' });
  }
});


// Express Rest API endpoints
app.get('/api/blog_posts', (req, res) => {
  getTable().then((rows) => res.send(rows))
});

app.get(`/api/blog/:id`, (req, res) => {
  const id = req.params.id
  getRow(id).then((rows) => {
    res.send(rows)
  })
});

/**
 * Public lookup: the LGBT-tracked articles a given user created. Combines a
 * live XTools "pages created" call with the cached lgbt_tracked_articles list
 * (refreshed by scripts/sync-lgbt-articles.mjs).
 */
app.get('/api/member-creations/:username', (req, res) => {
  const username = (req.params.username || '').trim();
  if (!username || username.length > 255) {
    res.status(400).json({ reason: 'A valid username is required' });
    return;
  }
  (async () => {
    let createdMap;
    try {
      createdMap = await fetchUserCreatedArticles(username);
    } catch (error) {
      console.error('Error in /api/member-creations (XTools):', error);
      res.status(502).json({ reason: 'Could not retrieve contributions from XTools' });
      return;
    }
    try {
      const trackedRows = await getTrackedArticlesByNormTitles([...createdMap.keys()]);
      const articles = trackedRows.map((row: any) => {
        const displayTitle = row.display_title as string;
        const created = createdMap.get(row.norm_title);
        return {
          title: displayTitle,
          url: `https://es.wikipedia.org/wiki/${encodeURIComponent(displayTitle.replace(/ /g, '_'))}`,
          creationDate: created?.creationDate ?? null,
          sizeBytes: created?.sizeBytes ?? null,
        };
      });
      // Most recently created first; entries without a date sort last.
      articles.sort((a, b) => (b.creationDate ?? '').localeCompare(a.creationDate ?? ''));
      res.json({ username, project: XTOOLS_PROJECT, count: articles.length, articles });
    } catch (error) {
      console.error('Error in /api/member-creations (tracked-articles lookup):', error);
      res.status(500).json({ reason: 'Could not match contributions against tracked articles' });
    }
  })();
});

/**
 * Public lookup: content-authorship breakdown for an article, proxied from
 * XTools (whose authorship route has no CORS). The browser computes the
 * member-focused split from the returned per-author list.
 */
app.get('/api/article-authorship/:title', (req, res) => {
  const title = (req.params.title || '').trim();
  if (!title || title.length > 255) {
    res.status(400).json({ reason: 'A valid article title is required' });
    return;
  }
  fetchArticleAuthorship(title)
    .then((result) => res.json(result))
    .catch((error) => {
      console.error('Error in /api/article-authorship:', error);
      res.status(502).json({ reason: 'Could not retrieve authorship from XTools' });
    });
});

app.post('/api/blog', (req, res) => {
  isAuthorized(req).then((authorized) => {
    if (!authorized) {
      res.status(403).json(unauthorizedError);
      return;
    }
    const { date, author, title, content } = req.body;
    insertRow(date, author, title, content)
      .then((result) => res.status(201).send(result))
      .catch((error) => res.status(500).send('Error inserting row: ' + error.message))
  })
});

app.put('/api/blog/:id', (req, res) => {
  isAuthorized(req).then((authorized) => {
    if (!authorized) {
      res.status(403).json(unauthorizedError);
      return
    }
    const id = req.params.id;
    const { date, author, title, content } = req.body;
    updateRow(date, author, title, content, id)
      .then((result) => res.status(200).send({ result, id }))
      .catch((error) => res.status(500).send('Error updating row: ' + error.message));
  })
});

app.delete('/api/blog/:id', (req, res) => {
  isAuthorized(req).then((authorized) => {
    if (!authorized) {
      res.status(403).json(unauthorizedError);
      return
    }
    const id = req.params.id;
    deleteRow(id)
      .then((result) => res.status(200).send({ result, id }))
      .catch((error) => res.status(500).send('Error deleting row: ' + error.message))
  })
});

// --- Contact form ------------------------------------------------------------
// Cloudflare's documented "always passes" test secret; used in local dev when
// no real secret is configured, paired with the test site key the frontend
// serves via isDevMode(). Must never be the value in production.
const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';
// Precedence: env override (ops/testing) → credentials.ts → test secret (dev).
const TURNSTILE_SECRET = process.env['TURNSTILE_SECRET'] || turnstileSecret || TURNSTILE_TEST_SECRET;
const CONTACT_RECIPIENT = 'vic@wmlgbt.org';
// From must be a tool-controlled address for SPF alignment; the submitter's
// address goes in Reply-To so the team can reply directly.
const CONTACT_FROM = 'Wikiproyecto LGBT <wmlgbt-es-web@toolforge.org>';

// Reused across requests. In local dev MAIL_DRY_RUN short-circuits before this
// is ever used, so it never tries to reach the (Toolforge-only) relay.
const mailTransport = nodemailer.createTransport({
  host: 'mail.tools.wmcloud.org',
  port: 25,
  secure: false,
  // Opportunistic STARTTLS is fine, but the internal relay's cert need not
  // validate against the public CA bundle.
  tls: { rejectUnauthorized: false },
});

// Coerce to a single-line string: strip control characters (incl. CR/LF, which
// is the header-injection vector for values that reach Subject/Reply-To),
// collapse whitespace, and cap length. Untrusted input always goes through this.
function oneLine(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  let out = '';
  for (const ch of value) {
    const c = ch.charCodeAt(0);
    out += c < 0x20 || c === 0x7f ? ' ' : ch;
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

// Like oneLine but preserves newlines (the message is intentionally multi-line):
// normalise CRLF, drop other control characters, then cap length.
function multiLine(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  let out = '';
  for (const ch of value.replace(/\r\n?/g, '\n')) {
    const c = ch.charCodeAt(0);
    if (c === 0x0a || (c >= 0x20 && c !== 0x7f)) out += ch;
  }
  return out.slice(0, maxLen).trim();
}

async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const body = new URLSearchParams();
  body.append('secret', TURNSTILE_SECRET);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: controller.signal,
    });
    const json: any = await res.json();
    return json?.success === true;
  } catch (error) {
    console.error('Turnstile siteverify failed:', error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

app.post('/api/contact', async (req, res) => {
  try {
    const b = req.body ?? {};
    // All untrusted strings are sanitised + length-capped server-side; the
    // client-side validators are for UX only and can be bypassed.
    const name = oneLine(b.name, 50);
    const email = oneLine(b.email, 254);
    const reason = multiLine(b.reason, 1000);
    const token = typeof b.turnstileToken === 'string' ? b.turnstileToken.slice(0, 4096) : '';

    if (!name) {
      res.status(400).json({ reason: 'A valid name is required' });
      return;
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      res.status(400).json({ reason: 'A valid email is required' });
      return;
    }
    if (!b.readPolicy || !b.readPrivacy) {
      res.status(400).json({ reason: 'Policy and privacy agreement are required' });
      return;
    }
    if (!token) {
      res.status(400).json({ reason: 'Captcha verification is required' });
      return;
    }

    const ip =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : undefined) || req.socket.remoteAddress || undefined;

    const passed = await verifyTurnstile(token, ip);
    if (!passed) {
      res.status(400).json({ reason: 'Captcha verification failed' });
      return;
    }

    const pronouns =
      b.pronouns === 'other' ? oneLine(b.otherPronouns, 100) || 'other' : oneLine(b.pronouns, 20) || '—';
    const wikimediaAccount = b.wikimediaAccount ? oneLine(b.wikimediaAccountName, 85) || '(not provided)' : 'No';
    const attendedEvent = b.attendedEvent ? oneLine(b.attendedEventName, 255) || '(not provided)' : 'No';
    const text =
      `Nuevo mensaje del formulario de contacto de WMLGBT+\n\n` +
      `Nombre/alias: ${name}\n` +
      `Email: ${email}\n` +
      `Pronombres: ${pronouns}\n` +
      `Cuenta Wikimedia: ${wikimediaAccount}\n` +
      `Ha participado en evento: ${attendedEvent}\n\n` +
      `Mensaje:\n${reason || '(sin mensaje)'}\n`;

    const message = {
      from: CONTACT_FROM,
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: `Formulario de contacto WMLGBT+ — ${name}`,
      text,
    };

    if (process.env['MAIL_DRY_RUN']) {
      console.log('[contact][DRY_RUN] would send email:', JSON.stringify(message, null, 2));
      res.status(200).json({ success: true, dryRun: true });
      return;
    }

    await mailTransport.sendMail(message);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in /api/contact:', error);
    res.status(502).json({ reason: 'Could not send the message' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Steer unwanted crawlers (scrapers, AI bots, …) to the static shell so they
 * don't trigger a full SSR render. Search engines and link-preview bots are
 * allow-listed inside the helper and fall through to the render below.
 */
app.use(filterUnwantedCrawlers(browserDistFolder));

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req, {
      providers: [
        { provide: REQUEST, useValue: req },
        { provide: RESPONSE, useValue: res },
      ],
    })
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error?: Error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
