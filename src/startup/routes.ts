import { passport } from "../../config/passport";
import type { Express } from "express";
import { signUpController } from "../controllers/signUpController";
import { accountController } from "../controllers/accountController";
import customErrorContainer from "../customErrors/customErrorContainer";
import fs from "fs";
import { isPicOfUser } from "../databaseMethods/isPicOfUser";
import { getDestination } from "../multer/multer";
import { avatarUploader } from "../multer/avatarUploader";
import { fileUploader } from "../multer/fileUploader";
import { folderVisualizer } from "../controllers/folderVisualizer";

async function routes(app: Express) {
  app.get("/", (req, res) => {
    if (req.user) {
      res.redirect("/account");
    } else {
      res.redirect("/login");
    }
  });

  app.get("/login", (_req: any, res) => {
    res.status(customErrorContainer.getErrorCode()).render("login", {
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

  app.get("/account/:path/:path", folderVisualizer);

  app.post("/account/avatar", avatarUploader);

  app.get("/img/:imageName", async (req, res) => {
    const result = getDestination();
    if (await isPicOfUser(req.user.id, req.params.imageName)) {
      const imageName = req.params.imageName;
      const readStream = fs.createReadStream(
        `${result}/users/${req.user.id}/avatar/${imageName}`,
      );
      readStream.pipe(res);
      console.log("Confirmed picture is of current user, loading image");
    } else {
      console.log(
        "Picture is not of current user, the action has been blocked",
      );
      res.status(400).render("404");
    }
  });

  app.post("/account/file", fileUploader);
}

export { routes };
