import "colors";
class Logger {
  error(message: any, other?: any) {
    console.error(message.red, other.red);
  }
}

const logger = new Logger();
export default logger;
