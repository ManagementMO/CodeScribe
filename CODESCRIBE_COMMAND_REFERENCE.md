# CodeScribe Complete Command Reference

## 🚀 Core CLI Commands

### Main CodeScribe Commands

```bash
# Default workflow - Create/Update PR with full tracking
codescribe
codescribe default
codescribe pr

# Smart commit with AI-generated messages
codescribe commit

# Interactive guided workflow selection
codescribe interactive

# Specialized workflows
codescribe docs          # Generate documentation, diagrams, and ADRs
codescribe quality       # Code quality analysis and security scanning
codescribe linear        # Advanced Linear ticket management
codescribe feature       # Complete feature development workflow
codescribe fix           # Bug fix workflow with issue management
codescribe review        # Code review assistance and analysis
codescribe release       # Release preparation and changelog generation

# Legacy commands
codescribe github-only   # Only perform GitHub operations
codescribe linear-only   # Only perform Linear operations
```

### History & Analytics Commands

```bash
# Show workflow execution history
codescribe history

# Show execution statistics and analytics
codescribe stats

# Replay a previous workflow execution
codescribe replay <execution-id>

# Show recent log entries
codescribe logs
```

### Global Options

```bash
--verbose, -v      # Enable verbose logging
--dry-run          # Show what would be done without executing
--config           # Specify custom configuration file
--help, -h         # Show help message
```

### Commit Command Options

```bash
codescribe commit [options]

--message, -m      # Custom commit message
--all, -a          # Stage all changes (new and modified files)
--add-modified     # Stage only modified files
--no-push          # Skip pushing to remote
--force            # Force commit even if no changes detected
```

### History Command Options

```bash
codescribe history --limit <number>    # Limit number of entries shown
codescribe history --verbose          # Show detailed results
codescribe logs --lines <number>      # Number of log lines to show
```

## 🌊 Warp Workflow Commands

### Available Warp Workflows

All workflows can be run directly from Warp's workflow picker or command palette:

```bash
# Main workflows
warp workflow run codescribe                    # Default PR workflow
warp workflow run codescribe-commit             # Smart commit workflow
warp workflow run codescribe-pr                 # Enhanced PR with tracking
warp workflow run codescribe-interactive        # Guided workflow selection

# Specialized workflows
warp workflow run codescribe-docs               # Documentation generation
warp workflow run codescribe-quality            # Code quality analysis
warp workflow run codescribe-linear             # Linear ticket management
warp workflow run codescribe-feature            # Feature development
warp workflow run codescribe-fix                # Bug fix workflow
warp workflow run codescribe-review             # Code review assistance
warp workflow run codescribe-release            # Release preparation
```

### Warp Workflow Descriptions

| Workflow | Description |
|----------|-------------|
| `codescribe` | Main PR workflow - analyzes changes, creates/updates PRs, updates Linear |
| `codescribe-commit` | Smart commit with AI-generated conventional commit messages |
| `codescribe-pr` | Enhanced PR workflow with Mermaid diagrams and quality analysis |
| `codescribe-interactive` | Guided workflow selection based on current project state |
| `codescribe-docs` | Generate documentation, ADRs, and architectural diagrams |
| `codescribe-quality` | Code quality analysis, security scanning, and best practices |
| `codescribe-linear` | Advanced Linear ticket management and progress tracking |
| `codescribe-feature` | Complete feature development workflow with testing |
| `codescribe-fix` | Bug fix workflow with issue tracking and validation |
| `codescribe-review` | Code review assistance with AI-powered insights |
| `codescribe-release` | Release preparation, changelog generation, and versioning |

## 🤖 CodeScribe Agent Commands (Linear Integration)

### Agent Mention Commands

Use `@codescribe-agent` in Linear issue comments:

```bash
# System & Health
@codescribe-agent status                        # Health check and system status
@codescribe-agent help                          # Show all available commands

# Code Analysis
@codescribe-agent [GitHub PR URL]               # Comprehensive PR review
@codescribe-agent commit                        # Analyze latest commit
@codescribe-agent repo                          # Repository statistics and analysis

# Project Insights
@codescribe-agent progress                      # Analyze current issue progress
@codescribe-agent team                          # Team insights dashboard
@codescribe-agent insights                      # Project analytics

# Conversational AI
@codescribe-agent chat [your question]          # Ask development questions
@codescribe-agent help me with [topic]          # Get assistance on specific topics
@codescribe-agent talk [message]                # General conversation
```

