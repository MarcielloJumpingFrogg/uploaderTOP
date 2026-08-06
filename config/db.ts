import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

require("dotenv/config")

function getDB() {
  const nodeEnv = process.env.NODE_ENV
  const pg = "postgresql://user123:password123@db:5432/db123"
  if (nodeEnv == "docker") {
    return pg
  }
  else {
    return process.env.LOCAL_CONNECTION_STRING
  }
}

const result = getDB()

export { result }
