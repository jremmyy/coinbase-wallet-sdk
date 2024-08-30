// server.js
const express = require("express");
const path = require("path");
const app = express();
const port = 3001;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve index.html for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
