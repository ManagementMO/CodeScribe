# CodeScribe Warp Workflows - Quick Reference

## 🚀 Quick Start

```bash
# Interactive mode (recommended for beginners)
codescribe interactive

# Default PR workflow
codescribe pr

# Smart commit
codescribe commit

# View help
codescribe --help
```

## 📋 Workflow Cheat Sheet

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `codescribe pr` | Create/update PR with full tracking | Ready for PR, need documentation |
| `codescribe commit` | Smart commit with AI messages | Incremental development |
| `codescribe interactive` | Guided workflow selection | Unsure which workflow to use |
| `codescribe docs` | Generate documentation & diagrams | Need visual documentation |
| `codescribe quality` | Code quality analysis | Before releases, health checks |
| `codescribe linear` | Linear ticket management | Focus on ticket workflows |
| `codescribe feature` | Feature development workflow | New feature development |
| `codescribe fix` | Bug fix workflow | Fixing bugs, issue tracking |
| `codescribe review` | Code review assistance | Preparing for reviews |
| `codescribe release` | Release preparation | Preparing releases |

## 🔧 Common Options

| Option | Description | Example |
|--------|-------------|---------|
| `--verbose, -v` | Detailed output | `codescribe pr --verbose` |
| `--dry-run` | Preview without executing | `codescribe quality --dry-run` |
| `--help, -h` | Show help | `codescribe commit --help` |

## 📊 History & Analytics

| Command | Purpose |
|---------|---------|
| `codescribe history` | View execution history |
| `codescribe stats` | Show usage statistics |
| `codescribe replay <id>` | Replay previous execution |
| `codescribe logs` | View detailed logs |

## 🔄 Typical Development Flow

```bash
# 1. Start new feature
codescribe interactive  # or codescribe feature

# 2. Make incremental commits
codescribe commit

# 3. Quality check before PR
codescribe quality

# 4. Generate documentation
codescribe docs

# 5. Create final PR
codescribe pr

# 6. Prepare release (when ready)
codescribe release
```

## ⚙️ Environment Setup

```bash
# Required environment variables
export GITHUB_TOKEN="your_github_token"
export LINEAR_API_KEY="your_linear_api_key"
export GEMINI_API_KEY="your_gemini_api_key"

# Optional configuration
export CODESCRIBE_LOG_LEVEL="info"
export CODESCRIBE_ENABLE_PROGRESS="true"
```

## 🏷️ Warp Tags for Discovery

- `ai` - AI-powered workflows
- `github` - GitHub integration
- `linear` - Linear integration
- `documentation` - Documentation generation
- `quality` - Code quality analysis
- `tracking` - Progress tracking
- `automation` - Automated processes

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Authentication errors | Check environment variables |
| No changes detected | Use `--force` flag or check git status |
| Workflow fails | Check `codescribe logs` |
| Unsure what to do | Use `codescribe interactive` |
| Need more details | Add `--verbose` flag |

## 💡 Pro Tips

1. **Use Interactive Mode**: Start with `codescribe interactive` to learn
2. **Check History**: Use `codescribe history` to learn from past executions
3. **Dry Run First**: Use `--dry-run` to preview actions
4. **Verbose for Debugging**: Add `--verbose` when troubleshooting
5. **Regular Quality Checks**: Run `codescribe quality` regularly
6. **Document as You Go**: Use `codescribe docs` frequently

---

*For detailed documentation, see [WARP_WORKFLOWS.md](./WARP_WORKFLOWS.md)*