### Agent Command Examples

```bash
# Health and status
@codescribe-agent status
@codescribe-agent health

# Repository analysis
@codescribe-agent repo
@codescribe-agent repository

# Code review
@codescribe-agent https://github.com/owner/repo/pull/123
@codescribe-agent commit
@codescribe-agent diff

# Project insights
@codescribe-agent progress
@codescribe-agent analyze
@codescribe-agent team
@codescribe-agent insights

# Conversational AI
@codescribe-agent chat how should I structure this feature?
@codescribe-agent help me with testing strategies
@codescribe-agent talk about the architecture decisions
```

## 📋 Command Usage Examples

### Basic Workflows

```bash
# Quick commit with auto-generated message
codescribe commit

# Custom commit message
codescribe commit -m "Fix authentication bug in user service"

# Stage all files and commit
codescribe commit --all

# Commit without pushing to remote
codescribe commit --no-push

# Full PR workflow
codescribe

# Documentation generation only
codescribe docs

# Code quality analysis
codescribe quality --verbose
```

### Interactive Mode

```bash
# Start interactive mode for guided workflow selection
codescribe interactive

# The interactive mode will:
# 1. Analyze your current project state
# 2. Suggest appropriate workflows
# 3. Guide you through workflow-specific options
# 4. Execute the selected workflow
```

### History and Analytics

```bash
# Show last 10 workflow executions
codescribe history --limit 10

# Show detailed execution statistics
codescribe stats

# Show recent log entries
codescribe logs --lines 100

# Replay a specific execution
codescribe replay abc123-def456-789
```

### Advanced Usage

```bash
# Dry run to see what would happen
codescribe pr --dry-run

# Use custom configuration
codescribe --config ./custom-config.json

# Verbose output for debugging
codescribe quality --verbose

# Force commit even with no changes
codescribe commit --force
```

## 🔧 Configuration Commands

### Environment Setup

```bash
# Copy example configuration
cp .codescribe.example.json .codescribe.json

# Edit configuration
# Set up your API keys in .env file:
# GITHUB_TOKEN=your_github_token
# LINEAR_API_KEY=your_linear_api_key
# GEMINI_API_KEY=your_gemini_api_key
```

### Agent Setup

```bash
# Start the Linear agent server
node linear_agent.js

# The agent runs on port 3000 by default
# Configure webhook URL in Linear: https://your-domain.com/api/webhook
```

## 🎯 Workflow Selection Guide

### When to Use Each Command

| Situation | Recommended Command |
|-----------|-------------------|
| Ready to create/update PR | `codescribe` or `codescribe pr` |
| Just want to commit changes | `codescribe commit` |
| Need documentation | `codescribe docs` |
| Code quality check | `codescribe quality` |
| Working on Linear ticket | `codescribe linear` |
| Building new feature | `codescribe feature` |
| Fixing a bug | `codescribe fix` |
| Preparing release | `codescribe release` |
| Not sure what to do | `codescribe interactive` |
| Need help in Linear | `@codescribe-agent help` |

## 💡 Pro Tips

1. **Use Interactive Mode**: When unsure, run `codescribe interactive` for guided workflow selection
2. **Agent Integration**: Set up the Linear agent for real-time assistance in your tickets
3. **Dry Run First**: Use `--dry-run` to preview changes before execution
4. **Check History**: Use `codescribe history` to track your workflow usage patterns
5. **Verbose Logging**: Add `--verbose` for detailed output when troubleshooting
6. **Custom Messages**: Use `-m` flag for commit messages when you want specific wording
7. **Warp Integration**: Use Warp workflows for quick access to common operations

## 🚨 Common Issues & Solutions

### Command Not Found
```bash
# If codescribe command not found, install globally:
npm install -g .
# or use npm link in the project directory
npm link
```

### Agent Not Responding
```bash
# Check agent status
@codescribe-agent status

# Restart the agent server
node linear_agent.js
```

### API Errors
```bash
# Check your .env file has all required tokens:
# GITHUB_TOKEN, LINEAR_API_KEY, GEMINI_API_KEY
```

This reference covers all available commands and their usage patterns. The tool is designed to be intuitive with the interactive mode helping guide users to the right workflow for their current situation.