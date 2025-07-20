// apply-diff.js (with Diagnostic Check)

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs');
const chalk = require('chalk');

// --- Diagnostic Check ---
// Let's print the environment variables to see what the script is actually loading.
console.log(chalk.magenta('--- DIAGNOSTIC CHECK ---'));
console.log(chalk.magenta(`Loaded SUPABASE_URL: ${process.env.SUPABASE_URL}`));
console.log(chalk.magenta(`Loaded SUPABASE_ANON_KEY: Is it present? ${!!process.env.SUPABASE_ANON_KEY}`));
console.log(chalk.magenta('------------------------\n'));
// The URL printed above MUST start with https:// for the script to work.

// --- Initialize Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('https')) {
  console.error(chalk.red.bold('❌ Configuration Error!'));
  console.error(chalk.red('   Your SUPABASE_URL in the .env file is incorrect. It must start with "https://".'));
  console.error(chalk.yellow('   Please copy the "Project URL" from your Supabase project\'s API settings.'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ... THE REST OF THE SCRIPT IS EXACTLY THE SAME AS BEFORE ...

async function applyDiff() {
  const ticketId = process.argv[2];
  if (!ticketId) {
    console.error(chalk.red.bold('❌ Please provide a Ticket ID as an argument.'));
    console.log(chalk.yellow('   Usage: node apply-diff.js COD-22'));
    process.exit(1);
  }
  console.log(chalk.cyan.bold(`🚀 Starting diff application for ticket: ${ticketId}`));
  try {
    console.log(chalk.blue('   - Querying database for diff metadata...'));
    const { data: diffRecord, error: dbError } = await supabase
      .from('code_diffs')
      .select('diff_file_path')
      .eq('ticket_id', ticketId)
      .single();
    if (dbError) { throw new Error(`Database query failed: ${dbError.message}`); }
    if (!diffRecord) { throw new Error(`Could not find a record for ticket "${ticketId}" in the database.`); }
    console.log(chalk.green(`   - Found record. File path: ${diffRecord.diff_file_path}`));
    console.log(chalk.blue(`   - Downloading diff file from Supabase Storage...`));
    const { data: blob, error: storageError } = await supabase.storage.from('code-diffs').download(diffRecord.diff_file_path);
    if (storageError) { throw new Error(`Could not download file "${diffRecord.diff_file_path}" from storage. ${storageError.message}`); }
    if (!blob) { throw new Error('Downloaded file data is empty.'); }
    console.log(chalk.green('   - Download complete.'));
    const tempFilePath = 'temp_patch.diff';
    const diffContent = await blob.text();
    fs.writeFileSync(tempFilePath, diffContent);
    console.log(chalk.blue(`   - Diff content saved to temporary file "${tempFilePath}".`));
    console.log(chalk.blue('   - Applying patch to local repository...'));
    execSync(`git apply --reject ${tempFilePath}`);
    console.log(chalk.green('   - Patch applied successfully! Check your local files for changes.'));
    fs.unlinkSync(tempFilePath);
    console.log(chalk.blue(`   - Cleaned up temporary file.`));
    console.log(chalk.green.bold('\n✅ Diff application complete. Your codebase is now ready!'));
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Operation failed:'), error.message);
    if (fs.existsSync('temp_patch.diff')) {
      fs.unlinkSync('temp_patch.diff');
    }
    process.exit(1);
  }
}

applyDiff();