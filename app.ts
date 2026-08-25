import express from "express";
import { result } from "./config/db";
import { passport } from "./config/passport";
import { routes } from "./src/startup/routes";
import type { Express } from "express";
import expressSession from "express-session";
import { prisma } from "./lib/prisma";
import { handleMulterError } from "./src/multer/multer";

const PORT = 8080;
const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

import { createRequire } from "node:module";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
const require = createRequire(import.meta.url);

require("dotenv/config");

app.use(
  expressSession({
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // ms
    },
    secret: "a santa at nasa",
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

// Insert express-session options here

app.use(passport.initialize());
app.use(passport.session());
routes(app);
app.use("/static", express.static("static"));
app.use("/img", express.static("uploads"));
app.use(handleMulterError);

app.listen(PORT, "0.0.0.0", () => console.log("listenting on 8080"));

export { app };
