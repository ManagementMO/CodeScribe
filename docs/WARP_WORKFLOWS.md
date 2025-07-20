# CodeScribe Warp Workflows Documentation

## Overview

CodeScribe provides comprehensive Warp workflows that integrate seamlessly with your development process. These workflows leverage AI-powered analysis, intelligent automation, and professional tracking to enhance your development workflow.

## Available Workflows

### Core Workflows

#### 1. CodeScribe - Create/Update PR with Full Tracking (`codescribe pr`)

**Purpose**: Complete PR workflow with comprehensive tracking and documentation

**Features**:
- AI-powered PR title and description generation
- Automatic Mermaid diagram generation for complex logic
- Linear ticket integration with progress tracking
- Code quality analysis and security scanning
- Conventional commit message validation

**Usage**:
```bash
codescribe pr
```

**When to Use**:
- Ready to create or update a pull request
- Want comprehensive documentation and tracking
- Need AI-generated PR descriptions
- Working with Linear tickets

---

#### 2. CodeScribe - Smart Commit with Tracking (`codescribe commit`)

**Purpose**: Intelligent commit creation with AI-generated messages and tracking

**Features**:
- AI-generated conventional commit messages
- Automatic staging of relevant files
- Code impact analysis in commit messages
- GitHub and Linear integration
- Explains the "why" behind changes, not just the "what"

**Usage**:
```bash
codescribe commit
codescribe commit -m "Custom message"
codescribe commit --all --no-push
```

**Options**:
- `--message, -m`: Custom commit message
- `--all, -a`: Stage all changes (new and modified files)
- `--add-modified`: Stage only modified files
- `--no-push`: Skip pushing to remote
- `--force`: Force commit even if no changes detected

**When to Use**:
- Making incremental commits during development
- Want intelligent commit messages
- Need tracking without full PR workflow

---

#### 3. CodeScribe - Interactive Workflow Guide (`codescribe interactive`)

**Purpose**: Guided workflow selection with context-aware suggestions

**Features**:
- Analyzes current project state
- Suggests appropriate workflows
- Step-by-step guidance
- Context-aware recommendations
- Beginner-friendly interface

**Usage**:
```bash
codescribe interactive
```

**When to Use**:
- New to CodeScribe
- Unsure which workflow to use
- Want guided assistance
- Learning the system

---

### Specialized Workflows

#### 4. CodeScribe - Generate Documentation & Diagrams (`codescribe docs`)

**Purpose**: Comprehensive documentation generation from code changes

**Features**:
- Mermaid flowcharts from function analysis
- Sequence diagrams for API interactions
- Architecture diagrams from project structure
- API documentation generation
- Architecture Decision Records (ADRs)

**Usage**:
```bash
codescribe docs
codescribe docs --verbose
```

**When to Use**:
- Need to update project documentation
- Want visual representations of code logic
- Preparing for code reviews
- Maintaining architecture documentation

---

#### 5. CodeScribe - Code Quality Analysis & Fixes (`codescribe quality`)

**Purpose**: Comprehensive code quality analysis and improvement suggestions

**Features**:
- Complexity metrics analysis
- Security vulnerability scanning
- Performance bottleneck detection
- Technical debt identification
- Automatic GitHub issue creation for problems

**Usage**:
```bash
codescribe quality
codescribe quality --verbose
```

**When to Use**:
- Before major releases
- Regular code health checks
- Identifying technical debt
- Security audits

---

#### 6. CodeScribe - Linear Ticket Management (`codescribe linear`)

**Purpose**: Advanced Linear integration for comprehensive ticket management

**Features**:
- Automatic status transitions
- Time tracking integration
- Sub-ticket creation for complex changes
- Blocker detection and notification
- Progress reporting for stakeholders

**Usage**:
```bash
codescribe linear
```

**When to Use**:
- Focus on Linear ticket management
- Complex ticket workflows
- Stakeholder communication
- Project tracking

