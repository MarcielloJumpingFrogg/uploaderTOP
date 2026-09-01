import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = __dirname + "/uploads";

fs.readdir(dir, (err, files) => {
  if (err) throw err;
  for (const file of files) {
    fs.rm(path.join(dir, file), { recursive: true }, (err) => {
      if (err) throw err;
    });
  }
});

console.log("done");
