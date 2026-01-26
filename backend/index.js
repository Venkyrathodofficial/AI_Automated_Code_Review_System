const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// test route (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// webhook route
app.post("/webhook/github", (req, res) => {
  console.log("✅ GitHub webhook received");
  console.log("Repository:", req.body.repository?.name);
  console.log("Commit message:", req.body.head_commit?.message);
  res.status(200).send("Webhook received");
});

// SERVER MUST LISTEN
app.listen(3000, () => {
  console.log("🚀 Backend running on port 3000");
});
