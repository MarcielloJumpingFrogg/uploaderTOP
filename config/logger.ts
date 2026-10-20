import "colors";
class Logger {
  error(message: any, other?: any) {
    console.error(message.red, other|| "");
  }
  test(message: any, other?: any) {
    console.log(message.black.bgCyan, other|| "");
  }
  toImplement(message: any, other?: any) {
    console.log(message.yellow.bgBlack, other || "")
  }
}

const logger = new Logger();
export default logger;
