const test = require("node:test");
const assert = require("node:assert/strict");
const { requireDemoPassword } = require("../prisma/seed-config");

test("demo seed password is required", () => {
  assert.throws(
    () => requireDemoPassword({}),
    /DEMO_PASSWORD must contain at least 12 characters/
  );
});

test("short demo seed password is rejected", () => {
  assert.throws(
    () => requireDemoPassword({ DEMO_PASSWORD: "short" }),
    /DEMO_PASSWORD must contain at least 12 characters/
  );
});

test("explicit strong demo seed password is accepted", () => {
  const password = "local-demo-password";
  assert.equal(requireDemoPassword({ DEMO_PASSWORD: password }), password);
});
