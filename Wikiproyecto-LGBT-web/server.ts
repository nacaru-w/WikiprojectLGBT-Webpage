import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import mysql from 'mysql2/promise';
import passport from 'passport'
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

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const cors = require('cors');
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.use(session({
    secret: oauthCredentials.session_secret,
    saveUninitialized: true,
    resave: true
    // TODO: Add store backed by MariaDB using https://www.npmjs.com/package/express-mysql-session
  }));
  server.use(passport.initialize());
  server.use(passport.session());

  server.use(cors());
  server.use(express.json())

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

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

  server.get("/login-mediawiki", function (req, res) {
    res.redirect(req.baseUrl + "/auth/mediawiki/callback");
  });

  server.get("/auth/mediawiki/callback", function (req, res, next) {
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
        res.redirect(req.baseUrl + "/");
      });
    })(req, res, next);
  });

  server.get("/logout", function (req, res) {
    delete req.session.user;
    res.redirect(req.baseUrl + "/");
  });

  server.get("/api/user", (req, res) => {
    if (req?.session?.user) {
      res.json({ displayName: req.session.user.displayName })
    } else {
      res.status(400).json({ reason: 'Not logged in' });
    }
  })


  // Express Rest API endpoints
  server.get('/api/blog_posts', (req, res) => {
    getTable().then((rows) => res.send(rows))
  });

  server.get(`/api/blog/:id`, (req, res) => {
    const id = req.params.id
    getRow(id).then((rows) => {
      res.send(rows)
    })
  });

  server.post('/api/blog', (req, res) => {
    const { date, author, title, content } = req.body;
    insertRow(date, author, title, content)
      .then((result) => res.status(201).send(result))
      .catch((error) => res.status(500).send('Error inserting row: ' + error.message))
  })

  server.put('/api/blog/:id', (req, res) => {
    const id = req.params.id;
    const { date, author, title, content } = req.body;
    updateRow(date, author, title, content, id)
      .then((result) => res.status(200).send({ result, id }))
      .catch((error) => res.status(500).send('Error updating row: ' + error.message));
  })

  server.delete('/api/blog/:id', (req, res) => {
    const id = req.params.id;
    deleteRow(id)
      .then((result) => res.status(200).send({ result, id }))
      .catch((error) => res.status(500).send('Error deleting row: ' + error.message))
  })

  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Expresss server listening on http://localhost:${port}`);
  });
}

run();
