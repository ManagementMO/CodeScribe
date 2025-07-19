// daily-summary.js - Scheduled Daily Task Summary Agent

require('dotenv').config();
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const chalk = require('chalk');

// Initialize AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Fetches all open issues assigned to a specific user
 */
async function fetchUserTasks(userId, userName) {
    console.log(chalk.blue(`   - Fetching tasks for ${userName}...`));

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

    const response = await axios.post('https://api.linear.app/graphql', {
        query: issuesQuery,
        variables: { assigneeId: userId }
    }, {
        headers: {
            'Authorization': `${process.env.LINEAR_API_KEY}`,
            'Content-Type': 'application/json',
        }
    });

    return response.data.data.issues.nodes;
}

/**
 * Generates a friendly morning summary using AI
 */
async function generateMorningSummary(issues, userName) {
    if (issues.length === 0) {
        return `### 🌅 Good Morning, ${userName}! ☀️

**🎉 You're all caught up!** 

No open tasks assigned to you today. Time to tackle some new challenges or help out your teammates! 

**Suggestions:**
- Review open PRs
- Help with team tasks
- Plan upcoming features
- Take a well-deserved break! 🎯`;
    }

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

    return `### 🌅 Good Morning, ${userName}! ☀️

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

/**
 * Posts a comment to a Linear issue
 */
async function postComment(issueId, commentBody) {
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

    await axios.post('https://api.linear.app/graphql', {
        query: commentMutation,
        variables: {
            issueId,
            body: commentBody,
        }
    }, {
        headers: {
            'Authorization': `${process.env.LINEAR_API_KEY}`,
            'Content-Type': 'application/json',
        }
    });
}

/**
 * Main function to send daily summaries to all team members
 */
async function sendDailySummaries() {
    console.log(chalk.cyan.bold('🌅 Starting Daily Task Summary Agent...'));

    try {
        // Get all team members
        const usersQuery = `
            query {
                users(first: 100) {
                    nodes {
                        id
                        name
                        email
                        active
                    }
                }
            }
        `;

        const usersResponse = await axios.post('https://api.linear.app/graphql', {
            query: usersQuery
        }, {
            headers: {
                'Authorization': `${process.env.LINEAR_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        const users = usersResponse.data.data.users.nodes.filter(user => user.active);
        console.log(chalk.blue(`   - Found ${users.length} active team members`));

        // Get a general team issue to post summaries to (or create one)
        const teamIssuesQuery = `
            query {
                issues(first: 10, filter: { title: { contains: "Daily Standup" } }) {
                    nodes {
                        id
                        title
                    }
                }
            }
        `;

        const teamIssuesResponse = await axios.post('https://api.linear.app/graphql', {
            query: teamIssuesQuery
        }, {
            headers: {
                'Authorization': `${process.env.LINEAR_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        let teamIssueId = null;
        if (teamIssuesResponse.data.data.issues.nodes.length > 0) {
            teamIssueId = teamIssuesResponse.data.data.issues.nodes[0].id;
        } else {
            // Create a daily standup issue if none exists
            const createIssueMutation = `
                mutation CreateIssue($input: IssueCreateInput!) {
                    issueCreate(input: $input) {
                        success
                        issue {
                            id
                            title
                        }
                    }
                }
            `;

            const createResponse = await axios.post('https://api.linear.app/graphql', {
                query: createIssueMutation,
                variables: {
                    input: {
                        title: "Daily Standup - Team Updates",
                        description: "Daily task summaries and team updates will be posted here automatically.",
                        teamId: process.env.LINEAR_TEAM_ID // You'll need to add this to your .env
                    }
                }
            }, {
                headers: {
                    'Authorization': `${process.env.LINEAR_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            });

            if (createResponse.data.data.issueCreate.success) {
                teamIssueId = createResponse.data.data.issueCreate.issue.id;
            }
        }

        if (!teamIssueId) {
            console.log(chalk.yellow('   - Warning: Could not find or create team issue for summaries'));
            return;
        }

        // Generate and post summaries for each user
        for (const user of users) {
            try {
                console.log(chalk.blue(`   - Processing ${user.name}...`));
                
                const issues = await fetchUserTasks(user.id, user.name);
                const summary = await generateMorningSummary(issues, user.name);
                
                // Post the summary as a comment
                await postComment(teamIssueId, summary);
                
                console.log(chalk.green(`   - ✅ Summary posted for ${user.name} (${issues.length} tasks)`));
                
                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(chalk.red(`   - ❌ Failed to process ${user.name}:`), error.message);
            }
        }

        console.log(chalk.green.bold('\n✅ Daily summaries completed successfully!'));

    } catch (error) {
        console.error(chalk.red.bold('\n❌ Daily summary failed:'), error.message);
        if (error.response) {
            console.error(chalk.red('Response status:'), error.response.status);
            console.error(chalk.red('Response data:'), JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Export for use in other files
module.exports = { sendDailySummaries };

// If run directly, execute the daily summary
if (require.main === module) {
    sendDailySummaries();
} 