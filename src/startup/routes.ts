import { passport } from "../../config/passport";
import type { Express } from "express";
import { signUpController } from "../controllers/signUpController";
import { accountController } from "../controllers/accountController";
import customErrorContainer from "../customErrors/customErrorContainer";
import fs from "fs";
// import { isPicOfUser } from "../databaseMethods/isPicOfUser";
import { avatarUploader } from "../controllers/avatarUploader";
import { fileUploader } from "../controllers/fileUploaderController";
import { folderVisualizer } from "../controllers/folderVisualizer";
import { newFolderController } from "../controllers/newFolderController";
import { getAvatar } from "../supabaseFn/getAvatar";
import { fileDeleteController } from "../controllers/fileDeleteController";
import { renameController } from "../controllers/renameController";
import { downloadController } from "../controllers/downloadController";
import { shareCreatorController } from "../controllers/shareCreatorController";
import { addSharedFileCtrl } from "../controllers/addSharedFileCtrl";
import { travelFolderController } from "../controllers/travelFolderController";
import logger from "../../config/logger";

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

  app.get("/api/user", (req, res) => {
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

  app.get("/account/:id/:path", folderVisualizer);

  // app.post("/account/folder", travelFolderController)

  app.post("/account/avatar", avatarUploader);

  app.get("/avatar", async (req: any, res) => {
    if (req.user.id === undefined) {
      logger.error("NO REQ.USER.ID");
    } else {
      const avatar = await getAvatar(req.user.id);
      res.redirect(avatar);
    }
  });

  app.post("/account/newFolder", newFolderController);

  app.get("/img/:imageName", async (req, res) => {
    const imageName = req.params.imageName;
    console.log("imageName: ", imageName);
    const avatarLink = await getAvatar(imageName);
    const readStream = fs.createReadStream(avatarLink || "");
    readStream.pipe(res);
  });

  app.post("/account/file", fileUploader);

  app.post("/account/delete", fileDeleteController);

  app.post("/account/rename", renameController);

  app.post("/account/download", downloadController);

  app.get("/share/add/:shareId", addSharedFileCtrl);

  app.post("/share/create", shareCreatorController);
}

export { routes };
