require("dotenv").config();

const { app } = require("./app");
const { prisma } = require("./lib/prisma");

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  const localUrl = "http://localhost:" + PORT;
  console.log("API running on " + localUrl);

  if (HOST === "0.0.0.0") {
    console.log("Phone access: use http://YOUR_COMPUTER_IP:" + PORT);
  }
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(signal + " received. Closing API...");

  const forceExitTimer = setTimeout(() => {
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  server.close(async () => {
    await prisma.$disconnect();
    clearTimeout(forceExitTimer);
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
