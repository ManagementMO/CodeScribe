# CodeScribe Modular Architecture

This directory contains the refactored modular architecture for CodeScribe, transforming it from a monolithic script into a comprehensive workflow orchestration platform.

## Architecture Overview

```
src/
├── core/
│   └── CodeScribeCore.js          # Central orchestrator
├── context/
│   └── ContextAnalyzer.js         # Enhanced context gathering
├── workflows/
│   ├── BaseWorkflow.js            # Base class for all workflows
│   ├── WorkflowOrchestrator.js    # Plugin-based workflow management
│   ├── github/
│   │   └── GitHubWorkflow.js      # GitHub operations
│   └── linear/
│       └── LinearWorkflow.js      # Linear ticket management
├── ai/
│   └── AIAnalysisEngine.js        # AI integration and analysis
└── config/
    └── ConfigurationManager.js    # Configuration management
```

## Key Components

### Core Engine (`CodeScribeCore.js`)
- Central orchestrator that manages workflow execution
- Coordinates between all components
- Provides plugin registration interface
- Handles error management and logging

### Context Analyzer (`ContextAnalyzer.js`)
- Enhanced version of original context gathering
- Extracts git information, branch details, and diff content
- Handles unpushed commits automatically
- Parses Linear ticket IDs from branch names
- Extensible for future context sources

### Workflow Orchestrator (`WorkflowOrchestrator.js`)
- Plugin-based system for managing different workflow types
- Intelligent workflow selection based on commands and context
- Dependency management between workflows
- Parallel and sequential execution support

### Base Workflow (`BaseWorkflow.js`)
- Abstract base class for all workflow implementations
- Provides common functionality and interfaces
- Error handling and retry logic
- Configuration management per workflow
- Logging and cleanup utilities

### GitHub Workflow (`GitHubWorkflow.js`)
- Handles all GitHub-related operations
- PR creation and updates with intelligent change detection
- Repository parsing and validation
- Fallback content generation when AI is unavailable

### Linear Workflow (`LinearWorkflow.js`)
- Manages Linear ticket updates and comments
- GraphQL API integration
- Issue lookup by identifier
- Comment generation based on GitHub results

### AI Analysis Engine (`AIAnalysisEngine.js`)
- Enhanced AI integration with retry logic
- Multiple model support (currently Gemini)
- Specialized prompts for different analysis types
- Fallback content generation
- Extensible for future AI providers

### Configuration Manager (`ConfigurationManager.js`)
- Hierarchical configuration system
- File-based configuration support (.codescribe.json)
- Environment variable integration
- Default configuration with user overrides
- Configuration validation

## Usage

### Basic Usage
```bash
# Run default workflow (GitHub + Linear)
codescribe

# GitHub operations only
codescribe github-only

# Linear operations only  
codescribe linear-only

# Show help
codescribe --help
```

### Configuration
Create a `.codescribe.json` file in your project root:

```json
{
  "workflows": {
    "github": { "enabled": true, "createDraft": true },
    "linear": { "enabled": true, "addComments": true }
  },
  "ai": {
    "model": "gemini-1.5-flash",
    "maxRetries": 3
  }
}
```

### Plugin Development
Extend the system with custom workflows:

```javascript
const BaseWorkflow = require('./src/workflows/BaseWorkflow');

class CustomWorkflow extends BaseWorkflow {
    constructor(config) {
        super(config, 'custom');
    }
    
    async execute(context, options) {
        // Custom workflow implementation
    }
}

// Register with core engine
codeScribe.registerWorkflow(new CustomWorkflow(config));
```

## Migration from Original

The refactored architecture maintains full backward compatibility while providing:

1. **Modularity**: Each component has a single responsibility
2. **Extensibility**: Easy to add new workflows and integrations
3. **Configuration**: Flexible configuration system
4. **Error Handling**: Improved error recovery and reporting
5. **Testing**: Each component can be tested independently
6. **Maintainability**: Clear separation of concerns

## Future Enhancements

The modular architecture enables easy addition of:
- Documentation generation workflows
- Code quality analysis
- Security scanning
- Custom notification systems
- Additional AI providers
- Advanced GitHub automations
- Enhanced Linear integrations

## Environment Variables

Required environment variables:
- `GITHUB_TOKEN`: GitHub personal access token
- `LINEAR_API_KEY`: Linear API key
- `GEMINI_API_KEY`: Google Gemini API key

Optional configuration can override these through the configuration file.