import fs from "node:fs";
import { getDestination } from "../controllers/multerController";
import path from "node:path";

function checkNewDatabase(id: number) {
  if (id == 1) {
    const dir = path.join(__dirname, "../../" + getDestination() + "/users");
    fs.readdir(dir, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        fs.rm(path.join(dir, file), { recursive: true }, (err) => {
          if (err) throw err;
        });
      }
    });
  }
}

export { checkNewDatabase };
