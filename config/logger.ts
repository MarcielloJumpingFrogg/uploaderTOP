import "colors";
class Logger {
  error(message: any, other?: any) {
    console.error(message.red, other.red);
  }
  test(message: any, other?: any) {
    console.log(message.black.bgCyan, other);
  }
}

const logger = new Logger();
export default logger;
