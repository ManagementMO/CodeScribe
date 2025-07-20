# CodeScribe Commit Workflow

The CodeScribe Commit Workflow provides intelligent commit creation with automatic GitHub and Linear tracking. This workflow analyzes your code changes, generates meaningful commit messages, and keeps your project management tools updated.

## Features

- **Intelligent Commit Messages**: Automatically generates conventional commit messages based on code analysis
- **GitHub Integration**: Tracks commits in GitHub with proper linking
- **Linear Integration**: Updates Linear tickets with commit information
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Flexible Staging**: Options for staging all files, modified files only, or custom staging
- **Push Management**: Automatic pushing to remote with upstream handling

## Usage

### Via Main CLI

```bash
# Basic commit with auto-generated message
codescribe commit

# Commit with custom message
codescribe commit --message "Fix critical authentication bug"
codescribe commit -m "Add user profile feature"

# Stage all files and commit
codescribe commit --all

# Commit without pushing to remote
codescribe commit --no-push

# Force commit even if no changes detected
codescribe commit --force
```

### Via Standalone Script

```bash
# Basic commit
node commit.js

# Custom message
node commit.js -m "Update API endpoints"

# Stage all and skip push
node commit.js --all --no-push

# Show help
node commit.js --help
```

## Command Options

| Option | Short | Description |
|--------|-------|-------------|
| `--message` | `-m` | Custom commit message |
| `--all` | `-a` | Stage all changes (new and modified files) |
| `--add-modified` | | Stage only modified files |
| `--no-push` | | Skip pushing to remote |
| `--force` | | Force commit even if no changes detected |
| `--help` | `-h` | Show help message |

## Intelligent Message Generation

The commit workflow analyzes your changes and generates appropriate commit messages using:

### Conventional Commits Format

Messages follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Maintenance tasks, dependency updates

### Scope Detection

The workflow automatically detects scope based on:
- Directory structure
- File types modified
- Common patterns (api, ui, auth, db, etc.)

### Breaking Changes

Breaking changes are automatically detected and marked with `!`:
```
feat(api)!: redesign authentication endpoints
```

## GitHub Integration

When integrated with GitHub, the commit workflow:

1. **Tracks Commits**: All commits are properly tracked in GitHub
2. **Links to Issues**: Automatically links commits to related issues
3. **Branch Management**: Handles branch creation and upstream setting
4. **Remote Pushing**: Automatically pushes commits to remote repository

## Linear Integration

When a Linear ticket ID is detected in the branch name or context:

1. **Ticket Updates**: Adds commit information to Linear ticket comments
2. **Progress Tracking**: Updates ticket with development progress
3. **Commit Linking**: Provides direct links to GitHub commits
4. **Team Visibility**: Keeps stakeholders informed of development activity

### Linear Comment Format

```markdown
💾 **New Commit**

**Commit:** `abc1234`
**Message:** feat(auth): add two-factor authentication
**Branch:** feat/AUTH-123-2fa-implementation
**GitHub:** [View Commit](https://github.com/owner/repo/commit/abc1234)

*Committed by CodeScribe Agent*
```

## Code Analysis

The workflow performs comprehensive code analysis to generate intelligent commit messages:

### File Categorization
- **Code files**: `.js`, `.ts`, `.jsx`, `.tsx`, etc.
- **Test files**: `.test.js`, `.spec.ts`, `__tests__/`
- **Documentation**: `README.md`, `.md` files
- **Configuration**: `.json`, `.yml`, `.yaml` files
- **Styles**: `.css`, `.scss`, `.less` files
- **Dependencies**: `package.json`, `package-lock.json`

### Change Detection
- New files vs. modified files
- Breaking changes detection
- Dependency updates
- Security-related changes
- Performance improvements

### Complexity Analysis
- Code complexity scoring
- Function and class analysis
- Nesting depth analysis
- Maintainability metrics

## Error Handling

The commit workflow includes robust error handling:

### Git Errors
- Repository state validation
- Merge conflict detection
- Remote connectivity issues
- Permission problems

### Staging Errors
- File access issues
- Large file warnings
- Binary file handling

### Push Errors
- Network connectivity
- Authentication failures
- Branch protection rules
- Upstream configuration

## Configuration

The commit workflow can be configured through the CodeScribe configuration:

```json
{
  "workflows": {
    "commit": {
      "enabled": true,
      "conventionalCommits": true,
      "autoStage": "modified",
      "autoPush": true,
      "requireMessage": false
    }
  }
}
```

### Configuration Options

- `enabled`: Enable/disable the commit workflow
- `conventionalCommits`: Use conventional commit format
- `autoStage`: Default staging behavior (`all`, `modified`, `none`)
- `autoPush`: Automatically push commits to remote
- `requireMessage`: Require manual commit message

## Examples

### Basic Development Workflow

```bash
# Make code changes
# ... edit files ...

# Commit with intelligent message generation
codescribe commit

# Output:
# 💾 CodeScribe Commit Tool
# 🚀 Starting CodeScribe Agent...
#    - Gathering context...
#    - Executing commit workflow...
#    - Creating commit with message: "feat(auth): add user authentication system"
#    - Pushing to remote branch: feat/AUTH-123-user-auth
#    - Linear ticket AUTH-123 updated with commit info
# ✅ Commit completed successfully!
#    📝 Commit: a1b2c3d
#    💬 Message: feat(auth): add user authentication system
#    🚀 Pushed to remote: feat/AUTH-123-user-auth
#    📋 Linear ticket updated: AUTH-123
```

### Bug Fix Workflow

```bash
# Fix a bug
# ... edit files ...

# Commit with custom message
codescribe commit -m "Fix null pointer exception in user service"

# Output shows conventional commit format:
# fix(service): Fix null pointer exception in user service
```

### Documentation Update

```bash
# Update documentation
# ... edit README.md ...

# Auto-detected as documentation change
codescribe commit

# Output:
# docs: Update README with new installation instructions
```

## Troubleshooting

### Common Issues

1. **No changes detected**
   - Use `--force` to commit anyway
   - Check if files are properly staged
   - Verify you're in the correct directory

2. **Push failures**
   - Check network connectivity
   - Verify GitHub authentication
   - Use `--no-push` to commit without pushing

3. **Linear integration not working**
   - Verify `LINEAR_API_KEY` environment variable
   - Check if ticket ID is properly detected
   - Ensure Linear workspace access

4. **Message generation issues**
   - Use `--message` to provide custom message
   - Check if code analysis is working properly
   - Verify file permissions

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=codescribe:* codescribe commit
```

## Best Practices

1. **Regular Commits**: Make small, focused commits frequently
2. **Meaningful Messages**: Let the AI generate messages or provide clear custom ones
3. **Branch Naming**: Use descriptive branch names with ticket IDs
4. **Code Review**: Use commits as part of your code review process
5. **Integration**: Leverage GitHub and Linear integration for team visibility

## Security Considerations

- Commit messages are analyzed locally before creation
- No sensitive information is sent to external services during analysis
- GitHub and Linear integration uses secure API tokens
- All network requests use HTTPS encryption