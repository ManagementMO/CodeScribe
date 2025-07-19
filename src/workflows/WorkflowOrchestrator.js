const chalk = require('chalk');

/**
 * Workflow Orchestrator - Plugin-based system for managing different workflow types
 */
class WorkflowOrchestrator {
    constructor(config) {
        this.config = config;
        this.workflows = new Map();
        this.registerDefaultWorkflows();
    }

    /**
     * Register default workflows that come with the system
     */
    registerDefaultWorkflows() {
        // Import and register default workflows
        const GitHubWorkflow = require('./github/GitHubWorkflow');
        const LinearWorkflow = require('./linear/LinearWorkflow');
        const CommitWorkflow = require('./commit/CommitWorkflow');
        
        this.registerWorkflow('github', new GitHubWorkflow(this.config));
        this.registerWorkflow('linear', new LinearWorkflow(this.config));
        this.registerWorkflow('commit', new CommitWorkflow(this.config));
    }

    /**
     * Register a workflow with the orchestrator
     * @param {string} name - Workflow name
     * @param {BaseWorkflow} workflow - Workflow instance
     */
    registerWorkflow(name, workflow) {
        this.workflows.set(name, workflow);
        console.log(chalk.blue(`   - Registered workflow: ${name}`));
    }

    /**
     * Select appropriate workflows based on command and context
     * @param {string} command - The command being executed
     * @param {Object} context - Current context
     * @returns {Array} Array of selected workflows
     */
    selectWorkflows(command, context) {
        const selectedWorkflows = [];

        // Default workflow selection logic
        switch (command) {
            case 'default':
            case 'pr':
                // Standard PR creation workflow
                selectedWorkflows.push(this.workflows.get('github'));
                selectedWorkflows.push(this.workflows.get('linear'));
                break;
            
            case 'commit':
                // Commit workflow with GitHub and Linear tracking
                selectedWorkflows.push(this.workflows.get('commit'));
                break;
            
            case 'github-only':
                selectedWorkflows.push(this.workflows.get('github'));
                break;
                
            case 'linear-only':
                selectedWorkflows.push(this.workflows.get('linear'));
                break;
                
            default:
                // Default to standard workflow
                selectedWorkflows.push(this.workflows.get('github'));
                selectedWorkflows.push(this.workflows.get('linear'));
        }

        return selectedWorkflows.filter(workflow => workflow !== undefined);
    }

    /**
     * Execute selected workflows with proper dependency management
     * @param {Array} workflows - Workflows to execute
     * @param {Object} context - Current context
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} Execution results
     */
    async execute(workflows, context, options = {}) {
        const results = {};
        
        for (const workflow of workflows) {
            try {
                console.log(chalk.blue(`   - Executing ${workflow.name} workflow...`));
                const result = await workflow.execute(context, options);
                results[workflow.name] = result;
                
                // Update context with results for subsequent workflows
                context[workflow.name] = result;
                
            } catch (error) {
                console.error(chalk.red(`   - ${workflow.name} workflow failed: ${error.message}`));
                
                // Decide whether to continue or fail based on workflow criticality
                if (workflow.critical !== false) {
                    throw error;
                }
                
                results[workflow.name] = { error: error.message };
            }
        }

        return results;
    }

    /**
     * Get list of registered workflows
     * @returns {Array} Array of workflow names
     */
    getRegisteredWorkflows() {
        return Array.from(this.workflows.keys());
    }

    /**
     * Get a specific workflow by name
     * @param {string} name - Workflow name
     * @returns {BaseWorkflow|undefined} Workflow instance
     */
    getWorkflow(name) {
        return this.workflows.get(name);
    }
}

module.exports = WorkflowOrchestrator;