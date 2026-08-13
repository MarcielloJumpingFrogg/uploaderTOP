import { passport } from "../../config/passport"
import type { Express } from "express"
import { signUpController } from "../controllers/signUpController"
import { avatarController } from "../controllers/multerController"
import { accountController } from "../controllers/accountController"
import customErrorContainer from "../functions/customErrorContainer"
import fs from "fs"

async function routes(app: Express) {
  app.get("/", (req, res) => {
    if(req.user) {
      res.redirect("/account")
    } else{
      res.redirect("/login")
    }
  })

  app.get("/login", (req:any, res) => {
    res.status(customErrorContainer.getErrorCode()).render("login", { title: "Login" , errors: customErrorContainer.getErrorList()})
  })

  app.get("/api/login", (req, res) => {
		res.json({user: req.user})

	} )

  app.post("/login",  passport.authenticate("local", {
    successRedirect: "/account",
    failureRedirect: "/login?error=Invalid+credentials",
    failureMessage: true,
  }))

  app.get("/signUp", (_req, res) => {
    res.render("signUp")
  })

  app.get('/log-out', (req, res, next) => {
    customErrorContainer.resetError()
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
  app.get("/images/:imageName", (req, res) => {
    const imageName = req.params.imageName 
    const readStream = fs.createReadStream(`images/${imageName}`)
    readStream.pipe(res)
  })
}

export { routes }
