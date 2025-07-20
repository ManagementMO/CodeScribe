const chalk = require('chalk');

/**
 * GitHub Tracking Reporter - Comprehensive tracking and reporting for GitHub operations
 * Provides detailed PR descriptions, code review context, impact analysis, and automated status updates
 */
class GitHubTrackingReporter {
    constructor(octokit, config) {
        this.octokit = octokit;
        this.config = config;
        this.reportingEnabled = config.get('github.reporting.enabled', true);
        this.trackingData = new Map(); // Store tracking data for PRs
    }

    /**
     * Generate comprehensive PR description with code analysis and impact assessment
     * @param {Object} context - Current execution context
     * @param {Object} changeAnalysis - Detailed change analysis
     * @param {Object} aiAnalysis - AI-generated analysis
     * @returns {Object} Enhanced PR content
     */
    generateComprehensivePRDescription(context, changeAnalysis, aiAnalysis) {
        const { git, linear, code } = context;
        const { complexity, security, dependencies, metrics } = changeAnalysis;

        // Build comprehensive PR body
        const sections = [];

        // Header with ticket reference
        if (linear?.ticketId) {
            sections.push(`## 🎫 Ticket Reference\n\n**Linear Ticket:** ${linear.ticketId}\n**Branch:** \`${git.branch}\``);
        }

        // AI-generated summary
        if (aiAnalysis?.summary) {
            sections.push(`## 📋 Summary\n\n${aiAnalysis.summary}`);
        }

        // Change overview
        sections.push(this.generateChangeOverview(metrics, code.changedFiles));

        // Impact analysis
        sections.push(this.generateImpactAnalysis(complexity, security, dependencies));

        // Code quality metrics
        sections.push(this.generateCodeQualitySection(changeAnalysis));

        // Files changed breakdown
        sections.push(this.generateFilesChangedSection(code.changedFiles));

        // Testing information
        sections.push(this.generateTestingSection(changeAnalysis));

        // Review checklist
        sections.push(this.generateReviewChecklist(changeAnalysis));

        return {
            title: aiAnalysis?.title || this.generateFallbackTitle(context),
            body: sections.join('\n\n---\n\n'),
            summary: aiAnalysis?.summary || `Code changes for ${linear?.ticketId || 'feature update'}`
        };
    }

    /**
     * Generate change overview section
     * @param {Object} metrics - Code metrics
     * @param {Array} changedFiles - Changed files
     * @returns {string} Change overview markdown
     */
    generateChangeOverview(metrics, changedFiles) {
        const fileCount = changedFiles?.length || 0;
        const addedLines = metrics?.addedLines || 0;
        const removedLines = metrics?.removedLines || 0;
        const netChange = addedLines - removedLines;

        return `## 📊 Change Overview

| Metric | Value |
|--------|-------|
| Files Changed | ${fileCount} |
| Lines Added | +${addedLines} |
| Lines Removed | -${removedLines} |
| Net Change | ${netChange >= 0 ? '+' : ''}${netChange} |
| Complexity Score | ${metrics?.complexityScore || 'N/A'} |`;
    }

    /**
     * Generate impact analysis section
     * @param {Object} complexity - Complexity analysis
     * @param {Object} security - Security analysis
     * @param {Object} dependencies - Dependency analysis
     * @returns {string} Impact analysis markdown
     */
    generateImpactAnalysis(complexity, security, dependencies) {
        const impacts = [];

        // Performance impact
        const perfImpact = this.assessPerformanceImpact(complexity);
        impacts.push(`**Performance:** ${this.getImpactEmoji(perfImpact)} ${perfImpact.replace('_', ' ')}`);

        // Security impact
        const securityLevel = security?.riskLevel || 'none';
        impacts.push(`**Security:** ${this.getSecurityEmoji(securityLevel)} ${securityLevel}`);

        // Maintainability impact
        const maintainability = this.assessMaintainabilityImpact(complexity);
        impacts.push(`**Maintainability:** ${this.getMaintainabilityEmoji(maintainability)} ${maintainability}`);

        // Breaking changes
        const hasBreaking = this.hasBreakingChanges(dependencies);
        impacts.push(`**Breaking Changes:** ${hasBreaking ? '⚠️ Yes' : '✅ No'}`);

        return `## 🎯 Impact Analysis

${impacts.join('\n')}

${this.generateImpactDetails(complexity, security, dependencies)}`;
    }