---

#### 7. CodeScribe - Feature Development Workflow (`codescribe feature`)

**Purpose**: Complete feature development lifecycle management

**Features**:
- Feature branch management
- Progressive development tracking
- Feature flag integration
- Comprehensive testing workflows
- Automatic sub-ticket creation

**Usage**:
```bash
codescribe feature
codescribe feature --dry-run
```

**When to Use**:
- Developing new features
- Complex feature implementations
- Need structured development process
- Working with feature flags

---

#### 8. CodeScribe - Bug Fix & Issue Management (`codescribe fix`)

**Purpose**: Specialized workflow for bug fixes and issue management

**Features**:
- Automatic GitHub issue creation from bug patterns
- Fix strategy suggestions
- Bug-specific PR templates
- Testing and validation workflows
- Root cause analysis

**Usage**:
```bash
codescribe fix
```

**When to Use**:
- Fixing bugs
- Need structured bug resolution process
- Want automatic issue tracking
- Require fix validation

---

#### 9. CodeScribe - Code Review Assistant (`codescribe review`)

**Purpose**: Comprehensive code review assistance and analysis

**Features**:
- Change impact analysis
- Review checklist generation
- Reviewer suggestions based on code ownership
- Security and performance considerations
- Review summary generation

**Usage**:
```bash
codescribe review
```

**When to Use**:
- Preparing for code reviews
- Need comprehensive review analysis
- Want reviewer recommendations
- Ensuring review quality

---

#### 10. CodeScribe - Release Preparation & Notes (`codescribe release`)

**Purpose**: Automated release preparation and management

**Features**:
- Version bumping
- Changelog generation
- Release notes from commits and PRs
- Tag creation and management
- Branch management for releases

**Usage**:
```bash
codescribe release
```

**When to Use**:
- Preparing for releases
- Need automated changelog generation
- Want consistent release processes
- Managing version tags

---

## History & Analytics

### Workflow History (`codescribe history`)

View your workflow execution history with detailed information about past runs.

**Usage**:
```bash
codescribe history
codescribe history --limit 50
codescribe history --verbose
```

**Features**:
- Execution timestamps and durations
- Success/failure status
- Workflow details
- Error information for failed executions

---

### Execution Statistics (`codescribe stats`)

Get comprehensive analytics about your CodeScribe usage patterns.

**Usage**:
```bash
codescribe stats
```

**Features**:
- Total execution counts
- Success rates
- Average execution times
- Most used commands and workflows
- Recent activity summary

---

### Replay Executions (`codescribe replay <id>`)

Replay previous workflow executions with the same parameters.

**Usage**:
```bash
codescribe replay <execution-id>
```

**Features**:
- Exact parameter reproduction
- Context restoration
- Modified options support

---

### View Logs (`codescribe logs`)

Access detailed log information for troubleshooting and analysis.

**Usage**:
```bash
codescribe logs
codescribe logs --lines 100
```

**Features**:
- Colored log output by level
- Configurable line count
- Detailed error information
- Timestamp tracking

---

## Configuration

### Global Options

All workflows support these global options:

- `--verbose, -v`: Enable detailed output and logging
- `--dry-run`: Show what would be done without executing
- `--config`: Specify custom configuration file
- `--help, -h`: Show help information

### Environment Variables

Configure CodeScribe behavior with these environment variables:

```bash
# API Keys
GITHUB_TOKEN=your_github_token
LINEAR_API_KEY=your_linear_api_key
GEMINI_API_KEY=your_gemini_api_key

# Logging Configuration
CODESCRIBE_LOG_LEVEL=info  # debug, info, warn, error
CODESCRIBE_ENABLE_FILE_LOGGING=true
CODESCRIBE_ENABLE_PROGRESS=true

# History Configuration
CODESCRIBE_ENABLE_HISTORY=true
CODESCRIBE_MAX_HISTORY_ENTRIES=100
```

