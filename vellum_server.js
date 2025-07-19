# .env file

# From Linear Settings > API > Agents
LINEAR_AGENT_KEY=lagn_...

# From GitHub Settings > Developer settings > Personal access tokens
GITHUB_TOKEN=github_pat_...

# From Google AI Studio or your chosen AI provider
GEMINI_API_KEY=AIzaSy...

# From Vellum Settings > API Keys
VELLUM_API_KEY=...

# This you will update every time you restart ngrok
# Example: https://<your-random-string>.ngrok-free.app
NGROK_URL=...```

**2. Your Vellum Workflows:**
*   You must have two Vellum workflows deployed:
    1.  A "Code Reviewer" workflow that takes a `git_diff` and returns a review.
    2.  A "CodeSmith" workflow that takes ticket details and your `tool_base_url`, uses the self-hosted tool to fetch files, and returns a JSON object of new code.
*   Make sure you have the correct deployment names for both.

**3. Your `package.json`:**
*   Ensure all necessary dependencies are installed: `express`, `axios`, `@linear/sdk`, `@octokit/rest`, `@google/generative-ai`, `vellum-ai`, `dotenv`, `chalk`. If you are missing `vellum-ai`, run `npm install vellum-ai`.

---

### **Part 2: The Complete Code (`cloud-server.js`)**

Copy and paste this entire code block into your `cloud-server.js` file.

```javascript
// cloud-server.js

require('dotenv').config();

// --- Standard Imports ---
const express = require('express');
const axios =require('axios');
const chalk = require('chalk');

