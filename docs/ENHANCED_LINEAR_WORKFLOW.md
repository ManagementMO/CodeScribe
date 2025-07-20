# Enhanced Linear Workflow Documentation

## Overview

The Enhanced Linear Workflow provides advanced ticket management capabilities including automatic status transitions, time tracking integration, scope change detection, and intelligent sub-ticket creation for complex development tasks.

## Features

### 1. Advanced Ticket Management (Task 6.1)

#### Automatic Status Transitions
- **Branch Created**: Automatically moves tickets from "Todo/Backlog" to "In Progress"
- **PR Created**: Transitions tickets to "In Review" when pull requests are opened
- **Changes Requested**: Moves tickets back to "In Progress" when PR changes are requested
- **PR Merged**: Automatically completes tickets when PRs are merged

#### Time Tracking Integration
- **Automatic Start**: Begins time tracking when development work starts
- **Session Tracking**: Monitors active development sessions
- **Efficiency Analysis**: Compares actual vs estimated time
- **Automatic Stop**: Ends tracking when work is completed

#### Scope Change Detection
- **Complexity Analysis**: Detects when code complexity exceeds estimates
- **File Count Monitoring**: Identifies scope creep through file change patterns
- **Dependency Impact**: Tracks new dependencies and breaking changes
- **Stakeholder Notification**: Automatically notifies team of significant scope changes

### 2. Sub-ticket Creation System (Task 6.2)

#### Intelligent Task Breakdown
- **Complexity-Based**: Creates sub-tickets when complexity thresholds are exceeded
- **Functionality Grouping**: Organizes changes by functional areas (API, UI, Services, etc.)
- **Security Isolation**: Separates security fixes into dedicated tickets
- **Dependency Management**: Creates specific tickets for breaking dependency changes

#### Blocker Detection
- **Security Blockers**: Identifies critical security vulnerabilities requiring immediate attention
- **Dependency Blockers**: Flags breaking changes that need approval
- **Testing Blockers**: Detects missing test coverage for complex changes

#### Automatic Sub-ticket Creation
- **Smart Titles**: Generates descriptive titles based on change analysis
- **Detailed Descriptions**: Includes scope, complexity, and priority information
- **Proper Relationships**: Creates parent-child relationships between tickets
- **Label Management**: Automatically applies relevant labels (security, refactor, etc.)

## Configuration

