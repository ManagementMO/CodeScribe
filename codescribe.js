#!/usr/bin/env node

require('dotenv').config();

// Import the new modular architecture
const CodeScribeCore = require('./src/core/CodeScribeCore');
const chalk = require('chalk');

/**
 * The main function that performs the entire agentic workflow using the new modular architecture
 */
async function runDraftAgent(command = 'default') {
    try {
        // Initialize the core engine with default configuration
        const codeScribe = new CodeScribeCore();
        
        // Execute the specified workflow
        const results = await codeScribe.execute(command);
        
        return results;
    } catch (error) {
        console.error(chalk.red.bold('\n❌ Agent failed:'), error.message);
        if (error.response) {
            console.error(chalk.red('Response status:'), error.response.status);
            console.error(chalk.red('Response data:'), JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

// --- Graceful exit handling ---
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Agent interrupted by user'));
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error(chalk.red.bold('\n❌ Unexpected error:'), error.message);
    process.exit(1);
});

// --- Command Line Interface ---
const args = process.argv.slice(2);
const command = args[0] || 'default';

// Handle help command
if (command === '--help' || command === '-h') {
    console.log(chalk.cyan.bold('CodeScribe - Enhanced Workflow Orchestration Tool'));
    console.log('');
    console.log(chalk.yellow('Usage:'));
    console.log('  codescribe [command] [options]');
    console.log('');
    console.log(chalk.yellow('Commands:'));
    console.log('  default, pr     Create/update PR and update Linear ticket (default)');
    console.log('  github-only     Only perform GitHub operations');
    console.log('  linear-only     Only perform Linear operations');
    console.log('  --help, -h      Show this help message');
    console.log('');
    console.log(chalk.yellow('Examples:'));
    console.log('  codescribe                 # Run default workflow');
    console.log('  codescribe pr              # Same as default');
    console.log('  codescribe github-only     # Only create/update GitHub PR');
    console.log('  codescribe linear-only     # Only update Linear ticket');
    process.exit(0);
}

// --- Execute the main function when the script is run ---
runDraftAgent(command).catch((error) => {
    console.error(chalk.red.bold('\n❌ Agent failed:'), error.message);
    process.exit(1);
});