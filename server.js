// Example webhook ngrok:
// https://d3746b51a3b7.ngrok-free.app/api/webhook
// ngrok http 3000

const axios = require('axios'); // For making HTTP requests
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Gemini
const { LinearClient } = require('@linear/sdk'); // Linear
require('dotenv').config(); // To load variables from .env file



// 1. Import the Express library
const express = require('express');

// 2. Create an instance of an Express application
const app = express();

// 3. Configure Middleware: The JSON Parser
// This is a CRITICAL line. It tells Express to automatically parse the body of
// any incoming request that has a 'Content-Type' of 'application/json'.
app.use(express.json());



// 3.5 Initialize API Clients with keys from .env
// Initialize API Clients with keys from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const linearClient = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

app.post('/api/webhook', async (req, res) => {
  console.log('✅ --- Webhook Received! --- ✅');

  // 1. A "Guard Clause" to ensure we only run on new PRs
  if (req.body.action !== 'opened' && req.body.action !== 'reopened') {
    console.log('Webhook was not for a new PR. Ignoring.');
    return res.status(200).send('Event ignored.');
  }

  try {
    // 2. Extract necessary information from the GitHub payload
    const pullRequest = req.body.pull_request;
    const diffUrl = pullRequest.diff_url;
    console.log(`Fetching diff from: ${diffUrl}`);

    // 3. Fetch the actual code changes (the .diff file)
    const diffResponse = await axios.get(diffUrl);
    const diffContent = diffResponse.data;
    
    if (!diffContent) {
      throw new Error('Could not fetch diff content.');
    }
    console.log('Diff content fetched successfully.');

    // 4. Call the Gemini API for a summary
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are an expert code reviewer. Summarize the following code changes from a git diff in a single, concise sentence for a project manager. Diff:\n\n${diffContent}`;
    
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    console.log(`AI Summary: ${summary}`);

    // 5. Post the summary to a HARDCODED Linear ticket
    const hardcodedTicketId = 'COD-5'; // <-- REPLACE WITH YOUR TEST TICKET ID
    
    await linearClient.comment.create({
      issueId: hardcodedTicketId,
      body: `🤖 AI-Generated Summary from new PR:\n\n> ${summary}`,
    });
    console.log(`✅ Successfully posted comment to Linear ticket ${hardcodedTicketId}`);
    // 6. Send the final success response
    res.status(200).send('Webhook processed and comment posted to Linear.');

  } catch (error) {
    console.error('❌ An error occurred:', error.message);
    res.status(500).send('An internal server error occurred.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});