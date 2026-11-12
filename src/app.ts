import express from 'express';
import 'dotenv/config';
import { passport } from '../config/passport';
import { routes } from '@/startup/routes';
import type { Express } from 'express';
import expressSession from 'express-session';
import { prisma } from '@prisma';
import { handleMulterError } from '@/multer/multer';
import logger from '../config/logger';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

const month = 1000 * 60 * 60 * 24 * 30;

app.use(
  expressSession({
    cookie: {
      maxAge: month,
    },
    secret: process.env['EXPRESS_SESSION'] || 'blank',
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000 * 90, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

// Insert express-session options here

app.use('/static', express.static('static'));
app.use('/img', express.static('uploads'));
app.use(passport.initialize());
app.use(passport.session());
routes(app);
app.use(handleMulterError);

export { app };
