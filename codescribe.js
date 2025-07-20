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
    showHelp();
    process.exit(0);
}

// Handle interactive mode
if (command === 'interactive') {
    runInteractiveMode().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error(chalk.red('❌ Interactive mode failed:'), error.message);
        process.exit(1);
    });
    return;
}

// Handle history and logging commands
if (['history', 'stats', 'replay', 'logs'].includes(command)) {
    handleHistoryCommand(command, args.slice(1), options).then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error(chalk.red('❌ History command failed:'), error.message);
        process.exit(1);
    });
    return;
}

/**
 * Display comprehensive help information
 */
function showHelp() {
    console.log(chalk.cyan.bold('CodeScribe - Enhanced Workflow Orchestration Tool'));
    console.log(chalk.gray('Intelligent AI-powered development workflow automation'));
    console.log('');
    
    console.log(chalk.yellow.bold('Usage:'));
    console.log('  codescribe [command] [options]');
    console.log('');
    
    console.log(chalk.yellow.bold('Core Workflows:'));
    console.log('  default, pr     Create/update PR with full tracking and documentation');
    console.log('  commit          Create intelligent commit with AI-generated messages');
    console.log('  interactive     Guided workflow selection with context-aware suggestions');
    console.log('');
    
    console.log(chalk.yellow.bold('Specialized Workflows:'));
    console.log('  docs            Generate documentation, diagrams, and ADRs');
    console.log('  quality         Code quality analysis and security scanning');
    console.log('  linear          Advanced Linear ticket management and tracking');
    console.log('  feature         Complete feature development workflow');
    console.log('  fix             Bug fix workflow with issue management');
    console.log('  review          Code review assistance and analysis');
    console.log('  release         Release preparation and changelog generation');
    console.log('');
    
    console.log(chalk.yellow.bold('History & Logging:'));
    console.log('  history         Show workflow execution history');
    console.log('  stats           Show execution statistics and analytics');
    console.log('  replay <id>     Replay a previous workflow execution');
    console.log('  logs            Show recent log entries');
    console.log('');
    
    console.log(chalk.yellow.bold('Legacy Commands:'));
    console.log('  github-only     Only perform GitHub operations');
    console.log('  linear-only     Only perform Linear operations');
    console.log('');
    
    console.log(chalk.yellow.bold('Global Options:'));
    console.log('  --verbose, -v   Enable verbose logging');
    console.log('  --dry-run       Show what would be done without executing');
    console.log('  --config        Specify custom configuration file');
    console.log('  --help, -h      Show this help message');
    console.log('');
    
    console.log(chalk.yellow.bold('Commit Command Options:'));
    console.log('  --message, -m   Custom commit message');
    console.log('  --all, -a       Stage all changes (new and modified files)');
    console.log('  --add-modified  Stage only modified files');
    console.log('  --no-push       Skip pushing to remote');
    console.log('  --force         Force commit even if no changes detected');
    console.log('');
    
    console.log(chalk.yellow.bold('Examples:'));
    console.log('  codescribe                           # Run default PR workflow');
    console.log('  codescribe interactive               # Guided workflow selection');
    console.log('  codescribe commit -m "Fix bug"       # Smart commit with custom message');
    console.log('  codescribe docs                      # Generate documentation only');
    console.log('  codescribe quality --verbose         # Code quality analysis with details');
    console.log('  codescribe feature --dry-run         # Preview feature workflow');
    console.log('');
    
    console.log(chalk.green.bold('💡 Tip:'), 'Use', chalk.cyan('codescribe interactive'), 'for guided workflow selection!');
}

/**
 * Interactive mode for guided workflow selection
 */