### Basic Configuration
```json
{
  "workflows": {
    "linear": {
      "enabled": true,
      "autoTransition": true,
      "trackTime": true,
      "detectScopeChanges": true,
      "notifyOnScopeChange": true,
      "autoCreateSubTickets": false,
      "subTicketComplexityThreshold": 15,
      "subTicketFileCountThreshold": 8
    }
  }
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `autoTransition` | `true` | Enable automatic status transitions |
| `trackTime` | `false` | Enable time tracking integration |
| `detectScopeChanges` | `true` | Monitor for scope changes |
| `notifyOnScopeChange` | `true` | Notify stakeholders of scope changes |
| `autoCreateSubTickets` | `false` | Automatically create sub-tickets |
| `subTicketComplexityThreshold` | `15` | Complexity score threshold for sub-tickets |
| `subTicketFileCountThreshold` | `8` | File count threshold for sub-tickets |

## Usage

### Basic Usage
The enhanced workflow runs automatically when CodeScribe executes with Linear integration enabled:

```bash
node codescribe.js
```

### Manual Testing
Test the enhanced functionality with the provided test script:

```bash
node test-enhanced-linear-workflow.js
```

## Status Transition Rules

### From "Todo" or "Backlog"
- **Branch Created** → "In Progress"
- **First Commit** → "In Progress"
- **PR Created** → "In Review"

### From "In Progress"
- **PR Created** → "In Review"
- **PR Merged** → "Done"

### From "In Review"
- **PR Approved** → "Ready for Deploy"
- **Changes Requested** → "In Progress"
- **PR Merged** → "Done"

### From "Ready for Deploy"
- **PR Merged** → "Done"

## Sub-ticket Creation Triggers

### Complexity-Based Triggers
- Code complexity score exceeds threshold (default: 15)
- High number of changed files (default: 8+)
- Deep nesting or complex logic patterns

### Security-Based Triggers
- High-severity security vulnerabilities detected
- Hardcoded secrets or API keys found
- Insecure coding patterns identified

### Dependency-Based Triggers
- Breaking dependency changes
- New dependencies requiring security review
- Major version updates

## Time Tracking

### Automatic Tracking
- Starts when branch is created or first commit is made
- Pauses during code review phases
- Resumes when changes are requested
- Stops when PR is merged

### Efficiency Metrics
- **High Efficiency**: Completed faster than estimated
- **Normal Efficiency**: Completed within expected timeframe
- **Low Efficiency**: Took longer than estimated

## Scope Change Detection

### Change Types
- **Complexity Increase**: Code complexity significantly exceeds estimates
- **File Count High**: More files changed than typical for ticket type
- **New Dependencies**: Additional dependencies added
- **Breaking Changes**: Changes that affect other systems

### Risk Levels
- **Low**: Minor scope adjustments
- **Medium**: Moderate scope expansion requiring attention
- **High**: Significant scope changes requiring stakeholder review

## Error Handling

The enhanced workflow includes comprehensive error handling:

- **API Failures**: Graceful degradation with retry logic
- **Configuration Errors**: Clear error messages and fallback behavior
- **Network Issues**: Automatic retry with exponential backoff
- **Permission Errors**: Informative error messages with resolution steps

## Integration with Other Workflows

The Enhanced Linear Workflow integrates seamlessly with:

- **GitHub Workflow**: Uses PR data for status transitions
- **Documentation Workflow**: Includes generated diagrams in comments
- **AI Analysis Engine**: Leverages AI insights for scope detection
- **Code Quality Engine**: Uses complexity metrics for sub-ticket creation

## Best Practices

### For Teams
1. **Configure Thresholds**: Adjust complexity and file count thresholds based on team standards
2. **Review Sub-tickets**: Regularly review auto-generated sub-tickets for accuracy
3. **Monitor Scope Changes**: Pay attention to scope change notifications
4. **Use Time Tracking**: Enable time tracking for better project estimation

### For Developers
1. **Descriptive Commits**: Write clear commit messages for better analysis
2. **Incremental Changes**: Keep changes focused to avoid unnecessary sub-ticket creation
3. **Security Awareness**: Address security issues promptly when flagged
4. **Test Coverage**: Maintain good test coverage to avoid testing blockers

## Troubleshooting

### Common Issues

#### Status Transitions Not Working
- Check Linear API key configuration
- Verify workflow states exist in Linear team
- Ensure user has permission to update ticket status

#### Sub-tickets Not Created
- Verify `autoCreateSubTickets` is enabled
- Check complexity and file count thresholds
- Ensure user has permission to create tickets

#### Time Tracking Issues
- Confirm `trackTime` is enabled
- Check for proper branch naming conventions
- Verify git history is accessible

### Debug Mode
Enable debug logging by setting the log level:

```json
{
  "logging": {
    "level": "debug"
  }
}
```

## API Reference

### Key Methods

#### `analyzeDevelopmentProgress(context, issue)`
Analyzes current development phase and suggests appropriate actions.

#### `handleStatusTransitions(issue, progressAnalysis, context)`
Manages automatic status transitions based on development progress.

#### `handleTimeTracking(issue, progressAnalysis, context)`
Tracks time spent on development activities.

#### `detectAndHandleScopeChanges(issue, context)`
Identifies and reports scope changes in the ticket.

#### `createSubTicketsForComplexChanges(issue, context)`
Creates sub-tickets when complex changes are detected.

### GraphQL Mutations Used

- `issueUpdate`: Update ticket status and properties
- `commentCreate`: Add comments to tickets
- `issueCreate`: Create new sub-tickets
- `issueRelationCreate`: Create parent-child relationships

## Contributing

When contributing to the Enhanced Linear Workflow:

1. **Test Thoroughly**: Run the test suite before submitting changes
2. **Update Documentation**: Keep this documentation current with changes
3. **Follow Patterns**: Maintain consistency with existing code patterns
4. **Add Tests**: Include tests for new functionality

## Support

For issues or questions about the Enhanced Linear Workflow:

1. Check the troubleshooting section above
2. Review the test script for usage examples
3. Examine the configuration options
4. Check Linear API documentation for integration details