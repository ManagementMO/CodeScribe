const { GoogleGenerativeAI } = require('@google/generative-ai');
const chalk = require('chalk');

/**
 * AI Analysis Engine - Enhanced AI integration with multiple models and specialized prompts
 */
class AIAnalysisEngine {
    constructor(config) {
        this.config = config;
        this.genAI = new GoogleGenerativeAI(
            process.env.GEMINI_API_KEY || config.get('ai.gemini.apiKey')
        );
        this.defaultModel = config.get('ai.model', 'gemini-1.5-flash');
        this.maxRetries = config.get('ai.maxRetries', 3);
    }

    /**
     * Analyze code changes and generate PR content
     * @param {Object} context - Current execution context
     * @returns {Promise<Object>} AI analysis results
     */
    async analyzePRContent(context) {
        console.log(chalk.blue('   - Sending code changes to AI for analysis...'));

        const prompt = this.buildPRAnalysisPrompt(context.git.diff);
        
        try {
            const result = await this.generateWithRetry(prompt);
            console.log(chalk.green('   - AI analysis complete.'));
            return result;
        } catch (error) {
            console.log(chalk.red('   - AI service unavailable, using fallback analysis...'));
            return this.generateFallbackPRContent(context);
        }
    }

    /**
     * Generate enhanced commit message with detailed context and impact analysis
     * @param {Object} context - Current execution context
     * @param {Object} changeAnalysis - Detailed change analysis
     * @returns {Promise<Object>} Enhanced commit message with metadata
     */
    async generateEnhancedCommitMessage(context, changeAnalysis) {
        console.log(chalk.blue('   - Generating enhanced commit message with AI analysis...'));

        const prompt = this.buildCommitAnalysisPrompt(context, changeAnalysis);
        
        try {
            const result = await this.generateWithRetry(prompt);
            console.log(chalk.green('   - Enhanced commit message generated.'));
            return result;
        } catch (error) {
            console.log(chalk.red('   - AI service unavailable, using fallback commit message...'));
            return this.generateFallbackCommitMessage(context, changeAnalysis);
        }
    }

    /**
     * Build comprehensive prompt for commit message analysis
     * @param {Object} context - Current execution context
     * @param {Object} changeAnalysis - Detailed change analysis
     * @returns {string} Formatted prompt
     */
    buildCommitAnalysisPrompt(context, changeAnalysis) {
        const { git, code, project } = context;
        const { complexity, security, dependencies, metrics } = changeAnalysis;

        // Get template suggestions
        const CommitMessageTemplates = require('../workflows/commit/CommitMessageTemplates');
        const templates = new CommitMessageTemplates();
        const templateSuggestions = templates.getTemplateSuggestions(changeAnalysis);

        return `Analyze the following code changes and generate a comprehensive commit message with impact analysis. Use the suggested templates as guidance for the commit format.

Return a clean JSON object with the following structure:
{
  "message": "conventional commit format message following suggested template",
  "type": "commit type (feat/fix/refactor/perf/security/etc)",
  "scope": "affected scope/module",
  "description": "detailed description explaining the 'why' behind changes",
  "impact": {
    "performance": "performance impact assessment (low_impact/medium_impact/high_impact)",
    "security": "security implications (none/low/medium/high)",
    "maintainability": "maintainability impact (improved/unchanged/degraded)",
    "breaking": boolean
  },
  "rationale": "design decisions and reasoning behind the changes",
  "template": "template type used (feature/bugfix/refactor/performance/security/etc)"
}

Context:
- Branch: ${git.branch}
- Files changed: ${code.changedFiles?.length || 0}
- Lines added: ${metrics?.addedLines || 0}
- Lines removed: ${metrics?.removedLines || 0}
- Complexity level: ${complexity?.level || 'unknown'}
- Security risk: ${security?.riskLevel || 'none'}
- Dependencies changed: ${dependencies?.added?.length + dependencies?.updated?.length + dependencies?.removed?.length || 0}

Suggested Template: ${templateSuggestions.primary.type} (${templateSuggestions.primary.reason})
Template Format: ${templateSuggestions.primary.template.format}
Alternative Templates: ${templateSuggestions.alternatives.map(alt => `${alt.type} (${alt.reason})`).join(', ')}

Available Template Types:
- feature: New functionality or capabilities
- bugfix: Bug fixes and error corrections  
- refactor: Code restructuring without changing functionality
- performance: Performance improvements and optimizations
- security: Security-related changes and fixes
- test: Adding or updating tests
- documentation: Documentation updates
- maintenance: Configuration, dependencies, and maintenance tasks
- breaking: Breaking changes that affect existing functionality

Code Changes:
${git.diff}

Complexity Analysis:
${JSON.stringify(complexity, null, 2)}

Security Analysis:
${JSON.stringify(security, null, 2)}

Dependency Changes:
${JSON.stringify(dependencies, null, 2)}

Generate a commit message that explains not just WHAT changed, but WHY it changed, including design decisions and their rationale. Focus on the business value and technical reasoning behind the changes.`;
    }

