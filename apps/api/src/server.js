require("dotenv").config();

const { app } = require("./app");

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  const localUrl = "http://localhost:" + PORT;
  console.log("API running on " + localUrl);

  if (HOST === "0.0.0.0") {
    console.log("Phone access: use http://YOUR_COMPUTER_IP:" + PORT);
  }
});
