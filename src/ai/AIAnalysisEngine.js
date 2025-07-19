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