// import fs from "node:fs";
// import { getDestination } from "../multer/avatarUploader";
// import path from "node:path";

function checkNewDatabase(id: number) {
  if (id == 1) {
    console.log("new database");
    //   const dir = path.join(__dirname, "../../" + getDestination() + "/users");
    //   fs.readdir(dir, (err, files) => {
    //     if (err) throw err;
    //     for (const file of files) {
    //       fs.rm(path.join(dir, file), { recursive: true }, (err) => {
    //         if (err) throw err;
    //       });
    //     }
    //   });
  }
}

export { checkNewDatabase };
