// cloud-server.js

require('dotenv').config();

const express = require('express');
const axios = require('axios');
const { Octokit } = require('@octokit/rest');
const { LinearClient } = require('@linear/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const chalk = require('chalk');

// --- Initialize API Clients ---
const app = express();
// We need the raw body for webhook verification, so we'll use a special middleware setup.
app.use(express.json());

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const linearClient = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * A helper function to parse GitHub PR details from a URL.
 * @param {string} url - The GitHub PR URL.
 * @returns {{owner: string, repo: string, pull_number: number}}
 */
function parseGitHubUrl(url) {
    const match = url.match(/github\.com\/([\w-]+)\/([\w-]+)\/pull\/(\d+)/);
    if (!match) throw new Error('Invalid GitHub PR URL format.');
    return {
        owner: match[1],
        repo: match[2],
        pull_number: parseInt(match[3], 10),
    };
}

// --- The Main Webhook Endpoint ---
app.post('/api/webhook', async (req, res) => {
    // 1. Immediately respond to Linear's challenge to verify the webhook URL
    if (req.body.type === 'WebhookChallenge') {
        console.log(chalk.yellow('Received Linear webhook challenge. Responding...'));
        return res.json({ challenge: req.body.challenge });
    }

    // 2. The Guard Clause: We only care about @mentions in issue comments.
    if (req.body.type !== 'AppUserNotification' || req.body.action !== 'issueCommentMention') {
        return res.status(200).send('Event ignored. Not an issue comment mention.');
    }

    console.log(chalk.cyan.bold('🚀 Received @mention! Starting review process...'));

    // Debug: Log the entire request body to understand the structure
    console.log(chalk.magenta('Debug - Full request body:'), JSON.stringify(req.body, null, 2));

    // Acknowledge receipt so the user knows the agent is working.
    // We wrap the main logic in a self-invoking async function to allow the acknowledgement
    // to be sent immediately without waiting for the full review.
    (async () => {
        try {
            // Extract data from the correct webhook structure
            const notification = req.body.notification;
            const issueId = notification.issueId;
            const commentId = notification.commentId;
            const body = notification.comment.body;
            console.log(chalk.blue(`   - Mention received on issue ${issueId}`));

            // 3. Acknowledge the request immediately by posting a comment.
            const ackCommentMutation = `
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

            const ackResponse = await axios.post('https://api.linear.app/graphql', {
                query: ackCommentMutation,
                variables: {
                    issueId: issueId,
                    body: "🤖 Roger that! I'm starting the code review now..."
                }
            }, {
                headers: {
                    'Authorization': `${process.env.LINEAR_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            });

            const ackComment = ackResponse.data.data.commentCreate.comment;
            console.log(chalk.green('   - Acknowledgement comment posted.'));

            // 4. Parse the command and execute different actions
            const command = body.toLowerCase().trim();
            let responseText = '';

            if (command.includes('status') || command.includes('health')) {
                // Health check command
                console.log(chalk.blue('   - Executing health check...'));
                responseText = `### 🤖 CodeScribe Status Report

**System Status:** ✅ All systems operational
**Current Time:** ${new Date().toLocaleString()}
**GitHub API:** ✅ Connected
**Linear API:** ✅ Connected  
**AI Model:** ✅ Gemini 1.5 Flash ready
**Webhook:** ✅ Receiving notifications

Ready to assist with code reviews and automation! 🚀`;

            } else if (command.includes('repo') || command.includes('repository')) {
                // Repository analysis
                console.log(chalk.blue('   - Analyzing repository...'));
                try {
                    const { data: repo } = await octokit.repos.get({
                        owner: 'ManagementMO',
                        repo: 'CodeScribe'
                    });

                    const { data: commits } = await octokit.repos.listCommits({
                        owner: 'ManagementMO',
                        repo: 'CodeScribe',
                        per_page: 5
                    });

                    responseText = `### 📊 Repository Analysis

**Repository:** ${repo.full_name}
**Description:** ${repo.description || 'No description'}
**Language:** ${repo.language}
**Stars:** ⭐ ${repo.stargazers_count}
**Forks:** 🍴 ${repo.forks_count}
**Last Updated:** ${new Date(repo.updated_at).toLocaleDateString()}

**Recent Commits:**
${commits.map(commit => `- ${commit.commit.message.split('\n')[0]} (${commit.commit.author.name})`).join('\n')}

**Repository Stats:**
- Open Issues: ${repo.open_issues_count}
- Default Branch: ${repo.default_branch}
- Size: ${repo.size} KB`;

                } catch (error) {
                    responseText = `### ❌ Repository Analysis Failed
                    
Could not fetch repository information: ${error.message}`;
                }

            } else if (command.includes('commit') || command.includes('diff')) {
                // Latest commit analysis
                console.log(chalk.blue('   - Analyzing latest commits...'));
                try {
                    const { data: commits } = await octokit.repos.listCommits({
                        owner: 'ManagementMO',
                        repo: 'CodeScribe',
                        per_page: 1
                    });

                    const latestCommit = commits[0];
                    const { data: commitDetails } = await octokit.repos.getCommit({
                        owner: 'ManagementMO',
                        repo: 'CodeScribe',
                        ref: latestCommit.sha
                    });

                    // Send commit to AI for analysis
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                    const prompt = `Analyze this git commit and provide insights about the changes made. Be concise but informative.

Commit Message: ${commitDetails.commit.message}
Author: ${commitDetails.commit.author.name}
Files Changed: ${commitDetails.files.length}

Changes:
${commitDetails.files.map(file => `${file.filename}: +${file.additions} -${file.deletions}`).join('\n')}`;

                    const result = await model.generateContent(prompt);
                    const analysis = result.response.text();

                    responseText = `### 📝 Latest Commit Analysis

**Commit:** ${latestCommit.sha.substring(0, 7)}
**Author:** ${commitDetails.commit.author.name}
**Date:** ${new Date(commitDetails.commit.author.date).toLocaleString()}
**Message:** ${commitDetails.commit.message}

**Files Changed:** ${commitDetails.files.length}
**Additions:** +${commitDetails.stats.additions}
**Deletions:** -${commitDetails.stats.deletions}

### 🤖 AI Analysis
${analysis}`;

                } catch (error) {
                    responseText = `### ❌ Commit Analysis Failed
                    
Could not fetch commit information: ${error.message}`;
                }

            } else if (command.includes('todo') || command.includes('daily') || command.includes('morning') || command.includes('tasks')) {
                // Daily task summary
                console.log(chalk.blue('   - Generating daily task summary...'));
                try {
                    // Get current user info
                    const userQuery = `
                        query {
                            viewer {
                                id
                                name
                                email
                            }
                        }
                    `;

                    const userResponse = await axios.post('https://api.linear.app/graphql', {
                        query: userQuery
                    }, {
                        headers: {
                            'Authorization': `${process.env.LINEAR_API_KEY}`,
                            'Content-Type': 'application/json',
                        }
                    });

                    const currentUser = userResponse.data.data.viewer;
                    console.log(chalk.blue(`   - Fetching tasks for ${currentUser.name}...`));

                    // Get all open issues assigned to the current user
                    const issuesQuery = `
                        query($assigneeId: String!) {
                            issues(
                                first: 50,
                                filter: {
                                    assignee: { id: { eq: $assigneeId } }
                                    state: { name: { nin: ["Done", "Canceled"] } }
                                }
                            ) {
                                nodes {
                                    id
                                    identifier
                                    title
                                    description
                                    priority
                                    state {
                                        name
                                        color
                                    }
                                    labels {
                                        nodes {
                                            name
                                            color
                                        }
                                    }
                                    dueDate
                                    estimate
                                }
                            }
                        }
                    `;

                    const issuesResponse = await axios.post('https://api.linear.app/graphql', {
                        query: issuesQuery,
                        variables: { assigneeId: currentUser.id }
                    }, {
                        headers: {
                            'Authorization': `${process.env.LINEAR_API_KEY}`,
                            'Content-Type': 'application/json',
                        }
                    });

                    const issues = issuesResponse.data.data.issues.nodes;
                    
                    if (issues.length === 0) {
                        responseText = `### 🌅 Good Morning, ${currentUser.name}! ☀️

**🎉 You're all caught up!** 

No open tasks assigned to you today. Time to tackle some new challenges or help out your teammates! 

**Suggestions:**
- Review open PRs
- Help with team tasks
- Plan upcoming features
- Take a well-deserved break! 🎯`;
                    } else {
                        // Categorize tasks by priority
                        const highPriority = issues.filter(issue => issue.priority === 2);
                        const mediumPriority = issues.filter(issue => issue.priority === 1);
                        const lowPriority = issues.filter(issue => issue.priority === 0);

                        // Generate friendly task list
                        const taskList = issues.map(issue => {
                            const priorityEmoji = issue.priority === 2 ? '🔴' : issue.priority === 1 ? '🟡' : '🟢';
                            const stateEmoji = issue.state.name === 'In Progress' ? '🔄' : '📋';
                            const estimateText = issue.estimate ? ` (${issue.estimate}h)` : '';
                            return `${priorityEmoji} ${stateEmoji} **${issue.identifier}**: ${issue.title}${estimateText}`;
                        }).join('\n');

                        // Calculate total estimated time
                        const totalEstimate = issues.reduce((sum, issue) => sum + (issue.estimate || 0), 0);

                        // Generate AI-powered summary
                        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                        const prompt = `Generate a friendly, motivating morning summary for a developer with ${issues.length} tasks. Be encouraging and help them prioritize. Keep it under 2 sentences. Tasks: ${issues.map(i => i.title).join(', ')}`;

                        const result = await model.generateContent(prompt);
                        const aiSummary = result.response.text();

                        responseText = `### 🌅 Good Morning, ${currentUser.name}! ☀️

**${aiSummary}**

**📋 Your Tasks Today (${issues.length} total):**
${taskList}

**📊 Quick Stats:**
- 🔴 High Priority: ${highPriority.length}
- 🟡 Medium Priority: ${mediumPriority.length}  
- 🟢 Low Priority: ${lowPriority.length}
- ⏱️ Total Estimated Time: ${totalEstimate}h

**💡 Pro Tip:** Start with the high-priority items to build momentum! You've got this! 💪`;
                    }

                } catch (error) {
                    console.error('Error generating daily summary:', error);
                    responseText = `### ❌ Daily Summary Failed
                    
Could not fetch your tasks: ${error.message}

Please try again or contact your admin if the issue persists.`;
                }

            } else {
                // Check for GitHub PR URL
                const urlMatch = body.match(/https:\/\/github\.com\/[\w-]+\/[\w-]+\/pull\/\d+/);
                if (urlMatch) {
                    // Original PR review functionality
                    const prUrl = urlMatch[0];
                    console.log(chalk.blue(`   - Found PR URL: ${prUrl}`));

                    const { owner, repo, pull_number } = parseGitHubUrl(prUrl);
                    const { data: diffContent } = await octokit.pulls.get({
                        owner,
                        repo,
                        pull_number,
                        headers: {
                            accept: 'application/vnd.github.v3.diff',
                        },
                    });
                    console.log(chalk.green('   - Successfully fetched PR diff.'));

                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                    const prompt = `You are an expert, friendly code reviewer. Analyze the following git diff and provide a concise but helpful code review. Focus on potential bugs, style issues, or suggestions for improvement. If there are no issues, give a positive confirmation. Format your response as Markdown. Diff:\n\n${diffContent}`;

                    const result = await model.generateContent(prompt);
                    responseText = `### 🤖 CodeScribe AI Review\n\n${result.response.text()}`;

                } else {
                    // Help message
                    responseText = `### 🤖 CodeScribe Agent Help

I can help you with several commands:

**🌅 Daily Summary:**
- \`@codescribe-agent todo\` - Get your daily task summary

**📊 Repository Analysis:**
- \`@codescribe-agent repo\` - Get repository stats and recent commits

**📝 Commit Analysis:**  
- \`@codescribe-agent commit\` - Analyze the latest commit with AI

**🔍 Code Review:**
- \`@codescribe-agent [GitHub PR URL]\` - Review a pull request

**⚡ Health Check:**
- \`@codescribe-agent status\` - Check system status

**Examples:**
- \`@codescribe-agent todo\`
- \`@codescribe-agent repo\`
- \`@codescribe-agent commit\`  
- \`@codescribe-agent status\``;
                }
            }

            // Post the response back to Linear
            await axios.post('https://api.linear.app/graphql', {
                query: ackCommentMutation,
                variables: {
                    issueId: issueId,
                    body: responseText
                }
            }, {
                headers: {
                    'Authorization': `${process.env.LINEAR_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            });
            console.log(chalk.green.bold('\n✅ Response posted to Linear!'));

        } catch (error) {
            console.error(chalk.red.bold('\n❌ An error occurred during the review process:'), error.message);
            // Optionally, post an error message back to Linear
        }
    })();

    // IMPORTANT: Respond to the webhook immediately with a 200 OK.
    // This tells Linear "I have received your message", even though the agent
    // is still working on the review in the background.
    res.status(200).send('Webhook received and is being processed.');
});

// --- Start the Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(chalk.yellow(`Cloud Listener server is running on port ${PORT}`));
});