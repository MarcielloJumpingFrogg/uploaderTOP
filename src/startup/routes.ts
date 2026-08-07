import { passport } from "../../config/passport"
import type { Express } from "express"
import { signUpController } from "./controller"


async function routes(app: Express) {
  app.get("/", (req, res) => {
    res.redirect("/login")
  })

  app.get("/login", (req, res) => {
    res.render("login", { user: req.user, title: "Login" })
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

  app.post("/signUp",   signUpController)
}

export { routes }