async function runInteractiveMode() {
    const inquirer = require('inquirer');
    
    console.log(chalk.cyan.bold('🎯 CodeScribe Interactive Mode'));
    console.log(chalk.gray('Let\'s find the best workflow for your current situation...\n'));
    
    try {
        // Quick context analysis
        const codeScribe = new CodeScribeCore();
        const context = await codeScribe.contextAnalyzer.gather();
        
        // Analyze current state and suggest workflows
        const suggestions = analyzeContextForSuggestions(context);
        
        console.log(chalk.blue('📊 Current Project State:'));
        if (context.git.hasChanges) {
            console.log(chalk.yellow('  • Uncommitted changes detected'));
        }
        if (context.git.branch !== 'main' && context.git.branch !== 'master') {
            console.log(chalk.yellow(`  • Working on branch: ${context.git.branch}`));
        }
        if (context.linear?.ticketId) {
            console.log(chalk.yellow(`  • Linear ticket: ${context.linear.ticketId}`));
        }
        console.log('');
        
        // Present workflow options
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'workflow',
                message: 'What would you like to do?',
                choices: [
                    { name: '🚀 Create/Update PR (Full workflow with tracking)', value: 'pr' },
                    { name: '💾 Smart Commit (AI-generated commit message)', value: 'commit' },
                    { name: '📚 Generate Documentation & Diagrams', value: 'docs' },
                    { name: '🔍 Code Quality Analysis', value: 'quality' },
                    { name: '🎫 Linear Ticket Management', value: 'linear' },
                    { name: '✨ Feature Development Workflow', value: 'feature' },
                    { name: '🐛 Bug Fix Workflow', value: 'fix' },
                    { name: '👀 Code Review Assistant', value: 'review' },
                    { name: '🏷️  Release Preparation', value: 'release' },
                    new inquirer.Separator(),
                    { name: '❌ Exit', value: 'exit' }
                ],
                default: suggestions.recommended
            }
        ]);
        
        if (answers.workflow === 'exit') {
            console.log(chalk.gray('👋 Goodbye!'));
            return;
        }
        
        // Get additional options for selected workflow
        const workflowOptions = await getWorkflowOptions(answers.workflow);
        
        // Execute selected workflow
        console.log(chalk.cyan(`\n🎬 Starting ${answers.workflow} workflow...\n`));
        await runDraftAgent(answers.workflow, workflowOptions);
        
    } catch (error) {
        console.error(chalk.red('❌ Interactive mode failed:'), error.message);
        process.exit(1);
    }
}

/**
 * Analyze context to provide workflow suggestions
 */
function analyzeContextForSuggestions(context) {
    let recommended = 'pr'; // default
    
    if (!context.git.hasChanges) {
        recommended = 'docs'; // No changes, maybe generate docs
    } else if (context.git.branch.includes('fix') || context.git.branch.includes('bug')) {
        recommended = 'fix'; // Bug fix branch
    } else if (context.git.branch.includes('feature')) {
        recommended = 'feature'; // Feature branch
    } else if (context.git.hasUncommittedChanges && !context.git.hasUnpushedCommits) {
        recommended = 'commit'; // Has changes but no commits
    }
    
    return { recommended };
}

/**
 * Get additional options for specific workflows
 */
async function getWorkflowOptions(workflow) {
    const inquirer = require('inquirer');
    const options = {};
    
    switch (workflow) {
        case 'commit':
            const commitAnswers = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'stageAll',
                    message: 'Stage all changes (including new files)?',
                    default: false
                },
                {
                    type: 'confirm',
                    name: 'push',
                    message: 'Push to remote after commit?',
                    default: true
                }
            ]);
            if (commitAnswers.stageAll) options.all = true;
            if (!commitAnswers.push) options['no-push'] = true;
            break;
            
        case 'quality':
        case 'docs':
            const analysisAnswers = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'verbose',
                    message: 'Enable detailed output?',
                    default: false
                }
            ]);
            if (analysisAnswers.verbose) options.verbose = true;
            break;
    }
    
    return options;
}

/**
 * Handle history and logging commands
 */
async function handleHistoryCommand(command, args, options) {
    const CodeScribeCore = require('./src/core/CodeScribeCore');
    const WorkflowHistory = require('./src/utils/WorkflowHistory');
    const Logger = require('./src/utils/Logger');
    
    const codeScribe = new CodeScribeCore();
    const history = codeScribe.workflowHistory;
    const logger = codeScribe.logger;
    
    switch (command) {
        case 'history':
            await showHistory(history, options);
            break;
            
        case 'stats':
            await showStats(history, options);
            break;
            
        case 'replay':
            if (args.length === 0) {
                console.error(chalk.red('❌ Please provide an execution ID to replay'));
                console.log(chalk.gray('Usage: codescribe replay <execution-id>'));
                process.exit(1);
            }
            await replayExecution(history, args[0], options);
            break;
            
        case 'logs':
            await showLogs(logger, options);
            break;
            
        default:
            console.error(chalk.red(`❌ Unknown history command: ${command}`));
            process.exit(1);
    }
}

/**
 * Show workflow execution history
 */
