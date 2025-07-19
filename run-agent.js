// run-agent.js (ESM version)

import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env

import { execSync } from 'child_process';
import axios from 'axios';
import { Octokit } from '@octokit/rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';

// --- Initialize API Clients ---
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runDraftAgent() {
  console.log(chalk.cyan.bold('🚀 Starting CodeScribe Agent...'));

  try {
    // --- 1. Context Gathering ---
    console.log(chalk.blue('   - Gathering local git context...'));
    const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const diffContent = execSync('git diff origin/main...HEAD').toString().trim();
    const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();

    if (!diffContent) {
      throw new Error('No staged changes found. Please run "git add <files>" for the changes you want to include.');
    }

    // --- 2. Ticket ID Extraction ---
    console.log(chalk.blue(`   - Parsing branch name "${branchName}"...`));
    const ticketIdMatch = branchName.match(/([A-Z]+-\d+)/);
    if (!ticketIdMatch) {
      throw new Error(`Could not find a Linear ticket ID in branch "${branchName}". Branch name should contain a ticket ID like COD-123, TIX-456, etc.`);
    }
    const linearTicketId = ticketIdMatch[0];
    console.log(chalk.green(`   - Found Linear Ticket: ${linearTicketId}`));

    // --- 3. AI Analysis ---
    console.log(chalk.blue('   - Sending code changes to AI for analysis...'));
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze the following git diff and generate a clean JSON object with three keys: "title", "body", and "summary". Diff:\n\n${diffContent}`;

    const result = await model.generateContent(prompt);
    const jsonString = result.response.text().replace(/```json\n|```/g, '').trim();
    const aiResults = JSON.parse(jsonString);
    console.log(chalk.green('   - AI analysis complete.'));

    // --- 4. GitHub PR Creation ---
    console.log(chalk.blue('   - Creating draft pull request on GitHub...'));
    const repoInfoMatch = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)(\.git)?/);
    if (!repoInfoMatch) {
      throw new Error('Could not parse GitHub owner and repo from remote URL.');
    }

    const owner = repoInfoMatch[1];
    const repo = repoInfoMatch[2];

    const pr = await octokit.pulls.create({
      owner,
      repo,
      title: aiResults.title,
      body: aiResults.body,
      head: branchName,
      base: 'main',
      draft: true
    });

    console.log(chalk.green(`   - Created Draft PR: ${pr.data.html_url}`));

    // --- 5. Linear Update ---
    console.log(chalk.blue(`   - Adding comment to Linear ticket ${linearTicketId}...`));

    const issueQuery = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          title
        }
      }
    `;

    const issueResponse = await axios.post('https://api.linear.app/graphql', {
      query: issueQuery,
      variables: { id: linearTicketId }
    }, {
      headers: {
        'Authorization': `${process.env.LINEAR_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!issueResponse.data.data || !issueResponse.data.data.issue) {
      console.log(chalk.yellow(`   - Warning: Linear ticket ${linearTicketId} not found, skipping Linear update`));
      console.log(chalk.green.bold('\n✅ Agent finished successfully (GitHub PR created, Linear skipped)!'));
      return;
    }

    const issueId = issueResponse.data.data.issue.id;

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

    await axios.post('https://api.linear.app/graphql', {
      query: commentMutation,
      variables: {
        issueId: issueId,
        body: commentBody
      }
    }, {
      headers: {
        'Authorization': `${process.env.LINEAR_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

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
}

runDraftAgent();
