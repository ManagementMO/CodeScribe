const BaseWorkflow = require('../BaseWorkflow');
const MermaidGenerator = require('./MermaidGenerator');
const chalk = require('chalk');

/**
 * Documentation Workflow - Generates visual documentation and diagrams
 */
class DocumentationWorkflow extends BaseWorkflow {
    constructor(config) {
        super(config);
        this.name = 'documentation';
        this.mermaidGenerator = new MermaidGenerator(config);
    }

    /**
     * Execute the documentation workflow
     * @param {Object} context - Current context
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} Workflow results
     */
    async execute(context, options = {}) {
        console.log(chalk.blue('📊 Starting Documentation Workflow...'));

        try {
            const results = {
                diagrams: null,
                formattedDiagrams: null,
                summary: null
            };

            // Generate Mermaid diagrams
            results.diagrams = await this.mermaidGenerator.generateDiagrams(context);

            // Format diagrams for different platforms
            results.formattedDiagrams = this.mermaidGenerator.formatDiagramsForPlatforms(results.diagrams);

            // Create summary
            results.summary = this.createDocumentationSummary(results.diagrams, context);

            console.log(chalk.green('✅ Documentation workflow completed'));
            return results;

        } catch (error) {
            console.error(chalk.red('❌ Documentation workflow failed:', error.message));
            throw error;
        }
    }

    /**
     * Create a summary of generated documentation
     * @param {Object} diagrams - Generated diagrams
     * @param {Object} context - Current context
     * @returns {Object} Documentation summary
     */
    createDocumentationSummary(diagrams, context) {
        const totalDiagrams = this.mermaidGenerator.getTotalDiagramCount(diagrams);
        
        const summary = {
            totalDiagrams,
            diagramTypes: {
                flowcharts: diagrams.flowcharts.length,
                dependencyGraphs: diagrams.dependencyGraphs.length,
                sequenceDiagrams: diagrams.sequenceDiagrams.length,
                architectureDiagrams: diagrams.architectureDiagrams.length
            },
            analysisContext: {
                hasCodeChanges: context.code?.hasChanges || false,
                changedFiles: context.code?.changedFiles?.length || 0,
                complexityLevel: context.code?.complexity?.level || 'unknown',
                securityRisk: context.code?.security?.riskLevel || 'unknown'
            },
            recommendations: this.generateDocumentationRecommendations(diagrams, context)
        };

        return summary;
    }

    /**
     * Generate recommendations based on documentation analysis
     * @param {Object} diagrams - Generated diagrams
     * @param {Object} context - Current context
     * @returns {Array} Array of recommendations
     */
    generateDocumentationRecommendations(diagrams, context) {
        const recommendations = [];

        // Recommend based on complexity
        if (context.code?.complexity?.level === 'high' || context.code?.complexity?.level === 'very_high') {
            recommendations.push({
                type: 'complexity',
                message: 'High code complexity detected. Consider breaking down complex functions shown in flowcharts.',
                priority: 'high'
            });
        }

        // Recommend based on dependency changes
        if (diagrams.dependencyGraphs.length > 0) {
            recommendations.push({
                type: 'dependencies',
                message: 'Dependency changes detected. Review impact analysis in dependency graphs.',
                priority: 'medium'
            });
        }

        // Recommend based on architecture changes
        if (diagrams.architectureDiagrams.length > 0 && context.code?.changedFiles?.length > 5) {
            recommendations.push({
                type: 'architecture',
                message: 'Multiple files changed. Consider reviewing architecture diagrams for impact assessment.',
                priority: 'medium'
            });
        }

        // Recommend based on API changes
        if (diagrams.sequenceDiagrams.length > 0) {
            recommendations.push({
                type: 'api',
                message: 'API interactions detected. Review sequence diagrams for proper error handling.',
                priority: 'low'
            });
        }

        return recommendations;
    }

    /**
     * Get diagrams formatted for GitHub PR description
     * @param {Object} diagrams - Generated diagrams
     * @returns {string} GitHub-formatted markdown
     */
    getGitHubFormattedDiagrams(diagrams) {
        return this.mermaidGenerator.formatDiagramsForPlatforms(diagrams).github.markdown;
    }

    /**
     * Get diagrams formatted for Linear ticket update
     * @param {Object} diagrams - Generated diagrams
     * @returns {string} Linear-formatted markdown
     */
    getLinearFormattedDiagrams(diagrams) {
        return this.mermaidGenerator.formatDiagramsForPlatforms(diagrams).linear.markdown;
    }
}

module.exports = DocumentationWorkflow;