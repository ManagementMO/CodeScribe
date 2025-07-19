const ContextAnalyzer = require('../context/ContextAnalyzer');
const WorkflowOrchestrator = require('../workflows/WorkflowOrchestrator');
const AIAnalysisEngine = require('../ai/AIAnalysisEngine');
const ConfigurationManager = require('../config/ConfigurationManager');
const chalk = require('chalk');

/**
 * Core Engine - Central orchestrator that manages workflow execution 
 * and coordinates between components
 */
class CodeScribeCore {
    constructor(config = {}) {
        this.config = new ConfigurationManager(config);
        this.contextAnalyzer = new ContextAnalyzer(this.config);
        this.workflowOrchestrator = new WorkflowOrchestrator(this.config);
        this.aiEngine = new AIAnalysisEngine(this.config);
    }

    /**
     * Main execution method that orchestrates the entire workflow
     * @param {string} command - The command to execute
     * @param {Object} options - Command options
     * @returns {Promise<Object>} Execution results
     */
    async execute(command = 'default', options = {}) {
        console.log(chalk.cyan.bold('🚀 Starting CodeScribe Agent...'));

        try {
            // Gather context from various sources
            console.log(chalk.blue('   - Gathering context...'));
            const context = await this.contextAnalyzer.gather();

            // Perform AI analysis if available
            if (this.aiEngine.isAvailable()) {
                context.ai = await this.aiEngine.analyzePRContent(context);
            }

            // Select appropriate workflows based on command and context
            const workflows = this.workflowOrchestrator.selectWorkflows(command, context);
            
            // Execute selected workflows
            const results = await this.workflowOrchestrator.execute(workflows, context, options);

            console.log(chalk.green.bold('\n✅ Agent finished successfully!'));
            return results;

        } catch (error) {
            console.error(chalk.red.bold('\n❌ Agent failed:'), error.message);
            if (error.response) {
                console.error(chalk.red('Response status:'), error.response.status);
                console.error(chalk.red('Response data:'), JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    /**
     * Register a custom workflow
     * @param {BaseWorkflow} workflow - The workflow to register
     */
    registerWorkflow(workflow) {
        this.workflowOrchestrator.registerWorkflow(workflow);
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return this.config.getAll();
    }

    /**
     * Update configuration
     * @param {Object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        this.config.update(newConfig);
    }
}

module.exports = CodeScribeCore;