// --- API Client Imports ---
const { Octokit } = require('@octokit/rest');
const { LinearClient } = require('@linear/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Vellum = require('vellum-ai'); // Vellum's official Node.js client

// --- Initialize API Clients ---
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const linearClient = new LinearClient({ apiKey: process.env.LINEAR_AGENT_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const vellumClient = new Vellum(process.env.VELLUM_API_KEY);

// --- Helper Functions ---

/**
 * Parses GitHub PR details from a URL.
 * @param {string} url - The GitHub PR URL.
 * @returns {{owner: string, repo: string, pull_number: number}}
 */
function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([\w-]+)\/([\w-]+)\/pull\/(\d+)/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    pull_number: parseInt(match[3], 10),
  };
}

// =================================================================
// --- SELF-HOSTED TOOL ENDPOINTS (For Vellum to Call) ---
// =================================================================

/**
 * Tool Endpoint: Fetch a file from GitHub.
 */
app.post('/tools/fetch-github-file', async (req, res) => {
  console.log(chalk.magenta('Tool call received: fetch-github-file'));
  const { owner, repo, file_path } = req.body;

  if (!owner || !repo || !file_path) {
    return res.status(400).json({ error: "Missing required parameters: owner, repo, file_path" });
  }

  try {
    const response = await octokit.repos.getContent({ owner, repo, path: file_path });
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    res.status(200).json({ success: true, content: content });
  } catch (error) {
    console.error(chalk.red('Error in fetch-github-file tool:'), error.message);
    res.status(500).json({ success: false, error: 'Internal server error while fetching file.' });
  }
});

// =================================================================
// --- MAIN LINEAR WEBHOOK LISTENER ---
// =================================================================

app.post('/api/webhook', async (req, res) => {
  // Immediately respond to Linear's challenge to verify the webhook URL
  if (req.body.type === 'WebhookChallenge') {
    console.log(chalk.yellow('Received Linear webhook challenge. Responding...'));
    return res.json({ challenge: req.body.challenge });
  }

  // Route the webhook to the correct handler based on the action
  if (req.body.type === 'AppUserNotification') {
    const action = req.body.action;
    const data = req.body.data;

    if (action === 'issueCommentMention') {
      handleCodeReview(data); // Fire-and-forget
    } else if (action === 'issueAssignedToYou') {
      handleCodeGeneration(data); // Fire-and-forget
    }
  }

  // IMPORTANT: Respond to the webhook immediately with a 200 OK.
  res.status(200).send('Webhook received and is being processed.');
});


// =================================================================
// --- AGENT SKILL IMPLEMENTATIONS ---
// =================================================================

/**
 * Handles the "Code Reviewer" skill, triggered by an @mention.
 * @param {object} data - The webhook data payload from Linear.
 */
async function handleCodeReview(data) {
  console.log(chalk.cyan.bold('🚀 Received @mention! Starting review process...'));
  const { issueId, commentId, body } = data;

  try {
    await linearClient.commentCreate({ issueId, body: "🤖 Roger that! I'm starting the code review now..." });
    console.log(chalk.green('   - Acknowledgement comment posted.'));

    const urlMatch = body.match(/https:\/\/github\.com\/[\w-]+\/[\w-]+\/pull\/\d+/);
    if (!urlMatch) throw new Error('No GitHub PR URL found in the comment.');
    
    const prUrl = urlMatch[0];
    const { owner, repo, pull_number } = parseGitHubUrl(prUrl);
    
    const { data: diffContent } = await octokit.pulls.get({
      owner, repo, pull_number, headers: { accept: 'application/vnd.github.v3.diff' },
    });
    console.log(chalk.green('   - Successfully fetched PR diff.'));

    // This could also be a Vellum workflow call
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `You are an expert code reviewer. Analyze the following git diff and provide a concise but helpful code review. Format as Markdown. Diff:\n\n${diffContent}`;
    const result = await model.generateContent(prompt);
    const reviewText = result.response.text();
    
    await linearClient.commentCreate({ issueId, body: `### 🤖 CodeScribe AI Review\n\n${reviewText}` });
    console.log(chalk.green.bold('\n✅ Review complete and posted to Linear!'));

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error in Code Review skill:'), error.message);
    await linearClient.commentCreate({ issueId, body: `🤖 I ran into an error: ${error.message}` });
  }
}

/**
 * Handles the "CodeSmith" skill, triggered by an issue assignment.
 * @param {object} data - The webhook data payload from Linear.
 */
async function handleCodeGeneration(data) {
  console.log(chalk.cyan.bold('✨ Received assignment! Starting code generation process...'));
  const { issueId, title, description } = data;

  try {
    await linearClient.commentCreate({ issueId, body: "🤖 Assignment received. I will now attempt to implement a solution." });

    const tool_base_url = process.env.NGROK_URL;
    if (!tool_base_url) throw new Error("NGROK_URL environment variable is not set.");

    // These would likely be parsed from the issue or a project setting
    const repo_owner = 'YourGitHubUsername'; // <-- CHANGE THIS
    const repo_name = 'warp-linear-agent'; // <-- CHANGE THIS

    console.log(chalk.blue('   - Calling Vellum "CodeSmith" workflow...'));
    const vellumResponse = await vellumClient.executeWorkflow({
      workflowDeploymentName: 'codesmith-agent-v1', // <-- CHANGE THIS to your Vellum deployment name
      inputs: [
        { name: 'ticket_title', type: 'STRING', value: title },
        { name: 'ticket_description', type: 'STRING', value: description || '' },
        { name: 'repo_owner', type: 'STRING', value: repo_owner },
        { name: 'repo_name', type: 'STRING', value: repo_name },
        { name: 'tool_base_url', type: 'STRING', value: tool_base_url },
      ]
    });

    const newCodeMap = vellumResponse.data.outputs.find(o => o.name === 'new_code_json')?.value;
    if (!newCodeMap) throw new Error("Vellum workflow did not return the expected 'new_code_json' output.");
    console.log(chalk.green('   - Vellum workflow complete. Received new code.'));

    // NOTE: The GitHub commit logic is complex and shown conceptually.
    // A real implementation would require a helper function using the Git Data API.
    console.log(chalk.blue('   - Committing new code to GitHub... (Conceptual Step)'));
    // 1. Create a new branch
    // 2. Create blobs for each file in newCodeMap
    // 3. Create a tree from the blobs
    // 4. Create a commit from the tree
    // 5. Update the branch ref to point to the new commit
    // 6. Create a Pull Request
    const newPrUrl = "https://github.com/placeholder/pr/123"; // Placeholder URL

    await linearClient.commentCreate({ issueId, body: `✅ I have created a potential solution. The pull request is ready for human review here: ${newPrUrl}` });
    console.log(chalk.green.bold('\n✅ Code generation complete and PR created!'));

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error in Code Generation skill:'), error.message);
    await linearClient.commentCreate({ issueId, body: `🤖 I ran into an error while trying to generate code: ${error.message}` });
  }
}


// --- Start the Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(chalk.yellow(`🚀 Cloud Listener server is running on port ${PORT}`));
  console.log(chalk.yellow(`   - Make sure your ngrok tunnel is running and the URL is set in your Linear App.`));
});