    /**
     * Generate fallback commit message when AI is unavailable
     * @param {Object} context - Current execution context
     * @param {Object} changeAnalysis - Detailed change analysis
     * @returns {Object} Fallback commit message
     */
    generateFallbackCommitMessage(context, changeAnalysis) {
        const { git, code } = context;
        const { complexity, security, dependencies, metrics } = changeAnalysis;

        // Use templates for better fallback messages
        const CommitMessageTemplates = require('../workflows/commit/CommitMessageTemplates');
        const templates = new CommitMessageTemplates();
        const templateSuggestions = templates.getTemplateSuggestions(changeAnalysis);

        const suggestedTemplate = templateSuggestions.primary;
        const scope = this.determineScope(code.changedFiles);
        const hasBreaking = this.hasBreakingChanges(changeAnalysis);

        // Generate message using template
        const ticketId = context.linear?.ticketId;
        const summary = this.generateTemplateSummary(suggestedTemplate.type, code.changedFiles, ticketId);

        let message;
        try {
            message = templates.generateMessage(
                suggestedTemplate.type,
                scope,
                summary,
                {
                    body: this.generateCommitBody(changeAnalysis, context),
                    footer: hasBreaking ? 'BREAKING CHANGE: API changes may affect existing functionality' : null
                }
            );
        } catch (error) {
            // Fallback to basic conventional commit format
            message = this.generateBasicConventionalMessage(suggestedTemplate.type, scope, summary, hasBreaking);
        }

        return {
            message: message,
            type: suggestedTemplate.type,
            scope: scope,
            description: this.generateDetailedDescription(changeAnalysis, context),
            impact: {
                performance: this.assessPerformanceImpact(changeAnalysis),
                security: security?.riskLevel || 'none',
                maintainability: this.assessMaintainabilityImpact(complexity),
                breaking: hasBreaking
            },
            rationale: this.generateRationale(changeAnalysis, suggestedTemplate),
            template: suggestedTemplate.type
        };
    }

