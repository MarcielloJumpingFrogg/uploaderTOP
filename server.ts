import logger from "./config/logger";
import { app } from "./app";
import "dotenv/config";
const PORT = Number(process.env.PORT) || 8080;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("Listenting on:", PORT);
});

server.on("error", (err) => {
  logger.error("SERVER ERROR: ", err);
});

server.on("close", () => {
  logger.error("SERVER CLOSED");
});
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION ", err);
});

process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION", err);
});

let shuttingDown = false;

function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal}: closing HTTP server`);

  server.close((err) => {
    if (err) {
      console.error("Error closing server:", err);
      process.exitCode = 1;
    }

    process.exit();
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

//small test
