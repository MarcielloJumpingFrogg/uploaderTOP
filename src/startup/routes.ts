import bcrypt from "bcryptjs"
import { passport } from "../../config/passport"
import type { Express } from "express"
import { prisma } from "../../lib/prisma"

async function routes(app: Express) {
  app.get("/", (req, res) => {
    console.log("e fin qua ci siamo")
    res.redirect("/login")
  })

  app.get("/login", (req, res) => {
    res.render("login", { user: req.user })
  })

  app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failurMessage: true,
  }))

  app.get("/signUp", (req, res) => {
    res.render("signUp")
  })

  app.get('/log-out', (req, res, next) => {
    req.logout((err: string) => {
      if (err) {
        return next(err)
      }
      res.redirect("/")
    })

  })

  app.post("/signUp", async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      const newUser = await prisma.users.create({
        data: {
          username: req.body.username,
          password: hashedPassword
        }
      })
      console.log(newUser)
    } catch (e) {
      console.error(e)
    }
    res.redirect("/")

  })
}

export { routes }
