// Simple diff application script
const { execSync } = require('child_process');
const fs = require('fs');
const chalk = require('chalk');

async function applyDiff() {
  const ticketId = process.argv[2];
  if (!ticketId) {
    console.error(chalk.red.bold('❌ Please provide a Ticket ID as an argument.'));
    console.log(chalk.yellow('   Usage: node apply_diff_simple.js COD-22'));
    process.exit(1);
  }
  
  console.log(chalk.cyan.bold(`🚀 Starting diff application for ticket: ${ticketId}`));
  
  try {
    const diffFilePath = `${ticketId}.diff`;
    
    if (!fs.existsSync(diffFilePath)) {
      throw new Error(`Diff file ${diffFilePath} not found`);
    }
    
    console.log(chalk.green(`   - Found diff file: ${diffFilePath}`));
    console.log(chalk.blue('   - Applying patch to local repository...'));
    
    execSync(`git apply --reject ${diffFilePath}`);
    
    console.log(chalk.green('   - Patch applied successfully! Check your local files for changes.'));
    console.log(chalk.green.bold('\n✅ Diff application complete. Your codebase is now ready!'));
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Operation failed:'), error.message);
    process.exit(1);
  }
}

applyDiff();