    /**
     * Generate template-specific summary
     * @param {string} templateType - Template type
     * @param {Array} changedFiles - Changed files
     * @param {string} ticketId - Linear ticket ID
     * @returns {string} Template summary
     */
    generateTemplateSummary(templateType, changedFiles, ticketId) {
        const fileCount = changedFiles?.length || 0;
        let summary = '';

        if (ticketId) {
            summary = `${ticketId} - `;
        }

        switch (templateType) {
            case 'feature':
                summary += fileCount === 1 ? 
                    `implement new functionality in ${this.getFileBasename(changedFiles[0]?.path)}` :
                    `implement new features across ${fileCount} components`;
                break;
            case 'bugfix':
                summary += fileCount === 1 ?
                    `resolve issue in ${this.getFileBasename(changedFiles[0]?.path)}` :
                    `fix multiple issues across ${fileCount} files`;
                break;
            case 'refactor':
                summary += fileCount === 1 ?
                    `restructure ${this.getFileBasename(changedFiles[0]?.path)}` :
                    `refactor and optimize ${fileCount} components`;
                break;
            case 'performance':
                summary += 'optimize performance and reduce complexity';
                break;
            case 'security':
                summary += 'enhance security and fix vulnerabilities';
                break;
            case 'test':
                summary += 'improve test coverage and reliability';
                break;
            case 'documentation':
                summary += 'update documentation and examples';
                break;
            case 'maintenance':
                summary += 'update dependencies and configuration';
                break;
            case 'breaking':
                summary += 'introduce breaking changes for improved API';
                break;
            default:
                summary += `update ${fileCount} files`;
        }

        return summary;
    }

    /**
     * Generate commit body with change details
     * @param {Object} changeAnalysis - Change analysis
     * @param {Object} context - Current context
     * @returns {string} Commit body
     */
    generateCommitBody(changeAnalysis, context) {
        const { code, complexity, security, dependencies, metrics } = changeAnalysis;
        let body = '';

        // Add change summary
        if (metrics) {
            body += `Changes: +${metrics.addedLines || 0}/-${metrics.removedLines || 0} lines across ${code.changedFiles?.length || 0} files\n`;
        }

        // Add complexity information
        if (complexity?.level && complexity.level !== 'low') {
            body += `Complexity: ${complexity.level} (${complexity.totalScore || 0} points)\n`;
        }

        // Add security information
        if (security?.riskLevel && security.riskLevel !== 'none') {
            body += `Security: ${security.riskLevel} risk level\n`;
        }

        // Add dependency information
        if (dependencies?.added?.length > 0 || dependencies?.updated?.length > 0) {
            body += `Dependencies: ${dependencies.added?.length || 0} added, ${dependencies.updated?.length || 0} updated\n`;
        }

        return body.trim();
    }

    /**
     * Generate basic conventional commit message
     * @param {string} type - Commit type
     * @param {string} scope - Commit scope
     * @param {string} summary - Commit summary
     * @param {boolean} hasBreaking - Whether has breaking changes
     * @returns {string} Conventional commit message
     */
    generateBasicConventionalMessage(type, scope, summary, hasBreaking) {
        let message = type;
        if (scope) message += `(${scope})`;
        if (hasBreaking) message += '!';
        message += `: ${summary}`;
        return message;
    }

    /**
     * Generate detailed description of changes
     * @param {Object} changeAnalysis - Change analysis
     * @param {Object} context - Current context
     * @returns {string} Detailed description
     */
    generateDetailedDescription(changeAnalysis, context) {
        const { code, complexity, security } = changeAnalysis;
        const fileCount = code.changedFiles?.length || 0;
        
        let description = `Modified ${fileCount} file${fileCount !== 1 ? 's' : ''}`;
        
        if (complexity?.level && complexity.level !== 'low') {
            description += ` with ${complexity.level} complexity`;
        }
        
        if (security?.riskLevel && security.riskLevel !== 'none') {
            description += ` and ${security.riskLevel} security impact`;
        }
        
        return description;
    }

    /**
     * Assess maintainability impact
     * @param {Object} complexity - Complexity analysis
     * @returns {string} Maintainability impact
     */
    assessMaintainabilityImpact(complexity) {
        if (!complexity?.level) return 'unchanged';
        
        switch (complexity.level) {
            case 'low': return 'improved';
            case 'medium': return 'unchanged';
            case 'high': return 'degraded';
            case 'very_high': return 'degraded';
            default: return 'unchanged';
        }
    }