async function showHistory(history, options) {
    const limit = parseInt(options.limit) || 20;
    const entries = await history.getHistory(limit);
    
    if (entries.length === 0) {
        console.log(chalk.yellow('📝 No workflow history found'));
        return;
    }
    
    console.log(chalk.cyan.bold(`📚 Workflow History (${entries.length} entries)`));
    console.log('');
    
    entries.forEach((entry, index) => {
        const date = new Date(entry.timestamp).toLocaleString();
        const status = entry.success ? chalk.green('✅') : chalk.red('❌');
        const duration = entry.duration ? `${entry.duration}ms` : 'N/A';
        
        console.log(`${status} ${chalk.bold(entry.command)} ${chalk.gray(`(${entry.id})`)}`);
        console.log(`   ${chalk.gray(date)} • ${chalk.blue(duration)}`);
        
        if (entry.workflows && entry.workflows.length > 0) {
            console.log(`   Workflows: ${chalk.cyan(entry.workflows.join(', '))}`);
        }
        
        if (!entry.success && entry.error) {
            console.log(`   ${chalk.red('Error:')} ${entry.error}`);
        }
        
        if (options.verbose && entry.results) {
            console.log(`   ${chalk.gray('Results:')} ${JSON.stringify(entry.results, null, 2)}`);
        }
        
        console.log('');
    });
    
    console.log(chalk.gray(`💡 Use 'codescribe replay <id>' to replay an execution`));
    console.log(chalk.gray(`💡 Use 'codescribe stats' to see execution statistics`));
}

/**
 * Show execution statistics
 */
async function showStats(history, options) {
    const stats = await history.getStats();
    
    console.log(chalk.cyan.bold('📊 CodeScribe Execution Statistics'));
    console.log('');
    
    console.log(chalk.yellow.bold('Overview:'));
    console.log(`   Total Executions: ${chalk.green(stats.totalExecutions)}`);
    console.log(`   Successful: ${chalk.green(stats.successfulExecutions)}`);
    console.log(`   Failed: ${chalk.red(stats.failedExecutions)}`);
    
    if (stats.totalExecutions > 0) {
        const successRate = Math.round((stats.successfulExecutions / stats.totalExecutions) * 100);
        console.log(`   Success Rate: ${chalk.blue(successRate + '%')}`);
        console.log(`   Average Duration: ${chalk.blue(stats.averageDuration + 'ms')}`);
    }
    
    console.log('');
    
    if (Object.keys(stats.mostUsedCommands).length > 0) {
        console.log(chalk.yellow.bold('Most Used Commands:'));
        Object.entries(stats.mostUsedCommands)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([command, count]) => {
                console.log(`   ${chalk.cyan(command)}: ${count} times`);
            });
        console.log('');
    }
    
    if (Object.keys(stats.mostUsedWorkflows).length > 0) {
        console.log(chalk.yellow.bold('Most Used Workflows:'));
        Object.entries(stats.mostUsedWorkflows)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([workflow, count]) => {
                console.log(`   ${chalk.cyan(workflow)}: ${count} times`);
            });
        console.log('');
    }
    
    if (stats.recentActivity.length > 0) {
        console.log(chalk.yellow.bold('Recent Activity:'));
        stats.recentActivity.slice(0, 5).forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleString();
            const status = entry.success ? chalk.green('✅') : chalk.red('❌');
            console.log(`   ${status} ${entry.command} ${chalk.gray(date)}`);
        });
    }
}

/**
 * Replay a previous execution
 */
async function replayExecution(history, executionId, options) {
    try {
        const replayData = await history.replayExecution(executionId, options);
        
        console.log(chalk.cyan.bold('🔄 Replaying Previous Execution'));
        console.log('');
        
        // Execute the replayed workflow
        await runDraftAgent(replayData.command, replayData.options);
        
    } catch (error) {
        console.error(chalk.red('❌ Failed to replay execution:'), error.message);
        process.exit(1);
    }
}

/**
 * Show recent log entries
 */
async function showLogs(logger, options) {
    const lines = parseInt(options.lines) || 50;
    const logEntries = await logger.getRecentLogs(lines);
    
    if (logEntries.length === 0) {
        console.log(chalk.yellow('📝 No log entries found'));
        return;
    }
    
    console.log(chalk.cyan.bold(`📋 Recent Log Entries (${logEntries.length} lines)`));
    console.log(chalk.gray(`Log file: ${logger.getLogFile()}`));
    console.log('');
    
    logEntries.forEach(entry => {
        // Parse log entry to colorize based on level
        const match = entry.match(/\[(.*?)\] \[(.*?)\] (.*)/);
        if (match) {
            const [, timestamp, level, message] = match;
            const levelColor = {
                'DEBUG': chalk.gray,
                'INFO': chalk.blue,
                'WARN': chalk.yellow,
                'ERROR': chalk.red
            }[level] || chalk.white;
            
            console.log(`${chalk.gray(timestamp)} ${levelColor(`[${level}]`)} ${message}`);
        } else {
            console.log(entry);
        }
    });
    
    console.log('');
    console.log(chalk.gray(`💡 Use '--lines <number>' to show more/fewer lines`));
}

// --- Execute the main function when the script is run ---
runDraftAgent(command, options).catch((error) => {
    console.error(chalk.red.bold('\n❌ Agent failed:'), error.message);
    process.exit(1);
});