const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/auth");
const customersRouter = require("./routes/customers");
const jobsRouter = require("./routes/jobs");
const { assertJwtSecret, requireAuth } = require("./middleware/auth");

assertJwtSecret();

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const authRateLimitWindowMs = normalizePositiveInteger(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000
);
const authRateLimitMax = normalizePositiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 30);

function normalizePositiveInteger(value, fallback) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return fallback;
  }

  return numberValue;
}

function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return !isProduction && allowedOrigins.length === 0;
}

function createRateLimiter({ windowMs, max, message }) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        error: {
          message
        }
      });
      return;
    }

    next();
  };
}

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
}

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });

  next();
}

app.use(securityHeaders);
app.use(requestLogger);

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "islik-cloud-api"
  });
});

app.use(
  "/api/auth",
  createRateLimiter({
    windowMs: authRateLimitWindowMs,
    max: authRateLimitMax,
    message: "Too many authentication attempts. Please try again later."
  }),
  authRouter
);
app.use("/api/customers", requireAuth, customersRouter);
app.use("/api/jobs", requireAuth, jobsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: {
      message: "Route not found."
    }
  });
});

app.use((error, req, res, next) => {
  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: {
        message: "Origin not allowed."
      }
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({
      error: {
        message: "Record not found."
      }
    });
  }

  if (error.code === "P2003") {
    return res.status(400).json({
      error: {
        message: "Related record was not found."
      }
    });
  }

  console.error(error);

  res.status(500).json({
    error: {
      message: "Internal server error."
    }
  });
});

module.exports = {
  app
};
