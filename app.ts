import express from "express";
import { session, postGresTable } from "./config/db";
import { passport } from "./config/passport"
import { routes } from "./src/startup/routes";
import type { Express } from "express";

const PORT = 8080
const app: Express = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set("view engine", "ejs")

import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

require("dotenv/config")

app.use(session({
  store: postGresTable,
  cookie: { maxAge: 1 * 60 * 60 * 1000 }, // 1 hour
  secret: "123",
  resave: false,
  saveUninitialized: true
  // Insert express-session options here
}));

app.use(passport.initialize())
app.use(passport.session())
routes(app)



app.listen(PORT, "0.0.0.0", () => console.log("listenting on 8080"))


