import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
import { prisma } from "../lib/prisma"

const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
import bcrypt from "bcryptjs"




const strategy = new LocalStrategy(async (username: string, password: string, done: Function) => {
  try {
    const user = await prisma.users.findFirst({
      where: {
        "username": username
      }
    })

    if (!user) {
      console.log("failed login")
      return done(null, false, { message: "Incorrect username" })
    }
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      console.log("failed login")
      return done(null, false, { message: "Incorrect password" })
    }
    console.log("successfull login")
    return done(null, user)
  } catch (e) {
    console.log("Error: ", e)
    return done(e)
  }
})

passport.use(strategy)

passport.serializeUser((user: any, done: Function) => {
  done(null, user.id)
})

passport.deserializeUser(async (userId: number, done: Function) => {
  try {
    const user = await prisma.users.findFirst({ where: { "id": userId } })

    done(null, user)
  } catch (e) {
    done(e)
  }
})

export { passport }
