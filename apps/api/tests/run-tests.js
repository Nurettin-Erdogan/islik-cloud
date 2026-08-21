const { spawnSync } = require("node:child_process");
const path = require("node:path");
const dotenv = require("dotenv");

const apiRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(apiRoot, ".env") });

function getTestDatabaseUrl() {
  const value = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL is required to run API tests.");
  }

  const databaseUrl = new URL(value);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const databaseName = databaseUrl.pathname.replace(/^\//, "");

  if (!localHosts.has(databaseUrl.hostname) || !databaseName.includes("islik")) {
    throw new Error("API tests require a local islik database.");
  }

  databaseUrl.searchParams.set("schema", "islik_test");
  return databaseUrl.toString();
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: apiRoot,
    env,
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const prismaRoot = path.dirname(require.resolve("prisma/package.json"));
const prismaCli = path.join(prismaRoot, "build", "index.js");
const testEnvironment = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: getTestDatabaseUrl(),
  JWT_SECRET: process.env.TEST_JWT_SECRET || "test-only-jwt-secret"
};

run(process.execPath, [prismaCli, "migrate", "deploy"], testEnvironment);
run(
  process.execPath,
  [
    "--test",
    path.join(__dirname, "api.test.js"),
    path.join(__dirname, "seed-config.test.js")
  ],
  testEnvironment
);
