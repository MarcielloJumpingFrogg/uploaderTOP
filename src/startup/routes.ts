import bcrypt from "bcryptjs"
import { passport } from "../../config/passport"
import type { Express } from "express"
import { prisma } from "../../lib/prisma"
import {body, validationResult} from "express-validator"

import { validateUser } from "./controller"

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

  app.post("/signUp", validateUser , async (req: any, res: any) => {
    const errors = validationResult(req);
    req.errors=errors
    if(!errors.isEmpty()) {
      return res.status(400).render("signUp" , {errors: errors.array()})
    }
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      const newUser = await prisma.users.create({
        data: {
          username: req.body.username,
          password: hashedPassword
        }
      })
      //console.log(newUser)
      req.login(newUser, function (err:any) {
        if(err) {
          console.error(err)
        } else {
          res.redirect('/')
        }
      })
    } catch (e: any) {
      if(e.code === "P2002") {
        const error = [{msg: "Username Already Take"}]
        return res.status(400).render("signUp", {errors: error})
      } else {
        const genericError = [{msg: "There has been an unexpected error, please try again later"}]
        return res.status(400).render("signUp", {errors: genericError})
        console.error(e)
      }
    }
    //res.redirect("/")

  })
}

export { routes }
