const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (typeof secret === "string" && secret.trim().length > 0) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production.");
  }

  return "local-dev-secret";
}

function assertJwtSecret() {
  getJwtSecret();
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    getJwtSecret(),
    {
      expiresIn: "7d"
    }
  );
}

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({
        error: {
          message: "Authentication required."
        }
      });
    }

    const payload = jwt.verify(token, getJwtSecret());

    req.user = {
      id: payload.sub,
      email: payload.email
    };

    next();
  } catch {
    return res.status(401).json({
      error: {
        message: "Invalid or expired token."
      }
    });
  }
}

module.exports = {
  assertJwtSecret,
  signToken,
  requireAuth
};
