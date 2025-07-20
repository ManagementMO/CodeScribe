#!/usr/bin/env node

/**
 * Real Linear Integration Test
 * This script helps you test the Enhanced Linear Workflow with your actual Linear workspace
 */

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function testRealLinearIntegration() {
    console.log('🔗 Real Linear Integration Test\n');
    
    // Check prerequisites
    console.log('📋 Checking Prerequisites...');
    
    // Check if LINEAR_API_KEY is set
    if (!process.env.LINEAR_API_KEY) {
        console.log('❌ LINEAR_API_KEY environment variable not set');
        console.log('   Please set it with: export LINEAR_API_KEY="your_api_key"');
        console.log('   Get your API key from: https://linear.app/settings/api');
        process.exit(1);
    }
    console.log('✅ LINEAR_API_KEY is set');
    
    // Check if we're in a git repository
    try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        console.log('✅ Git repository detected');
    } catch (error) {
        console.log('❌ Not in a git repository');
        process.exit(1);
    }
    
    // Get current branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    console.log(`✅ Current branch: ${currentBranch}`);
    
    // Check for Linear ticket ID in branch name
    const ticketMatch = currentBranch.match(/([A-Z]+-\d+)/);
    let ticketId = ticketMatch ? ticketMatch[1] : null;
    
    if (!ticketId) {
        console.log('\n⚠️  No Linear ticket ID found in branch name');
        ticketId = await askQuestion('Enter Linear ticket ID (e.g., ABC-123): ');
        if (!ticketId.match(/^[A-Z]+-\d+$/)) {
            console.log('❌ Invalid ticket ID format. Should be like ABC-123');
            process.exit(1);
        }
    }
    console.log(`✅ Using ticket ID: ${ticketId}`);
    
    // Check for changes
    try {
        const hasChanges = execSync('git diff --name-only HEAD~1').toString().trim();
        if (!hasChanges) {
            console.log('\n⚠️  No recent changes detected');
            const proceed = await askQuestion('Continue anyway? (y/n): ');
            if (proceed.toLowerCase() !== 'y') {
                process.exit(0);
            }
        } else {
            console.log('✅ Code changes detected');
        }
    } catch (error) {
        console.log('⚠️  Could not check for changes (might be first commit)');
    }
    
    console.log('\n🚀 Running Enhanced Linear Workflow...\n');
    
    // Create a temporary context for testing
    const testContext = {
        linear: { ticketId },
        git: { branch: currentBranch }
    };
    
    try {
        // Import and run the workflow
        const LinearWorkflow = require('./src/workflows/linear/LinearWorkflow');
        const ConfigurationManager = require('./src/config/ConfigurationManager');
        
        const config = new ConfigurationManager();
        const workflow = new LinearWorkflow(config);
        
        console.log('🔍 Testing Linear API connection...');
        
        // Test getting the issue first
        const issue = await workflow.getEnhancedIssueByIdentifier(ticketId);
        console.log(`✅ Found ticket: ${issue.title}`);
        console.log(`   Status: ${issue.state.name}`);
        console.log(`   Assignee: ${issue.assignee?.name || 'Unassigned'}`);
        
        const runFullWorkflow = await askQuestion('\nRun full enhanced workflow? This will add a comment to your Linear ticket (y/n): ');
        
        if (runFullWorkflow.toLowerCase() === 'y') {
            // Import context analyzer for real analysis
            const ContextAnalyzer = require('./src/context/ContextAnalyzer');
            const contextAnalyzer = new ContextAnalyzer(config);
            
            console.log('\n📊 Gathering real context...');
            const fullContext = await contextAnalyzer.gather();
            fullContext.linear = { ticketId };
            
            console.log('🔄 Executing enhanced workflow...');
            const result = await workflow.execute(fullContext);
            
            console.log('\n✅ Enhanced Linear Workflow Results:');
            console.log(`   - Ticket: ${result.ticketId}`);
            console.log(`   - Comment Added: ${result.commentAdded}`);
            
            if (result.progressAnalysis) {
                console.log(`   - Development Phase: ${result.progressAnalysis.currentPhase}`);
                console.log(`   - Complexity: ${result.progressAnalysis.complexity}`);
                console.log(`   - Risk Level: ${result.progressAnalysis.riskLevel}`);
            }
            
            if (result.statusTransition?.success) {
                console.log(`   - Status Updated: ${result.statusTransition.fromStatus} → ${result.statusTransition.toStatus}`);
            }
            
            if (result.subTickets?.analysis?.suggestedSubTickets?.length > 0) {
                console.log(`   - Sub-tickets Suggested: ${result.subTickets.analysis.suggestedSubTickets.length}`);
            }
            
            console.log(`\n🎉 Check your Linear ticket: https://linear.app/issue/${ticketId}`);
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        if (error.message.includes('Could not find Linear issue')) {
            console.log('\n💡 Troubleshooting:');
            console.log('   - Make sure the ticket ID exists in your Linear workspace');
            console.log('   - Check that your API key has access to this ticket');
            console.log('   - Verify the ticket ID format (e.g., ABC-123)');
        } else if (error.message.includes('Linear API')) {
            console.log('\n💡 Troubleshooting:');
            console.log('   - Check your LINEAR_API_KEY is correct');
            console.log('   - Verify your API key has the required permissions');
            console.log('   - Make sure you have internet connectivity');
        }
        
        process.exit(1);
    }
    
    rl.close();
    console.log('\n✅ Real Linear integration test completed!');
}

// Run the test
if (require.main === module) {
    testRealLinearIntegration().catch(console.error);
}

module.exports = { testRealLinearIntegration };