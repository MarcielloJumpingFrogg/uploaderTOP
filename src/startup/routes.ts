import { passport } from "../../config/passport"
import type { Express } from "express"
import { signUpController } from "../controllers/signUpController"
import { avatarController } from "../controllers/multerController"
import { accountController } from "../controllers/accountController"


async function routes(app: Express) {
  app.get("/", (req, res) => {
    if(req.user) {
      res.redirect("/account")
    } else{
      res.redirect("/login")
    }
  })

  app.get("/login", (req, res) => {
    console.log("req.errors: ", req.session)
    res.render("login", { user: req.user, title: "Login" })
  })

  app.get("/api/login", (req, res) => {
		res.json({user: req.user})

	} )

  app.post("/login",  passport.authenticate("local", {
    successRedirect: "/account",
    failureRedirect: "/login",
    failureMessage: true,
  }))

  app.get("/signUp", (_req, res) => {
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

  app.get("/account",  accountController)

  app.post("/account/avatar", avatarController)
}

export { routes }
