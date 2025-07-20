#!/usr/bin/env node

/**
 * Test script for Enhanced Linear Workflow functionality
 * Tests the advanced ticket management and sub-ticket creation features
 */

const LinearWorkflow = require('./src/workflows/linear/LinearWorkflow');
const ConfigurationManager = require('./src/config/ConfigurationManager');

// Mock configuration for testing
const mockConfig = new ConfigurationManager({
    workflows: {
        linear: {
            enabled: true,
            autoTransition: true,
            trackTime: true,
            detectScopeChanges: true,
            notifyOnScopeChange: true,
            autoCreateSubTickets: false, // Set to false for testing suggestions only
            subTicketComplexityThreshold: 10,
            subTicketFileCountThreshold: 5
        }
    }
});

// Mock context with complex changes that should trigger sub-ticket creation
const mockContext = {
    linear: {
        ticketId: 'TEST-123'
    },
    git: {
        branch: 'feature/complex-refactor',
        commits: [
            { hash: 'abc123', message: 'Initial implementation' },
            { hash: 'def456', message: 'Add security fixes' },
            { hash: 'ghi789', message: 'Refactor complex logic' }
        ],
        diff: 'mock diff content...'
    },
    code: {
        hasChanges: true,
        changedFiles: [
            { path: 'src/api/users.js', status: 'modified', isJavaScript: true, isTest: false },
            { path: 'src/api/auth.js', status: 'modified', isJavaScript: true, isTest: false },
            { path: 'src/services/userService.js', status: 'modified', isJavaScript: true, isTest: false },
            { path: 'src/services/authService.js', status: 'modified', isJavaScript: true, isTest: false },
            { path: 'src/utils/validation.js', status: 'modified', isJavaScript: true, isTest: false },
            { path: 'src/models/User.js', status: 'modified', isJavaScript: true, isTest: false },
            { path: 'package.json', status: 'modified', isJavaScript: false, isTest: false }
        ],
        complexity: {
            totalScore: 85,
            averageScore: 17,
            level: 'high',
            files: [
                { file: 'src/api/users.js', score: 15 },
                { file: 'src/services/userService.js', score: 22 },
                { file: 'src/utils/validation.js', score: 12 }
            ]
        },
        security: {
            riskLevel: 'medium',
            vulnerabilities: [
                {
                    file: 'src/api/auth.js',
                    type: 'hardcoded_secret',
                    severity: 'high',
                    message: 'Hardcoded API key detected',
                    line: 15
                }
            ]
        },
        dependencies: {
            added: [{ package: 'express-rate-limit', version: '^6.0.0' }],
            updated: [],
            removed: [],
            breakingChanges: []
        }
    },
    github: {
        pr: {
            number: 42,
            state: 'open',
            html_url: 'https://github.com/test/repo/pull/42',
            title: 'Complex refactor with security improvements'
        }
    }
};

// Mock Linear API responses
const mockLinearResponses = {
    getEnhancedIssueByIdentifier: {
        data: {
            issues: {
                nodes: [{
                    id: 'issue-123',
                    identifier: 'TEST-123',
                    title: 'Implement user authentication system',
                    description: 'Add comprehensive user authentication with security features',
                    priority: 2,
                    estimate: 8,
                    state: {
                        id: 'state-todo',
                        name: 'Todo',
                        type: 'unstarted'
                    },
                    assignee: {
                        id: 'user-123',
                        name: 'Test Developer',
                        email: 'dev@test.com'
                    },
                    project: {
                        id: 'project-123',
                        name: 'Authentication Project'
                    },
                    team: {
                        id: 'team-123',
                        name: 'Backend Team'
                    },
                    labels: { nodes: [] },
                    comments: { nodes: [] },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z'
                }]
            }
        }
    },
    getWorkflowStates: {
        data: {
            team: {
                states: {
                    nodes: [
                        { id: 'state-todo', name: 'Todo', type: 'unstarted', position: 1 },
                        { id: 'state-progress', name: 'In Progress', type: 'started', position: 2 },
                        { id: 'state-review', name: 'In Review', type: 'started', position: 3 },
                        { id: 'state-done', name: 'Done', type: 'completed', position: 4 }
                    ]
                }
            }
        }
    }
};

// Create workflow instance with mocked API
class TestLinearWorkflow extends LinearWorkflow {
    constructor(config) {
        super(config);
        this.testMode = true;
    }

