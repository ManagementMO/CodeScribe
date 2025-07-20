# CodeScribe User Guide

## Overview

CodeScribe is an intelligent AI-powered development workflow orchestration tool that automates common development tasks like creating pull requests, managing Linear tickets, generating documentation, and maintaining code quality. It transforms your development workflow by providing intelligent automation that understands your code changes and project context.

## Quick Start

### Installation

1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd CodeScribe
npm install
```

2. Set up your environment variables in `.env`:
```bash
GITHUB_TOKEN=your_github_token
LINEAR_API_KEY=your_linear_api_key
GEMINI_API_KEY=your_gemini_api_key
```

3. Test the installation:
```bash
node codescribe.js --help
```

### Basic Usage

The simplest way to use CodeScribe is to run it in your project directory after making changes:

```bash
node codescribe.js
```

This will:
- Analyze your code changes
- Create or update a pull request
- Update your Linear ticket (if applicable)
- Generate documentation and diagrams
- Provide code quality insights

## Core Workflows

### Default Workflow (PR Creation)

The default workflow is the most comprehensive and handles the complete development lifecycle:

```bash
node codescribe.js
# or
node codescribe.js pr
```

**What it does:**
- Gathers git context and analyzes code changes
- Performs AI-powered code analysis
- Creates or updates GitHub pull request with intelligent descriptions
- Updates Linear ticket status and adds progress comments
- Generates Mermaid diagrams for code visualization
- Provides security and quality analysis

### Smart Commit Workflow

Create intelligent commits with AI-generated messages:

```bash
node codescribe.js commit
```

**Options:**
- `--message, -m`: Custom commit message
- `--all, -a`: Stage all changes (new and modified files)
- `--add-modified`: Stage only modified files
- `--no-push`: Skip pushing to remote
- `--force`: Force commit even if no changes detected

**Examples:**
```bash
node codescribe.js commit -m "Fix authentication bug"
node codescribe.js commit --all --no-push
node codescribe.js commit --add-modified
```

### Interactive Mode

Get guided workflow selection based on your current project state:

```bash
node codescribe.js interactive
```

This mode will:
- Analyze your current project state
- Suggest the most appropriate workflow
- Guide you through workflow-specific options
- Execute your selected workflow

### Documentation Generation

Generate comprehensive documentation and visual diagrams:

```bash
node codescribe.js docs
```

**What it generates:**
- Mermaid flowcharts for functions and classes
- Architecture diagrams from project structure
- API flow diagrams for endpoint changes
- Code change impact visualizations

### Code Quality Analysis

Perform comprehensive code quality and security analysis:

```bash
node codescribe.js quality
```

**Analysis includes:**
- Code complexity metrics
- Security vulnerability scanning
- Dependency analysis
- Performance bottleneck detection
- Technical debt identification

### Linear Ticket Management

Advanced Linear integration for ticket workflow management:

```bash
node codescribe.js linear
```

**Features:**
- Automatic ticket status transitions
- Time tracking integration
- Sub-ticket creation for complex changes
- Blocker detection and notification
- Progress reporting with detailed context

## Specialized Workflows

### Feature Development

Complete workflow for feature development:

```bash
node codescribe.js feature
```

Optimized for feature branches with enhanced tracking and documentation.

### Bug Fix Workflow

Specialized workflow for bug fixes:

```bash
node codescribe.js fix
```

Includes issue management and regression testing suggestions.

### Code Review Assistant

Get assistance with code reviews:

```bash
node codescribe.js review
```

Provides detailed analysis and suggestions for code review.

### Release Preparation

Prepare releases with automated changelog generation:

```bash
node codescribe.js release
```

Generates release notes, version tags, and deployment preparation.

## Primary Development Flow

Here's the recommended workflow for most development tasks:

### 1. Start Development
- Create a feature branch following naming conventions (e.g., `feat/COD-123-feature-name`)
- Make your code changes
- Test your changes locally

### 2. Commit and Push
```bash
# Stage and commit with intelligent message generation
node codescribe.js commit --all

# Or use interactive mode for guidance
node codescribe.js interactive
```

### 3. Create Pull Request
```bash
# Create comprehensive PR with full tracking
node codescribe.js pr
```

This will:
- Create a new branch if needed
- Push commits to remote
- Create GitHub PR with detailed description
- Update Linear ticket with progress
- Generate documentation and diagrams
- Provide code quality analysis

### 4. Handle Updates
When you make additional changes:
```bash
# Commit new changes
node codescribe.js commit -m "Address review feedback"

# Update existing PR
node codescribe.js pr
```

The system will automatically update the existing PR and Linear ticket.

## Configuration

### Environment Variables

Required environment variables:

```bash
# GitHub Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Linear Integration  
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxx

