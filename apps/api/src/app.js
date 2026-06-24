const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customers");
const jobRoutes = require("./routes/jobs");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "islik-cloud-api"
  });
});

app.use("/api/customers", customerRoutes);
app.use("/api/jobs", jobRoutes);

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
        message: "Related record does not exist."
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
