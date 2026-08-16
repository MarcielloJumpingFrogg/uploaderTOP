import { passport } from "../../config/passport";
import type { Express } from "express";
import { signUpController } from "../controllers/signUpController";
import { avatarController } from "../controllers/multerController";
import { accountController } from "../controllers/accountController";
import customErrorContainer from "../customErrors/customErrorContainer";
import fs from "fs";
import { isPicOfUser } from "../databaseMethods/isPicOfUser";

async function routes(app: Express) {
  app.get("/", (req, res) => {
    if (req.user) {
      res.redirect("/account");
    } else {
      res.redirect("/login");
    }
  });

  app.get("/login", (req: any, res) => {
    res
      .status(customErrorContainer.getErrorCode())
      .render("login", {
        title: "Login",
        errors: customErrorContainer.getErrorList(),
      });
  });

  app.get("/api/login", (req, res) => {
    res.json({ user: req.user });
  });

  app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/account",
      failureRedirect: "/login?error=Invalid+credentials",
      failureMessage: true,
    }),
  );

  app.get("/signUp", (_req, res) => {
    res.render("signUp");
  });

  app.get("/log-out", (req, res, next) => {
    customErrorContainer.resetError();
    req.logout((err: string) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

  app.post("/signUp", signUpController);

  app.get("/account", accountController);

  app.post("/account/avatar", avatarController);

  app.get("/img/:imageName", async (req, res) => {
    if (await isPicOfUser(req.user.id, req.params.imageName)) {
      const imageName = req.params.imageName;
      const readStream = fs.createReadStream(`uploads/${imageName}`);
      readStream.pipe(res);
      console.log("yes");
    } else {
      console.log("no");
      res.status(400).render("404");
    }
  });

  app.post("/create/folder", async (req, res) => {
    const folderName = req.body.name;
  });
}

export { routes };