    /**
     * Generate code quality section
     * @param {Object} changeAnalysis - Change analysis data
     * @returns {string} Code quality markdown
     */
    generateCodeQualitySection(changeAnalysis) {
        const { complexity, security, dependencies } = changeAnalysis;
        
        const qualityItems = [];

        // Complexity assessment
        if (complexity?.level) {
            const level = complexity.level;
            const emoji = level === 'low' ? '🟢' : level === 'medium' ? '🟡' : '🔴';
            qualityItems.push(`${emoji} **Complexity:** ${level} (${complexity.totalScore || 0} points)`);
        }

        // Security assessment
        if (security?.riskLevel && security.riskLevel !== 'none') {
            const emoji = this.getSecurityEmoji(security.riskLevel);
            qualityItems.push(`${emoji} **Security Risk:** ${security.riskLevel}`);
            
            if (security.vulnerabilities?.length > 0) {
                qualityItems.push(`  - ${security.vulnerabilities.length} potential vulnerabilities detected`);
            }
        }

        // Dependency changes
        if (dependencies?.added?.length > 0 || dependencies?.updated?.length > 0) {
            qualityItems.push(`📦 **Dependencies:** ${dependencies.added?.length || 0} added, ${dependencies.updated?.length || 0} updated`);
        }

        return `## 🔍 Code Quality

${qualityItems.length > 0 ? qualityItems.join('\n') : '✅ No quality issues detected'}`;
    }

    /**
     * Generate files changed section
     * @param {Array} changedFiles - Changed files
     * @returns {string} Files changed markdown
     */
    generateFilesChangedSection(changedFiles) {
        if (!changedFiles || changedFiles.length === 0) {
            return '## 📁 Files Changed\n\nNo files changed.';
        }

        const filesByType = this.categorizeFiles(changedFiles);
        const sections = [];

        Object.entries(filesByType).forEach(([type, files]) => {
            if (files.length > 0) {
                sections.push(`**${type}:**`);
                files.forEach(file => {
                    const statusEmoji = this.getFileStatusEmoji(file.status);
                    sections.push(`- ${statusEmoji} \`${file.path}\` ${file.lines ? `(${file.lines} lines)` : ''}`);
                });
                sections.push('');
            }
        });

        return `## 📁 Files Changed\n\n${sections.join('\n')}`;
    }

    /**
     * Generate testing section
     * @param {Object} changeAnalysis - Change analysis data
     * @returns {string} Testing section markdown
     */
    generateTestingSection(changeAnalysis) {
        const { code } = changeAnalysis;
        const testFiles = code?.changedFiles?.filter(f => f.isTest) || [];
        const hasTests = testFiles.length > 0;

        let content = `## 🧪 Testing\n\n`;

        if (hasTests) {
            content += `✅ **Test files updated:** ${testFiles.length}\n\n`;
            testFiles.forEach(test => {
                content += `- \`${test.path}\`\n`;
            });
        } else {
            content += `⚠️ **No test files were modified**\n\n`;
            content += `Consider adding tests for:\n`;
            const codeFiles = code?.changedFiles?.filter(f => f.isJavaScript && !f.isTest) || [];
            codeFiles.slice(0, 3).forEach(file => {
                content += `- \`${file.path}\`\n`;
            });
        }

        return content;
    }

    /**
     * Generate review checklist
     * @param {Object} changeAnalysis - Change analysis data
     * @returns {string} Review checklist markdown
     */
    generateReviewChecklist(changeAnalysis) {
        const { complexity, security, dependencies } = changeAnalysis;
        
        const checklist = [
            '- [ ] Code follows project conventions and style guidelines',
            '- [ ] All new functionality is properly tested',
            '- [ ] Documentation has been updated if necessary',
            '- [ ] No sensitive information is exposed in the code'
        ];

        // Add complexity-specific items
        if (complexity?.level === 'high' || complexity?.level === 'very_high') {
            checklist.push('- [ ] High complexity code has been reviewed for simplification opportunities');
            checklist.push('- [ ] Complex logic is properly documented');
        }

        // Add security-specific items
        if (security?.riskLevel === 'high' || security?.riskLevel === 'medium') {
            checklist.push('- [ ] Security implications have been thoroughly reviewed');
            checklist.push('- [ ] Input validation and sanitization are properly implemented');
        }

        // Add dependency-specific items
        if (dependencies?.added?.length > 0) {
            checklist.push('- [ ] New dependencies are necessary and from trusted sources');
            checklist.push('- [ ] License compatibility has been verified');
        }

        return `## ✅ Review Checklist\n\n${checklist.join('\n')}`;
    }

