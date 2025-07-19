// run-agent.js (Refactored for Agent API)

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
        // This is your improved diff command, which is great!
        const diffContent = execSync('git diff origin/main...HEAD').toString().trim();
        const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();

        if (!diffContent) {
            throw new Error('No new commits found on this branch compared to "origin/main". Please commit your changes.');
        }

        // --- 2. Ticket ID Extraction: What is this work for? ---
        console.log(chalk.blue(`   - Parsing branch name "${branchName}"...`));
        const ticketIdMatch = branchName.match(/([A-Z]+-\d+)/);
        if (!ticketIdMatch) {
            throw new Error(`Could not find a Linear ticket ID (e.g., TIX-123) in branch "${branchName}".`);
        }
        const linearTicketId = ticketIdMatch[0];
        console.log(chalk.green(`   - Found Linear Ticket: ${linearTicketId}`));

        // --- 3. AI Analysis: What should I say about this work? ---
        console.log(chalk.blue('   - Sending code changes to AI for analysis...'));
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Analyze the following git diff and generate a clean JSON object with three keys: "title" (a conventional commit-style PR title), "body" (a detailed PR description in Markdown format), and "summary" (a one-sentence summary for a project manager). Do not add any text before or after the JSON object. Diff:\n\n${diffContent}`;

        const result = await model.generateContent(prompt);
        const jsonString = result.response.text().replace(/```json\n|```/g, '').trim();
        const aiResults = JSON.parse(jsonString);
        console.log(chalk.green('   - AI analysis complete.'));

        // --- 4. GitHub Action: Let me create the PR for you. ---
        console.log(chalk.blue('   - Creating draft pull request on GitHub...'));
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
            head: branchName,
            base: 'main',
            draft: true,
        });
        console.log(chalk.green(`   - Created Draft PR: ${pr.data.html_url}`));

        // --- 5. Linear Agent Action: Let me update the team. (REFACTORED) ---
        console.log(chalk.blue(`   - Posting action to Linear ticket ${linearTicketId}...`));

        // The Agent API is a simple REST endpoint. We use the special LINEAR_AGENT_KEY.
        await axios.post('https://api.linear.app/oauth/agent/action', {
            issueId: linearTicketId, // Use the ticket identifier directly (e.g., "TIX-1")
            action: 'create',
            subject: 'Pull Request',
            url: pr.data.html_url,
            metadata: {
                status: `Draft PR #${pr.data.number}`,
                summary: aiResults.summary,
            }
        }, {
            headers: {
                // Ensure you are using the Agent Key from your .env file
                'Authorization': `Bearer ${process.env.LINEAR_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        console.log(chalk.green('   - Linear ticket updated with Agent Action.'));
        console.log(chalk.green.bold('\n✅ Agent finished successfully!'));

    } catch (error) {
        console.error(chalk.red.bold('\n❌ Agent failed:'), error.message);
        if (error.response) {
            console.error(chalk.red('Response status:'), error.response.status);
            console.error(chalk.red('Response data:'), JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

// --- Execute the main function when the script is run ---
runDraftAgent();