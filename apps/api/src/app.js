const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/auth");
const customersRouter = require("./routes/customers");
const jobsRouter = require("./routes/jobs");
const { requireAuth } = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

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
