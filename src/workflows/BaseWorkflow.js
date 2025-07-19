/**
 * Base Workflow - Abstract base class for all workflows
 * Provides common functionality and interface for workflow implementations
 */
class BaseWorkflow {
    constructor(config, name = 'base') {
        this.config = config;
        this.name = name;
        this.critical = true; // Whether failure should stop execution
        this.dependencies = []; // Other workflows this depends on
        this.parallel = false; // Whether this can run in parallel with others
    }

    /**
     * Execute the workflow - must be implemented by subclasses
     * @param {Object} context - Current execution context
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} Workflow execution results
     */
    async execute(context, options = {}) {
        throw new Error(`execute() method must be implemented by ${this.constructor.name}`);
    }

    /**
     * Validate that the workflow can execute with the given context
     * @param {Object} context - Current execution context
     * @returns {boolean} Whether the workflow can execute
     */
    canExecute(context) {
        return true; // Default implementation - override in subclasses
    }

    /**
     * Get workflow configuration
     * @returns {Object} Workflow-specific configuration
     */
    getConfig() {
        return this.config.get(`workflows.${this.name}`, {});
    }

    /**
     * Check if workflow is enabled
     * @returns {boolean} Whether the workflow is enabled
     */
    isEnabled() {
        const workflowConfig = this.getConfig();
        return workflowConfig.enabled !== false;
    }

    /**
     * Log workflow-specific messages
     * @param {string} message - Message to log
     * @param {string} level - Log level (info, warn, error)
     */
    log(message, level = 'info') {
        const prefix = `[${this.name}]`;
        switch (level) {
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    }

    /**
     * Handle workflow errors with optional retry logic
     * @param {Error} error - The error that occurred
     * @param {Object} context - Current execution context
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<boolean>} Whether to retry the operation
     */
    async handleError(error, context, retryCount = 0) {
        this.log(`Error occurred: ${error.message}`, 'error');
        
        // Default: no retry logic, but subclasses can override
        return false;
    }

    /**
     * Cleanup resources after workflow execution
     * @param {Object} context - Current execution context
     * @param {Object} results - Execution results
     */
    async cleanup(context, results) {
        // Default: no cleanup needed, but subclasses can override
    }

    /**
     * Get workflow metadata
     * @returns {Object} Workflow metadata
     */
    getMetadata() {
        return {
            name: this.name,
            critical: this.critical,
            dependencies: this.dependencies,
            parallel: this.parallel,
            enabled: this.isEnabled()
        };
    }
}

module.exports = BaseWorkflow;