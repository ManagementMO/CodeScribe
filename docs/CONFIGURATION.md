# Configuration Reference

CodeScribe supports extensive configuration to adapt to your team's workflow and project requirements. This document covers all configuration options and examples.

## Configuration Files

CodeScribe looks for configuration in the following order:
1. `.codescribe.json` (project-specific)
2. `.codescribe.js` (for dynamic configuration)
3. `package.json` (under `codescribe` key)
4. Environment variables
5. Default values

## Basic Configuration

### Project Configuration (`.codescribe.json`)

```json
{
  "github": {
    "owner": "your-username",
    "repo": "your-repo-name",
    "defaultBranch": "main",
    "prTemplate": "default",
    "autoMerge": false,
    "reviewers": ["@team-lead", "@senior-dev"],
    "labels": ["enhancement", "needs-review"]
  },
  "linear": {
    "teamId": "your-team-id",
    "projectId": "your-project-id",
    "autoTransition": true,
    "statusMapping": {
      "in_progress": "In Progress",
      "in_review": "In Review",
      "done": "Done"
    }
  },
  "commit": {
    "conventional": true,
    "signoff": false,
    "template": "default",
    "maxLength": 72,
    "includeScope": true,
    "autoStage": "modified"
  },
  "ai": {
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "temperature": 0.3,
    "maxTokens": 1000
  },
  "workflows": {
    "autoCreatePR": true,
    "autoUpdateLinear": true,
    "generateDocs": true,
    "runTests": false,
    "notifyTeam": false
  }
}
```

## Detailed Configuration Options

### GitHub Configuration

```json
{
  "github": {
    "owner": "string",              // GitHub username or organization
    "repo": "string",               // Repository name
    "defaultBranch": "main",        // Default branch for PRs
    "apiUrl": "https://api.github.com", // GitHub API URL (for Enterprise)
    
    // Pull Request Settings
    "prTemplate": "default",        // PR template to use
    "autoMerge": false,            // Auto-merge when approved
    "deleteBranchAfterMerge": true, // Clean up feature branches
    "squashMerge": true,           // Use squash merge
    
    // Review Settings
    "reviewers": [],               // Default reviewers
    "teamReviewers": [],           // Team reviewers
    "assignees": [],               // Default assignees
    
    // Labels and Metadata
    "labels": [],                  // Default labels
    "milestone": null,             // Default milestone
    "projects": [],                // GitHub projects to add to
    
    // Branch Protection
    "branchProtection": {
      "enabled": false,
      "requireReviews": 1,
      "requireStatusChecks": true,
      "enforceAdmins": false
    }
  }
}
```

### Linear Configuration

```json
{
  "linear": {
    "teamId": "string",            // Linear team ID
    "projectId": "string",         // Linear project ID
    "workspaceId": "string",       // Linear workspace ID
    
    // Automation Settings
    "autoTransition": true,        // Auto-transition ticket status
    "autoAssign": false,           // Auto-assign tickets
    "trackTime": true,             // Track time spent
    
    // Status Mapping
    "statusMapping": {
      "todo": "Todo",
      "in_progress": "In Progress",
      "in_review": "In Review",
      "done": "Done",
      "cancelled": "Cancelled"
    },
    
    // Ticket Creation
    "createSubTickets": true,      // Create sub-tickets for complex changes
    "ticketTemplate": "default",   // Template for new tickets
    
    // Notifications
    "notifyOnUpdate": true,        // Notify team on updates
    "slackIntegration": false,     // Slack notifications
    
    // Custom Fields
    "customFields": {
      "priority": "High",
      "component": "Frontend",
      "environment": "Development"
    }
  }
}
```

### Commit Configuration

```json
{
  "commit": {
    // Message Format
    "conventional": true,          // Use conventional commits
    "template": "default",         // Commit message template
    "maxLength": 72,              // Max subject line length
    "includeScope": true,         // Include scope in messages
    "includeBody": true,          // Include detailed body
    "includeFooter": true,        // Include footer with refs
    
    // Staging Options
    "autoStage": "modified",      // "all", "modified", "none"
    "stagePatterns": [            // Patterns to auto-stage
      "src/**/*.js",
      "tests/**/*.test.js"
    ],
    "ignorePatterns": [           // Patterns to ignore
      "*.log",
      "node_modules/**"
    ],
    
    // Git Options
    "signoff": false,             // Add Signed-off-by
    "gpgSign": false,             // GPG sign commits
    "allowEmpty": false,          // Allow empty commits
    "amendLast": false,           // Amend last commit
    
    // Validation
    "validateMessage": true,      // Validate commit messages
    "requireTicketRef": true,     // Require ticket reference
    "allowBreakingChanges": true, // Allow breaking changes
    
    // Hooks
    "preCommitHooks": [],         // Pre-commit hooks to run
    "postCommitHooks": []         // Post-commit hooks to run
  }
}
```

### AI Configuration

```json
{
  "ai": {
    "provider": "gemini",         // "gemini", "openai", "anthropic"
    "model": "gemini-1.5-flash",  // Model to use
    "apiKey": "env:GEMINI_API_KEY", // API key (use env: prefix)
    
    // Generation Settings
    "temperature": 0.3,           // Creativity level (0-1)
    "maxTokens": 1000,           // Max response length
    "topP": 0.9,                 // Nucleus sampling
    
    // Prompts
    "commitPrompt": "default",    // Commit message prompt
    "prPrompt": "default",        // PR description prompt
    "docPrompt": "default",       // Documentation prompt
    
    // Features
    "codeAnalysis": true,         // Enable code analysis
    "securityScan": true,         // Security vulnerability scanning
    "performanceAnalysis": false, // Performance analysis
    "testGeneration": false,      // Auto-generate tests
    
    // Fallback
    "fallbackProvider": "openai", // Fallback if primary fails
    "retryAttempts": 3,          // Retry attempts
    "timeout": 30000             // Request timeout (ms)
  }
}
```

