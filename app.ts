import express from "express";
import "dotenv/config";
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
import logger from "./config/logger";
const require = createRequire(import.meta.url);

require("dotenv/config");

const month = 1000 * 60 * 60 * 24 * 30;

app.use(
  expressSession({
    cookie: {
      maxAge: month,
    },
    secret: process.env.EXPRESS_SESSION || "blank",
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

app.use(passport.initialize());
app.use(passport.session());
routes(app);
app.use("/static", express.static("static"));
app.use("/img", express.static("uploads"));
app.use(handleMulterError);

if (process.env.NODE_ENV !== "test") {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("Listenting on:", PORT);
  });

  server.on("error", (err) => {
    logger.error("SERVER ERROR: ", err);
  });

  server.on("close", () => {
    logger.error("SERVER CLOSED");
  });
  process.on("uncaughtException", (err) => {
    logger.error("UNCAUGHT EXCEPTION ", err);
  });

  process.on("unhandledRejection", (err) => {
    logger.error("UNHANDLED REJECTION", err);
  });

  let shuttingDown = false;

  function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal}: closing HTTP server`);

    server.close((err) => {
      if (err) {
        console.error("Error closing server:", err);
        process.exitCode = 1;
      }

      process.exit();
    });
  }

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}
export { app };

//small test
