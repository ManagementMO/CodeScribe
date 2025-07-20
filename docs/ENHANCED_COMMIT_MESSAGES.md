# Enhanced Commit Message Generation

This document describes the enhanced commit message generation functionality implemented in CodeScribe, which provides AI-powered commit messages with detailed context and impact analysis.

## Overview

The enhanced commit message generation system analyzes code changes comprehensively and generates intelligent commit messages that explain not just WHAT changed, but WHY it changed, including design decisions and their rationale.

## Features

### 1. AI-Powered Analysis
- Uses Google Gemini AI for intelligent commit message generation
- Analyzes code complexity, security implications, and performance impact
- Provides detailed rationale for changes and design decisions
- Falls back to template-based generation when AI is unavailable

### 2. Commit Message Templates
- Supports multiple commit types: feature, bugfix, refactor, performance, security, test, documentation, maintenance, breaking
- Follows conventional commit format with scope and breaking change indicators
- Automatically suggests the most appropriate template based on change analysis

### 3. Detailed Impact Analysis
- **Performance Impact**: Assesses whether changes affect performance (low/medium/high impact)
- **Security Analysis**: Identifies security vulnerabilities and risk levels
- **Maintainability**: Evaluates how changes affect code maintainability
- **Breaking Changes**: Detects API changes that may affect existing functionality

### 4. Enhanced Linear Integration
- Adds detailed commit information to Linear tickets
- Includes impact analysis, code metrics, and quality assessments
- Provides GitHub commit links and comprehensive change summaries

## Usage

### Basic Usage
The enhanced commit message generation is automatically used when creating commits through the CodeScribe workflow:

```javascript
const commitWorkflow = new CommitWorkflow(config);
const result = await commitWorkflow.execute(context, options);
```

### Configuration
Configure AI settings in your CodeScribe configuration:

```json
{
  "ai": {
    "model": "gemini-1.5-flash",
    "maxRetries": 3,
    "gemini": {
      "apiKey": "your-api-key"
    }
  },
  "workflows": {
    "commit": {
      "enabled": true,
      "conventionalCommits": true
    }
  }
}
```

### Environment Variables
Set your Gemini API key:
```bash
export GEMINI_API_KEY=your-api-key-here
```

## Commit Message Structure

### Enhanced Format
```
type(scope): summary

Detailed body with change analysis:
- Changes: +45/-5 lines across 2 files
- Complexity: medium (8 points)
- Security: low risk level
- Dependencies: 1 added, 2 updated

Footer with breaking changes or issue references
```

### Template Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New functionality | `feat(auth): implement OAuth2 authentication flow` |
| `fix` | Bug fixes | `fix(api): resolve token expiration handling` |
| `refactor` | Code restructuring | `refactor(auth): extract authentication utilities` |
| `perf` | Performance improvements | `perf(api): optimize database query performance` |
| `security` | Security-related changes | `security(auth): implement rate limiting` |
| `test` | Test updates | `test(auth): add unit tests for login flow` |
| `docs` | Documentation | `docs(api): update endpoint documentation` |
| `chore` | Maintenance tasks | `chore(deps): update dependencies to latest versions` |

## Impact Analysis Details

### Performance Impact Levels
- **low_impact**: Minor changes with minimal performance effect
- **medium_impact**: Moderate changes that may affect performance
- **high_impact**: Significant changes with potential performance implications

### Security Risk Levels
- **none**: No security implications detected
- **low**: Minor security considerations
- **medium**: Moderate security risks that should be reviewed
- **high**: Significant security vulnerabilities requiring immediate attention

### Maintainability Assessment
- **improved**: Changes that enhance code maintainability
- **unchanged**: No significant impact on maintainability
- **degraded**: Changes that may reduce code maintainability

## Linear Integration

When a Linear ticket ID is detected in the branch name or context, the system automatically:

1. Adds a detailed commit comment to the Linear ticket
2. Includes impact analysis and code metrics
3. Provides GitHub commit links
4. Shows complexity and security analysis results

### Example Linear Comment
```markdown
💾 **New Commit**

**Commit:** `abc123f`
**Message:** feat(ai): ECS-123 - implement enhanced commit message generation
**Branch:** feature/enhanced-commit-messages
**GitHub:** [View Commit](https://github.com/user/repo/commit/abc123f)

### 📊 **Impact Analysis**
**Performance Impact:** low_impact
**Security Risk:** low
**Maintainability:** improved

### 📈 **Code Metrics**
**Lines Added:** 45
**Lines Removed:** 5
**Files Modified:** 2

### 🔍 **Code Quality**
**Complexity Level:** medium

*Committed by CodeScribe Agent with Enhanced Analysis*
```

## Testing

The implementation includes comprehensive tests:

- `test-enhanced-commit.js`: Tests core functionality
- `test-commit-integration.js`: Tests integration with existing workflows

Run tests:
```bash
node test-enhanced-commit.js
node test-commit-integration.js
```

## Architecture

### Key Components

1. **AIAnalysisEngine** (`src/ai/AIAnalysisEngine.js`)
   - Handles AI-powered commit message generation
   - Provides fallback functionality when AI is unavailable
   - Manages retry logic and error handling

2. **CommitMessageTemplates** (`src/workflows/commit/CommitMessageTemplates.js`)
   - Defines commit message templates for different change types
   - Provides template suggestion logic based on change analysis
   - Supports conventional commit format generation

3. **CommitWorkflow** (`src/workflows/commit/CommitWorkflow.js`)
   - Orchestrates the enhanced commit message generation
   - Integrates with Linear for ticket updates
   - Manages commit creation and remote pushing

4. **ContextAnalyzer** (`src/context/ContextAnalyzer.js`)
   - Provides comprehensive code analysis
   - Analyzes complexity, security, and dependencies
   - Generates detailed change metrics

## Future Enhancements

- Support for additional AI models (OpenAI, Claude, etc.)
- Custom template definitions
- Integration with other project management tools
- Advanced security vulnerability detection
- Performance impact prediction based on code patterns
- Automated code review suggestions in commit messages

## Troubleshooting

### Common Issues

1. **AI Service Unavailable**
   - System automatically falls back to template-based generation
   - Check API key configuration and network connectivity

2. **Template Generation Errors**
   - Fallback to basic conventional commit format
   - Check change analysis data structure

3. **Linear Integration Failures**
   - Commit still succeeds, only Linear update fails
   - Check Linear API configuration and permissions

### Debug Mode
Enable debug logging by setting the log level in your configuration:
```json
{
  "logging": {
    "level": "debug"
  }
}
```