    /**
     * Generate rationale for changes
     * @param {Object} changeAnalysis - Change analysis
     * @param {Object} suggestedTemplate - Suggested template
     * @returns {string} Rationale
     */
    generateRationale(changeAnalysis, suggestedTemplate) {
        const { code, complexity, security, dependencies } = changeAnalysis;
        
        let rationale = `Changes classified as ${suggestedTemplate.type} based on ${suggestedTemplate.reason.toLowerCase()}. `;
        
        if (complexity?.level === 'high' || complexity?.level === 'very_high') {
            rationale += 'High complexity detected - consider refactoring for maintainability. ';
        }
        
        if (security?.riskLevel === 'high') {
            rationale += 'Security vulnerabilities identified - review and address before deployment. ';
        }
        
        if (dependencies?.breakingChanges?.length > 0) {
            rationale += 'Breaking dependency changes may affect existing functionality. ';
        }
        
        return rationale.trim();
    }

    /**
     * Get basename of file path
     * @param {string} filePath - Full file path
     * @returns {string} File basename
     */
    getFileBasename(filePath) {
        if (!filePath) return 'unknown';
        return filePath.split('/').pop() || filePath;
    }

    /**
     * Generate commit message suggestions for user selection
     * @param {Object} context - Current execution context
     * @param {Object} changeAnalysis - Detailed change analysis
     * @returns {Promise<Array>} Array of commit message suggestions
     */
    async generateCommitSuggestions(context, changeAnalysis) {
        const CommitMessageTemplates = require('../workflows/commit/CommitMessageTemplates');
        const templates = new CommitMessageTemplates();
        const templateSuggestions = templates.getTemplateSuggestions(changeAnalysis);
        
        const suggestions = [];
        const scope = this.determineScope(changeAnalysis.code?.changedFiles);
        const hasBreaking = this.hasBreakingChanges(changeAnalysis);

        // Generate suggestion for primary template
        const primarySummary = this.generateTemplateSummary(
            templateSuggestions.primary.type, 
            changeAnalysis.code?.changedFiles, 
            context.linear?.ticketId
        );
        
        suggestions.push({
            type: templateSuggestions.primary.type,
            message: templates.generateMessage(templateSuggestions.primary.type, scope, primarySummary),
            confidence: 'high',
            reason: templateSuggestions.primary.reason,
            template: templateSuggestions.primary.template
        });

        // Generate suggestions for alternatives
        for (const alt of templateSuggestions.alternatives) {
            const altSummary = this.generateTemplateSummary(
                alt.type, 
                changeAnalysis.code?.changedFiles, 
                context.linear?.ticketId
            );
            
            suggestions.push({
                type: alt.type,
                message: templates.generateMessage(alt.type, scope, altSummary),
                confidence: 'medium',
                reason: alt.reason,
                template: alt.template
            });
        }

        return suggestions;
    }

    /**
     * Determine commit type from change analysis
     * @param {Object} changeAnalysis - Change analysis data
     * @returns {string} Commit type
     */
    determineCommitType(changeAnalysis) {
        const { code, dependencies } = changeAnalysis;
        
        if (!code?.changedFiles) return 'chore';

        const files = code.changedFiles;
        const hasTests = files.some(f => f.isTest);
        const hasConfig = files.some(f => f.isConfig);
        const hasCode = files.some(f => f.isJavaScript && !f.isTest);
        const hasNewFiles = files.some(f => f.status === 'added');
        const hasDeletedFiles = files.some(f => f.status === 'deleted');
        const hasDependencyChanges = dependencies?.added?.length > 0 || dependencies?.updated?.length > 0;

        // Priority order for commit types
        if (hasTests && !hasCode) return 'test';
        if (hasConfig && !hasCode && !hasTests) return 'chore';
        if (hasDependencyChanges && !hasCode) return 'chore';
        if (hasDeletedFiles && !hasNewFiles && !hasCode) return 'refactor';
        if (hasNewFiles && hasCode) return 'feat';
        if (hasCode && !hasNewFiles) return 'fix';
        if (hasNewFiles && !hasCode) return 'feat';

        return 'feat'; // Default
    }

