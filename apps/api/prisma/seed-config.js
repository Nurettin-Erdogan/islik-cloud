function requireDemoPassword(environment = process.env) {
  const demoPassword = String(environment.DEMO_PASSWORD || "");

  if (demoPassword.length < 12) {
    throw new Error("DEMO_PASSWORD must contain at least 12 characters.");
  }

  return demoPassword;
}

module.exports = {
  requireDemoPassword
};
