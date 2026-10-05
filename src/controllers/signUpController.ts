import bcrypt, { hash } from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { validationResult } from "express-validator";
import { validateUser } from "./validateUser";
import customErrorContainer from "../customErrors/customErrorContainer";
import fs from "node:fs";
import { getDestination } from "../multer/multer";
import path from "node:path";

const signUpController: any = [
  validateUser,
  async (req: any, res: any) => {
    const errors: any = validationResult(req);
    if (!errors.isEmpty()) {
      customErrorContainer.validatorError(errors.errors);
      return res
        .status(customErrorContainer.getErrorCode())
        .render("signUp", { errors: customErrorContainer.getErrorList() });
    }
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const newUser = await prisma.users.create({
        data: {
          username: req.body.username,
          password: hashedPassword,
        },
      });
      req.login(newUser, (err: any) => {
        if (err) throw err;
        req.user = newUser;
        res.redirect("/account");
      });
    } catch (e: any) {
      if (e.code === "P2002") {
        const error = "Username Already Take";
        customErrorContainer.signUpError(error, 409);
        return res
          .status(customErrorContainer.getErrorCode())
          .render("signUp", { errors: customErrorContainer.getErrorList() });
      } else {
        const genericError =
          "There has been an unexpected error, please try again later";
        customErrorContainer.signUpError(genericError, 400);
        console.error(e);
        return res
          .status(customErrorContainer.getErrorCode())
          .render("signUp", { errors: customErrorContainer.getErrorList() });
      }
    }
  },
];

export { signUpController };
