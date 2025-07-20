# Getting Started with CodeScribe

CodeScribe is a comprehensive workflow orchestration tool that automates your development workflow from code changes to GitHub PRs and Linear ticket management. This guide will help you get up and running quickly.

## Prerequisites

- Node.js (v14 or higher)
- Git repository with remote origin
- GitHub account with repository access
- Linear account with API access (optional)
- Google Gemini API key for AI features

## Installation

1. **Clone or download CodeScribe**
   ```bash
   git clone <your-codescribe-repo>
   cd codescribe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   GITHUB_TOKEN=your_github_personal_access_token
   LINEAR_API_KEY=your_linear_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

## Quick Start Examples

### Example 1: Basic Commit Workflow

The most common workflow - you've made changes and want to commit with an intelligent message:

```bash
# Let CodeScribe analyze your changes and generate a commit message
node codescribe.js commit

# Or use the standalone commit tool
node commit.js
```

**What happens:**
- Analyzes your git diff
- Generates a conventional commit message
- Stages appropriate files
- Creates the commit
- Pushes to your current branch

### Example 2: Feature Branch Workflow

You're working on a Linear ticket and need to create a feature branch:

```bash
# Create a new branch based on Linear ticket
node codescribe.js branch --ticket LIN-123

# Make your changes, then commit
node codescribe.js commit

# Create PR when ready
node codescribe.js pr
```

### Example 3: Complete Development Cycle

The primary workflow that automates the entire development cycle:

```bash
# After making changes, run the full workflow
node codescribe.js

# This will:
# 1. Analyze your changes
# 2. Create/update commits
# 3. Create or update PR
# 4. Update Linear ticket status
# 5. Generate documentation if needed
```

## Common Workflows

### Daily Development Workflow

1. **Start work on a ticket**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Create feature branch (CodeScribe can help)
   node codescribe.js branch --ticket LIN-123
   ```

2. **Make your changes**
   - Edit code, add features, fix bugs
   - Run tests locally

3. **Commit your work**
   ```bash
   # Let CodeScribe create intelligent commits
   node codescribe.js commit
   
   # Or commit specific files
   node codescribe.js commit --files src/feature.js tests/feature.test.js
   ```

4. **Create Pull Request**
   ```bash
   # Create PR with Linear integration
   node codescribe.js pr
   
   # Or run full workflow
   node codescribe.js
   ```

### Bug Fix Workflow

1. **Create hotfix branch**
   ```bash
   node codescribe.js branch --type hotfix --ticket LIN-456
   ```

2. **Fix the bug and commit**
   ```bash
   node codescribe.js commit --type fix
   ```

3. **Create urgent PR**
   ```bash
   node codescribe.js pr --urgent --reviewers @team-lead
   ```

### Feature Development Workflow

1. **Plan the feature**
   ```bash
   # CodeScribe can help break down complex features
   node codescribe.js plan --ticket LIN-789
   ```

2. **Implement incrementally**
   ```bash
   # Commit each logical piece
   node codescribe.js commit --scope auth --type feat
   node codescribe.js commit --scope validation --type feat
   ```

3. **Generate documentation**
   ```bash
   # Auto-generate diagrams and docs
   node codescribe.js docs --mermaid --api
   ```

## Configuration

### Basic Configuration

Create a `.codescribe.json` file in your project root:

```json
{
  "github": {
    "owner": "your-username",
    "repo": "your-repo",
    "defaultBranch": "main"
  },
  "linear": {
    "teamId": "your-team-id",
    "projectId": "your-project-id"
  },
  "commit": {
    "conventional": true,
    "signoff": false,
    "template": "default"
  },
  "workflows": {
    "autoCreatePR": true,
    "autoUpdateLinear": true,
    "generateDocs": true
  }
}
```

### Advanced Configuration

For more complex setups, see [Configuration Reference](CONFIGURATION.md).

## Troubleshooting

### Common Issues

1. **"GitHub token not found"**
   - Ensure `GITHUB_TOKEN` is set in your `.env` file
   - Verify the token has appropriate permissions

2. **"Linear API key invalid"**
   - Check your `LINEAR_API_KEY` in `.env`
   - Ensure you have access to the Linear workspace

3. **"No changes detected"**
   - Make sure you have uncommitted changes
   - Use `git status` to verify

4. **"Branch already exists"**
   - CodeScribe will switch to existing branch
   - Use `--force` to recreate the branch

### Getting Help

- Run `node codescribe.js --help` for command help
- Check the logs in `.codescribe/logs/`
- Review the [FAQ](FAQ.md)
- Create an issue on GitHub

## Next Steps

- Read the [Configuration Reference](CONFIGURATION.md)
- Explore [Advanced Workflows](ADVANCED_WORKFLOWS.md)
- Learn about [Plugin Development](PLUGIN_DEVELOPMENT.md)
- Check out [Best Practices](BEST_PRACTICES.md)

## Tips for Success

1. **Start Simple**: Begin with basic commit workflow, then add complexity
2. **Customize Gradually**: Adjust configuration as you learn what works
3. **Use Templates**: Leverage built-in templates for consistency
4. **Monitor Logs**: Check logs when things don't work as expected
5. **Stay Updated**: Keep CodeScribe updated for latest features