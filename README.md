# CodeScribe - Enhanced Workflow Orchestration Tool

A comprehensive workflow orchestration platform for professional software engineers that automates GitHub operations, Linear ticket management, and intelligent commit creation.

## Features

### Core Workflows
- **Intelligent Commit Creation**: Auto-generates conventional commit messages with GitHub and Linear tracking
- **GitHub Integration**: Automated PR creation, issue management, and branch operations
- **Linear Integration**: Ticket updates, progress tracking, and team communication
- **AI-Powered Analysis**: Code analysis, security scanning, and quality assessment

### Commit Workflow
- **Smart Message Generation**: Analyzes code changes to create meaningful commit messages
- **Conventional Commits**: Follows industry-standard commit message format
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Flexible Staging**: Multiple options for staging files
- **Automatic Tracking**: Updates GitHub and Linear with commit information

## Quick Start

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file with your API keys:
```env
GITHUB_TOKEN=your_github_token
LINEAR_API_KEY=your_linear_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Basic Usage

#### Create Intelligent Commits
```bash
# Auto-generate commit message and track in GitHub/Linear
node codescribe.js commit

# Custom commit message
node codescribe.js commit -m "Fix authentication bug"

# Stage all files and commit
node codescribe.js commit --all
```

#### Create/Update Pull Requests
```bash
# Standard PR workflow
node codescribe.js

# GitHub operations only
node codescribe.js github-only

# Linear operations only
node codescribe.js linear-only
```

#### Standalone Commit Tool
```bash
# Direct commit script
node commit.js

# With options
node commit.js -m "Add new feature" --all --no-push
```

## Commands

| Command | Description |
|---------|-------------|
| `codescribe` | Default PR creation and Linear update workflow |
| `codescribe commit` | Intelligent commit with tracking |
| `codescribe github-only` | GitHub operations only |
| `codescribe linear-only` | Linear operations only |
| `node commit.js` | Standalone commit tool |

## Commit Options

| Option | Short | Description |
|--------|-------|-------------|
| `--message` | `-m` | Custom commit message |
| `--all` | `-a` | Stage all changes |
| `--add-modified` | | Stage only modified files |
| `--no-push` | | Skip pushing to remote |
| `--force` | | Force commit even with no changes |

## Documentation

- [Commit Workflow Guide](docs/COMMIT_WORKFLOW.md) - Detailed guide for the commit functionality
- [Configuration](docs/CONFIGURATION.md) - Configuration options and setup
- [API Reference](docs/API.md) - Developer API documentation

## Architecture

The system uses a modular architecture with:
- **Core Engine**: Central orchestrator for workflow execution
- **Context Analyzer**: Enhanced code and git analysis
- **Workflow Orchestrator**: Plugin-based workflow management
- **AI Analysis Engine**: Intelligent code analysis and suggestions

## Technology Stack

- **Node.js**: Runtime environment
- **GitHub API**: Repository and PR management
- **Linear API**: Project management integration
- **Google Gemini**: AI-powered code analysis
- **Git**: Version control integration
- **Babel**: Code parsing and AST analysis

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `node commit.js -m "Add new feature"`
4. Push to your branch: `git push origin feature/new-feature`
5. Create a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation in the `docs/` directory
- Review the help commands: `node codescribe.js --help`