    /**
     * Track PR creation and updates
     * @param {Object} prData - PR data from GitHub API
     * @param {Object} context - Current execution context
     * @param {Object} changeAnalysis - Change analysis data
     */
    trackPRActivity(prData, context, changeAnalysis) {
        if (!this.reportingEnabled) return;

        const trackingInfo = {
            prNumber: prData.number,
            title: prData.title,
            branch: context.git.branch,
            ticketId: context.linear?.ticketId,
            createdAt: prData.created_at,
            updatedAt: prData.updated_at,
            isUpdate: prData.isUpdate || false,
            metrics: {
                filesChanged: changeAnalysis.code?.changedFiles?.length || 0,
                linesAdded: changeAnalysis.metrics?.addedLines || 0,
                linesRemoved: changeAnalysis.metrics?.removedLines || 0,
                complexityLevel: changeAnalysis.complexity?.level || 'unknown',
                securityRisk: changeAnalysis.security?.riskLevel || 'none'
            },
            url: prData.html_url
        };

        this.trackingData.set(prData.number, trackingInfo);
        this.logPRActivity(trackingInfo);
    }

    /**
     * Generate activity report for tracked PRs
     * @returns {Object} Activity report
     */
    generateActivityReport() {
        const prs = Array.from(this.trackingData.values());
        
        return {
            totalPRs: prs.length,
            updates: prs.filter(pr => pr.isUpdate).length,
            newPRs: prs.filter(pr => !pr.isUpdate).length,
            averageComplexity: this.calculateAverageComplexity(prs),
            securityRisks: prs.filter(pr => pr.metrics.securityRisk !== 'none').length,
            summary: this.generateReportSummary(prs)
        };
    }

    /**
     * Update PR with additional context after creation
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {number} prNumber - PR number
     * @param {Object} additionalContext - Additional context to add
     */
    async updatePRWithContext(owner, repo, prNumber, additionalContext) {
        try {
            const currentPR = await this.octokit.pulls.get({
                owner,
                repo,
                pull_number: prNumber
            });

            const updatedBody = this.appendContextToPRBody(currentPR.data.body, additionalContext);

            await this.octokit.pulls.update({
                owner,
                repo,
                pull_number: prNumber,
                body: updatedBody
            });

            console.log(chalk.green(`   - Updated PR #${prNumber} with additional context`));
        } catch (error) {
            console.log(chalk.yellow(`   - Failed to update PR context: ${error.message}`));
        }
    }

    /**
     * Add automated status updates to PR
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {number} prNumber - PR number
     * @param {Object} statusUpdate - Status update information
     */
    async addStatusUpdate(owner, repo, prNumber, statusUpdate) {
        try {
            const comment = this.formatStatusUpdate(statusUpdate);
            
            await this.octokit.issues.createComment({
                owner,
                repo,
                issue_number: prNumber,
                body: comment
            });

            console.log(chalk.green(`   - Added status update to PR #${prNumber}`));
        } catch (error) {
            console.log(chalk.yellow(`   - Failed to add status update: ${error.message}`));
        }
    }

    // Helper methods

    /**
     * Assess performance impact
     * @param {Object} complexity - Complexity data
     * @returns {string} Performance impact level
     */
    assessPerformanceImpact(complexity) {
        if (!complexity?.level) return 'low_impact';
        
        switch (complexity.level) {
            case 'very_high': return 'high_impact';
            case 'high': return 'medium_impact';
            case 'medium': return 'low_impact';
            default: return 'low_impact';
        }
    }

    /**
     * Assess maintainability impact
     * @param {Object} complexity - Complexity data
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
     * Check for breaking changes
     * @param {Object} dependencies - Dependency data
     * @returns {boolean} Whether breaking changes exist
     */
    hasBreakingChanges(dependencies) {
        return dependencies?.breakingChanges?.length > 0 || false;
    }

    /**
     * Get emoji for impact level
     * @param {string} impact - Impact level
     * @returns {string} Emoji
     */
    getImpactEmoji(impact) {
        const emojiMap = {
            'low_impact': '🟢',
            'medium_impact': '🟡',
            'high_impact': '🔴'
        };
        return emojiMap[impact] || '⚪';
    }

    /**
     * Get emoji for security level
     * @param {string} level - Security level
     * @returns {string} Emoji
     */
    getSecurityEmoji(level) {
        const emojiMap = {
            'none': '✅',
            'low': '🟡',
            'medium': '🟠',
            'high': '🔴'
        };
        return emojiMap[level] || '⚪';
    }

    /**
     * Get emoji for maintainability
     * @param {string} maintainability - Maintainability level
     * @returns {string} Emoji
     */
    getMaintainabilityEmoji(maintainability) {
        const emojiMap = {
            'improved': '📈',
            'unchanged': '➡️',
            'degraded': '📉'
        };
        return emojiMap[maintainability] || '➡️';
    }

