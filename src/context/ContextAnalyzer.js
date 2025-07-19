const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * Context Analyzer - Enhanced version of current context gathering with deeper code analysis
 */
class ContextAnalyzer {
    constructor(config) {
        this.config = config;
    }

    /**
     * Gather comprehensive context from various sources
     * @returns {Promise<Object>} Complete context object
     */
    async gather() {
        const gitContext = await this.gatherGitContext();
        
        const context = {
            git: gitContext,
            code: await this.analyzeCodeChanges(),
            project: await this.analyzeProjectStructure(),
            linear: this.gatherLinearContext(gitContext.branch)
        };

        return context;
    }

    /**
     * Gather Git-related context information
     * @returns {Promise<Object>} Git context
     */
    async gatherGitContext() {
        console.log(chalk.blue('   - Gathering git context...'));
        
        try {
            const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
            const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
            
            // Handle unpushed commits
            await this.handleUnpushedCommits(branchName);
            
            const diffContent = execSync('git diff origin/main...HEAD').toString().trim();
            
            if (!diffContent) {
                throw new Error('No new commits found on this branch compared to "origin/main". Please commit your changes.');
            }

            console.log(chalk.blue(`   - Found ${diffContent.split('\n').length} lines of changes`));

            return {
                branch: branchName,
                remoteUrl,
                diff: diffContent,
                diffStats: execSync('git diff --stat origin/main...HEAD').toString().trim(),
                commits: this.getRecentCommits(branchName)
            };
        } catch (error) {
            throw new Error(`Git context gathering failed: ${error.message}`);
        }
    }

    /**
     * Handle unpushed commits by pushing them to remote
     * @param {string} branchName - Current branch name
     */
    async handleUnpushedCommits(branchName) {
        try {
            const unpushedCommits = execSync(`git log origin/${branchName}..HEAD --oneline`).toString().trim();
            if (unpushedCommits) {
                console.log(chalk.yellow('   - Found unpushed commits, pushing to remote...'));
                execSync(`git push origin ${branchName}`);
                console.log(chalk.green('   - Pushed latest commits to remote'));
            }
        } catch (pushError) {
            // Branch might not exist on remote yet
            console.log(chalk.yellow('   - Branch not on remote, pushing for first time...'));
            try {
                execSync(`git push -u origin ${branchName}`);
                console.log(chalk.green('   - Pushed branch to remote'));
            } catch (firstPushError) {
                console.log(chalk.red('   - Warning: Could not push to remote, continuing anyway...'));
            }
        }
    }

    /**
     * Get recent commits for the current branch
     * @param {string} branchName - Current branch name
     * @returns {Array} Array of commit objects
     */
    getRecentCommits(branchName) {
        try {
            const commitLog = execSync(`git log origin/main..${branchName} --oneline --no-merges`).toString().trim();
            if (!commitLog) return [];
            
            return commitLog.split('\n').map(line => {
                const [hash, ...messageParts] = line.split(' ');
                return {
                    hash: hash,
                    message: messageParts.join(' ')
                };
            });
        } catch (error) {
            return [];
        }
    }

    /**
     * Analyze code changes in the current diff
     * @returns {Promise<Object>} Code analysis results
     */
    async analyzeCodeChanges() {
        // For now, return basic analysis - will be enhanced in later tasks
        return {
            hasChanges: true,
            complexity: 'medium',
            security: { vulnerabilities: [] },
            dependencies: [],
            testCoverage: {}
        };
    }

    /**
     * Analyze project structure and configuration
     * @returns {Promise<Object>} Project analysis results
     */
    async analyzeProjectStructure() {
        // For now, return basic structure - will be enhanced in later tasks
        return {
            structure: {},
            configuration: {},
            metadata: {}
        };
    }

    /**
     * Gather Linear ticket context from branch name
     * @param {string} branchName - Current branch name
     * @returns {Object} Linear context
     */
    gatherLinearContext(branchName) {
        console.log(chalk.blue(`   - Parsing branch name "${branchName}"...`));
        const ticketIdMatch = branchName.match(/([A-Z]+-\d+)/);
        
        if (!ticketIdMatch) {
            throw new Error(`Could not find a Linear ticket ID (e.g., TIX-123) in branch "${branchName}".`);
        }
        
        const linearTicketId = ticketIdMatch[0];
        console.log(chalk.green(`   - Found Linear Ticket: ${linearTicketId}`));

        return {
            ticketId: linearTicketId,
            ticketData: null, // Will be populated by Linear workflow
            projectData: null
        };
    }
}

module.exports = ContextAnalyzer;