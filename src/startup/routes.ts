import { passport } from "../../config/passport"
import type { Express } from "express"
import { signUpController } from "../controllers/signUpController"
import { multerController } from "../controllers/multerController"


async function routes(app: Express) {
  app.get("/", (req, res) => {
    if(req.user) {
      res.redirect("/account")
    } else{
      res.redirect("/login")
    }
  })

  app.get("/login", (req, res) => {
    res.render("login", { user: req.user, title: "Login" })
  })

  app.get("/api/login", (req, res) => {
    console.log("should be here")
    console.log(req.user)
    res.json(req.user)
  })

  app.post("/login", passport.authenticate("local", {
    successRedirect: "/account",
    failureRedirect: "/signUp",
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

  app.post("/signUp", signUpController)

  app.get("/account", (req, res) => {
    res.render("account", {user: req.user })
  })

  app.post("/account", multerController)
}

export { routes }
