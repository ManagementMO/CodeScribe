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

        // --- 4. GitHub Action: Let me create or update the PR for you. ---
        console.log(chalk.blue('   - Checking for existing pull request on GitHub...'));
        const repoInfoMatch = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
        if (!repoInfoMatch) {
            throw new Error('Could not parse GitHub owner and repo from remote URL.');
        }
        const owner = repoInfoMatch[1];
        const repo = repoInfoMatch[2];

        // Check if PR already exists for this branch
        let pr;
        let isUpdate = false;
        try {
            const existingPRs = await octokit.pulls.list({
                owner,
                repo,
                head: `${owner}:${branchName}`,
                state: 'open'
            });

            if (existingPRs.data.length > 0) {
                const existingPR = existingPRs.data[0];
                isUpdate = true;

                // Check if title or body has changed
                const titleChanged = existingPR.title !== aiResults.title;
                const bodyChanged = existingPR.body !== aiResults.body;

                if (titleChanged || bodyChanged) {
                    console.log(chalk.yellow(`   - Found existing PR #${existingPR.number}, updating with latest changes...`));
                    if (titleChanged) console.log(chalk.yellow(`     • Title updated`));
                    if (bodyChanged) console.log(chalk.yellow(`     • Description updated with latest code analysis`));
                } else {
                    console.log(chalk.blue(`   - Found existing PR #${existingPR.number}, no changes needed to title/description`));
                }

                // Always update to ensure we have the latest commit references
                pr = await octokit.pulls.update({
                    owner,
                    repo,
                    pull_number: existingPR.number,
                    title: aiResults.title,
                    body: aiResults.body,
                });
                console.log(chalk.green(`   - Updated existing PR: ${pr.data.html_url}`));
            } else {
                // Create new PR
                console.log(chalk.blue('   - No existing PR found, creating new draft PR...'));
                pr = await octokit.pulls.create({
                    owner,
                    repo,
                    title: aiResults.title,
                    body: aiResults.body,
                    head: branchName,
                    base: 'main',
                    draft: true,
                });
                console.log(chalk.green(`   - Created new Draft PR: ${pr.data.html_url}`));
            }
        } catch (createError) {
            if (createError.status === 422 && createError.message.includes('pull request already exists')) {
                // Fallback: try to find and update the existing PR
                console.log(chalk.yellow('   - Handling edge case: PR exists but not found in initial search...'));
                const existingPRs = await octokit.pulls.list({
                    owner,
                    repo,
                    head: `${owner}:${branchName}`,
                    state: 'open'
                });

                if (existingPRs.data.length > 0) {
                    isUpdate = true;
                    pr = await octokit.pulls.update({
                        owner,
                        repo,
                        pull_number: existingPRs.data[0].number,
                        title: aiResults.title,
                        body: aiResults.body,
                    });
                    console.log(chalk.green(`   - Updated existing PR: ${pr.data.html_url}`));
                } else {
                    throw createError;
                }
            } else {
                throw createError;
            }
        }

        // --- 5. Linear Action: Let me update the team. ---
        console.log(chalk.blue(`   - Adding comment to Linear ticket ${linearTicketId}...`));

        // First, get the issue ID from the identifier
        const issueQuery = `
            query {
                issues(first: 50) {
                    nodes {
                        id
                        identifier
                        title
                    }
                }
            }
        `;

        const issueResponse = await axios.post('https://api.linear.app/graphql', {
            query: issueQuery
        }, {
            headers: {
                'Authorization': `${process.env.LINEAR_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        const issues = issueResponse.data.data.issues.nodes;
        const issue = issues.find(issue => issue.identifier === linearTicketId);
        if (!issue) {
            throw new Error(`Could not find Linear issue with identifier ${linearTicketId}`);
        }

        // Add a comment to the issue
        const commentMutation = `
            mutation($input: CommentCreateInput!) {
                commentCreate(input: $input) {
                    success
                    comment {
                        id
                    }
                }
            }
        `;

        const commentBody = `🚀 **Pull Request ${isUpdate ? 'Updated' : 'Created'}**

${aiResults.summary}

**PR Details:**
- Status: ${isUpdate ? 'Updated' : 'Draft'} PR #${pr.data.number}
- URL: ${pr.data.html_url}
- Title: ${aiResults.title}
${isUpdate ? '- ✨ Updated with latest code changes and AI analysis' : ''}`;

        await axios.post('https://api.linear.app/graphql', {
            query: commentMutation,
            variables: {
                input: {
                    issueId: issue.id,
                    body: commentBody
                }
            }
        }, {
            headers: {
                'Authorization': `${process.env.LINEAR_API_KEY}`,
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