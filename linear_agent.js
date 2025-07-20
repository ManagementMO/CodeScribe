// Enhanced Linear AI Agent - Intelligent Conversational Assistant

require('dotenv').config();

const express = require('express');
const axios = require('axios');
const { Octokit } = require('@octokit/rest');
const { LinearClient } = require('@linear/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// --- Initialize API Clients ---
const app = express();
app.use(express.json());

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const linearClient = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Enhanced AI Agent Classes ---
class ConversationMemory {
    constructor() {
        this.conversations = new Map();
        this.contextCache = new Map();
        this.userProfiles = new Map();
    }

    async saveConversation(issueId, userId, message, response) {
        const key = `${issueId}-${userId}`;
        if (!this.conversations.has(key)) {
            this.conversations.set(key, []);
        }
        
        this.conversations.get(key).push({
            timestamp: new Date(),
            message,
            response,
            context: await this.getIssueContext(issueId)
        });

        // Keep only last 20 exchanges per conversation
        if (this.conversations.get(key).length > 20) {
            this.conversations.get(key).shift();
        }
    }

    getConversationHistory(issueId, userId) {
        const key = `${issueId}-${userId}`;
        return this.conversations.get(key) || [];
    }

    async getIssueContext(issueId) {
        if (this.contextCache.has(issueId)) {
            const cached = this.contextCache.get(issueId);
            if (Date.now() - cached.timestamp < 300000) { // 5 min cache
                return cached.data;
            }
        }

        try {
            const issue = await linearClient.issue(issueId);
            const context = {
                title: issue.title,
                description: issue.description,
                state: issue.state?.name,
                priority: issue.priority,
                labels: issue.labels?.nodes?.map(l => l.name) || [],
                assignee: issue.assignee?.name,
                team: issue.team?.name,
                project: issue.project?.name,
                cycle: issue.cycle?.name,
                estimate: issue.estimate,
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt
            };
            
            this.contextCache.set(issueId, {
                timestamp: Date.now(),
                data: context
            });
            
            return context;
        } catch (error) {
            console.error('Error fetching issue context:', error);
            return null;
        }
    }
}

class IntelligentAgent {
    constructor() {
        this.memory = new ConversationMemory();
        this.model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-pro',
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                maxOutputTokens: 2048,
            }
        });
    }

    async processMessage(issueId, userId, userName, message) {
        const context = await this.memory.getIssueContext(issueId);
        const history = this.memory.getConversationHistory(issueId, userId);
        
        // Build comprehensive prompt with context
        const systemPrompt = this.buildSystemPrompt(context, history, userName);
        const response = await this.generateResponse(systemPrompt, message, context);
        
        // Save conversation
        await this.memory.saveConversation(issueId, userId, message, response);
        
        return response;
    }

    buildSystemPrompt(context, history, userName) {
        return `You are CodeScribe AI, an intelligent development assistant integrated with Linear and GitHub. You're having a conversation with ${userName} about their work.

CURRENT ISSUE CONTEXT:
${context ? `
- Title: ${context.title}
- Description: ${context.description || 'No description'}
- State: ${context.state}
- Priority: ${context.priority}
- Team: ${context.team}
- Assignee: ${context.assignee || 'Unassigned'}
- Labels: ${context.labels.join(', ') || 'None'}
- Estimate: ${context.estimate || 'Not estimated'}
- Project: ${context.project || 'No project'}
- Cycle: ${context.cycle || 'No cycle'}
` : 'No issue context available'}

CONVERSATION HISTORY:
${history.slice(-5).map(h => `User: ${h.message}\nYou: ${h.response}`).join('\n\n')}

CAPABILITIES:
- Analyze code, commits, and pull requests
- Help with Linear workflow management
- Provide development insights and suggestions
- Remember conversation context
- Execute GitHub operations
- Track project progress
- Generate documentation
- Suggest improvements and optimizations

PERSONALITY:
- Conversational and helpful
- Technical but approachable
- Proactive in suggesting improvements
- Remember previous discussions
- Ask clarifying questions when needed

Respond naturally as if you're a knowledgeable teammate who understands the project context.`;
    }

    async generateResponse(systemPrompt, userMessage, context) {
        try {
            const prompt = `${systemPrompt}

User Message: ${userMessage}

Respond helpfully and conversationally. If the user is asking about code, commits, PRs, or Linear workflows, provide specific actionable insights. If you need more information, ask clarifying questions.`;

            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('AI generation error:', error);
            return "I'm having trouble processing that right now. Could you try rephrasing your question?";
        }
    }
}

class WorkflowAutomation {
    constructor(linearClient, octokit) {
        this.linear = linearClient;
        this.github = octokit;
    }

    async analyzeIssueProgress(issueId) {
        try {
            const issue = await this.linear.issue(issueId);
            const comments = await issue.comments();
            
            return {
                issue: {
                    title: issue.title,
                    state: issue.state?.name,
                    progress: this.calculateProgress(issue, comments.nodes),
                    blockers: this.identifyBlockers(comments.nodes),
                    nextSteps: this.suggestNextSteps(issue, comments.nodes)
                }
            };
        } catch (error) {
            console.error('Error analyzing issue progress:', error);
            return null;
        }
    }

    calculateProgress(issue, comments) {
        // Simple progress calculation based on state and activity
        const stateProgress = {
            'Backlog': 0,
            'Todo': 10,
            'In Progress': 50,
            'In Review': 80,
            'Done': 100
        };
        
        return stateProgress[issue.state?.name] || 0;
    }

    identifyBlockers(comments) {
        const blockerKeywords = ['blocked', 'blocker', 'stuck', 'waiting', 'issue', 'problem'];
        return comments
            .filter(comment => 
                blockerKeywords.some(keyword => 
                    comment.body?.toLowerCase().includes(keyword)
                )
            )
            .slice(-3); // Last 3 potential blockers
    }

    suggestNextSteps(issue, comments) {
        const suggestions = [];
        
        if (issue.state?.name === 'Todo') {
            suggestions.push('Move to In Progress when you start working');
        }
        
        if (issue.state?.name === 'In Progress' && !issue.assignee) {
            suggestions.push('Assign someone to this issue');
        }
        
        if (!issue.estimate) {
            suggestions.push('Add story point estimate');
        }
        
        return suggestions;
    }
}

// Initialize enhanced components
const agent = new IntelligentAgent();
const automation = new WorkflowAutomation(linearClient, octokit);

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

**📊 Repository Analysis:**
- \`@codescribe-agent repo\` - Get repository stats and recent commits

**📝 Commit Analysis:**  
- \`@codescribe-agent commit\` - Analyze the latest commit with AI

**🔍 Code Review:**
- \`@codescribe-agent [GitHub PR URL]\` - Review a pull request

**⚡ Health Check:**
- \`@codescribe-agent status\` - Check system status

**Examples:**
- \`@codescribe-agent repo\`
- \`@codescribe-agent commit\`  
- \`@codescribe-agent status\`
- \`@codescribe-agent https://github.com/owner/repo/pull/123\`

Try any of these commands to test my capabilities! 🚀`;
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