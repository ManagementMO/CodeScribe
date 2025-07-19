const BaseWorkflow = require('../BaseWorkflow');
const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * Commit Workflow - Handles intelligent commit creation with GitHub and Linear tracking
 */
class CommitWorkflow extends BaseWorkflow {
    constructor(config) {
        super(config, 'commit');
        this.critical = false; // Don't fail entire workflow if commit fails
    }

    /**
     * Execute commit workflow operations
     * @param {Object} context - Current execution context
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} Commit workflow results
     */
    async execute(context, options = {}) {
        if (!this.isEnabled()) {
            this.log('Commit workflow is disabled, skipping...');
            return { skipped: true };
        }

        try {
            // Check if there are any staged or unstaged changes
            const hasChanges = this.checkForChanges();
            if (!hasChanges && !options.force) {
                this.log('No changes detected to commit', 'info');
                return { skipped: true, reason: 'no_changes' };
            }

            // Generate intelligent commit message
            const commitMessage = await this.generateCommitMessage(context, options);
            
            // Stage changes if needed
            await this.stageChanges(options);
            
            // Create the commit
            const commitResult = await this.createCommit(commitMessage, options);
            
            // Push to remote if requested
            let pushResult = null;
            if (options.push !== false) {
                pushResult = await this.pushToRemote(context.git.branch);
            }

            // Update Linear ticket if available
            let linearUpdate = null;
            if (context.linear?.ticketId) {
                linearUpdate = await this.updateLinearTicket(context, commitResult);
            }

            this.log(`Commit created successfully: ${commitResult.hash}`, 'info');

            return {
                commit: commitResult,
                push: pushResult,
                linear: linearUpdate,
                message: commitMessage
            };

        } catch (error) {
            this.log(`Commit workflow failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Check if there are changes to commit
     * @returns {boolean} Whether there are changes
     */
    checkForChanges() {
        try {
            // Check for staged changes
            const stagedChanges = execSync('git diff --cached --name-only').toString().trim();
            
            // Check for unstaged changes
            const unstagedChanges = execSync('git diff --name-only').toString().trim();
            
            // Check for untracked files
            const untrackedFiles = execSync('git ls-files --others --exclude-standard').toString().trim();
            
            return !!(stagedChanges || unstagedChanges || untrackedFiles);
        } catch (error) {
            this.log(`Error checking for changes: ${error.message}`, 'warn');
            return false;
        }
    }

    /**
     * Generate intelligent commit message based on context and changes
     * @param {Object} context - Current execution context
     * @param {Object} options - Execution options
     * @returns {Promise<string>} Generated commit message
     */
    async generateCommitMessage(context, options) {
        // If user provided a custom message, use it
        if (options.message) {
            return this.formatCommitMessage(options.message, context);
        }

        // Generate message based on code analysis
        const changes = await this.analyzeChanges();
        const ticketId = context.linear?.ticketId;
        
        // Determine commit type based on changes
        const commitType = this.determineCommitType(changes);
        
        // Generate descriptive message
        let message = this.generateDescriptiveMessage(commitType, changes, ticketId);
        
        // Add conventional commit format if enabled
        if (this.getConfig().conventionalCommits !== false) {
            message = this.formatConventionalCommit(commitType, message, changes);
        }

        return message;
    }

    /**
     * Analyze current changes to understand what was modified
     * @returns {Promise<Object>} Change analysis
     */
    async analyzeChanges() {
        const analysis = {
            files: [],
            types: new Set(),
            scope: null,
            hasBreakingChanges: false,
            summary: ''
        };

        try {
            // Get staged and unstaged files
            const stagedFiles = execSync('git diff --cached --name-only').toString().trim().split('\n').filter(f => f);
            const unstagedFiles = execSync('git diff --name-only').toString().trim().split('\n').filter(f => f);
            const untrackedFiles = execSync('git ls-files --others --exclude-standard').toString().trim().split('\n').filter(f => f);
            
            const allFiles = [...new Set([...stagedFiles, ...unstagedFiles, ...untrackedFiles])];
            
            for (const file of allFiles) {
                if (!file) continue;
                
                const fileInfo = {
                    path: file,
                    extension: file.split('.').pop(),
                    isNew: untrackedFiles.includes(file),
                    isModified: stagedFiles.includes(file) || unstagedFiles.includes(file),
                    type: this.categorizeFile(file)
                };
                
                analysis.files.push(fileInfo);
                analysis.types.add(fileInfo.type);
            }

            // Determine scope from files
            analysis.scope = this.determineScope(analysis.files);
            
            // Check for breaking changes
            analysis.hasBreakingChanges = this.detectBreakingChanges(analysis.files);
            
            // Generate summary
            analysis.summary = this.generateChangeSummary(analysis);
            
        } catch (error) {
            this.log(`Error analyzing changes: ${error.message}`, 'warn');
        }

        return analysis;
    }

    /**
     * Categorize a file based on its path and extension
     * @param {string} filePath - Path to the file
     * @returns {string} File category
     */
    categorizeFile(filePath) {
        const path = filePath.toLowerCase();
        
        if (path.includes('test') || path.includes('spec')) return 'test';
        if (path.includes('doc') || path.includes('readme')) return 'docs';
        if (path.includes('config') || path.endsWith('.json') || path.endsWith('.yml') || path.endsWith('.yaml')) return 'config';
        if (path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.less')) return 'style';
        if (path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.tsx')) return 'code';
        if (path.includes('package.json') || path.includes('package-lock.json')) return 'deps';
        
        return 'other';
    }

    /**
     * Determine the scope of changes
     * @param {Array} files - Array of file objects
     * @returns {string|null} Determined scope
     */
    determineScope(files) {
        const directories = files.map(f => f.path.split('/')[0]).filter(d => d);
        const uniqueDirs = [...new Set(directories)];
        
        if (uniqueDirs.length === 1) {
            return uniqueDirs[0];
        }
        
        // Common scope patterns
        const commonScopes = ['api', 'ui', 'auth', 'db', 'config', 'test', 'docs'];
        for (const scope of commonScopes) {
            if (files.some(f => f.path.toLowerCase().includes(scope))) {
                return scope;
            }
        }
        
        return null;
    }

    /**
     * Detect if changes include breaking changes
     * @param {Array} files - Array of file objects
     * @returns {boolean} Whether breaking changes are detected
     */
    detectBreakingChanges(files) {
        // Simple heuristics for breaking changes
        const breakingPatterns = [
            'package.json', // Dependency changes
            'api/', // API changes
            'schema', // Database schema changes
            'migration' // Database migrations
        ];
        
        return files.some(f => 
            breakingPatterns.some(pattern => 
                f.path.toLowerCase().includes(pattern)
            )
        );
    }

    /**
     * Generate a summary of changes
     * @param {Object} analysis - Change analysis
     * @returns {string} Change summary
     */
    generateChangeSummary(analysis) {
        const fileCount = analysis.files.length;
        const types = Array.from(analysis.types);
        
        if (fileCount === 1) {
            return `Update ${analysis.files[0].path}`;
        }
        
        if (types.length === 1) {
            const type = types[0];
            return `Update ${fileCount} ${type} file${fileCount > 1 ? 's' : ''}`;
        }
        
        return `Update ${fileCount} files (${types.join(', ')})`;
    }

    /**
     * Determine commit type based on changes
     * @param {Object} changes - Change analysis
     * @returns {string} Commit type
     */
    determineCommitType(changes) {
        const types = Array.from(changes.types);
        
        if (types.includes('test')) return 'test';
        if (types.includes('docs')) return 'docs';
        if (types.includes('config')) return 'chore';
        if (types.includes('style')) return 'style';
        if (types.includes('deps')) return 'chore';
        
        // Check for new files vs modifications
        const hasNewFiles = changes.files.some(f => f.isNew);
        const hasModifications = changes.files.some(f => f.isModified);
        
        if (hasNewFiles && !hasModifications) return 'feat';
        if (hasModifications && !hasNewFiles) return 'fix';
        
        return 'feat'; // Default to feature
    }

    /**
     * Generate descriptive commit message
     * @param {string} type - Commit type
     * @param {Object} changes - Change analysis
     * @param {string} ticketId - Linear ticket ID
     * @returns {string} Descriptive message
     */
    generateDescriptiveMessage(type, changes, ticketId) {
        let message = changes.summary;
        
        // Add ticket reference if available
        if (ticketId) {
            message = `${ticketId}: ${message}`;
        }
        
        return message;
    }

    /**
     * Format commit message with conventional commit format
     * @param {string} type - Commit type
     * @param {string} message - Base message
     * @param {Object} changes - Change analysis
     * @returns {string} Formatted conventional commit message
     */
    formatConventionalCommit(type, message, changes) {
        let formatted = `${type}`;
        
        if (changes.scope) {
            formatted += `(${changes.scope})`;
        }
        
        if (changes.hasBreakingChanges) {
            formatted += '!';
        }
        
        formatted += `: ${message}`;
        
        return formatted;
    }

    /**
     * Format commit message with additional context
     * @param {string} message - Base message
     * @param {Object} context - Current execution context
     * @returns {string} Formatted message
     */
    formatCommitMessage(message, context) {
        // Add ticket reference if not already present
        if (context.linear?.ticketId && !message.includes(context.linear.ticketId)) {
            message = `${context.linear.ticketId}: ${message}`;
        }
        
        return message;
    }

    /**
     * Stage changes for commit
     * @param {Object} options - Execution options
     */
    async stageChanges(options) {
        try {
            if (options.addAll || options.all) {
                // Stage all changes including new files
                this.log('Staging all changes...', 'info');
                execSync('git add -A');
            } else if (options.addModified) {
                // Stage only modified files
                this.log('Staging modified files...', 'info');
                execSync('git add -u');
            } else {
                // Check if there are already staged changes
                const stagedChanges = execSync('git diff --cached --name-only').toString().trim();
                if (!stagedChanges) {
                    // No staged changes, stage all by default
                    this.log('No staged changes found, staging all changes...', 'info');
                    execSync('git add -A');
                }
            }
        } catch (error) {
            throw new Error(`Failed to stage changes: ${error.message}`);
        }
    }

    /**
     * Create the commit
     * @param {string} message - Commit message
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} Commit result
     */
    async createCommit(message, options) {
        try {
            this.log(`Creating commit with message: "${message}"`, 'info');
            
            // Create the commit
            execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
            
            // Get commit hash and details
            const hash = execSync('git rev-parse HEAD').toString().trim();
            const shortHash = execSync('git rev-parse --short HEAD').toString().trim();
            const author = execSync('git log -1 --format="%an <%ae>"').toString().trim();
            const timestamp = execSync('git log -1 --format="%ci"').toString().trim();
            
            return {
                hash,
                shortHash,
                message,
                author,
                timestamp
            };
            
        } catch (error) {
            throw new Error(`Failed to create commit: ${error.message}`);
        }
    }

    /**
     * Push commit to remote repository
     * @param {string} branchName - Current branch name
     * @returns {Promise<Object>} Push result
     */
    async pushToRemote(branchName) {
        try {
            this.log(`Pushing to remote branch: ${branchName}`, 'info');
            
            // Push to remote
            execSync(`git push origin ${branchName}`, { stdio: 'pipe' });
            
            this.log('Successfully pushed to remote', 'info');
            
            return {
                success: true,
                branch: branchName,
                remote: 'origin'
            };
            
        } catch (error) {
            // Try to set upstream if branch doesn't exist on remote
            try {
                this.log('Branch not on remote, setting upstream...', 'info');
                execSync(`git push -u origin ${branchName}`, { stdio: 'pipe' });
                
                return {
                    success: true,
                    branch: branchName,
                    remote: 'origin',
                    setUpstream: true
                };
                
            } catch (upstreamError) {
                this.log(`Failed to push to remote: ${error.message}`, 'warn');
                return {
                    success: false,
                    error: error.message,
                    branch: branchName
                };
            }
        }
    }

    /**
     * Update Linear ticket with commit information
     * @param {Object} context - Current execution context
     * @param {Object} commitResult - Commit result
     * @returns {Promise<Object>} Linear update result
     */
    async updateLinearTicket(context, commitResult) {
        try {
            // Import LinearWorkflow to reuse its functionality
            const LinearWorkflow = require('../linear/LinearWorkflow');
            const linearWorkflow = new LinearWorkflow(this.config);
            
            if (!linearWorkflow.canExecute(context)) {
                return { skipped: true, reason: 'linear_not_configured' };
            }

            // Get the issue details
            const issue = await linearWorkflow.getIssueByIdentifier(context.linear.ticketId);
            
            // Create commit comment
            const commentBody = this.generateLinearCommitComment(commitResult, context);
            
            // Add comment to the issue
            await linearWorkflow.addCommentToIssue(issue.id, commentBody);

            this.log(`Linear ticket ${context.linear.ticketId} updated with commit info`, 'info');

            return {
                success: true,
                ticketId: context.linear.ticketId,
                issueId: issue.id,
                commentAdded: true
            };

        } catch (error) {
            this.log(`Failed to update Linear ticket: ${error.message}`, 'warn');
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate Linear comment for commit
     * @param {Object} commitResult - Commit result
     * @param {Object} context - Current execution context
     * @returns {string} Generated comment
     */
    generateLinearCommitComment(commitResult, context) {
        let comment = `💾 **New Commit**\n\n`;
        comment += `**Commit:** \`${commitResult.shortHash}\`\n`;
        comment += `**Message:** ${commitResult.message}\n`;
        comment += `**Branch:** ${context.git.branch}\n`;
        
        if (context.git.remoteUrl) {
            const { owner, repo } = this.parseRepoInfo(context.git.remoteUrl);
            const commitUrl = `https://github.com/${owner}/${repo}/commit/${commitResult.hash}`;
            comment += `**GitHub:** [View Commit](${commitUrl})\n`;
        }
        
        comment += `\n*Committed by CodeScribe Agent*`;
        
        return comment;
    }

    /**
     * Parse GitHub owner and repo from remote URL
     * @param {string} remoteUrl - Git remote URL
     * @returns {Object} Owner and repo information
     */
    parseRepoInfo(remoteUrl) {
        const repoInfoMatch = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
        if (!repoInfoMatch) {
            return { owner: 'unknown', repo: 'unknown' };
        }
        
        return {
            owner: repoInfoMatch[1],
            repo: repoInfoMatch[2]
        };
    }

    /**
     * Check if commit workflow can execute
     * @param {Object} context - Current execution context
     * @returns {boolean} Whether workflow can execute
     */
    canExecute(context) {
        try {
            // Check if we're in a git repository
            execSync('git rev-parse --git-dir', { stdio: 'pipe' });
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = CommitWorkflow;