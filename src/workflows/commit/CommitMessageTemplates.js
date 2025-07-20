/**
 * Commit Message Templates - Provides templates for different types of changes
 */
class CommitMessageTemplates {
    constructor() {
        this.templates = {
            feature: {
                format: 'feat({scope}): {summary}',
                description: 'A new feature or functionality',
                examples: [
                    'feat(auth): add OAuth2 authentication flow',
                    'feat(api): implement user profile endpoints',
                    'feat(ui): add responsive navigation component'
                ]
            },
            bugfix: {
                format: 'fix({scope}): {summary}',
                description: 'A bug fix or error correction',
                examples: [
                    'fix(auth): resolve token expiration handling',
                    'fix(api): correct validation error responses',
                    'fix(ui): fix mobile layout overflow issue'
                ]
            },
            refactor: {
                format: 'refactor({scope}): {summary}',
                description: 'Code restructuring without changing functionality',
                examples: [
                    'refactor(auth): extract authentication utilities',
                    'refactor(api): simplify error handling logic',
                    'refactor(ui): consolidate component styles'
                ]
            },
            performance: {
                format: 'perf({scope}): {summary}',
                description: 'Performance improvements',
                examples: [
                    'perf(api): optimize database query performance',
                    'perf(ui): implement lazy loading for components',
                    'perf(core): reduce memory allocation in loops'
                ]
            },
            test: {
                format: 'test({scope}): {summary}',
                description: 'Adding or updating tests',
                examples: [
                    'test(auth): add unit tests for login flow',
                    'test(api): add integration tests for user endpoints',
                    'test(ui): add component snapshot tests'
                ]
            },
            documentation: {
                format: 'docs({scope}): {summary}',
                description: 'Documentation updates',
                examples: [
                    'docs(api): update endpoint documentation',
                    'docs(readme): add installation instructions',
                    'docs(contributing): update development guidelines'
                ]
            },
            maintenance: {
                format: 'chore({scope}): {summary}',
                description: 'Maintenance tasks and configuration',
                examples: [
                    'chore(deps): update dependencies to latest versions',
                    'chore(config): update build configuration',
                    'chore(ci): add automated testing workflow'
                ]
            },
            security: {
                format: 'security({scope}): {summary}',
                description: 'Security-related changes',
                examples: [
                    'security(auth): implement rate limiting',
                    'security(api): add input validation',
                    'security(deps): update vulnerable dependencies'
                ]
            },
            breaking: {
                format: 'feat({scope})!: {summary}',
                description: 'Breaking changes that affect existing functionality',
                examples: [
                    'feat(api)!: change user endpoint response format',
                    'feat(auth)!: remove deprecated login methods',
                    'feat(core)!: update configuration schema'
                ]
            }
        };
    }

    /**
     * Get template by type
     * @param {string} type - Template type
     * @returns {Object|null} Template object or null if not found
     */
    getTemplate(type) {
        return this.templates[type] || null;
    }

    /**
     * Get all available templates
     * @returns {Object} All templates
     */
    getAllTemplates() {
        return this.templates;
    }

    /**
     * Generate commit message from template
     * @param {string} type - Template type
     * @param {string} scope - Commit scope
     * @param {string} summary - Commit summary
     * @param {Object} options - Additional options
     * @returns {string} Formatted commit message
     */
    generateMessage(type, scope, summary, options = {}) {
        const template = this.getTemplate(type);
        if (!template) {
            throw new Error(`Unknown template type: ${type}`);
        }

        let message = template.format
            .replace('{scope}', scope || '')
            .replace('{summary}', summary);

        // Clean up empty scope parentheses
        message = message.replace(/\(\)/, '');

        // Add body if provided
        if (options.body) {
            message += `\n\n${options.body}`;
        }

        // Add footer if provided (for breaking changes, issues, etc.)
        if (options.footer) {
            message += `\n\n${options.footer}`;
        }

        return message;
    }

    /**
     * Suggest template based on change analysis
     * @param {Object} changeAnalysis - Analysis of code changes
     * @returns {string} Suggested template type
     */
    suggestTemplate(changeAnalysis) {
        const { code, security, dependencies, complexity } = changeAnalysis;

        // Security-related changes
        if (security?.riskLevel === 'high' || security?.vulnerabilities?.length > 0) {
            return 'security';
        }

        // Breaking changes
        if (dependencies?.breakingChanges?.length > 0 || this.hasBreakingChanges(changeAnalysis)) {
            return 'breaking';
        }

        // Performance-related changes
        if (complexity?.level === 'high' || this.hasPerformanceChanges(changeAnalysis)) {
            return 'performance';
        }

        // Test-related changes
        if (code?.changedFiles?.every(f => f.isTest)) {
            return 'test';
        }

        // Documentation changes
        if (code?.changedFiles?.every(f => f.path.toLowerCase().includes('doc') || f.path.toLowerCase().includes('readme'))) {
            return 'documentation';
        }

        // Configuration/maintenance changes
        if (code?.changedFiles?.every(f => f.isConfig) || dependencies?.added?.length > 0 || dependencies?.updated?.length > 0) {
            return 'maintenance';
        }

        // Refactoring (no new functionality, just restructuring)
        if (this.isRefactoring(changeAnalysis)) {
            return 'refactor';
        }

        // Bug fixes (modifications to existing code without new files)
        if (code?.changedFiles?.every(f => f.status === 'modified') && !this.hasNewFeatures(changeAnalysis)) {
            return 'bugfix';
        }

        // Default to feature for new functionality
        return 'feature';
    }

