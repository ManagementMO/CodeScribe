// run-agent.js — CommonJS with ESM dynamic imports
require('dotenv').config();
const { execSync } = require('child_process');
const axios = require('axios');

(async () => {
  // Dynamically import ESM-only modules
  const { Octokit } = await import('@octokit/rest');
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const chalk = (await import('chalk')).default;

  // --- Initialize API Clients ---
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  console.log(chalk.cyan.bold('🚀 Starting CodeScribe Agent...'));

  try {
    // --- 1. Gather Local Git Info ---
    console.log(chalk.blue('   - Gathering local git context...'));
    const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const diffContent = execSync('git diff origin/main...HEAD').toString().trim();
    const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();

    if (!diffContent) {
      throw new Error('No staged changes found. Please run "git add <files>" for the changes you want to include.');
    }

    // --- 2. Extract Linear Ticket ID ---
    console.log(chalk.blue(`   - Parsing branch name "${branchName}"...`));
    const ticketIdMatch = branchName.match(/([A-Z]+-\d+)/);
    if (!ticketIdMatch) {
      throw new Error(`Could not find a Linear ticket ID in branch "${branchName}". Use format like TIX-123.`);
    }
    const linearTicketId = ticketIdMatch[0];
    console.log(chalk.green(`   - Found Linear Ticket: ${linearTicketId}`));

    // --- 3. Send Diff to Gemini AI ---
    console.log(chalk.blue('   - Sending code changes to AI for analysis...'));
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze the following git diff and generate a clean JSON object with three keys: "title" (PR title), "body" (Markdown description), and "summary" (PM-friendly summary). Diff:\n\n${diffContent}`;

    const result = await model.generateContent(prompt);
    const jsonString = result.response.text().replace(/```json\n?|```/g, '').trim();
    const aiResults = JSON.parse(jsonString);
    console.log(chalk.green('   - AI analysis complete.'));

    // --- 4. Create GitHub Draft PR ---
    console.log(chalk.blue('   - Creating draft pull request on GitHub...'));
    const repoMatch = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)(\.git)?/);
    if (!repoMatch) {
      throw new Error('Could not parse GitHub owner/repo from remote URL.');
    }
    const owner = repoMatch[1];
    const repo = repoMatch[2];

    const pr = await octokit.pulls.create({
      owner,
      repo,
      title: aiResults.title,
      body: aiResults.body,
      head: branchName,
      base: 'main',
      draft: true,
    });

    console.log(chalk.green(`   - Created Draft PR: ${pr.data.html_url}`));

    // --- 5. Update Linear Ticket ---
    console.log(chalk.blue(`   - Adding comment to Linear ticket ${linearTicketId}...`));

    const issueQuery = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          title
        }
      }
    `;

    const issueRes = await axios.post(
      'https://api.linear.app/graphql',
      {
        query: issueQuery,
        variables: { id: linearTicketId },
      },
      {
        headers: {
          Authorization: process.env.LINEAR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!issueRes.data.data?.issue) {
      console.log(chalk.yellow(`   - Warning: Ticket ${linearTicketId} not found in Linear.`));
      console.log(chalk.green.bold('\n✅ Agent finished (GitHub PR created, Linear skipped)!'));
      return;
    }

    const issueId = issueRes.data.data.issue.id;

    const commentMutation = `
      mutation CreateComment($issueId: String!, $body: String!) {
        commentCreate(input: {
          issueId: $issueId
          body: $body
        }) {
          success
          comment {
            id
          }
        }
      }
    `;

    const commentBody = `🚀 **Draft PR Created**

${aiResults.summary}

**Pull Request:** ${pr.data.html_url}  
**Status:** Draft PR #${pr.data.number}`;

    await axios.post(
      'https://api.linear.app/graphql',
      {
        query: commentMutation,
        variables: {
          issueId,
          body: commentBody,
        },
      },
      {
        headers: {
          Authorization: process.env.LINEAR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(chalk.green('   - Linear ticket updated with PR comment.'));
    console.log(chalk.green.bold('\n✅ Agent finished successfully!'));

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Agent failed:'), error.message);
    if (error.response) {
      console.error(chalk.red('Response status:'), error.response.status);
      console.error(chalk.red('Response data:'), JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
})();