### Configuration File

Create a `.codescribe.json` file in your project root:

```json
{
  "workflows": {
    "github": {
      "enabled": true,
      "templates": "default",
      "autoAssignReviewers": true
    },
    "linear": {
      "enabled": true,
      "autoTransition": true,
      "timeTracking": true
    },
    "documentation": {
      "enabled": true,
      "formats": ["mermaid", "markdown"],
      "generateADRs": true
    },
    "quality": {
      "enabled": true,
      "thresholds": {
        "complexity": 10,
        "coverage": 80
      }
    }
  },
  "ai": {
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "fallback": "gpt-3.5-turbo"
  },
  "logging": {
    "level": "info",
    "enableFile": true,
    "enableConsole": true
  }
}
```

---

## Best Practices

### 1. Workflow Selection

- Use `codescribe interactive` when unsure which workflow to use
- Use `codescribe pr` for complete feature delivery
- Use `codescribe commit` for incremental development
- Use specialized workflows for specific tasks

### 2. Development Process

1. **Start Development**: `codescribe feature` or `codescribe interactive`
2. **Incremental Commits**: `codescribe commit`
3. **Quality Checks**: `codescribe quality`
4. **Documentation**: `codescribe docs`
5. **Final PR**: `codescribe pr`
6. **Release**: `codescribe release`

### 3. Team Collaboration

- Use `codescribe review` before requesting reviews
- Use `codescribe linear` for stakeholder updates
- Use `codescribe stats` for team analytics
- Use `codescribe history` for process improvement

### 4. Troubleshooting

- Use `--verbose` flag for detailed output
- Check `codescribe logs` for error details
- Use `codescribe history` to review past executions
- Use `--dry-run` to preview actions

---

## Integration with Warp

### Adding to Warp

1. Ensure CodeScribe is installed and configured
2. Warp will automatically detect the `.warp/workflows/*.yaml` files
3. Access workflows through Warp's workflow interface
4. Use Warp's search to find specific workflows by tags

### Workflow Tags

Each workflow includes relevant tags for easy discovery:

- `ai`: AI-powered workflows
- `github`: GitHub integration
- `linear`: Linear integration
- `documentation`: Documentation generation
- `quality`: Code quality analysis
- `tracking`: Progress tracking
- `automation`: Automated processes

### Customization

You can customize workflow descriptions and commands by editing the `.warp/workflows/*.yaml` files in your project.

---

## Troubleshooting

### Common Issues

1. **API Authentication Errors**
   - Verify environment variables are set
   - Check API key permissions
   - Use `codescribe logs` to see detailed errors

2. **Git Repository Issues**
   - Ensure you're in a git repository
   - Check git remote configuration
   - Verify branch permissions

3. **Linear Integration Issues**
   - Verify Linear API key
   - Check ticket ID format
   - Ensure proper Linear workspace access

4. **Performance Issues**
   - Use `--dry-run` to test without execution
   - Check `codescribe stats` for performance patterns
   - Consider reducing verbosity for faster execution

### Getting Help

- Use `codescribe --help` for command reference
- Use `codescribe interactive` for guided assistance
- Check `codescribe logs` for detailed error information
- Review `codescribe history` for execution patterns

---

## Advanced Usage

### Custom Workflows

You can extend CodeScribe by creating custom workflows. See the plugin development guide for details.

### Automation

Integrate CodeScribe into your CI/CD pipelines:

```bash
# In your CI script
codescribe quality --verbose
codescribe docs
codescribe pr --dry-run
```

### Team Configuration

Share configuration across your team by committing `.codescribe.json` to your repository.

---

## Support

For issues, feature requests, or questions:

1. Check the documentation
2. Review `codescribe logs` for errors
3. Use `codescribe interactive` for guidance
4. Create an issue in the project repository

---

*This documentation covers CodeScribe's Warp workflow integration. For more detailed information about specific features, see the individual workflow documentation files.*