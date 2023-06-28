'use strict';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import MongoStore from 'connect-mongo';
import express from "express";
import bodyParser from 'body-parser';
import session from 'express-session';
import passport from 'passport';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sessionConfig = (app, dbPath, secret) => {
  const sessionDurationHours = process.env.SESSION_DURATION_HOURS;
  const sessionDurationMilliseconds = sessionDurationHours * 60 * 60 * 1000;

  app.set('views', 'pages');
  app.set("view engine", "ejs");
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(resolve(__dirname, "../public")));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      secret: secret,
      store: MongoStore.create({ 
        mongoUrl: dbPath,
        ttl: sessionDurationMilliseconds / 1000, // Convert milliseconds to seconds
      }),
      cookie: {
        maxAge: sessionDurationMilliseconds
      },
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
};

export { sessionConfig };
