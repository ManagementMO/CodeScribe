// codescribe.js
require('dotenv').config();

const { execSync }      = require('child_process');
const axios              = require('axios');
const { Octokit }        = require('@octokit/rest');
const { VellumClient }   = require('vellum-ai');
const chalk              = require('chalk');

// — Initialize clients —
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const vellum  = new VellumClient({ apiKey: process.env.VELLUM_API_KEY });

async function runDraftAgent() {
  console.log(chalk.cyan.bold('🚀 Starting CodeScribe Agent with Vellum…'));

  try {
    // 1. Gather local Git context
    const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    console.log(chalk.blue(`   • Branch: ${branchName}`));

    // Push unpushed commits if any
    try {
      const unpushed = execSync(`git log origin/${branchName}..HEAD --oneline`).toString().trim();
      if (unpushed) {
        console.log(chalk.yellow('   • Pushing commits…'));
        execSync(`git push -u origin ${branchName}`);
        console.log(chalk.green('   • Push complete'));
      }
    } catch { /* ignore */ }

    const diffContent = execSync('git diff origin/main...HEAD').toString().trim();
    if (!diffContent) throw new Error('No changes vs origin/main');

    // 2. Extract Linear ticket ID
    const ticketMatch = branchName.match(/([A-Z]+-\d+)/);
    if (!ticketMatch) throw new Error('Branch name missing ticket ID (e.g. TIX-123)');
    const ticketId = ticketMatch[0];
    console.log(chalk.green(`   • Ticket: ${ticketId}`));

    // 3. Run Vellum workflow
    console.log(chalk.blue('   • Invoking Vellum workflow…'));
    const resp = await vellum.runWorkflow('code-executor', {
      inputs: { diff: diffContent }
    });
    const aiResults = JSON.parse(resp.outputs.ai_results);
    console.log(chalk.green('   • Vellum analysis done'));

    // 4. Create or update GitHub PR
    const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
    const [, owner, repo] = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    let pr, isUpdate = false;

    const existing = await octokit.pulls.list({
      owner, repo,
      head: `${owner}:${branchName}`, state: 'open'
    });

    if (existing.data.length) {
      pr = existing.data[0];
      isUpdate = true;
      console.log(chalk.yellow(`   • Updating PR #${pr.number}`));
      pr = (await octokit.pulls.update({
        owner, repo,
        pull_number: pr.number,
        title: aiResults.title,
        body:  aiResults.body
      })).data;
    } else {
      console.log(chalk.blue('   • Creating new draft PR…'));
      pr = (await octokit.pulls.create({
        owner, repo,
        head:   branchName,
        base:   'main',
        draft:  true,
        title:  aiResults.title,
        body:   aiResults.body
      })).data;
      console.log(chalk.green(`   • Draft PR #${pr.number} created`));
    }

    // 5. Post back to Linear
    console.log(chalk.blue(`   • Commenting on Linear ${ticketId}`));
    const issuesResp = await axios.post(
      'https://api.linear.app/graphql',
      { query: `
        query { issues(first:50) { nodes { id identifier } } }
      `},
      { headers: {
          'Authorization': process.env.LINEAR_API_KEY,
          'Content-Type':  'application/json'
      }}
    );
    const issueNode = issuesResp.data.data.issues.nodes
      .find(n => n.identifier === ticketId);
    if (!issueNode) throw new Error(`Linear issue ${ticketId} not found`);

    const commentBody = `🚀 **PR ${isUpdate? 'Updated' : 'Created'}**
${aiResults.summary}

**PR:** ${pr.html_url}
**Status:** ${isUpdate? 'Updated' : 'Draft'} #${pr.number}`;

    await axios.post(
      'https://api.linear.app/graphql',
      {
        query: `
          mutation($input: CommentCreateInput!) {
            commentCreate(input: $input) { success }
          }
        `,
        variables: { input: {
          issueId: issueNode.id,
          body:    commentBody
        }}
      },
      { headers: {
          'Authorization': process.env.LINEAR_API_KEY,
          'Content-Type':  'application/json'
      }}
    );

    console.log(chalk.green.bold('✅ Agent finished!'));
  }
  catch(err) {
    console.error(chalk.red.bold('❌ Agent failed:'), err.message);
    process.exit(1);
  }
}

runDraftAgent();
