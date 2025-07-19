#!/usr/bin/env node

require('dotenv').config();

// Import the commit workflow functionality
const CodeScribeCore = require('./src/core/CodeScribeCore');
const chalk = require('chalk');

/**
 * Standalone commit script for easy access to commit functionality
 */
async function runCommitWorkflow() {
    try {
        console.log(chalk.cyan.bold('💾 CodeScribe Commit Tool'));
        
        // Parse command line arguments
        const args = process.argv.slice(2);
        const options = {};
        
        // Parse options
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === '--message' || arg === '-m') {
                options.message = args[i + 1];
                i++; // Skip next argument
            } else if (arg === '--all' || arg === '-a') {
                options.addAll = true;
            } else if (arg === '--add-modified') {
                options.addModified = true;
            } else if (arg === '--no-push') {
                options.push = false;
            } else if (arg === '--force') {
                options.force = true;
            } else if (arg === '--help' || arg === '-h') {
                showHelp();
                return;
            }
        }
        
        // Initialize the core engine
        const codeScribe = new CodeScribeCore();
        
        // Execute commit workflow
        const results = await codeScribe.execute('commit', options);
        
        if (results.commit?.skipped) {
            console.log(chalk.yellow('⏭️  Commit skipped: ' + (results.commit.reason || 'No changes detected')));
        } else {
            console.log(chalk.green.bold('✅ Commit completed successfully!'));
            if (results.commit?.commit) {
                console.log(chalk.blue(`   📝 Commit: ${results.commit.commit.shortHash}`));
                console.log(chalk.blue(`   💬 Message: ${results.commit.commit.message}`));
            }
            if (results.commit?.push?.success) {
                console.log(chalk.green(`   🚀 Pushed to remote: ${results.commit.push.branch}`));
            }
            if (results.commit?.linear?.success) {
                console.log(chalk.green(`   📋 Linear ticket updated: ${results.commit.linear.ticketId}`));
            }
        }
        
    } catch (error) {
        console.error(chalk.red.bold('\n❌ Commit failed:'), error.message);
        process.exit(1);
    }
}

function showHelp() {
    console.log(chalk.cyan.bold('CodeScribe Commit Tool'));
    console.log('');
    console.log(chalk.yellow('Usage:'));
    console.log('  node commit.js [options]');
    console.log('');
    console.log(chalk.yellow('Options:'));
    console.log('  --message, -m   Custom commit message');
    console.log('  --all, -a       Stage all changes (new and modified files)');
    console.log('  --add-modified  Stage only modified files');
    console.log('  --no-push       Skip pushing to remote');
    console.log('  --force         Force commit even if no changes detected');
    console.log('  --help, -h      Show this help message');
    console.log('');
    console.log(chalk.yellow('Examples:'));
    console.log('  node commit.js                           # Auto-generate commit message');
    console.log('  node commit.js -m "Fix critical bug"     # Custom commit message');
    console.log('  node commit.js --all --no-push          # Stage all, commit, but don\'t push');
    console.log('  node commit.js --force                   # Force commit even with no changes');
}

// --- Graceful exit handling ---
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Commit interrupted by user'));
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error(chalk.red.bold('\n❌ Unexpected error:'), error.message);
    process.exit(1);
});

// --- Execute when run directly ---
if (require.main === module) {
    runCommitWorkflow();
}

module.exports = runCommitWorkflow;