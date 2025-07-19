// server.js

// 1. Import the Express library
const express = require('express');

// 2. Create an instance of an Express application
const app = express();

// 3. Configure Middleware: The JSON Parser
// This is a CRITICAL line. It tells Express to automatically parse the body of
// any incoming request that has a 'Content-Type' of 'application/json'.
app.use(express.json());

// 4. Define the Webhook Endpoint (Our "Front Door")
app.post('/api/webhook', (req, res) => {
  // The "Security Camera Feed" - Log everything to the console.
  console.log('✅ --- Webhook Received! --- ✅');
  
  // Pretty-print the entire JSON payload from GitHub to see what we're getting.
  console.log('Payload:', JSON.stringify(req.body, null, 2));

  // The "Reply Slip" - Send a success response back to GitHub.
  res.status(200).send('Webhook received successfully.');
});

// 5. Define the Port and Start the Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});