    /**
     * Determine scope from changed files
     * @param {Array} changedFiles - Array of changed files
     * @returns {string|null} Determined scope
     */
    determineScope(changedFiles) {
        if (!changedFiles || changedFiles.length === 0) return null;

        // Extract directory paths
        const directories = changedFiles
            .map(f => f.path.split('/')[0])
            .filter(d => d && d !== '.');

        const uniqueDirs = [...new Set(directories)];

        // If all files are in the same directory, use that as scope
        if (uniqueDirs.length === 1) {
            return uniqueDirs[0];
        }

        // Common scope patterns
        const commonScopes = ['api', 'ui', 'auth', 'db', 'config', 'test', 'docs', 'workflow', 'core'];
        for (const scope of commonScopes) {
            if (changedFiles.some(f => f.path.toLowerCase().includes(scope))) {
                return scope;
            }
        }

        return null;
    }

    /**
     * Check if changes include breaking changes
     * @param {Object} changeAnalysis - Change analysis data
     * @returns {boolean} Whether breaking changes are detected
     */
    hasBreakingChanges(changeAnalysis) {
        const { dependencies, code } = changeAnalysis;
        
        // Check for major version bumps in dependencies
        if (dependencies?.breakingChanges?.length > 0) return true;
        
        // Check for API-related file changes
        if (code?.changedFiles) {
            const apiFiles = code.changedFiles.filter(f => 
                f.path.toLowerCase().includes('api') ||
                f.path.toLowerCase().includes('schema') ||
                f.path.toLowerCase().includes('migration')
            );
            if (apiFiles.length > 0) return true;
        }

        return false;
    }

    /**
     * Generate basic commit message
     * @param {string} type - Commit type
     * @param {Array} changedFiles - Changed files
     * @param {string} ticketId - Linear ticket ID
     * @returns {string} Basic message
     */
    generateBasicMessage(type, changedFiles, ticketId) {
        const fileCount = changedFiles?.length || 0;
        let message = '';

        if (ticketId) {
            message = `${ticketId}: `;
        }

        switch (type) {
            case 'feat':
                message += fileCount === 1 ? 
                    `add new feature in ${changedFiles[0].path}` :
                    `add new features across ${fileCount} files`;
                break;
            case 'fix':
                message += fileCount === 1 ?
                    `fix issue in ${changedFiles[0].path}` :
                    `fix issues across ${fileCount} files`;
                break;
            case 'refactor':
                message += fileCount === 1 ?
                    `refactor ${changedFiles[0].path}` :
                    `refactor ${fileCount} files`;
                break;
            case 'test':
                message += 'update tests';
                break;
            case 'docs':
                message += 'update documentation';
                break;
            case 'chore':
                message += 'update configuration and dependencies';
                break;
            default:
                message += `update ${fileCount} files`;
        }

        return message;
    }

    /**
     * Assess performance impact from changes
     * @param {Object} changeAnalysis - Change analysis data
     * @returns {string} Performance impact assessment
     */
    assessPerformanceImpact(changeAnalysis) {
        const { complexity, code } = changeAnalysis;
        
        if (complexity?.level === 'very_high') return 'high_impact';
        if (complexity?.level === 'high') return 'medium_impact';
        
        const hasLoops = complexity?.files?.some(f => f.loops > 0);
        const hasLargeFiles = code?.changedFiles?.some(f => f.lines > 500);
        
        if (hasLoops || hasLargeFiles) return 'medium_impact';
        
        return 'low_impact';
    }

    /**
     * Get template type for commit
     * @param {string} commitType - Commit type
     * @returns {string} Template type
     */
    getTemplateType(commitType) {
        const templateMap = {
            'feat': 'feature',
            'fix': 'bugfix',
            'refactor': 'refactor',
            'test': 'test',
            'docs': 'documentation',
            'chore': 'maintenance'
        };
        
        return templateMap[commitType] || 'general';
    }

