const DEFAULT_BASE_URL = "https://islik-cloud-api.onrender.com";
const DEFAULT_TIMEOUT_MS = 90_000;

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function parseBaseUrl(value) {
  const url = new URL(value || DEFAULT_BASE_URL);
  assert(["http:", "https:"].includes(url.protocol), "Smoke URL must use http or https.");
  assert(!url.username && !url.password, "Smoke URL must not contain credentials.");
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url;
}

function parseTimeout(value) {
  const timeout = Number(value || DEFAULT_TIMEOUT_MS);
  assert(Number.isInteger(timeout) && timeout > 0, "SMOKE_TIMEOUT_MS must be a positive integer.");
  return timeout;
}

function parseExpectedRevision(value) {
  const revision = String(value || "").trim().toLowerCase();
  assert(
    !revision || /^[0-9a-f]{7,64}$/.test(revision),
    "SMOKE_EXPECTED_GIT_COMMIT must be a 7-64 character hexadecimal commit SHA.",
  );
  return revision;
}

async function request(baseUrl, path, timeoutMs, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const rawBody = await response.text();
  let body = null;

  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      fail(`${path} did not return valid JSON.`);
    }
  }

  return { response, body };
}

function assertHeader(response, name, expectedValue) {
  const actualValue = response.headers.get(name);
  assert(
    actualValue?.toLowerCase() === expectedValue.toLowerCase(),
    `${name} must be "${expectedValue}", received "${actualValue || "missing"}".`,
  );
}

async function main() {
  const baseUrl = parseBaseUrl(process.env.SMOKE_BASE_URL);
  const timeoutMs = parseTimeout(process.env.SMOKE_TIMEOUT_MS);
  const expectedRevision = parseExpectedRevision(process.env.SMOKE_EXPECTED_GIT_COMMIT);

  console.log(`Checking ${baseUrl.origin}`);

  const health = await request(baseUrl, "/health", timeoutMs);
  assert(health.response.status === 200, `/health returned ${health.response.status}.`);
  assert(health.body?.status === "ok", '/health must return status "ok".');
  assert(health.body?.service === "islik-cloud-api", "/health returned an unexpected service.");
  assert(typeof health.body?.revision === "string", "/health must return a deployment revision.");
  if (expectedRevision) {
    assert(
      health.body.revision === expectedRevision,
      `/health is running revision "${health.body.revision}", expected "${expectedRevision}".`,
    );
  }

  assertHeader(health.response, "x-content-type-options", "nosniff");
  assertHeader(health.response, "x-frame-options", "DENY");
  assertHeader(health.response, "referrer-policy", "no-referrer");
  assertHeader(health.response, "cache-control", "no-store");
  assert(
    health.response.headers.get("permissions-policy")?.includes("camera=()"),
    "Permissions-Policy must disable camera access.",
  );
  assert(!health.response.headers.has("x-powered-by"), "X-Powered-By must not be exposed.");

  if (process.env.SMOKE_REQUIRE_HSTS !== "false") {
    assert(
      health.response.headers.get("strict-transport-security")?.includes("max-age="),
      "Strict-Transport-Security is missing.",
    );
  }

  console.log("✓ /health and security headers");

  const readiness = await request(baseUrl, "/ready", timeoutMs);
  assert(readiness.response.status === 200, `/ready returned ${readiness.response.status}.`);
  assert(readiness.body?.status === "ready", '/ready must return status "ready".');
  assert(readiness.body?.service === "islik-cloud-api", "/ready returned an unexpected service.");
  assert(
    readiness.body?.revision === health.body.revision,
    "/health and /ready returned different deployment revisions.",
  );

  console.log("✓ /ready and database connectivity");

  const rejectedOrigin = await request(baseUrl, "/health", timeoutMs, {
    headers: {
      Origin: "https://portfolio-smoke.invalid",
    },
  });
  assert(rejectedOrigin.response.status === 403, `Disallowed CORS origin returned ${rejectedOrigin.response.status}.`);
  assert(
    !rejectedOrigin.response.headers.has("access-control-allow-origin"),
    "Disallowed CORS origin received Access-Control-Allow-Origin.",
  );

  console.log("✓ disallowed CORS origin");
  console.log("Production smoke test passed.");
}

main().catch((error) => {
  console.error(`Production smoke test failed: ${error.message}`);
  process.exitCode = 1;
});