    /**
     * Get emoji for file status
     * @param {string} status - File status
     * @returns {string} Emoji
     */
    getFileStatusEmoji(status) {
        const emojiMap = {
            'added': '➕',
            'modified': '📝',
            'deleted': '➖',
            'renamed': '🔄'
        };
        return emojiMap[status] || '📝';
    }

    /**
     * Categorize files by type
     * @param {Array} files - Changed files
     * @returns {Object} Files categorized by type
     */
    categorizeFiles(files) {
        const categories = {
            'Source Code': [],
            'Tests': [],
            'Configuration': [],
            'Documentation': [],
            'Other': []
        };

        files.forEach(file => {
            if (file.isTest) {
                categories['Tests'].push(file);
            } else if (file.isConfig) {
                categories['Configuration'].push(file);
            } else if (file.isDocumentation) {
                categories['Documentation'].push(file);
            } else if (file.isJavaScript || file.isTypeScript) {
                categories['Source Code'].push(file);
            } else {
                categories['Other'].push(file);
            }
        });

        return categories;
    }

    /**
     * Generate impact details
     * @param {Object} complexity - Complexity data
     * @param {Object} security - Security data
     * @param {Object} dependencies - Dependencies data
     * @returns {string} Impact details
     */
    generateImpactDetails(complexity, security, dependencies) {
        const details = [];

        if (complexity?.level === 'high' || complexity?.level === 'very_high') {
            details.push('⚠️ **High complexity detected** - Consider refactoring for better maintainability');
        }

        if (security?.riskLevel === 'high') {
            details.push('🚨 **High security risk** - Thorough security review required');
        }

        if (dependencies?.breakingChanges?.length > 0) {
            details.push('💥 **Breaking changes detected** - May affect existing functionality');
        }

        return details.length > 0 ? `\n${details.join('\n')}` : '';
    }

    /**
     * Generate fallback title
     * @param {Object} context - Current context
     * @returns {string} Fallback title
     */
    generateFallbackTitle(context) {
        const ticketId = context.linear?.ticketId || 'UNKNOWN';
        return `feat: ${ticketId} - Update implementation`;
    }

    /**
     * Log PR activity
     * @param {Object} trackingInfo - Tracking information
     */
    logPRActivity(trackingInfo) {
        const action = trackingInfo.isUpdate ? 'Updated' : 'Created';
        console.log(chalk.blue(`   - ${action} PR #${trackingInfo.prNumber}: ${trackingInfo.title}`));
        console.log(chalk.gray(`     Files: ${trackingInfo.metrics.filesChanged}, Complexity: ${trackingInfo.metrics.complexityLevel}`));
    }

    /**
     * Calculate average complexity
     * @param {Array} prs - PR data
     * @returns {string} Average complexity
     */
    calculateAverageComplexity(prs) {
        const complexityLevels = { 'low': 1, 'medium': 2, 'high': 3, 'very_high': 4 };
        const total = prs.reduce((sum, pr) => sum + (complexityLevels[pr.metrics.complexityLevel] || 1), 0);
        const average = total / prs.length;
        
        if (average <= 1.5) return 'low';
        if (average <= 2.5) return 'medium';
        if (average <= 3.5) return 'high';
        return 'very_high';
    }

    /**
     * Generate report summary
     * @param {Array} prs - PR data
     * @returns {string} Report summary
     */
    generateReportSummary(prs) {
        if (prs.length === 0) return 'No PR activity recorded';
        
        const totalFiles = prs.reduce((sum, pr) => sum + pr.metrics.filesChanged, 0);
        const totalLines = prs.reduce((sum, pr) => sum + pr.metrics.linesAdded + pr.metrics.linesRemoved, 0);
        
        return `${prs.length} PRs processed, ${totalFiles} files changed, ${totalLines} lines modified`;
    }

    /**
     * Append context to PR body
     * @param {string} currentBody - Current PR body
     * @param {Object} additionalContext - Additional context
     * @returns {string} Updated PR body
     */
    appendContextToPRBody(currentBody, additionalContext) {
        const contextSection = `\n\n---\n\n## 🔄 Additional Context\n\n${additionalContext.message}`;
        return currentBody + contextSection;
    }

    /**
     * Format status update
     * @param {Object} statusUpdate - Status update data
     * @returns {string} Formatted status update
     */
    formatStatusUpdate(statusUpdate) {
        const timestamp = new Date().toISOString();
        return `## 🤖 Automated Status Update\n\n**Timestamp:** ${timestamp}\n**Status:** ${statusUpdate.status}\n\n${statusUpdate.message}`;
    }
}

module.exports = GitHubTrackingReporter;