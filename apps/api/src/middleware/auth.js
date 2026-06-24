const jwt = require("jsonwebtoken");

function getJwtSecret() {
  return process.env.JWT_SECRET || "local-dev-secret";
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
  signToken,
  requireAuth
};
