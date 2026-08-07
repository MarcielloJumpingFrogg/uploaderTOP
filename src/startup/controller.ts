import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma"
import { validationResult } from "express-validator";
import { validateUser } from "./validateUser";

const  signUpController =[ validateUser , async (req: any, res: any) => {
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
        console.error(e)
        return res.status(400).render("signUp", {errors: genericError})
      }
    }
} ];


export {signUpController}
