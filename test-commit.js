#!/usr/bin/env node

// Simple test script to verify the commit functionality works
const CodeScribeCore = require('./src/core/CodeScribeCore');
const chalk = require('chalk');

async function testCommitWorkflow() {
    try {
        console.log(chalk.cyan.bold('🧪 Testing Commit Workflow...'));
        
        // Initialize the core engine
        const codeScribe = new CodeScribeCore();
        
        // Test commit workflow with dry-run options
        const results = await codeScribe.execute('commit', {
            message: 'test: Add commit workflow functionality',
            addAll: true,
            push: false // Don't push during test
        });
        
        console.log(chalk.green.bold('✅ Commit workflow test completed!'));
        console.log('Results:', JSON.stringify(results, null, 2));
        
    } catch (error) {
        console.error(chalk.red.bold('❌ Test failed:'), error.message);
        process.exit(1);
    }
}

// Only run if called directly
if (require.main === module) {
    testCommitWorkflow();
}

module.exports = testCommitWorkflow;