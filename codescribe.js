#!/usr/bin/env node

require('dotenv').config();

// Import the new modular architecture
const CodeScribeCore = require('./src/core/CodeScribeCore');
const chalk = require('chalk');

/**
 * The main function that performs the entire agentic workflow using the new modular architecture
 */
async function runDraftAgent(command = 'default', options = {}) {
    try {
        // Initialize the core engine with default configuration
        const codeScribe = new CodeScribeCore();
        
        // Execute the specified workflow
        const results = await codeScribe.execute(command, options);
        
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

// Parse command line options
const options = {};
for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
        const key = arg.slice(2);
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
            options[key] = args[i + 1];
            i++; // Skip next argument as it's the value
        } else {
            options[key] = true;
        }
    } else if (arg.startsWith('-') && arg.length === 2) {
        const key = arg.slice(1);
        if (args[i + 1] && !args[i + 1].startsWith('-')) {
            options[key] = args[i + 1];
            i++; // Skip next argument as it's the value
        } else {
            options[key] = true;
        }
    }
}

// Handle help command
if (command === '--help' || command === '-h') {
    console.log(chalk.cyan.bold('CodeScribe - Enhanced Workflow Orchestration Tool'));
    console.log('');
    console.log(chalk.yellow('Usage:'));
    console.log('  codescribe [command] [options]');
    console.log('');
    console.log(chalk.yellow('Commands:'));
    console.log('  default, pr     Create/update PR and update Linear ticket (default)');
    console.log('  commit          Create intelligent commit with GitHub and Linear tracking');
    console.log('  github-only     Only perform GitHub operations');
    console.log('  linear-only     Only perform Linear operations');
    console.log('  --help, -h      Show this help message');
    console.log('');
    console.log(chalk.yellow('Commit Command Options:'));
    console.log('  --message, -m   Custom commit message');
    console.log('  --all, -a       Stage all changes (new and modified files)');
    console.log('  --add-modified  Stage only modified files');
    console.log('  --no-push       Skip pushing to remote');
    console.log('  --force         Force commit even if no changes detected');
    console.log('');
    console.log(chalk.yellow('Examples:'));
    console.log('  codescribe                           # Run default workflow');
    console.log('  codescribe pr                        # Same as default');
    console.log('  codescribe commit                    # Create intelligent commit');
    console.log('  codescribe commit -m "Fix bug"       # Commit with custom message');
    console.log('  codescribe commit --all --no-push    # Stage all, commit, but don\'t push');
    console.log('  codescribe github-only               # Only create/update GitHub PR');
    console.log('  codescribe linear-only               # Only update Linear ticket');
    process.exit(0);
}

// --- Execute the main function when the script is run ---
runDraftAgent(command, options).catch((error) => {
    console.error(chalk.red.bold('\n❌ Agent failed:'), error.message);
    process.exit(1);
});