### Workflow Configuration

```json
{
  "workflows": {
    // Core Workflows
    "autoCreatePR": true,         // Auto-create PRs
    "autoUpdateLinear": true,     // Auto-update Linear tickets
    "generateDocs": true,         // Generate documentation
    "runTests": false,           // Run tests before commit
    "notifyTeam": false,         // Notify team members
    
    // Advanced Workflows
    "codeReview": {
      "enabled": true,
      "autoRequest": true,
      "reviewers": ["@senior-dev"],
      "requireApproval": true
    },
    
    "deployment": {
      "enabled": false,
      "environment": "staging",
      "autoTrigger": false,
      "healthChecks": true
    },
    
    "documentation": {
      "mermaidDiagrams": true,
      "apiDocs": true,
      "changelog": true,
      "readmeUpdate": false
    },
    
    // Custom Workflows
    "customWorkflows": [
      {
        "name": "security-check",
        "trigger": "pre-commit",
        "command": "npm run security-audit",
        "required": true
      }
    ]
  }
}
```

## Environment Variables

```bash
# Required
GITHUB_TOKEN=your_github_token
LINEAR_API_KEY=your_linear_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional
CODESCRIBE_LOG_LEVEL=info          # debug, info, warn, error
CODESCRIBE_CONFIG_PATH=./config    # Custom config directory
CODESCRIBE_CACHE_DIR=./.codescribe # Cache directory
CODESCRIBE_DRY_RUN=false          # Dry run mode
CODESCRIBE_VERBOSE=false          # Verbose output

# GitHub Enterprise
GITHUB_API_URL=https://api.github.com
GITHUB_UPLOAD_URL=https://uploads.github.com

# Linear Custom
LINEAR_API_URL=https://api.linear.app

# AI Provider Alternatives
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## Dynamic Configuration (`.codescribe.js`)

For complex setups, use JavaScript configuration:

```javascript
module.exports = {
  github: {
    owner: process.env.GITHUB_OWNER || 'default-owner',
    repo: process.env.GITHUB_REPO || 'default-repo',
    reviewers: process.env.NODE_ENV === 'production' 
      ? ['@senior-dev', '@team-lead'] 
      : ['@junior-dev']
  },
  
  linear: {
    teamId: getLinearTeamId(),
    autoTransition: process.env.NODE_ENV !== 'development'
  },
  
  workflows: {
    runTests: process.env.CI === 'true',
    generateDocs: shouldGenerateDocs()
  }
};

function getLinearTeamId() {
  // Custom logic to determine team ID
  return process.env.LINEAR_TEAM_ID;
}

function shouldGenerateDocs() {
  // Custom logic for documentation generation
  return process.env.GENERATE_DOCS === 'true';
}
```

## Team Configuration Examples

### Small Team Setup

```json
{
  "github": {
    "reviewers": ["@team-lead"],
    "autoMerge": true,
    "labels": ["ready-for-review"]
  },
  "linear": {
    "autoTransition": true,
    "notifyOnUpdate": false
  },
  "commit": {
    "requireTicketRef": false,
    "conventional": true
  },
  "workflows": {
    "runTests": false,
    "notifyTeam": false
  }
}
```

### Enterprise Setup

```json
{
  "github": {
    "apiUrl": "https://github.company.com/api/v3",
    "reviewers": ["@security-team", "@architecture-team"],
    "branchProtection": {
      "enabled": true,
      "requireReviews": 2,
      "requireStatusChecks": true
    }
  },
  "linear": {
    "autoTransition": false,
    "customFields": {
      "security_review": "Required",
      "compliance": "SOX"
    }
  },
  "workflows": {
    "runTests": true,
    "securityScan": true,
    "complianceCheck": true
  }
}
```

### Open Source Project

```json
{
  "github": {
    "labels": ["community", "needs-review"],
    "prTemplate": "community",
    "requireContributorAgreement": true
  },
  "commit": {
    "signoff": true,
    "conventional": true,
    "requireTicketRef": false
  },
  "workflows": {
    "runTests": true,
    "generateDocs": true,
    "notifyMaintainers": true
  }
}
```

## Validation and Testing

Test your configuration:

```bash
# Validate configuration
node codescribe.js config --validate

# Test GitHub connection
node codescribe.js test --github

# Test Linear connection
node codescribe.js test --linear

# Test AI integration
node codescribe.js test --ai

# Dry run workflow
CODESCRIBE_DRY_RUN=true node codescribe.js
```

## Migration Guide

### From v1.x to v2.x

1. **Update configuration format**:
   ```bash
   node codescribe.js migrate --from v1 --to v2
   ```

2. **Review breaking changes**:
   - `prTemplate` moved to `github.prTemplate`
   - `autoUpdate` split into `autoCreatePR` and `autoUpdateLinear`

3. **Test new configuration**:
   ```bash
   node codescribe.js config --validate
   ```

## Troubleshooting Configuration

### Common Issues

1. **Invalid JSON**: Use a JSON validator
2. **Missing required fields**: Check error messages
3. **API connection issues**: Verify tokens and URLs
4. **Permission errors**: Check token scopes

### Debug Configuration

```bash
# Show current configuration
node codescribe.js config --show

# Show configuration sources
node codescribe.js config --sources

# Validate and show errors
node codescribe.js config --validate --verbose
```