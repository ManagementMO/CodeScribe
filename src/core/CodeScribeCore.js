const ContextAnalyzer = require('../context/ContextAnalyzer');
const WorkflowOrchestrator = require('../workflows/WorkflowOrchestrator');
const AIAnalysisEngine = require('../ai/AIAnalysisEngine');
const ConfigurationManager = require('../config/ConfigurationManager');
const Logger = require('../utils/Logger');
const ProgressReporter = require('../utils/ProgressReporter');
const WorkflowHistory = require('../utils/WorkflowHistory');
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
        
        // Initialize logging and progress tracking
        this.logger = new Logger({
            level: config.logLevel || 'info',
            enableConsole: config.enableConsoleLogging !== false,
            enableFile: config.enableFileLogging !== false
        });
        
        this.progressReporter = new ProgressReporter({
            enableProgress: config.enableProgress !== false,
            verbose: config.verbose || false
        });
        
        this.workflowHistory = new WorkflowHistory({
            enableHistory: config.enableHistory !== false
        });
    }

    /**
     * Main execution method that orchestrates the entire workflow
     * @param {string} command - The command to execute
     * @param {Object} options - Command options
     * @returns {Promise<Object>} Execution results
     */
    async execute(command = 'default', options = {}) {
        const startTime = Date.now();
        let executionId = null;
        
        // Initialize progress tracking
        const totalSteps = 4; // Context, AI Analysis, Workflow Selection, Execution
        this.progressReporter.start(totalSteps, 'Starting CodeScribe Agent...');
        
        // Log workflow start
        this.logger.info(`Starting CodeScribe execution`, {
            command: command,
            options: options,
            timestamp: new Date().toISOString()
        });

        try {
            // Step 1: Gather context from various sources
            this.progressReporter.nextStep('Gathering context...', { command });
            const stepStartTime = Date.now();
            
            const context = await this.contextAnalyzer.gather();
            this.progressReporter.completeStep(Date.now() - stepStartTime);
            
            this.logger.debug('Context gathered successfully', {
                branch: context.git?.branch,
                hasChanges: context.git?.hasChanges,
                ticketId: context.linear?.ticketId
            });

            // Step 2: Perform AI analysis if available
            this.progressReporter.nextStep('Performing AI analysis...', { 
                aiAvailable: this.aiEngine.isAvailable() 
            });
            const aiStartTime = Date.now();
            
            if (this.aiEngine.isAvailable()) {
                context.ai = await this.aiEngine.analyzePRContent(context);
                this.logger.debug('AI analysis completed');
            } else {
                this.logger.warn('AI analysis not available');
            }
            this.progressReporter.completeStep(Date.now() - aiStartTime);

            // Step 3: Select appropriate workflows based on command and context
            this.progressReporter.nextStep('Selecting workflows...', { command });
            const selectionStartTime = Date.now();
            
            const workflows = this.workflowOrchestrator.selectWorkflows(command, context);
            this.progressReporter.completeStep(Date.now() - selectionStartTime);
            
            this.logger.info('Workflows selected', {
                workflows: workflows.map(w => w.name),
                count: workflows.length
            });
            
            // Step 4: Execute selected workflows
            this.progressReporter.nextStep('Executing workflows...', { 
                workflowCount: workflows.length 
            });
            const executionStartTime = Date.now();
            
            const results = await this.workflowOrchestrator.execute(workflows, context, options);
            this.progressReporter.completeStep(Date.now() - executionStartTime);

            // Complete progress tracking
            const totalDuration = Date.now() - startTime;
            this.progressReporter.complete(`Agent finished successfully! (${totalDuration}ms)`);
            
            // Log successful completion
            this.logger.info('CodeScribe execution completed successfully', {
                command: command,
                duration: totalDuration,
                workflows: workflows.map(w => w.name),
                results: Object.keys(results)
            });
            
            // Record execution in history
            executionId = await this.workflowHistory.recordExecution({
                command: command,
                options: options,
                context: context,
                workflows: workflows,
                results: results,
                duration: totalDuration,
                success: true,
                error: null
            });
            
            if (executionId) {
                this.logger.debug(`Execution recorded with ID: ${executionId}`);
            }

            return results;

        } catch (error) {
            const totalDuration = Date.now() - startTime;
            
            // Handle error in progress reporting
            this.progressReporter.error(`Agent failed: ${error.message}`, error);
            
            // Log error
            this.logger.error('CodeScribe execution failed', {
                command: command,
                duration: totalDuration,
                error: error.message,
                stack: error.stack
            });
            
            // Record failed execution in history
            if (!executionId) {
                await this.workflowHistory.recordExecution({
                    command: command,
                    options: options,
                    context: null,
                    workflows: [],
                    results: null,
                    duration: totalDuration,
                    success: false,
                    error: error.message
                });
            }
            
            // Enhanced error reporting
            if (error.response) {
                this.logger.error('API Error Details', {
                    status: error.response.status,
                    data: error.response.data
                });
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