    /**
     * Check if changes include breaking changes
     * @param {Object} changeAnalysis - Change analysis
     * @returns {boolean} Whether breaking changes are detected
     */
    hasBreakingChanges(changeAnalysis) {
        const { code } = changeAnalysis;
        
        if (!code?.changedFiles) return false;

        // Check for API-related changes
        const apiFiles = code.changedFiles.filter(f => 
            f.path.toLowerCase().includes('api') ||
            f.path.toLowerCase().includes('schema') ||
            f.path.toLowerCase().includes('migration') ||
            f.path.toLowerCase().includes('interface')
        );

        return apiFiles.length > 0;
    }

    /**
     * Check if changes are performance-related
     * @param {Object} changeAnalysis - Change analysis
     * @returns {boolean} Whether performance changes are detected
     */
    hasPerformanceChanges(changeAnalysis) {
        const { code, complexity } = changeAnalysis;
        
        if (complexity?.level === 'high' || complexity?.level === 'very_high') {
            return true;
        }

        if (!code?.changedFiles) return false;

        // Check for performance-related file patterns
        const perfPatterns = ['cache', 'optimize', 'performance', 'lazy', 'async', 'worker'];
        return code.changedFiles.some(f => 
            perfPatterns.some(pattern => f.path.toLowerCase().includes(pattern))
        );
    }

    /**
     * Check if changes are refactoring
     * @param {Object} changeAnalysis - Change analysis
     * @returns {boolean} Whether changes are refactoring
     */
    isRefactoring(changeAnalysis) {
        const { code, metrics } = changeAnalysis;
        
        if (!code?.changedFiles || !metrics) return false;

        // Refactoring typically has similar lines added/removed (restructuring)
        const addedLines = metrics.addedLines || 0;
        const removedLines = metrics.removedLines || 0;
        const ratio = addedLines > 0 ? removedLines / addedLines : 0;

        // If ratio is close to 1, it's likely refactoring
        return ratio > 0.7 && ratio < 1.3 && addedLines > 10;
    }

    /**
     * Check if changes include new features
     * @param {Object} changeAnalysis - Change analysis
     * @returns {boolean} Whether new features are detected
     */
    hasNewFeatures(changeAnalysis) {
        const { code } = changeAnalysis;
        
        if (!code?.changedFiles) return false;

        // New features typically include new files or significant additions
        const hasNewFiles = code.changedFiles.some(f => f.status === 'added');
        const hasSignificantAdditions = (changeAnalysis.metrics?.addedLines || 0) > 50;

        return hasNewFiles || hasSignificantAdditions;
    }

    /**
     * Get template suggestions with reasoning
     * @param {Object} changeAnalysis - Change analysis
     * @returns {Object} Template suggestions with reasoning
     */
    getTemplateSuggestions(changeAnalysis) {
        const suggestions = [];
        const primarySuggestion = this.suggestTemplate(changeAnalysis);

        // Add primary suggestion
        suggestions.push({
            type: primarySuggestion,
            confidence: 'high',
            reason: this.getTemplateReason(primarySuggestion, changeAnalysis),
            template: this.getTemplate(primarySuggestion)
        });

        // Add alternative suggestions
        const alternatives = this.getAlternativeTemplates(primarySuggestion, changeAnalysis);
        for (const alt of alternatives) {
            suggestions.push({
                type: alt,
                confidence: 'medium',
                reason: this.getTemplateReason(alt, changeAnalysis),
                template: this.getTemplate(alt)
            });
        }

        return {
            primary: suggestions[0],
            alternatives: suggestions.slice(1),
            all: suggestions
        };
    }

    /**
     * Get reasoning for template suggestion
     * @param {string} templateType - Template type
     * @param {Object} changeAnalysis - Change analysis
     * @returns {string} Reasoning for suggestion
     */
    getTemplateReason(templateType, changeAnalysis) {
        const { code, security, dependencies, complexity } = changeAnalysis;

        switch (templateType) {
            case 'security':
                return `Security-related changes detected (risk level: ${security?.riskLevel})`;
            case 'breaking':
                return 'Breaking changes detected in API or dependencies';
            case 'performance':
                return `Performance-related changes (complexity: ${complexity?.level})`;
            case 'test':
                return 'Only test files were modified';
            case 'documentation':
                return 'Only documentation files were modified';
            case 'maintenance':
                return `Configuration or dependency changes (${dependencies?.added?.length + dependencies?.updated?.length || 0} deps affected)`;
            case 'refactor':
                return 'Code restructuring without new functionality';
            case 'bugfix':
                return 'Modifications to existing code without new files';
            case 'feature':
                return `New functionality added (${code?.changedFiles?.filter(f => f.status === 'added').length || 0} new files)`;
            default:
                return 'Based on change analysis patterns';
        }
    }

    /**
     * Get alternative template suggestions
     * @param {string} primaryType - Primary template type
     * @param {Object} changeAnalysis - Change analysis
     * @returns {Array} Alternative template types
     */
    getAlternativeTemplates(primaryType, changeAnalysis) {
        const alternatives = [];
        const { code } = changeAnalysis;

        // Always consider feature/bugfix as alternatives
        if (primaryType !== 'feature' && this.hasNewFeatures(changeAnalysis)) {
            alternatives.push('feature');
        }
        if (primaryType !== 'bugfix' && code?.changedFiles?.some(f => f.status === 'modified')) {
            alternatives.push('bugfix');
        }

        // Consider refactor if significant changes
        if (primaryType !== 'refactor' && this.isRefactoring(changeAnalysis)) {
            alternatives.push('refactor');
        }

        return alternatives.slice(0, 2); // Limit to 2 alternatives
    }
}

module.exports = CommitMessageTemplates;