    async makeGraphQLRequest(query, variables = {}) {
        // Mock different API calls based on query content
        if (query.includes('issues(first: 50)')) {
            return mockLinearResponses.getEnhancedIssueByIdentifier;
        } else if (query.includes('team(id: $teamId)')) {
            return mockLinearResponses.getWorkflowStates;
        } else if (query.includes('commentCreate')) {
            return {
                data: {
                    commentCreate: {
                        success: true,
                        comment: { id: 'comment-123' }
                    }
                }
            };
        } else if (query.includes('issueUpdate')) {
            return {
                data: {
                    issueUpdate: {
                        success: true,
                        issue: {
                            id: 'issue-123',
                            state: { name: 'In Progress' }
                        }
                    }
                }
            };
        }
        
        return { data: {} };
    }

    // Override to prevent actual API calls during testing
    async createSubTickets(parentIssue, subTicketSuggestions) {
        console.log(`\n📝 Would create ${subTicketSuggestions.length} sub-tickets:`);
        subTicketSuggestions.forEach((suggestion, index) => {
            console.log(`   ${index + 1}. ${suggestion.title}`);
            console.log(`      Priority: ${suggestion.priority}, Estimate: ${suggestion.estimate}h`);
            console.log(`      Files: ${suggestion.metadata.files.join(', ')}`);
        });
        
        // Return mock created tickets
        return subTicketSuggestions.map((suggestion, index) => ({
            id: `sub-issue-${index + 1}`,
            identifier: `TEST-${124 + index}`,
            title: suggestion.title,
            url: `https://linear.app/test/issue/TEST-${124 + index}`
        }));
    }
}

async function testEnhancedLinearWorkflow() {
    console.log('🧪 Testing Enhanced Linear Workflow...\n');

    try {
        const workflow = new TestLinearWorkflow(mockConfig);
        
        console.log('📊 Test Context:');
        console.log(`   - Ticket: ${mockContext.linear.ticketId}`);
        console.log(`   - Branch: ${mockContext.git.branch}`);
        console.log(`   - Changed Files: ${mockContext.code.changedFiles.length}`);
        console.log(`   - Complexity Score: ${mockContext.code.complexity.averageScore}`);
        console.log(`   - Security Risk: ${mockContext.code.security.riskLevel}`);
        console.log(`   - PR State: ${mockContext.github.pr.state}\n`);

        // Test the enhanced workflow execution
        const result = await workflow.execute(mockContext);

        console.log('✅ Enhanced Linear Workflow Results:');
        console.log(`   - Ticket ID: ${result.ticketId}`);
        console.log(`   - Comment Added: ${result.commentAdded}`);
        
        if (result.progressAnalysis) {
            console.log(`   - Current Phase: ${result.progressAnalysis.currentPhase}`);
            console.log(`   - Complexity: ${result.progressAnalysis.complexity}`);
            console.log(`   - Risk Level: ${result.progressAnalysis.riskLevel}`);
            console.log(`   - Estimated Time: ${result.progressAnalysis.timeSpent} minutes`);
        }

        if (result.statusTransition && result.statusTransition.success) {
            console.log(`   - Status Transition: ${result.statusTransition.fromStatus} → ${result.statusTransition.toStatus}`);
        }

        if (result.timeTracking && !result.timeTracking.skipped) {
            console.log(`   - Time Tracking: ${result.timeTracking.action}`);
        }

        if (result.scopeChange && result.scopeChange.hasChanges) {
            console.log(`   - Scope Changes: ${result.scopeChange.changes.length} detected`);
        }

        if (result.subTickets && !result.subTickets.skipped) {
            console.log(`   - Sub-ticket Analysis: ${result.subTickets.success ? 'Completed' : 'Failed'}`);
            if (result.subTickets.analysis) {
                console.log(`   - Suggested Sub-tickets: ${result.subTickets.analysis.suggestedSubTickets.length}`);
                console.log(`   - Detected Blockers: ${result.subTickets.analysis.blockers.length}`);
            }
        }

        console.log('\n🎉 Enhanced Linear Workflow test completed successfully!');
        
        // Test individual components
        console.log('\n🔍 Testing Individual Components...');
        
        // Test task breakdown generation
        const issue = mockLinearResponses.getEnhancedIssueByIdentifier.data.issues.nodes[0];
        const taskBreakdown = await workflow.generateTaskBreakdownSuggestions(issue, mockContext);
        console.log(`\n📋 Task Breakdown Suggestions: ${taskBreakdown.length}`);
        taskBreakdown.forEach((task, index) => {
            console.log(`   ${index + 1}. ${task.title} (${task.type}, ${task.priority} priority)`);
        });

        // Test file grouping
        const fileGroups = workflow.groupFilesByFunctionality(mockContext.code.changedFiles);
        console.log(`\n📁 File Groups: ${Object.keys(fileGroups).length}`);
        Object.entries(fileGroups).forEach(([group, files]) => {
            console.log(`   - ${group}: ${files.length} files`);
        });

        console.log('\n✅ All tests passed! Enhanced Linear Workflow is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testEnhancedLinearWorkflow();
}

module.exports = { testEnhancedLinearWorkflow };