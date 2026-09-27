// ==========================================
// SERVER.JS - Server Entry Point
// ==========================================
// This is the starting point of our application.
// It loads environment variables, imports the Express app,
// and starts the server listening on a specific port.

require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`🚀 Server is running on: http://localhost:${PORT}`);
  console.log(`🩺 Health check URL:    http://localhost:${PORT}/api/health`);
  console.log(`👤 Student Profile:     http://localhost:${PORT}/api/profile`);
  console.log(`🎯 Opportunities:       http://localhost:${PORT}/api/opportunities`);
  console.log(`✨ Recommendations:     http://localhost:${PORT}/api/recommendations`);
  console.log(`💬 Feedback:            http://localhost:${PORT}/api/feedback`);
  console.log("==================================================");
});
