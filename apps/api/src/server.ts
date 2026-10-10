import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./shared/prisma.js";

const port = env.PORT;
const host = "0.0.0.0";

const app = createApp();

const server = app.listen(port, host, () => {
  logger.info(`Server listening on http://${host}:${port} [${env.NODE_ENV}]`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    logger.info("HTTP server closed.");
    try {
      await prisma.$disconnect();
      logger.info("Database connection closed.");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during database disconnect");
      process.exit(1);
    }
  });

  // Force shutdown if connections do not drain within 10 seconds
  setTimeout(() => {
    logger.error("Graceful shutdown timeout exceeded; forcing exit.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
