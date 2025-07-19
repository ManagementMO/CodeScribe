const BaseWorkflow = require('../BaseWorkflow');
const { Octokit } = require('@octokit/rest');
const chalk = require('chalk');

/**
 * GitHub Workflow - Handles GitHub-related operations like PR creation and management
 */
class GitHubWorkflow extends BaseWorkflow {
    constructor(config) {
        super(config, 'github');
        this.octokit = new Octokit({ 
            auth: process.env.GITHUB_TOKEN || config.get('github.token')
        });
    }

    /**
     * Execute GitHub workflow operations
     * @param {Object} context - Current execution context
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} GitHub workflow results
     */
    async execute(context, options = {}) {
        if (!this.isEnabled()) {
            this.log('GitHub workflow is disabled, skipping...');
            return { skipped: true };
        }

        try {
            // Parse repository information from git context
            const { owner, repo } = this.parseRepoInfo(context.git.remoteUrl);
            
            // Check for existing PR or create new one
            const prResult = await this.handlePullRequest(
                owner, 
                repo, 
                context.git.branch, 
                context.ai || await this.generatePRContent(context)
            );

            this.log(`PR operation completed: ${prResult.html_url}`, 'info');

            return {
                pr: prResult,
                owner,
                repo,
                isUpdate: prResult.isUpdate || false
            };

        } catch (error) {
            this.log(`GitHub workflow failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Parse GitHub owner and repo from remote URL
     * @param {string} remoteUrl - Git remote URL
     * @returns {Object} Owner and repo information
     */
    parseRepoInfo(remoteUrl) {
        const repoInfoMatch = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
        if (!repoInfoMatch) {
            throw new Error('Could not parse GitHub owner and repo from remote URL.');
        }
        
        return {
            owner: repoInfoMatch[1],
            repo: repoInfoMatch[2]
        };
    }

    /**
     * Handle PR creation or update
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} branchName - Branch name
     * @param {Object} prContent - PR content (title, body)
     * @returns {Promise<Object>} PR operation result
     */
    async handlePullRequest(owner, repo, branchName, prContent) {
        console.log(chalk.blue('   - Checking for existing pull request on GitHub...'));

        try {
            // Check if PR already exists for this branch
            const existingPRs = await this.octokit.pulls.list({
                owner,
                repo,
                head: `${owner}:${branchName}`,
                state: 'open'
            });

            if (existingPRs.data.length > 0) {
                return await this.updateExistingPR(existingPRs.data[0], prContent);
            } else {
                return await this.createNewPR(owner, repo, branchName, prContent);
            }

        } catch (createError) {
            if (createError.status === 422 && createError.message.includes('pull request already exists')) {
                // Fallback: try to find and update the existing PR
                console.log(chalk.yellow('   - Handling edge case: PR exists but not found in initial search...'));
                const existingPRs = await this.octokit.pulls.list({
                    owner,
                    repo,
                    head: `${owner}:${branchName}`,
                    state: 'open'
                });

                if (existingPRs.data.length > 0) {
                    return await this.updateExistingPR(existingPRs.data[0], prContent);
                }
            }
            throw createError;
        }
    }

    /**
     * Update an existing pull request
     * @param {Object} existingPR - Existing PR data
     * @param {Object} prContent - New PR content
     * @returns {Promise<Object>} Updated PR data
     */
    async updateExistingPR(existingPR, prContent) {
        const titleChanged = existingPR.title !== prContent.title;
        const bodyChanged = existingPR.body !== prContent.body;

        if (titleChanged || bodyChanged) {
            console.log(chalk.yellow(`   - Found existing PR #${existingPR.number}, updating with latest changes...`));
            if (titleChanged) console.log(chalk.yellow(`     • Title updated`));
            if (bodyChanged) console.log(chalk.yellow(`     • Description updated with latest code analysis`));
        } else {
            console.log(chalk.blue(`   - Found existing PR #${existingPR.number}, no changes needed to title/description`));
        }

        const updatedPR = await this.octokit.pulls.update({
            owner: existingPR.base.repo.owner.login,
            repo: existingPR.base.repo.name,
            pull_number: existingPR.number,
            title: prContent.title,
            body: prContent.body,
        });

        console.log(chalk.green(`   - Updated existing PR: ${updatedPR.data.html_url}`));
        updatedPR.data.isUpdate = true;
        return updatedPR.data;
    }

    /**
     * Create a new pull request
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} branchName - Branch name
     * @param {Object} prContent - PR content
     * @returns {Promise<Object>} New PR data
     */
    async createNewPR(owner, repo, branchName, prContent) {
        console.log(chalk.blue('   - No existing PR found, creating new draft PR...'));
        
        const newPR = await this.octokit.pulls.create({
            owner,
            repo,
            title: prContent.title,
            body: prContent.body,
            head: branchName,
            base: 'main',
            draft: true,
        });

        console.log(chalk.green(`   - Created new Draft PR: ${newPR.data.html_url}`));
        newPR.data.isUpdate = false;
        return newPR.data;
    }

    /**
     * Generate PR content from context (fallback when AI is not available)
     * @param {Object} context - Current execution context
     * @returns {Object} Generated PR content
     */
    async generatePRContent(context) {
        const ticketId = context.linear?.ticketId || 'UNKNOWN';
        
        return {
            title: `feat: ${ticketId} - Update implementation`,
            body: `## Changes\n\nThis PR addresses ticket ${ticketId}.\n\n### Diff Summary\n\`\`\`\n${context.git.diffStats}\n\`\`\`\n\n### Files Changed\n${context.git.diff.split('\n').filter(line => line.startsWith('diff --git')).map(line => line.replace('diff --git a/', '- ')).join('\n')}`,
            summary: `Updated implementation for ${ticketId} with code changes across multiple files.`
        };
    }

    /**
     * Check if GitHub workflow can execute
     * @param {Object} context - Current execution context
     * @returns {boolean} Whether workflow can execute
     */
    canExecute(context) {
        return !!(process.env.GITHUB_TOKEN || this.config.get('github.token')) &&
               context.git && 
               context.git.remoteUrl &&
               context.git.remoteUrl.includes('github.com');
    }
}

module.exports = GitHubWorkflow;