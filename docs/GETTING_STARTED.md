# Getting Started with CodeScribe

CodeScribe is an intelligent AI-powered development workflow orchestration tool that automates your entire development lifecycle - from intelligent commits to comprehensive pull requests with full Linear integration and automated documentation generation.

## Prerequisites

- Node.js (v14 or higher)
- Git repository
- GitHub account with personal access token
- Linear account with API key (optional but recommended)
- Gemini API key for AI analysis (optional but recommended)

## Quick Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CodeScribe
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your API keys:
```bash
GITHUB_TOKEN=your_github_token_here
LINEAR_API_KEY=your_linear_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Test the installation:
```bash
node codescribe.js --help
```

## The Primary Development Workflow

Here's the most common and powerful way to use CodeScribe in your daily development:

### 1. Start Your Feature Development

Create a branch following the naming convention (this is important for Linear integration):

```bash
git checkout -b feat/COD-123-user-authentication
# or
git checkout -b fix/COD-456-login-bug
```

The format `feat/COD-123-description` automatically links to Linear ticket COD-123.

### 2. Make Your Code Changes

Work on your feature as usual:
- Write code
- Add tests
- Make multiple commits if needed

### 3. Use CodeScribe for Intelligent Commits

Instead of manual commits, let CodeScribe create intelligent commit messages:

```bash
# Stage all changes and create AI-powered commit
node codescribe.js commit --all
```

This will:
- Analyze your code changes
- Generate a detailed commit message explaining what and why
- Include impact analysis (performance, security, maintainability)
- Follow conventional commit format
- Push to remote automatically

### 4. Create Comprehensive Pull Request

When ready for review, create a full pull request with complete tracking:

```bash
node codescribe.js
```

This single command will:
- **GitHub**: Create/update PR with detailed description, code analysis, and visual diagrams
- **Linear**: Update ticket status, add progress comments, create sub-tickets if needed
- **Documentation**: Generate Mermaid diagrams showing code flow and architecture
- **Quality**: Perform security analysis and complexity assessment
- **Tracking**: Record all activities for project visibility

### 5. Handle Review Feedback

When you make changes based on review feedback:

```bash
# Make your changes, then:
node codescribe.js commit -m "Address review feedback"

# Update the PR with new analysis:
node codescribe.js
```

The system automatically updates the existing PR and Linear ticket with new information.

## Interactive Mode for Beginners

If you're unsure which workflow to use, start with interactive mode:

```bash
node codescribe.js interactive
```

This will:
- Analyze your current project state
- Suggest the most appropriate workflow
- Guide you through options
- Execute your selected workflow

## API Key Setup

### GitHub Token Setup

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories)
   - `write:discussion` (for PR discussions)
4. Copy the token and add to `.env`

### Linear API Key Setup

1. Go to [Linear Settings > API](https://linear.app/settings/api)
2. Click "Create API key"
3. Give it a descriptive name like "CodeScribe Integration"
4. Copy the key and add to `.env`

### Gemini API Key Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API key"
3. Copy the key and add to `.env`

## Verification

Test that everything is working:

```bash
# Check configuration
node codescribe.js --help

# Test with dry run (won't make actual changes)
node codescribe.js --dry-run

# Run interactive mode to verify integrations
node codescribe.js interactive
```

## Common First-Time Issues

### 1. Git Authentication
If you get git push errors, ensure your GitHub token has the right permissions and your git remote is set up correctly.

### 2. Large Repository Performance
For large repositories, CodeScribe automatically handles large diffs by using summaries. You'll see messages like "Large diff detected, using summary..."

### 3. Branch Naming
For Linear integration to work, include the ticket ID in your branch name: `feat/COD-123-description`

### 4. No Changes Detected
If CodeScribe says "no changes found," ensure you have committed changes and your branch differs from `origin/main`.

## What Makes CodeScribe Different

Unlike simple automation tools, CodeScribe provides:

- **Intelligent Analysis**: AI-powered understanding of your code changes
- **Complete Integration**: Seamless GitHub + Linear + Documentation workflow
- **Visual Documentation**: Automatic Mermaid diagram generation
- **Security & Quality**: Built-in code analysis and vulnerability scanning
- **Context Awareness**: Understands your project structure and development patterns
- **Workflow History**: Tracks and learns from your development patterns

## Next Steps

Now that you have CodeScribe set up:

1. **Try the primary workflow** with a real feature branch
2. **Explore interactive mode** to see all available options
3. **Read the [User Guide](USER_GUIDE.md)** for comprehensive documentation
4. **Check out [Warp Workflows](WARP_WORKFLOWS.md)** for terminal integration
5. **Review [Configuration](CONFIGURATION.md)** for advanced customization

## Getting Help

- Use `node codescribe.js --help` for command reference
- Use `node codescribe.js interactive` for guided assistance
- Check execution history: `node codescribe.js history`
- View logs for troubleshooting: `node codescribe.js logs`

The key to getting the most out of CodeScribe is to use it as part of your regular development workflow, not just as an occasional tool. The more you use it, the better it becomes at understanding your project and development patterns.