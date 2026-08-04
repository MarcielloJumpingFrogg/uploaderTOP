import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

require("dotenv/config")
const { Pool } = require("pg")
const session = require('express-session');
const pgSession = require("connect-pg-simple")(session)

function getDB() {
  const nodeEnv = process.env.NODE_ENV
  const pg = "postgres://user123:password123@db:5432/db123"
  //const pg = {
  //  host: "db",
  //  user: "user123",
  //  password: "password123",
  //  port: 2345,
  //  database: "db123"
  //}
  if (nodeEnv == "docker") {
    return pg
  }
  else {
    return process.env.CONNECTION_STRING
  }
}

const result = getDB()

const pool = new Pool({
  result
})

const postGresTable = new pgSession({
  pool: pool,
  createTableIfMissing: true,
})

export { session, postGresTable, result }
