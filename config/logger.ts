import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const colors = require("colors");
class Logger {
  error(message: any, other?: any) {
    console.error(colors.red(message), other || "");
  }
  test(message: any, other?: any) {
    console.log(colors.black.bgCyan(message), other || "");
  }
  toImplement(message: any, other?: any) {
    console.log(colors.yellow.bgBlack(message), other || "");
  }
}

const logger = new Logger();
export default logger;
