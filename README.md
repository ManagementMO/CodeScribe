# CodeScribe - AI-Powered Development Assistant

A comprehensive AI agent that automates PR creation, Linear ticket updates, and provides daily task summaries.

## Features
- 🤖 **AI-Powered PR Creation**: Analyzes git diffs and creates draft PRs automatically
- 📋 **Linear Integration**: Updates Linear tickets with PR information
- 🌅 **Daily Task Summaries**: Generates friendly morning summaries of your daily tasks
- 🔍 **Code Review**: AI-powered code review for pull requests
- 📊 **Repository Analysis**: Get insights about your codebase
- ⏰ **Automated Scheduling**: Daily summaries at 9 AM on weekdays

## Quick Start

### Manual Daily Summary
Get your daily task summary anytime:
```bash
@codescribe-agent todo
```

### Automated Daily Summaries
Run the scheduler for automatic 9 AM summaries:
```bash
npm run scheduler
```

### PR Creation
1. Stage your changes: `git add .`
2. Run the agent: `npm run agent`
3. Check your PR and Linear ticket!

## Available Commands

- `@codescribe-agent todo` - Get your daily task summary
- `@codescribe-agent repo` - Repository analysis
- `@codescribe-agent commit` - Analyze latest commit
- `@codescribe-agent [GitHub PR URL]` - Code review
- `@codescribe-agent status` - System health check

## Technology & Tools 
- Linear API
- Gemini AI
- GitHub API
- Node.js
- Express

## Environment Variables

Add these to your `.env` file:
```
LINEAR_API_KEY=your_linear_api_key
GITHUB_TOKEN=your_github_token
GEMINI_API_KEY=your_gemini_api_key
LINEAR_TEAM_ID=your_team_id (for daily summaries)
```
