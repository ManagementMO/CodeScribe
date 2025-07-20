#!/usr/bin/env node

/**
 * Test script to verify the status transition fix
 */

const LinearWorkflow = require('./src/workflows/linear/LinearWorkflow');
const ConfigurationManager = require('./src/config/ConfigurationManager');

// Mock configuration
const mockConfig = new ConfigurationManager({
    workflows: {
        linear: {
            enabled: true,
            autoTransition: true
        }
    }
});

// Test the GraphQL mutation format
class TestLinearWorkflow extends LinearWorkflow {
    constructor(config) {
        super(config);
    }

    async makeGraphQLRequest(query, variables = {}) {
        console.log('📝 GraphQL Query:');
        console.log(query);
        console.log('\n📊 Variables:');
        console.log(JSON.stringify(variables, null, 2));
        
        // Mock successful response
        if (query.includes('issueUpdate')) {
            return {
                data: {
                    issueUpdate: {
                        success: true,
                        issue: {
                            id: 'test-issue-id',
                            state: {
                                name: 'In Progress'
                            }
                        }
                    }
                }
            };
        }
        
        // Mock team states response
        if (query.includes('team(id: $teamId)')) {
            return {
                data: {
                    team: {
                        states: {
                            nodes: [
                                { id: 'state-1', name: 'Todo', type: 'unstarted', position: 1 },
                                { id: 'state-2', name: 'In Progress', type: 'started', position: 2 },
                                { id: 'state-3', name: 'In Review', type: 'started', position: 3 },
                                { id: 'state-4', name: 'Done', type: 'completed', position: 4 }
                            ]
                        }
                    }
                }
            };
        }
        
        return { data: {} };
    }
}

async function testStatusTransitionFix() {
    console.log('🧪 Testing Status Transition Fix...\n');

    try {
        const workflow = new TestLinearWorkflow(mockConfig);
        
        // Mock issue data
        const mockIssue = {
            id: 'test-issue-id',
            identifier: 'TEST-123',
            title: 'Test Issue',
            state: {
                id: 'state-1',
                name: 'Todo'
            },
            team: {
                id: 'test-team-id',
                name: 'Test Team'
            }
        };

        // Mock progress analysis indicating PR created
        const mockProgressAnalysis = {
            currentPhase: 'in_review',
            complexity: 'medium',
            riskLevel: 'low'
        };

        console.log('🔄 Testing status transition from Todo to In Review...\n');
        
        const result = await workflow.handleStatusTransitions(
            mockIssue, 
            mockProgressAnalysis, 
            { github: { pr: { state: 'open' } } }
        );

        console.log('\n✅ Status Transition Result:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n🎉 Status transition fix is working correctly!');
            console.log(`   - Transitioned from: ${result.fromStatus}`);
            console.log(`   - Transitioned to: ${result.toStatus}`);
            console.log(`   - Reason: ${result.reason}`);
        } else {
            console.log('\n❌ Status transition still has issues');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
if (require.main === module) {
    testStatusTransitionFix();
}

module.exports = { testStatusTransitionFix };