# AI Analysis (Gemini)
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx
```

### Project Configuration

Create a `.codescribe.config.json` file in your project root for custom settings:

```json
{
  "workflows": {
    "github": {
      "enabled": true,
      "templates": "default",
      "autoMerge": false
    },
    "linear": {
      "enabled": true,
      "autoTransition": true,
      "timeTracking": true
    },
    "documentation": {
      "enabled": true,
      "formats": ["mermaid", "markdown"],
      "autoGenerate": true
    },
    "quality": {
      "enabled": true,
      "thresholds": {
        "complexity": 10,
        "security": "medium"
      }
    }
  },
  "ai": {
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "fallback": "gpt-3.5-turbo"
  },
  "notifications": {
    "slack": { "enabled": false },
    "email": { "enabled": false }
  }
}
```

## History and Logging

### View Execution History

```bash
node codescribe.js history
```

Shows recent workflow executions with success/failure status and duration.

### View Statistics

```bash
node codescribe.js stats
```

Displays execution statistics, most used commands, and success rates.

### Replay Previous Execution

```bash
node codescribe.js replay <execution-id>
```

Replay a previous workflow execution with the same parameters.

### View Logs

```bash
node codescribe.js logs
```

Show recent log entries with different verbosity levels.

**Options:**
- `--lines <number>`: Number of log lines to show (default: 50)

## Advanced Features

### Branch Naming Conventions

CodeScribe automatically detects Linear ticket IDs from branch names:

- `feat/COD-123-feature-name` → Links to Linear ticket COD-123
- `fix/COD-456-bug-description` → Links to Linear ticket COD-456
- `chore/COD-789-maintenance` → Links to Linear ticket COD-789

### Automatic Status Transitions

When Linear integration is enabled, CodeScribe automatically:
- Transitions tickets to "In Progress" when work begins
- Updates tickets with development progress
- Transitions to "In Review" when PR is created
- Handles sub-ticket creation for complex changes

### Security Analysis

CodeScribe performs comprehensive security analysis:
- Detects hardcoded secrets and API keys
- Identifies potential XSS vulnerabilities
- Scans for code injection risks
- Analyzes dependency vulnerabilities
- Provides security recommendations

### Code Quality Metrics

Automated code quality analysis includes:
- Cyclomatic complexity calculation
- Code maintainability scoring
- Technical debt identification
- Performance bottleneck detection
- Test coverage analysis

## Troubleshooting

### Common Issues

**1. Buffer Overflow Errors**
If you see `ENOBUFS` errors, CodeScribe will automatically handle large outputs by using summaries and truncation.

**2. Git Authentication Issues**
Ensure your GitHub token has the necessary permissions:
- `repo` scope for private repositories
- `public_repo` scope for public repositories

**3. Linear API Issues**
Verify your Linear API key has the required permissions:
- Read access to tickets
- Write access for status updates
- Comment creation permissions

**4. AI Analysis Failures**
If AI analysis fails:
- Check your Gemini API key is valid
- Ensure you have sufficient API quota
- CodeScribe will continue without AI analysis if needed

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
node codescribe.js --verbose
node codescribe.js quality --verbose
```

### Getting Help

- Use `node codescribe.js --help` for command reference
- Use `node codescribe.js interactive` for guided assistance
- Check logs with `node codescribe.js logs`
- View execution history with `node codescribe.js history`

## Best Practices

### 1. Branch Management
- Use descriptive branch names with ticket IDs
- Keep branches focused on single features/fixes
- Regularly sync with main branch

### 2. Commit Messages
- Let CodeScribe generate intelligent commit messages
- Use conventional commit format when possible
- Include context about why changes were made

### 3. Pull Requests
- Use CodeScribe's automated PR creation for consistency
- Review generated descriptions and modify if needed
- Leverage automated documentation generation

### 4. Linear Integration
- Ensure ticket IDs are in branch names
- Keep ticket descriptions updated
- Use sub-tickets for complex features

### 5. Code Quality
- Run quality analysis regularly
- Address security vulnerabilities promptly
- Monitor complexity metrics over time

## Integration with Development Tools

### Warp Terminal Workflows

CodeScribe includes pre-built Warp workflows for common tasks. See the `.warp/workflows` directory for available workflows.

### IDE Integration

While CodeScribe is primarily a CLI tool, you can integrate it with your IDE:
- Set up custom tasks/scripts
- Use terminal integration
- Create keyboard shortcuts for common commands

### CI/CD Integration

CodeScribe can be integrated into CI/CD pipelines:
- Run quality analysis in CI
- Generate documentation automatically
- Update tickets based on deployment status

## Support and Contributing

For issues, feature requests, or contributions, please refer to the project repository. CodeScribe is designed to be extensible, and custom workflows can be added through the plugin system.