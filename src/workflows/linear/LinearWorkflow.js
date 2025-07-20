const BaseWorkflow = require('../BaseWorkflow');
const axios = require('axios');
const chalk = require('chalk');

/**
 * Enhanced Linear Workflow - Handles advanced Linear ticket management with automatic status transitions,
 * time tracking, and scope change detection
 */
class LinearWorkflow extends BaseWorkflow {
    constructor(config) {
        super(config, 'linear');
        this.apiKey = process.env.LINEAR_API_KEY || config.get('linear.apiKey');
        this.apiUrl = 'https://api.linear.app/graphql';
        
        // Enhanced configuration options
        this.autoTransition = config.get('workflows.linear.autoTransition', true);
        this.trackTime = config.get('workflows.linear.trackTime', false);
        this.detectScopeChanges = config.get('workflows.linear.detectScopeChanges', true);
        this.notifyOnScopeChange = config.get('workflows.linear.notifyOnScopeChange', true);
        
        // Status transition mappings based on development progress
        this.statusTransitions = {
            'Todo': {
                onBranchCreated: 'In Progress',
                onFirstCommit: 'In Progress',
                onPRCreated: 'In Review',
                onPRApproved: 'Ready for Deploy',
                onPRMerged: 'Done'
            },
            'Backlog': {
                onBranchCreated: 'In Progress',
                onFirstCommit: 'In Progress',
                onPRCreated: 'In Review',
                onPRApproved: 'Ready for Deploy',
                onPRMerged: 'Done'
            },
            'In Progress': {
                onPRCreated: 'In Review',
                onPRApproved: 'Ready for Deploy',
                onPRMerged: 'Done'
            },
            'In Review': {
                onPRApproved: 'Ready for Deploy',
                onPRMerged: 'Done',
                onPRChangesRequested: 'In Progress'
            },
            'Ready for Deploy': {
                onPRMerged: 'Done'
            }
        };
        
        // Time tracking state
        this.timeTrackingState = new Map();
    }

