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
import passport from 'passport';
import passportMediawiki from 'passport-mediawiki-oauth';

const MediaWikiStrategy = passportMediawiki.OAuthStrategy;
import { credentials, oauthCredentials } from './credentials';

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
