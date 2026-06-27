const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/auth");
const customersRouter = require("./routes/customers");
const jobsRouter = require("./routes/jobs");
const { requireAuth } = require("./middleware/auth");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
      if (allowedOrigins.length === 0 || !origin || allowedOrigins.includes(origin)) {
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

app.use("/api/auth", authRouter);
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
