// run-agent.js

// Load environment variables from .env file at the very start
require('dotenv').config();

// Import necessary libraries
const { execSync } = require('child_process'); // To run shell commands
const axios = require('axios'); // To make HTTP requests to the Linear Agent API
const { Octokit } = require('@octokit/rest'); // Official client for the GitHub API
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Official client for the Gemini API
const chalk = require('chalk'); // A library to add color and style to terminal output

// --- Initialize API Clients ---
// These objects will be our interface to the external services.
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * The main function that performs the entire agentic workflow, from gathering
 * local context to updating cloud services.
 */
async function runDraftAgent() {
  console.log(chalk.cyan.bold('🚀 Starting CodeScribe Agent...'));

  try {
    // --- 1. Context Gathering: What have I been working on? ---
    console.log(chalk.blue('   - Gathering local git context...'));
    const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const diffContent = execSync('git diff --staged').toString().trim();
    const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();

    // The script cannot proceed without staged changes.
    if (!diffContent) {
      throw new Error('No staged changes found. Please run "git add <files>" for the changes you want to include.');
    }

    // --- 2. Ticket ID Extraction: What is this work for? ---
    console.log(chalk.blue(`   - Parsing branch name "${branchName}"...`));
    const ticketIdMatch = branchName.match(/([A-Z]+-\d+)/);
    if (!ticketIdMatch) {
      throw new Error(`Could not find a Linear ticket ID (e.g., TIX-123) in the branch name.`);
    }
    const linearTicketId = ticketIdMatch[0];
    console.log(chalk.green(`   - Found Linear Ticket: ${linearTicketId}`));

    // --- 3. AI Analysis: What should I say about this work? ---
    console.log(chalk.blue('   - Sending code changes to AI for analysis...'));
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze the following git diff and generate a clean JSON object with three keys: "title" (a conventional commit-style PR title), "body" (a detailed PR description in Markdown format), and "summary" (a one-sentence summary for a project manager). Do not add any text before or after the JSON object. Diff:\n\n${diffContent}`;

    const result = await model.generateContent(prompt);
    // Clean up the response to ensure we have a parsable JSON string, as LLMs sometimes add markdown wrappers.
    const jsonString = result.response.text().replace(/```json\n|```/g, '').trim();
    const aiResults = JSON.parse(jsonString);
    console.log(chalk.green('   - AI analysis complete.'));

    // --- 4. GitHub Action: Let me create the PR for you. ---
    console.log(chalk.blue('   - Creating draft pull request on GitHub...'));
    // Extract owner and repo from a URL like 'https://github.com/User/Repo.git'
    const repoInfoMatch = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
    if (!repoInfoMatch) {
      throw new Error('Could not parse GitHub owner and repo from remote URL.');
    }
    const owner = repoInfoMatch[1];
    const repo = repoInfoMatch[2];

    const pr = await octokit.pulls.create({
      owner,
      repo,
      title: aiResults.title,
      body: aiResults.body,
      head: branchName, // The branch with your changes
      base: 'main',      // The branch you want to merge into. CHANGE IF YOURS IS 'master'
      draft: true,       // Create it as a draft, not ready for review.
    });
    console.log(chalk.green(`   - Created Draft PR: ${pr.data.html_url}`));

    // --- 5. Linear Action: Let me update the team. ---
    console.log(chalk.blue(`   - Adding comment to Linear ticket ${linearTicketId}...`));
    
    // First, get the issue ID using the identifier
    const issueQuery = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          title
        }
      }
    `;
    
    const issueResponse = await axios.post('https://api.linear.app/graphql', {
      query: issueQuery,
      variables: { id: linearTicketId }
    }, {
      headers: {
        'Authorization': `${process.env.LINEAR_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!issueResponse.data.data || !issueResponse.data.data.issue) {
      console.log(chalk.yellow(`   - Warning: Linear ticket ${linearTicketId} not found, skipping Linear update`));
      console.log(chalk.green.bold('\n✅ Agent finished successfully (GitHub PR created, Linear skipped)!'));
      return;
    }

    const issueId = issueResponse.data.data.issue.id;
    
    // Now add a comment to the issue
    const commentMutation = `
      mutation CreateComment($issueId: String!, $body: String!) {
        commentCreate(input: {
          issueId: $issueId
          body: $body
        }) {
          success
          comment {
            id
          }
        }
      }
    `;

    const commentBody = `🚀 **Draft PR Created**

${aiResults.summary}

**Pull Request:** ${pr.data.html_url}
**Status:** Draft PR #${pr.data.number}`;

    await axios.post('https://api.linear.app/graphql', {
      query: commentMutation,
      variables: {
        issueId: issueId,
        body: commentBody
      }
    }, {
      headers: {
        'Authorization': `${process.env.LINEAR_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(chalk.green('   - Linear ticket updated with PR comment.'));

    console.log(chalk.green.bold('\n✅ Agent finished successfully!'));

  } catch (error) {
    // If any step fails, catch the error and print a clear message.
    console.error(chalk.red.bold('\n❌ Agent failed:'), error.message);
    
    // If it's an axios error, show more details
    if (error.response) {
      console.error(chalk.red('Response status:'), error.response.status);
      console.error(chalk.red('Response data:'), JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1); // Exit with a non-zero code to indicate failure.
  }
}

// --- Execute the main function when the script is run ---
runDraftAgent();