    /**
     * Execute enhanced Linear workflow operations with advanced ticket management
     * @param {Object} context - Current execution context
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} Linear workflow results
     */
    async execute(context, options = {}) {
        if (!this.isEnabled()) {
            this.log('Linear workflow is disabled, skipping...');
            return { skipped: true };
        }

        if (!context.linear?.ticketId) {
            throw new Error('No Linear ticket ID found in context');
        }

        try {
            // Get the issue details with enhanced information
            const issue = await this.getEnhancedIssueByIdentifier(context.linear.ticketId);
            
            // Detect development progress and determine appropriate actions
            const progressAnalysis = await this.analyzeDevelopmentProgress(context, issue);
            
            // Handle automatic status transitions
            const statusTransitionResult = await this.handleStatusTransitions(issue, progressAnalysis, context);
            
            // Handle time tracking
            const timeTrackingResult = await this.handleTimeTracking(issue, progressAnalysis, context);
            
            // Detect and handle scope changes
            const scopeChangeResult = await this.detectAndHandleScopeChanges(issue, context);
            
            // Handle sub-ticket creation for complex changes
            const subTicketResult = await this.createSubTicketsForComplexChanges(issue, context);
            
            // Create enhanced comment content
            const commentBody = this.generateEnhancedCommentBody(context, progressAnalysis, statusTransitionResult, timeTrackingResult, scopeChangeResult, subTicketResult);
            
            // Add comment to the issue
            await this.addCommentToIssue(issue.id, commentBody);

            this.log(`Linear ticket ${context.linear.ticketId} updated successfully with advanced management`, 'info');

            return {
                ticketId: context.linear.ticketId,
                issueId: issue.id,
                commentAdded: true,
                issue: issue,
                progressAnalysis,
                statusTransition: statusTransitionResult,
                timeTracking: timeTrackingResult,
                scopeChange: scopeChangeResult,
                subTickets: subTicketResult
            };

        } catch (error) {
            this.log(`Enhanced Linear workflow failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get Linear issue by identifier (e.g., TIX-123)
     * @param {string} identifier - Linear issue identifier
     * @returns {Promise<Object>} Issue data
     */
    async getIssueByIdentifier(identifier) {
        console.log(chalk.blue(`   - Looking up Linear ticket ${identifier}...`));

        const query = `
            query {
                issues(first: 50) {
                    nodes {
                        id
                        identifier
                        title
                        state {
                            name
                        }
                    }
                }
            }
        `;

        const response = await this.makeGraphQLRequest(query);
        const issues = response.data.issues.nodes;
        const issue = issues.find(issue => issue.identifier === identifier);
        
        if (!issue) {
            throw new Error(`Could not find Linear issue with identifier ${identifier}`);
        }

        return issue;
    }

    /**
     * Get enhanced Linear issue by identifier with additional metadata
     * @param {string} identifier - Linear issue identifier
     * @returns {Promise<Object>} Enhanced issue data
     */
    async getEnhancedIssueByIdentifier(identifier) {
        console.log(chalk.blue(`   - Looking up Linear ticket ${identifier} with enhanced details...`));

        const query = `
            query {
                issues(first: 50) {
                    nodes {
                        id
                        identifier
                        title
                        description
                        priority
                        estimate
                        state {
                            id
                            name
                            type
                        }
                        assignee {
                            id
                            name
                            email
                        }
                        project {
                            id
                            name
                        }
                        team {
                            id
                            name
                        }
                        labels {
                            nodes {
                                id
                                name
                                color
                            }
                        }
                        comments {
                            nodes {
                                id
                                body
                                createdAt
                                user {
                                    name
                                }
                            }
                        }
                        createdAt
                        updatedAt
                        startedAt
                        completedAt
                        dueDate
                        cycle {
                            id
                            name
                            startsAt
                            endsAt
                        }
                    }
                }
            }
        `;

        const response = await this.makeGraphQLRequest(query);
        const issues = response.data.issues.nodes;
        const issue = issues.find(issue => issue.identifier === identifier);
        
        if (!issue) {
            throw new Error(`Could not find Linear issue with identifier ${identifier}`);
        }

        return issue;
    }

    /**
     * Analyze development progress based on context and determine appropriate actions
     * @param {Object} context - Current execution context
     * @param {Object} issue - Linear issue data
     * @returns {Promise<Object>} Progress analysis results
     */
    async analyzeDevelopmentProgress(context, issue) {
        console.log(chalk.blue('   - Analyzing development progress...'));

        const analysis = {
            currentPhase: 'unknown',
            suggestedActions: [],
            timeSpent: 0,
            complexity: 'medium',
            riskLevel: 'low',
            blockers: [],
            milestones: []
        };

        // Determine current development phase
        if (context.github?.pr?.merged) {
            analysis.currentPhase = 'completed';
            analysis.milestones.push({ type: 'pr_merged', timestamp: new Date() });
        } else if (context.github?.pr?.state === 'open') {
            if (context.github.pr.review_comments > 0 || context.github.pr.requested_changes) {
                analysis.currentPhase = 'changes_requested';
                analysis.milestones.push({ type: 'changes_requested', timestamp: new Date() });
            } else {
                analysis.currentPhase = 'in_review';
                analysis.milestones.push({ type: 'pr_created', timestamp: new Date() });
            }
        } else if (context.git?.commits?.length > 0) {
            analysis.currentPhase = 'development';
            analysis.milestones.push({ type: 'commits_made', count: context.git.commits.length, timestamp: new Date() });
        } else if (context.git?.branch && context.git.branch !== 'main' && context.git.branch !== 'master') {
            analysis.currentPhase = 'started';
            analysis.milestones.push({ type: 'branch_created', branch: context.git.branch, timestamp: new Date() });
        }

        // Analyze code complexity and risk
        if (context.code?.complexity) {
            analysis.complexity = context.code.complexity.level || 'medium';
            if (context.code.complexity.averageScore > 15) {
                analysis.riskLevel = 'high';
                analysis.blockers.push({
                    type: 'high_complexity',
                    message: `Code complexity score (${context.code.complexity.averageScore}) exceeds recommended threshold`,
                    severity: 'medium'
                });
            }
        }

        // Check for security issues
        if (context.code?.security?.riskLevel === 'high') {
            analysis.riskLevel = 'high';
            analysis.blockers.push({
                type: 'security_risk',
                message: 'High security risk detected in code changes',
                severity: 'high'
            });
        }

        // Estimate time spent based on commits and changes
        if (context.git?.commits) {
            // Rough estimation: 30 minutes per commit + complexity factor
            analysis.timeSpent = context.git.commits.length * 30;
            if (analysis.complexity === 'high') analysis.timeSpent *= 1.5;
            if (analysis.complexity === 'very_high') analysis.timeSpent *= 2;
        }

        // Generate suggested actions based on current phase
        analysis.suggestedActions = this.generateSuggestedActions(analysis, context, issue);

        return analysis;
    }

    /**
     * Generate suggested actions based on progress analysis
     * @param {Object} analysis - Progress analysis
     * @param {Object} context - Current execution context
     * @param {Object} issue - Linear issue data
     * @returns {Array} Array of suggested actions
     */
    generateSuggestedActions(analysis, context, issue) {
        const actions = [];

        switch (analysis.currentPhase) {
            case 'started':
                actions.push({
                    type: 'status_transition',
                    action: 'Move to In Progress',
                    reason: 'Branch created and work has begun'
                });
                if (this.trackTime) {
                    actions.push({
                        type: 'time_tracking',
                        action: 'Start time tracking',
                        reason: 'Development work has started'
                    });
                }
                break;

            case 'development':
                actions.push({
                    type: 'status_transition',
                    action: 'Keep In Progress',
                    reason: 'Active development in progress'
                });
                if (analysis.complexity === 'high' || analysis.complexity === 'very_high') {
                    actions.push({
                        type: 'scope_review',
                        action: 'Review ticket scope',
                        reason: 'High complexity detected - may need to break down into sub-tasks'
                    });
                }
                break;

            case 'in_review':
                actions.push({
                    type: 'status_transition',
                    action: 'Move to In Review',
                    reason: 'Pull request created and ready for review'
                });
                break;

            case 'changes_requested':
                actions.push({
                    type: 'status_transition',
                    action: 'Move back to In Progress',
                    reason: 'Changes requested in code review'
                });
                break;

            case 'completed':
                actions.push({
                    type: 'status_transition',
                    action: 'Move to Done',
                    reason: 'Pull request merged successfully'
                });
                if (this.trackTime) {
                    actions.push({
                        type: 'time_tracking',
                        action: 'Stop time tracking',
                        reason: 'Work completed'
                    });
                }
                break;
        }

        // Add blocker-related actions
        for (const blocker of analysis.blockers) {
            if (blocker.severity === 'high') {
                actions.push({
                    type: 'blocker_notification',
                    action: 'Notify team of blocker',
                    reason: blocker.message
                });
            }
        }

        return actions;
    }

    /**
     * Handle automatic status transitions based on development progress
     * @param {Object} issue - Linear issue data
     * @param {Object} progressAnalysis - Progress analysis results
     * @param {Object} context - Current execution context
     * @returns {Promise<Object>} Status transition results
     */
    async handleStatusTransitions(issue, progressAnalysis, context) {
        if (!this.autoTransition) {
            return { skipped: true, reason: 'Auto-transition disabled' };
        }

        console.log(chalk.blue('   - Handling automatic status transitions...'));

        const currentStatus = issue.state.name;
        const transitions = this.statusTransitions[currentStatus];
        
        if (!transitions) {
            return { skipped: true, reason: `No transitions defined for status: ${currentStatus}` };
        }

        let targetStatus = null;
        let transitionReason = '';

        // Determine target status based on development progress
        switch (progressAnalysis.currentPhase) {
            case 'started':
                targetStatus = transitions.onBranchCreated || transitions.onFirstCommit;
                transitionReason = 'Development work started';
                break;
            case 'development':
                targetStatus = transitions.onFirstCommit;
                transitionReason = 'Active development in progress';
                break;
            case 'in_review':
                targetStatus = transitions.onPRCreated;
                transitionReason = 'Pull request created for review';
                break;
            case 'changes_requested':
                targetStatus = transitions.onPRChangesRequested;
                transitionReason = 'Changes requested in code review';
                break;
            case 'completed':
                targetStatus = transitions.onPRMerged;
                transitionReason = 'Pull request merged successfully';
                break;
        }

        if (!targetStatus || targetStatus === currentStatus) {
            return { 
                skipped: true, 
                reason: `No status change needed (current: ${currentStatus}, target: ${targetStatus})` 
            };
        }

        try {
            // Get available workflow states for the team
            const workflowStates = await this.getWorkflowStates(issue.team.id);
            const targetState = workflowStates.find(state => state.name === targetStatus);

            if (!targetState) {
                return { 
                    failed: true, 
                    reason: `Target status '${targetStatus}' not found in workflow` 
                };
            }

            // Update issue status
            await this.updateIssueStatus(issue.id, targetState.id);

            this.log(`Status transitioned from '${currentStatus}' to '${targetStatus}': ${transitionReason}`, 'info');

            return {
                success: true,
                fromStatus: currentStatus,
                toStatus: targetStatus,
                reason: transitionReason,
                timestamp: new Date()
            };

        } catch (error) {
            this.log(`Status transition failed: ${error.message}`, 'error');
            return {
                failed: true,
                error: error.message,
                fromStatus: currentStatus,
                targetStatus: targetStatus
            };
        }
    }

    /**
     * Handle time tracking integration with development activities
     * @param {Object} issue - Linear issue data
     * @param {Object} progressAnalysis - Progress analysis results
     * @param {Object} context - Current execution context
     * @returns {Promise<Object>} Time tracking results
     */
    async handleTimeTracking(issue, progressAnalysis, context) {
        if (!this.trackTime) {
            return { skipped: true, reason: 'Time tracking disabled' };
        }

        console.log(chalk.blue('   - Handling time tracking...'));

        const ticketId = issue.identifier;
        const currentTime = new Date();
        
        let timeTrackingResult = {
            action: 'none',
            timeSpent: 0,
            totalTime: 0,
            efficiency: 'normal'
        };

        // Get existing time tracking state
        const existingState = this.timeTrackingState.get(ticketId) || {
            startTime: null,
            totalTime: 0,
            sessions: []
        };

        switch (progressAnalysis.currentPhase) {
            case 'started':
            case 'development':
                if (!existingState.startTime) {
                    // Start time tracking
                    existingState.startTime = currentTime;
                    timeTrackingResult.action = 'started';
                    this.log(`Time tracking started for ${ticketId}`, 'info');
                } else {
                    // Continue tracking - calculate session time
                    const sessionTime = Math.floor((currentTime - existingState.startTime) / (1000 * 60)); // minutes
                    timeTrackingResult.action = 'continuing';
                    timeTrackingResult.timeSpent = sessionTime;
                }
                break;

            case 'completed':
                if (existingState.startTime) {
                    // Stop time tracking and calculate total
                    const sessionTime = Math.floor((currentTime - existingState.startTime) / (1000 * 60)); // minutes
                    existingState.sessions.push({
                        startTime: existingState.startTime,
                        endTime: currentTime,
                        duration: sessionTime
                    });
                    existingState.totalTime += sessionTime;
                    existingState.startTime = null;
                    
                    timeTrackingResult.action = 'completed';
                    timeTrackingResult.timeSpent = sessionTime;
                    timeTrackingResult.totalTime = existingState.totalTime;
                    
                    // Calculate efficiency based on estimate vs actual
                    if (issue.estimate && existingState.totalTime > 0) {
                        const estimateMinutes = issue.estimate * 60; // assuming estimate is in hours
                        const efficiency = estimateMinutes / existingState.totalTime;
                        if (efficiency > 1.2) timeTrackingResult.efficiency = 'high';
                        else if (efficiency < 0.8) timeTrackingResult.efficiency = 'low';
                    }

                    this.log(`Time tracking completed for ${ticketId}. Total time: ${existingState.totalTime} minutes`, 'info');
                }
                break;

            case 'in_review':
                if (existingState.startTime) {
                    // Pause time tracking during review
                    const sessionTime = Math.floor((currentTime - existingState.startTime) / (1000 * 60));
                    existingState.sessions.push({
                        startTime: existingState.startTime,
                        endTime: currentTime,
                        duration: sessionTime,
                        phase: 'development'
                    });
                    existingState.totalTime += sessionTime;
                    existingState.startTime = null;
                    
                    timeTrackingResult.action = 'paused';
                    timeTrackingResult.timeSpent = sessionTime;
                    timeTrackingResult.totalTime = existingState.totalTime;
                }
                break;
        }

        // Update time tracking state
        this.timeTrackingState.set(ticketId, existingState);

        // Log time to Linear if we have a significant session
        if (timeTrackingResult.timeSpent > 5) { // Only log sessions longer than 5 minutes
            try {
                await this.logTimeToLinear(issue.id, timeTrackingResult.timeSpent, progressAnalysis.currentPhase);
                timeTrackingResult.loggedToLinear = true;
            } catch (error) {
                this.log(`Failed to log time to Linear: ${error.message}`, 'warn');
                timeTrackingResult.loggedToLinear = false;
            }
        }

        return timeTrackingResult;
    }

    /**
     * Detect and handle scope changes in the ticket
     * @param {Object} issue - Linear issue data
     * @param {Object} context - Current execution context
     * @returns {Promise<Object>} Scope change detection results
     */
    async detectAndHandleScopeChanges(issue, context) {
        if (!this.detectScopeChanges) {
            return { skipped: true, reason: 'Scope change detection disabled' };
        }

        console.log(chalk.blue('   - Detecting scope changes...'));

        const scopeAnalysis = {
            hasChanges: false,
            changes: [],
            riskLevel: 'low',
            recommendations: []
        };

        // Analyze code complexity vs original estimate
        if (issue.estimate && context.code?.complexity) {
            const complexityScore = context.code.complexity.averageScore || 0;
            const estimatedComplexity = issue.estimate * 5; // rough mapping: 1 hour = 5 complexity points
            
            if (complexityScore > estimatedComplexity * 1.5) {
                scopeAnalysis.hasChanges = true;
                scopeAnalysis.changes.push({
                    type: 'complexity_increase',
                    severity: 'medium',
                    message: `Code complexity (${complexityScore}) significantly exceeds estimated complexity (${estimatedComplexity})`,
                    impact: 'May require additional development time'
                });
                scopeAnalysis.riskLevel = 'medium';
            }
        }

        // Analyze file changes vs typical scope
        if (context.code?.changedFiles) {
            const fileCount = context.code.changedFiles.length;
            const jsFileCount = context.code.changedFiles.filter(f => f.isJavaScript).length;
            
            if (fileCount > 10) {
                scopeAnalysis.hasChanges = true;
                scopeAnalysis.changes.push({
                    type: 'file_count_high',
                    severity: 'low',
                    message: `High number of files changed (${fileCount})`,
                    impact: 'May indicate scope creep or complex refactoring'
                });
            }

            if (jsFileCount > 5) {
                scopeAnalysis.hasChanges = true;
                scopeAnalysis.changes.push({
                    type: 'js_file_count_high',
                    severity: 'medium',
                    message: `High number of JavaScript files changed (${jsFileCount})`,
                    impact: 'Increased testing and review requirements'
                });
            }
        }

        // Check for new dependencies
        if (context.code?.dependencies?.added?.length > 0) {
            scopeAnalysis.hasChanges = true;
            scopeAnalysis.changes.push({
                type: 'new_dependencies',
                severity: 'medium',
                message: `New dependencies added: ${context.code.dependencies.added.map(d => d.package).join(', ')}`,
                impact: 'Security review and approval may be required'
            });
        }

        // Check for breaking changes
        if (context.code?.dependencies?.breakingChanges?.length > 0) {
            scopeAnalysis.hasChanges = true;
            scopeAnalysis.changes.push({
                type: 'breaking_changes',
                severity: 'high',
                message: `Breaking dependency changes detected`,
                impact: 'Additional testing and migration work required'
            });
            scopeAnalysis.riskLevel = 'high';
        }

        // Generate recommendations based on scope changes
        if (scopeAnalysis.hasChanges) {
            scopeAnalysis.recommendations = this.generateScopeChangeRecommendations(scopeAnalysis, issue, context);
            
            // Notify stakeholders if configured
            if (this.notifyOnScopeChange && scopeAnalysis.riskLevel !== 'low') {
                await this.notifyStakeholdersOfScopeChange(issue, scopeAnalysis);
            }
        }

        return scopeAnalysis;
    }

    /**
     * Generate scope change recommendations based on analysis
     * @param {Object} scopeAnalysis - Scope analysis results
     * @param {Object} issue - Linear issue data
     * @param {Object} context - Current execution context
     * @returns {Array} Array of recommendations
     */
    generateScopeChangeRecommendations(scopeAnalysis, issue, context) {
        const recommendations = [];

        for (const change of scopeAnalysis.changes) {
            switch (change.type) {
                case 'complexity_increase':
                    recommendations.push({
                        type: 'estimate_update',
                        message: 'Consider updating the time estimate for this ticket',
                        action: 'Update estimate based on actual complexity'
                    });
                    recommendations.push({
                        type: 'code_review',
                        message: 'Request additional code review due to high complexity',
                        action: 'Add senior developer as reviewer'
                    });
                    break;

                case 'file_count_high':
                case 'js_file_count_high':
                    recommendations.push({
                        type: 'testing_strategy',
                        message: 'Expand testing strategy due to wide-ranging changes',
                        action: 'Add integration tests and increase test coverage'
                    });
                    break;

                case 'new_dependencies':
                    recommendations.push({
                        type: 'security_review',
                        message: 'Security review required for new dependencies',
                        action: 'Run security audit and get approval from security team'
                    });
                    break;

                case 'breaking_changes':
                    recommendations.push({
                        type: 'migration_plan',
                        message: 'Create migration plan for breaking changes',
                        action: 'Document migration steps and coordinate with affected teams'
                    });
                    recommendations.push({
                        type: 'extended_testing',
                        message: 'Extended testing required for breaking changes',
                        action: 'Add regression tests and coordinate staging deployment'
                    });
                    break;
            }
        }

        return recommendations;
    }

    /**
     * Notify stakeholders of significant scope changes
     * @param {Object} issue - Linear issue data
     * @param {Object} scopeAnalysis - Scope analysis results
     * @returns {Promise<void>}
     */
    async notifyStakeholdersOfScopeChange(issue, scopeAnalysis) {
        try {
            const notificationComment = this.generateScopeChangeNotification(issue, scopeAnalysis);
            await this.addCommentToIssue(issue.id, notificationComment);
            this.log(`Stakeholders notified of scope changes for ${issue.identifier}`, 'info');
        } catch (error) {
            this.log(`Failed to notify stakeholders: ${error.message}`, 'warn');
        }
    }

    /**
     * Generate scope change notification comment
     * @param {Object} issue - Linear issue data
     * @param {Object} scopeAnalysis - Scope analysis results
     * @returns {string} Notification comment
     */
    generateScopeChangeNotification(issue, scopeAnalysis) {
        let notification = `⚠️ **Scope Change Detected**\n\n`;
        notification += `The scope of this ticket appears to have changed significantly:\n\n`;

        for (const change of scopeAnalysis.changes) {
            notification += `- **${change.type.replace('_', ' ').toUpperCase()}**: ${change.message}\n`;
            notification += `  - Impact: ${change.impact}\n\n`;
        }

        if (scopeAnalysis.recommendations.length > 0) {
            notification += `**Recommended Actions:**\n`;
            for (const rec of scopeAnalysis.recommendations) {
                notification += `- ${rec.message}: ${rec.action}\n`;
            }
        }

        notification += `\n**Risk Level:** ${scopeAnalysis.riskLevel.toUpperCase()}\n`;
        notification += `\nPlease review and update the ticket accordingly.`;

        return notification;
    }

    /**
     * Get workflow states for a team
     * @param {string} teamId - Linear team ID
     * @returns {Promise<Array>} Array of workflow states
     */
    async getWorkflowStates(teamId) {
        const query = `
            query($teamId: String!) {
                team(id: $teamId) {
                    states {
                        nodes {
                            id
                            name
                            type
                            position
                        }
                    }
                }
            }
        `;

        const variables = { teamId };
        const response = await this.makeGraphQLRequest(query, variables);
        
        if (!response.data.team) {
            throw new Error(`Team not found: ${teamId}`);
        }

        return response.data.team.states.nodes;
    }

    /**
     * Update issue status
     * @param {string} issueId - Linear issue ID
     * @param {string} stateId - Target state ID
     * @returns {Promise<Object>} Update result
     */
    async updateIssueStatus(issueId, stateId) {
        const mutation = `
            mutation($id: String!, $stateId: String!) {
                issueUpdate(id: $id, input: { stateId: $stateId }) {
                    success
                    issue {
                        id
                        state {
                            name
                        }
                    }
                }
            }
        `;

        const variables = {
            id: issueId,
            stateId: stateId
        };

        const response = await this.makeGraphQLRequest(mutation, variables);
        
        if (!response.data.issueUpdate.success) {
            throw new Error('Failed to update issue status in Linear');
        }

        return response.data.issueUpdate.issue;
    }

    /**
     * Log time to Linear issue
     * @param {string} issueId - Linear issue ID
     * @param {number} timeSpent - Time spent in minutes
     * @param {string} phase - Development phase
     * @returns {Promise<Object>} Time log result
     */
    async logTimeToLinear(issueId, timeSpent, phase) {
        // Note: Linear doesn't have a built-in time tracking API, so we'll add a comment instead
        const timeComment = `⏱️ **Time Logged**: ${timeSpent} minutes (${phase} phase)\n\nAutomatically tracked by CodeScribe Agent.`;
        return await this.addCommentToIssue(issueId, timeComment);
    }

    /**
     * Generate enhanced comment body with all analysis results
     * @param {Object} context - Current execution context
     * @param {Object} progressAnalysis - Progress analysis results
     * @param {Object} statusTransitionResult - Status transition results
     * @param {Object} timeTrackingResult - Time tracking results
     * @param {Object} scopeChangeResult - Scope change results
     * @param {Object} subTicketResult - Sub-ticket creation results
     * @returns {string} Enhanced comment body
     */
    generateEnhancedCommentBody(context, progressAnalysis, statusTransitionResult, timeTrackingResult, scopeChangeResult, subTicketResult) {
        const githubResult = context.github;
        const aiResult = context.ai;
        const documentationResult = context.documentation;
        
        let commentBody = `🚀 **CodeScribe Agent - Enhanced Workflow Execution**\n\n`;

        // Development Progress Section
        commentBody += `**Development Progress:**\n`;
        commentBody += `- Current Phase: ${progressAnalysis.currentPhase.replace('_', ' ').toUpperCase()}\n`;
        commentBody += `- Complexity Level: ${progressAnalysis.complexity.toUpperCase()}\n`;
        commentBody += `- Risk Level: ${progressAnalysis.riskLevel.toUpperCase()}\n`;
        
        if (progressAnalysis.timeSpent > 0) {
            commentBody += `- Estimated Time Spent: ${Math.floor(progressAnalysis.timeSpent / 60)}h ${progressAnalysis.timeSpent % 60}m\n`;
        }

        // Status Transition Section
        if (statusTransitionResult.success) {
            commentBody += `\n**Status Update:**\n`;
            commentBody += `- ✅ Status changed from "${statusTransitionResult.fromStatus}" to "${statusTransitionResult.toStatus}"\n`;
            commentBody += `- Reason: ${statusTransitionResult.reason}\n`;
        } else if (statusTransitionResult.failed) {
            commentBody += `\n**Status Update:**\n`;
            commentBody += `- ❌ Failed to change status: ${statusTransitionResult.reason || statusTransitionResult.error}\n`;
        }

        // Time Tracking Section
        if (timeTrackingResult.action !== 'none' && !timeTrackingResult.skipped) {
            commentBody += `\n**Time Tracking:**\n`;
            commentBody += `- Action: ${timeTrackingResult.action.replace('_', ' ').toUpperCase()}\n`;
            if (timeTrackingResult.timeSpent > 0) {
                commentBody += `- Session Time: ${timeTrackingResult.timeSpent} minutes\n`;
            }
            if (timeTrackingResult.totalTime > 0) {
                commentBody += `- Total Time: ${Math.floor(timeTrackingResult.totalTime / 60)}h ${timeTrackingResult.totalTime % 60}m\n`;
            }
            if (timeTrackingResult.efficiency !== 'normal') {
                commentBody += `- Efficiency: ${timeTrackingResult.efficiency.toUpperCase()}\n`;
            }
        }

        // Scope Change Section
        if (scopeChangeResult.hasChanges) {
            commentBody += `\n**Scope Analysis:**\n`;
            commentBody += `- ⚠️ Scope changes detected (Risk: ${scopeChangeResult.riskLevel.toUpperCase()})\n`;
            for (const change of scopeChangeResult.changes) {
                commentBody += `- ${change.message}\n`;
            }
            if (scopeChangeResult.recommendations.length > 0) {
                commentBody += `\n**Recommendations:**\n`;
                for (const rec of scopeChangeResult.recommendations) {
                    commentBody += `- ${rec.message}\n`;
                }
            }
        }

        // Blockers Section
        if (progressAnalysis.blockers.length > 0) {
            commentBody += `\n**Blockers Detected:**\n`;
            for (const blocker of progressAnalysis.blockers) {
                const icon = blocker.severity === 'high' ? '🚨' : blocker.severity === 'medium' ? '⚠️' : 'ℹ️';
                commentBody += `- ${icon} ${blocker.message}\n`;
            }
        }

        // GitHub PR Section
        if (githubResult) {
            const isUpdate = githubResult.isUpdate;
            const prNumber = githubResult.pr?.number;
            const prUrl = githubResult.pr?.html_url;
            const prTitle = githubResult.pr?.title;

            commentBody += `\n**GitHub Integration:**\n`;
            commentBody += `- Status: ${isUpdate ? 'Updated' : 'Created'} PR #${prNumber}\n`;
            
            if (prUrl) {
                commentBody += `- URL: ${prUrl}\n`;
            }
            
            if (prTitle) {
                commentBody += `- Title: ${prTitle}\n`;
            }
        }

        // AI Analysis Section
        if (aiResult?.summary) {
            commentBody += `\n**AI Analysis:**\n`;
            commentBody += `${aiResult.summary}\n`;
        }

        // Documentation Section
        if (documentationResult && documentationResult.summary) {
            commentBody += `\n**Code Analysis:**\n`;
            commentBody += `- Generated ${documentationResult.summary.totalDiagrams} visualization diagrams\n`;
            commentBody += `- Complexity Level: ${documentationResult.summary.analysisContext.complexityLevel}\n`;
            commentBody += `- Security Risk: ${documentationResult.summary.analysisContext.securityRisk}\n`;
            
            if (documentationResult.summary.recommendations.length > 0) {
                commentBody += `\n**Code Recommendations:**\n`;
                documentationResult.summary.recommendations.forEach(rec => {
                    commentBody += `- ${rec.message}\n`;
                });
            }
        }

        // Sub-ticket Creation Section
        if (subTicketResult && !subTicketResult.skipped) {
            if (subTicketResult.success) {
                commentBody += `\n**Sub-ticket Management:**\n`;
                if (subTicketResult.createdSubTickets && subTicketResult.createdSubTickets.length > 0) {
                    commentBody += `- ✅ Created ${subTicketResult.createdSubTickets.length} sub-tickets for complex changes\n`;
                    for (const subTicket of subTicketResult.createdSubTickets) {
                        commentBody += `  - ${subTicket.identifier}: ${subTicket.title}\n`;
                    }
                } else if (subTicketResult.analysis?.suggestedSubTickets?.length > 0) {
                    commentBody += `- 💡 Suggested ${subTicketResult.analysis.suggestedSubTickets.length} sub-tickets (auto-creation disabled)\n`;
                    for (const suggestion of subTicketResult.analysis.suggestedSubTickets.slice(0, 3)) {
                        commentBody += `  - ${suggestion.title}\n`;
                    }
                }
                
                if (subTicketResult.analysis?.blockers?.length > 0) {
                    commentBody += `- 🚨 Detected ${subTicketResult.analysis.blockers.length} potential blockers\n`;
                    for (const blocker of subTicketResult.analysis.blockers) {
                        commentBody += `  - ${blocker.title}\n`;
                    }
                }
                
                if (subTicketResult.reasons && subTicketResult.reasons.length > 0) {
                    commentBody += `- Reasons: ${subTicketResult.reasons.join(', ')}\n`;
                }
            }
        }

        // Add Mermaid diagrams if available
        if (documentationResult && documentationResult.formattedDiagrams) {
            commentBody += '\n\n' + documentationResult.formattedDiagrams.linear.markdown;
        }

        commentBody += `\n\n---\n*Automated by CodeScribe Enhanced Linear Workflow*`;

        return commentBody;
    }

    /**
     * Automatically create sub-tickets when complex changes are detected
     * @param {Object} issue - Parent Linear issue data
     * @param {Object} context - Current execution context
     * @returns {Promise<Object>} Sub-ticket creation results
     */
    async createSubTicketsForComplexChanges(issue, context) {
        console.log(chalk.blue('   - Analyzing need for sub-ticket creation...'));

        const subTicketAnalysis = {
            shouldCreateSubTickets: false,
            suggestedSubTickets: [],
            blockers: [],
            taskBreakdown: []
        };

        // Analyze complexity and determine if sub-tickets are needed
        const complexityThreshold = this.config.get('workflows.linear.subTicketComplexityThreshold', 15);
        const fileCountThreshold = this.config.get('workflows.linear.subTicketFileCountThreshold', 8);

        let needsSubTickets = false;
        let reasons = [];

        // Check code complexity
        if (context.code?.complexity?.averageScore > complexityThreshold) {
            needsSubTickets = true;
            reasons.push(`High code complexity (${context.code.complexity.averageScore} > ${complexityThreshold})`);
        }

        // Check file count
        if (context.code?.changedFiles?.length > fileCountThreshold) {
            needsSubTickets = true;
            reasons.push(`High number of changed files (${context.code.changedFiles.length} > ${fileCountThreshold})`);
        }

        // Check for breaking changes
        if (context.code?.dependencies?.breakingChanges?.length > 0) {
            needsSubTickets = true;
            reasons.push('Breaking dependency changes detected');
        }

        // Check for security vulnerabilities
        if (context.code?.security?.riskLevel === 'high') {
            needsSubTickets = true;
            reasons.push('High security risk detected');
        }

        if (!needsSubTickets) {
            return {
                skipped: true,
                reason: 'Complexity and scope within normal limits'
            };
        }

        subTicketAnalysis.shouldCreateSubTickets = true;

        // Generate task breakdown suggestions
        subTicketAnalysis.taskBreakdown = await this.generateTaskBreakdownSuggestions(issue, context);

        // Generate suggested sub-tickets
        subTicketAnalysis.suggestedSubTickets = await this.generateSubTicketSuggestions(issue, context, subTicketAnalysis.taskBreakdown);

        // Detect blockers that need separate tickets
        subTicketAnalysis.blockers = await this.detectBlockersForSubTickets(issue, context);

        // Create sub-tickets if auto-creation is enabled
        const autoCreateSubTickets = this.config.get('workflows.linear.autoCreateSubTickets', false);
        let createdSubTickets = [];

        if (autoCreateSubTickets) {
            try {
                createdSubTickets = await this.createSubTickets(issue, subTicketAnalysis.suggestedSubTickets);
                this.log(`Created ${createdSubTickets.length} sub-tickets for ${issue.identifier}`, 'info');
            } catch (error) {
                this.log(`Failed to create sub-tickets: ${error.message}`, 'error');
            }
        }

        return {
            success: true,
            reasons,
            analysis: subTicketAnalysis,
            createdSubTickets,
            autoCreated: autoCreateSubTickets
        };
    }

    /**
     * Generate task breakdown suggestions based on code analysis
     * @param {Object} issue - Parent Linear issue data
     * @param {Object} context - Current execution context
     * @returns {Promise<Array>} Array of task breakdown suggestions
     */
    async generateTaskBreakdownSuggestions(issue, context) {
        const suggestions = [];

        // Analyze changed files and group by functionality
        if (context.code?.changedFiles) {
            const fileGroups = this.groupFilesByFunctionality(context.code.changedFiles);
            
            for (const [groupName, files] of Object.entries(fileGroups)) {
                if (files.length > 2) { // Only suggest breakdown for groups with multiple files
                    suggestions.push({
                        type: 'functionality_group',
                        title: `Implement ${groupName} functionality`,
                        description: `Handle changes to ${files.length} files related to ${groupName}`,
                        files: files.map(f => f.path),
                        estimatedComplexity: this.estimateGroupComplexity(files),
                        priority: this.determineGroupPriority(groupName, files)
                    });
                }
            }
        }

        // Suggest breakdown based on complexity hotspots
        if (context.code?.complexity?.files) {
            const highComplexityFiles = context.code.complexity.files.filter(f => f.score > 10);
            
            for (const file of highComplexityFiles) {
                suggestions.push({
                    type: 'complexity_refactor',
                    title: `Refactor high-complexity file: ${file.file}`,
                    description: `Address complexity issues in ${file.file} (score: ${file.score})`,
                    files: [file.file],
                    estimatedComplexity: 'high',
                    priority: 'medium'
                });
            }
        }

        // Suggest breakdown for security issues
        if (context.code?.security?.vulnerabilities?.length > 0) {
            const securityIssues = context.code.security.vulnerabilities.filter(v => v.severity === 'high');
            
            if (securityIssues.length > 0) {
                suggestions.push({
                    type: 'security_fixes',
                    title: 'Address security vulnerabilities',
                    description: `Fix ${securityIssues.length} high-severity security issues`,
                    files: [...new Set(securityIssues.map(v => v.file))],
                    estimatedComplexity: 'medium',
                    priority: 'high'
                });
            }
        }

        // Suggest breakdown for dependency updates
        if (context.code?.dependencies?.breakingChanges?.length > 0) {
            suggestions.push({
                type: 'dependency_migration',
                title: 'Handle breaking dependency changes',
                description: `Migrate code for ${context.code.dependencies.breakingChanges.length} breaking changes`,
                files: ['package.json', 'package-lock.json'],
                estimatedComplexity: 'high',
                priority: 'high'
            });
        }

        return suggestions;
    }

    /**
     * Group files by functionality based on path and naming patterns
     * @param {Array} changedFiles - Array of changed files
     * @returns {Object} Grouped files by functionality
     */
    groupFilesByFunctionality(changedFiles) {
        const groups = {};

        for (const file of changedFiles) {
            const path = file.path;
            let groupName = 'general';

            // Determine group based on path patterns
            if (path.includes('/api/') || path.includes('/routes/')) {
                groupName = 'api';
            } else if (path.includes('/components/') || path.includes('/ui/')) {
                groupName = 'ui-components';
            } else if (path.includes('/services/') || path.includes('/lib/')) {
                groupName = 'services';
            } else if (path.includes('/utils/') || path.includes('/helpers/')) {
                groupName = 'utilities';
            } else if (path.includes('/models/') || path.includes('/schemas/')) {
                groupName = 'data-models';
            } else if (path.includes('/tests/') || path.includes('.test.') || path.includes('.spec.')) {
                groupName = 'testing';
            } else if (path.includes('/config/') || path.includes('.config.')) {
                groupName = 'configuration';
            } else if (path.includes('/docs/') || path.includes('README')) {
                groupName = 'documentation';
            }

            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(file);
        }

        return groups;
    }

    /**
     * Estimate complexity for a group of files
     * @param {Array} files - Array of files in the group
     * @returns {string} Complexity level
     */
    estimateGroupComplexity(files) {
        const jsFiles = files.filter(f => f.isJavaScript).length;
        const totalFiles = files.length;

        if (totalFiles > 5 || jsFiles > 3) return 'high';
        if (totalFiles > 2 || jsFiles > 1) return 'medium';
        return 'low';
    }

    /**
     * Determine priority for a file group
     * @param {string} groupName - Name of the group
     * @param {Array} files - Array of files in the group
     * @returns {string} Priority level
     */
    determineGroupPriority(groupName, files) {
        const highPriorityGroups = ['api', 'services', 'data-models'];
        const mediumPriorityGroups = ['ui-components', 'configuration'];

        if (highPriorityGroups.includes(groupName)) return 'high';
        if (mediumPriorityGroups.includes(groupName)) return 'medium';
        
        // Check for critical files
        const hasCriticalFiles = files.some(f => 
            f.path.includes('index.') || 
            f.path.includes('main.') || 
            f.path.includes('app.')
        );

        return hasCriticalFiles ? 'high' : 'low';
    }

    /**
     * Generate sub-ticket suggestions based on task breakdown
     * @param {Object} issue - Parent Linear issue data
     * @param {Object} context - Current execution context
     * @param {Array} taskBreakdown - Task breakdown suggestions
     * @returns {Promise<Array>} Array of sub-ticket suggestions
     */
    async generateSubTicketSuggestions(issue, context, taskBreakdown) {
        const subTickets = [];

        for (const task of taskBreakdown) {
            const subTicket = {
                title: task.title,
                description: this.generateSubTicketDescription(task, issue, context),
                priority: this.mapPriorityToLinear(task.priority),
                estimate: this.estimateSubTicketTime(task),
                labels: this.generateSubTicketLabels(task),
                parentIssueId: issue.id,
                teamId: issue.team.id,
                projectId: issue.project?.id,
                assigneeId: issue.assignee?.id, // Assign to same person initially
                metadata: {
                    type: task.type,
                    files: task.files,
                    complexity: task.estimatedComplexity,
                    autoGenerated: true,
                    parentTicket: issue.identifier
                }
            };

            subTickets.push(subTicket);
        }

        return subTickets;
    }

    /**
     * Generate description for a sub-ticket
     * @param {Object} task - Task breakdown item
     * @param {Object} parentIssue - Parent issue data
     * @param {Object} context - Current execution context
     * @returns {string} Sub-ticket description
     */
    generateSubTicketDescription(task, parentIssue, context) {
        let description = `**Auto-generated sub-ticket from ${parentIssue.identifier}**\n\n`;
        description += `${task.description}\n\n`;

        description += `**Scope:**\n`;
        if (task.files && task.files.length > 0) {
            description += `Files to modify:\n`;
            for (const file of task.files) {
                description += `- ${file}\n`;
            }
        }

        description += `\n**Complexity:** ${task.estimatedComplexity}\n`;
        description += `**Priority:** ${task.priority}\n`;

        if (task.type === 'security_fixes') {
            description += `\n**Security Considerations:**\n`;
            description += `This task addresses security vulnerabilities. Please ensure:\n`;
            description += `- Code review by security team\n`;
            description += `- Security testing before deployment\n`;
            description += `- Documentation of security fixes\n`;
        }

        if (task.type === 'dependency_migration') {
            description += `\n**Migration Notes:**\n`;
            description += `This task handles breaking dependency changes. Consider:\n`;
            description += `- Backward compatibility requirements\n`;
            description += `- Migration timeline and rollback plan\n`;
            description += `- Impact on other services/components\n`;
        }

        description += `\n**Parent Ticket:** ${parentIssue.identifier} - ${parentIssue.title}`;

        return description;
    }

    /**
     * Map priority string to Linear priority value
     * @param {string} priority - Priority string
     * @returns {number} Linear priority value
     */
    mapPriorityToLinear(priority) {
        const priorityMap = {
            'low': 4,
            'medium': 3,
            'high': 2,
            'urgent': 1
        };
        return priorityMap[priority] || 3;
    }

    /**
     * Estimate time for sub-ticket
     * @param {Object} task - Task breakdown item
     * @returns {number} Estimated time in hours
     */
    estimateSubTicketTime(task) {
        const baseEstimates = {
            'functionality_group': 4,
            'complexity_refactor': 6,
            'security_fixes': 3,
            'dependency_migration': 8
        };

        let baseEstimate = baseEstimates[task.type] || 2;

        // Adjust based on complexity
        const complexityMultipliers = {
            'low': 0.5,
            'medium': 1.0,
            'high': 1.5
        };

        baseEstimate *= complexityMultipliers[task.estimatedComplexity] || 1.0;

        // Adjust based on file count
        if (task.files && task.files.length > 3) {
            baseEstimate *= 1.2;
        }

        return Math.ceil(baseEstimate);
    }

    /**
     * Generate labels for sub-ticket
     * @param {Object} task - Task breakdown item
     * @returns {Array} Array of label names
     */
    generateSubTicketLabels(task) {
        const labels = ['auto-generated', 'sub-task'];

        switch (task.type) {
            case 'functionality_group':
                labels.push('feature');
                break;
            case 'complexity_refactor':
                labels.push('refactor', 'technical-debt');
                break;
            case 'security_fixes':
                labels.push('security', 'bug');
                break;
            case 'dependency_migration':
                labels.push('dependencies', 'migration');
                break;
        }

        if (task.priority === 'high') {
            labels.push('high-priority');
        }

        return labels;
    }

    /**
     * Detect blockers that need separate sub-tickets
     * @param {Object} issue - Parent Linear issue data
     * @param {Object} context - Current execution context
     * @returns {Promise<Array>} Array of blocker sub-tickets
     */
    async detectBlockersForSubTickets(issue, context) {
        const blockers = [];

        // Check for high-severity security vulnerabilities
        if (context.code?.security?.vulnerabilities) {
            const criticalVulns = context.code.security.vulnerabilities.filter(v => v.severity === 'high');
            
            if (criticalVulns.length > 0) {
                blockers.push({
                    type: 'security_blocker',
                    title: `🚨 Security Review Required - ${issue.identifier}`,
                    description: `Critical security vulnerabilities must be addressed before proceeding with ${issue.identifier}`,
                    priority: 'urgent',
                    blocking: true,
                    vulnerabilities: criticalVulns
                });
            }
        }

        // Check for breaking dependency changes
        if (context.code?.dependencies?.breakingChanges?.length > 0) {
            blockers.push({
                type: 'dependency_blocker',
                title: `⚠️ Breaking Changes Review - ${issue.identifier}`,
                description: `Breaking dependency changes require approval and migration plan`,
                priority: 'high',
                blocking: true,
                changes: context.code.dependencies.breakingChanges
            });
        }

        // Check for missing tests on complex changes
        if (context.code?.complexity?.averageScore > 15) {
            const testFiles = context.code.changedFiles?.filter(f => f.isTest) || [];
            const jsFiles = context.code.changedFiles?.filter(f => f.isJavaScript && !f.isTest) || [];
            
            if (jsFiles.length > 3 && testFiles.length === 0) {
                blockers.push({
                    type: 'testing_blocker',
                    title: `🧪 Test Coverage Required - ${issue.identifier}`,
                    description: `Complex changes require comprehensive test coverage before deployment`,
                    priority: 'high',
                    blocking: true,
                    missingTests: jsFiles.map(f => f.path)
                });
            }
        }

        return blockers;
    }

    /**
     * Create sub-tickets in Linear
     * @param {Object} parentIssue - Parent Linear issue data
     * @param {Array} subTicketSuggestions - Array of sub-ticket suggestions
     * @returns {Promise<Array>} Array of created sub-tickets
     */
    async createSubTickets(parentIssue, subTicketSuggestions) {
        const createdSubTickets = [];

        for (const suggestion of subTicketSuggestions) {
            try {
                const subTicket = await this.createSubTicket(suggestion);
                createdSubTickets.push(subTicket);
                
                // Create relationship between parent and sub-ticket
                await this.createIssueRelation(parentIssue.id, subTicket.id, 'blocks');
                
                this.log(`Created sub-ticket: ${subTicket.identifier} - ${subTicket.title}`, 'info');
                
            } catch (error) {
                this.log(`Failed to create sub-ticket "${suggestion.title}": ${error.message}`, 'error');
            }
        }

        return createdSubTickets;
    }

    /**
     * Create a single sub-ticket in Linear
     * @param {Object} subTicketData - Sub-ticket data
     * @returns {Promise<Object>} Created sub-ticket
     */
    async createSubTicket(subTicketData) {
        const mutation = `
            mutation($input: IssueCreateInput!) {
                issueCreate(input: $input) {
                    success
                    issue {
                        id
                        identifier
                        title
                        url
                    }
                }
            }
        `;

        const variables = {
            input: {
                title: subTicketData.title,
                description: subTicketData.description,
                priority: subTicketData.priority,
                estimate: subTicketData.estimate,
                teamId: subTicketData.teamId,
                projectId: subTicketData.projectId,
                assigneeId: subTicketData.assigneeId
            }
        };

        const response = await this.makeGraphQLRequest(mutation, variables);
        
        if (!response.data.issueCreate.success) {
            throw new Error('Failed to create sub-ticket in Linear');
        }

        return response.data.issueCreate.issue;
    }

    /**
     * Create relationship between issues
     * @param {string} fromIssueId - Parent issue ID
     * @param {string} toIssueId - Sub-ticket issue ID
     * @param {string} relationType - Type of relationship ('blocks', 'relates')
     * @returns {Promise<Object>} Relationship creation result
     */
    async createIssueRelation(fromIssueId, toIssueId, relationType = 'blocks') {
        const mutation = `
            mutation($input: IssueRelationCreateInput!) {
                issueRelationCreate(input: $input) {
                    success
                    issueRelation {
                        id
                    }
                }
            }
        `;

        const variables = {
            input: {
                issueId: fromIssueId,
                relatedIssueId: toIssueId,
                type: relationType
            }
        };

        const response = await this.makeGraphQLRequest(mutation, variables);
        
        if (!response.data.issueRelationCreate.success) {
            throw new Error('Failed to create issue relationship in Linear');
        }

        return response.data.issueRelationCreate.issueRelation;
    }

    /**
     * Add a comment to a Linear issue
     * @param {string} issueId - Linear issue ID
     * @param {string} body - Comment body
     * @returns {Promise<Object>} Comment creation result
     */
    async addCommentToIssue(issueId, body) {
        console.log(chalk.blue(`   - Adding comment to Linear ticket...`));

        const mutation = `
            mutation($input: CommentCreateInput!) {
                commentCreate(input: $input) {
                    success
                    comment {
                        id
                    }
                }
            }
        `;

        const variables = {
            input: {
                issueId: issueId,
                body: body
            }
        };

        const response = await this.makeGraphQLRequest(mutation, variables);
        
        if (!response.data.commentCreate.success) {
            throw new Error('Failed to create comment in Linear');
        }

        console.log(chalk.green('   - Linear ticket updated with Agent Action.'));
        return response.data.commentCreate.comment;
    }

    /**
     * Generate comment body based on context
     * @param {Object} context - Current execution context
     * @returns {string} Generated comment body
     */
    generateCommentBody(context) {
        const githubResult = context.github;
        const aiResult = context.ai;
        const documentationResult = context.documentation;
        
        if (!githubResult) {
            return `🚀 **CodeScribe Agent Executed**\n\nAgent completed successfully but no GitHub PR information available.`;
        }

        const isUpdate = githubResult.isUpdate;
        const prNumber = githubResult.pr?.number;
        const prUrl = githubResult.pr?.html_url;
        const prTitle = githubResult.pr?.title;

        let commentBody = `🚀 **Pull Request ${isUpdate ? 'Updated' : 'Created'}**\n\n`;
        
        if (aiResult?.summary) {
            commentBody += `${aiResult.summary}\n\n`;
        }

        commentBody += `**PR Details:**\n`;
        commentBody += `- Status: ${isUpdate ? 'Updated' : 'Draft'} PR #${prNumber}\n`;
        
        if (prUrl) {
            commentBody += `- URL: ${prUrl}\n`;
        }
        
        if (prTitle) {
            commentBody += `- Title: ${prTitle}\n`;
        }
        
        if (isUpdate) {
            commentBody += `- ✨ Updated with latest code changes and AI analysis\n`;
        }

        // Add documentation analysis if available
        if (documentationResult && documentationResult.summary) {
            commentBody += `\n**Code Analysis:**\n`;
            commentBody += `- Generated ${documentationResult.summary.totalDiagrams} visualization diagrams\n`;
            commentBody += `- Complexity Level: ${documentationResult.summary.analysisContext.complexityLevel}\n`;
            commentBody += `- Security Risk: ${documentationResult.summary.analysisContext.securityRisk}\n`;
            
            if (documentationResult.summary.recommendations.length > 0) {
                commentBody += `\n**Recommendations:**\n`;
                documentationResult.summary.recommendations.forEach(rec => {
                    commentBody += `- ${rec.message}\n`;
                });
            }
        }

        // Add Mermaid diagrams if available
        if (documentationResult && documentationResult.formattedDiagrams) {
            commentBody += '\n\n' + documentationResult.formattedDiagrams.linear.markdown;
        }

        return commentBody;
    }

    /**
     * Make a GraphQL request to Linear API
     * @param {string} query - GraphQL query or mutation
     * @param {Object} variables - GraphQL variables
     * @returns {Promise<Object>} API response
     */
    async makeGraphQLRequest(query, variables = {}) {
        try {
            const response = await axios.post(this.apiUrl, {
                query,
                variables
            }, {
                headers: {
                    'Authorization': this.apiKey,
                    'Content-Type': 'application/json',
                }
            });

            if (response.data.errors) {
                throw new Error(`Linear API error: ${JSON.stringify(response.data.errors)}`);
            }

            return response.data;

        } catch (error) {
            if (error.response) {
                throw new Error(`Linear API request failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Check if Linear workflow can execute
     * @param {Object} context - Current execution context
     * @returns {boolean} Whether workflow can execute
     */
    canExecute(context) {
        return !!(this.apiKey && context.linear?.ticketId);
    }
}

module.exports = LinearWorkflow;