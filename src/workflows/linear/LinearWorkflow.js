const BaseWorkflow = require('../BaseWorkflow');
const axios = require('axios');
const chalk = require('chalk');

/**
 * Linear Workflow - Handles Linear ticket updates and management
 */
class LinearWorkflow extends BaseWorkflow {
    constructor(config) {
        super(config, 'linear');
        this.apiKey = process.env.LINEAR_API_KEY || config.get('linear.apiKey');
        this.apiUrl = 'https://api.linear.app/graphql';
    }

    /**
     * Execute Linear workflow operations
     * @param {Object} context - Current execution context
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} Linear workflow results
     */
    async execute(context, options = {}) {
        if (!this.isEnabled()) {
            this.log('Linear workflow is disabled, skipping...');
            return { skipped: true };
        }

        if (!context.linear?.ticketId) {
            throw new Error('No Linear ticket ID found in context');
        }

        try {
            // Get the issue details
            const issue = await this.getIssueByIdentifier(context.linear.ticketId);
            
            // Create comment content based on GitHub results
            const commentBody = this.generateCommentBody(context);
            
            // Add comment to the issue
            await this.addCommentToIssue(issue.id, commentBody);

            this.log(`Linear ticket ${context.linear.ticketId} updated successfully`, 'info');

            return {
                ticketId: context.linear.ticketId,
                issueId: issue.id,
                commentAdded: true,
                issue: issue
            };

        } catch (error) {
            this.log(`Linear workflow failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get Linear issue by identifier (e.g., TIX-123)
     * @param {string} identifier - Linear issue identifier
     * @returns {Promise<Object>} Issue data
     */
    async getIssueByIdentifier(identifier) {
        console.log(chalk.blue(`   - Looking up Linear ticket ${identifier}...`));

        const query = `
            query {
                issues(first: 50) {
                    nodes {
                        id
                        identifier
                        title
                        state {
                            name
                        }
                    }
                }
            }
        `;

        const response = await this.makeGraphQLRequest(query);
        const issues = response.data.issues.nodes;
        const issue = issues.find(issue => issue.identifier === identifier);
        
        if (!issue) {
            throw new Error(`Could not find Linear issue with identifier ${identifier}`);
        }

        return issue;
    }

    /**
     * Add a comment to a Linear issue
     * @param {string} issueId - Linear issue ID
     * @param {string} body - Comment body
     * @returns {Promise<Object>} Comment creation result
     */
    async addCommentToIssue(issueId, body) {
        console.log(chalk.blue(`   - Adding comment to Linear ticket...`));

        const mutation = `
            mutation($input: CommentCreateInput!) {
                commentCreate(input: $input) {
                    success
                    comment {
                        id
                    }
                }
            }
        `;

        const variables = {
            input: {
                issueId: issueId,
                body: body
            }
        };

        const response = await this.makeGraphQLRequest(mutation, variables);
        
        if (!response.data.commentCreate.success) {
            throw new Error('Failed to create comment in Linear');
        }

        console.log(chalk.green('   - Linear ticket updated with Agent Action.'));
        return response.data.commentCreate.comment;
    }

    /**
     * Generate comment body based on context
     * @param {Object} context - Current execution context
     * @returns {string} Generated comment body
     */
    generateCommentBody(context) {
        const githubResult = context.github;
        const aiResult = context.ai;
        
        if (!githubResult) {
            return `🚀 **CodeScribe Agent Executed**\n\nAgent completed successfully but no GitHub PR information available.`;
        }

        const isUpdate = githubResult.isUpdate;
        const prNumber = githubResult.pr?.number;
        const prUrl = githubResult.pr?.html_url;
        const prTitle = githubResult.pr?.title;

        let commentBody = `🚀 **Pull Request ${isUpdate ? 'Updated' : 'Created'}**\n\n`;
        
        if (aiResult?.summary) {
            commentBody += `${aiResult.summary}\n\n`;
        }

        commentBody += `**PR Details:**\n`;
        commentBody += `- Status: ${isUpdate ? 'Updated' : 'Draft'} PR #${prNumber}\n`;
        
        if (prUrl) {
            commentBody += `- URL: ${prUrl}\n`;
        }
        
        if (prTitle) {
            commentBody += `- Title: ${prTitle}\n`;
        }
        
        if (isUpdate) {
            commentBody += `- ✨ Updated with latest code changes and AI analysis`;
        }

        return commentBody;
    }

    /**
     * Make a GraphQL request to Linear API
     * @param {string} query - GraphQL query or mutation
     * @param {Object} variables - GraphQL variables
     * @returns {Promise<Object>} API response
     */
    async makeGraphQLRequest(query, variables = {}) {
        try {
            const response = await axios.post(this.apiUrl, {
                query,
                variables
            }, {
                headers: {
                    'Authorization': this.apiKey,
                    'Content-Type': 'application/json',
                }
            });

            if (response.data.errors) {
                throw new Error(`Linear API error: ${JSON.stringify(response.data.errors)}`);
            }

            return response.data;

        } catch (error) {
            if (error.response) {
                throw new Error(`Linear API request failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Check if Linear workflow can execute
     * @param {Object} context - Current execution context
     * @returns {boolean} Whether workflow can execute
     */
    canExecute(context) {
        return !!(this.apiKey && context.linear?.ticketId);
    }
}

module.exports = LinearWorkflow;