    /**
     * Build prompt for PR content analysis
     * @param {string} diffContent - Git diff content
     * @returns {string} Formatted prompt
     */
    buildPRAnalysisPrompt(diffContent) {
        return `Analyze the following git diff and generate a clean JSON object with three keys: "title" (a conventional commit-style PR title), "body" (a detailed PR description in Markdown format), and "summary" (a one-sentence summary for a project manager). Do not add any text before or after the JSON object. Diff:\n\n${diffContent}`;
    }

    /**
     * Generate content with retry logic
     * @param {string} prompt - The prompt to send to AI
     * @param {string} modelName - Model to use (optional)
     * @returns {Promise<Object>} Generated content
     */
    async generateWithRetry(prompt, modelName = this.defaultModel) {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        let lastError;

        for (let retryCount = 0; retryCount < this.maxRetries; retryCount++) {
            try {
                const result = await model.generateContent(prompt);
                const jsonString = result.response.text().replace(/```json\n|```/g, '').trim();
                return JSON.parse(jsonString);
            } catch (error) {
                lastError = error;
                
                if (error.message.includes('overloaded') || error.message.includes('503')) {
                    if (retryCount < this.maxRetries - 1) {
                        const waitTime = (retryCount + 1) * 2; // 2, 4, 6 seconds
                        console.log(chalk.yellow(`   - AI service overloaded, retrying in ${waitTime}s... (${retryCount + 1}/${this.maxRetries})`));
                        await this.sleep(waitTime * 1000);
                        continue;
                    }
                }
                
                // If it's not a retryable error, break out of the loop
                if (retryCount >= this.maxRetries - 1) {
                    break;
                }
            }
        }

        throw lastError;
    }

    /**
     * Generate fallback PR content when AI is unavailable
     * @param {Object} context - Current execution context
     * @returns {Object} Fallback PR content
     */
    generateFallbackPRContent(context) {
        const ticketId = context.linear?.ticketId || 'UNKNOWN';
        const diffStats = context.git?.diffStats || '';
        const diff = context.git?.diff || '';

        const filesChanged = diff.split('\n')
            .filter(line => line.startsWith('diff --git'))
            .map(line => line.replace('diff --git a/', '- '))
            .join('\n');

        return {
            title: `feat: ${ticketId} - Update implementation`,
            body: `## Changes\n\nThis PR addresses ticket ${ticketId}.\n\n### Diff Summary\n\`\`\`\n${diffStats}\n\`\`\`\n\n### Files Changed\n${filesChanged}`,
            summary: `Updated implementation for ${ticketId} with code changes across multiple files.`
        };
    }

    /**
     * Analyze code quality and complexity
     * @param {Object} context - Current execution context
     * @returns {Promise<Object>} Code quality analysis
     */
    async analyzeCodeQuality(context) {
        // Placeholder for future implementation
        return {
            complexity: 'medium',
            maintainability: 'good',
            testability: 'good',
            suggestions: []
        };
    }

    /**
     * Analyze security implications of code changes
     * @param {Object} context - Current execution context
     * @returns {Promise<Object>} Security analysis
     */
    async analyzeSecurityImplications(context) {
        // Placeholder for future implementation
        return {
            vulnerabilities: [],
            recommendations: []
        };
    }

    /**
     * Generate documentation from code changes
     * @param {Object} context - Current execution context
     * @returns {Promise<Object>} Documentation suggestions
     */
    async generateDocumentation(context) {
        // Placeholder for future implementation
        return {
            missing: [],
            outdated: [],
            suggestions: []
        };
    }

    /**
     * Sleep utility for retry delays
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if AI service is available
     * @returns {boolean} Whether AI service is configured
     */
    isAvailable() {
        return !!(process.env.GEMINI_API_KEY || this.config.get('ai.gemini.apiKey'));
    }
}

module.exports = AIAnalysisEngine;