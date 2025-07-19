// scheduler.js - Automated Daily Task Summary Scheduler

require('dotenv').config();
const cron = require('node-cron');
const chalk = require('chalk');
const { sendDailySummaries } = require('./daily-summary');

console.log(chalk.cyan.bold('⏰ CodeScribe Daily Summary Scheduler Starting...'));

// Schedule daily summaries at 9 AM every weekday (Monday-Friday)
const schedule = cron.schedule('0 9 * * 1-5', async () => {
    console.log(chalk.yellow('🌅 9 AM - Time for daily task summaries!'));
    await sendDailySummaries();
}, {
    scheduled: false,
    timezone: "America/New_York" // Adjust timezone as needed
});

// Start the scheduler
schedule.start();
console.log(chalk.green('✅ Scheduler started! Daily summaries will run at 9 AM on weekdays.'));

// Keep the process running
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Shutting down scheduler...'));
    schedule.stop();
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error(chalk.red('❌ Uncaught Exception:'), error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('❌ Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
    process.exit(1);
}); 