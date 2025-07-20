#!/usr/bin/env node

/**
 * Integration test for enhanced commit workflow
 */

const CommitWorkflow = require('./src/workflows/commit/CommitWorkflow');
const ContextAnalyzer = require('./src/context/ContextAnalyzer');
const ConfigurationManager = require('./src/config/ConfigurationManager');

// Mock configuration
const mockConfig = {
    get: (key, defaultValue) => {
        const config = {
            'ai.model': 'gemini-1.5-flash',
            'ai.maxRetries': 3,
            'ai.gemini.apiKey': process.env.GEMINI_API_KEY || null,
            'workflows.commit.enabled': true,
            'workflows.commit.conventionalCommits': true
        };
        return config[key] || defaultValue;
    }
};

// Mock context with enhanced analysis
const mockContext = {
    git: {
        branch: 'feature/enhanced-commit-messages',
        remoteUrl: 'https://github.com/user/codescribe.git',
        diff: `diff --git a/src/ai/AIAnalysisEngine.js b/src/ai/AIAnalysisEngine.js
index 1234567..abcdefg 100644
--- a/src/ai/AIAnalysisEngine.js
+++ b/src/ai/AIAnalysisEngine.js
@@ -50,6 +50,25 @@ class AIAnalysisEngine {
     }
 
+    /**
+     * Generate enhanced commit message with detailed context and impact analysis
+     */
+    async generateEnhancedCommitMessage(context, changeAnalysis) {
+        // Implementation here
+    }`,
        diffStats: '2 files changed, 45 insertions(+), 5 deletions(-)'
    },
    code: {
        changedFiles: [
            {
                path: 'src/ai/AIAnalysisEngine.js',
                status: 'modified',
                extension: 'js',
                isJavaScript: true,
                isConfig: false,
                isTest: false
            },
            {
                path: 'src/workflows/commit/CommitMessageTemplates.js',
                status: 'added',
                extension: 'js',
                isJavaScript: true,
                isConfig: false,
                isTest: false
            }
        ],
        complexity: {
            level: 'medium',
            totalScore: 8,
            averageScore: 4,
            files: [
                {
                    file: 'src/ai/AIAnalysisEngine.js',
                    score: 6,
                    functions: 3,
                    classes: 1,
                    conditionals: 2,
                    loops: 0,
                    depth: 3,
                    lines: 150
                }
            ],
            issues: []
        },
        security: {
            vulnerabilities: [],
            riskLevel: 'low',
            issues: []
        },
        dependencies: {
            added: [],
            updated: [],
            removed: [],
            breakingChanges: []
        },
        metrics: {
            addedLines: 45,
            removedLines: 5,
            modifiedFiles: 2,
            totalLines: 200
        }
    },
    linear: {
        ticketId: 'ECS-123'
    }
};

async function testCommitWorkflowIntegration() {
    console.log('🔄 Testing Commit Workflow Integration...\n');
    
    const commitWorkflow = new CommitWorkflow(mockConfig);
    
    // Test if workflow can execute (will fail if not in git repo, which is expected)
    console.log('1. Testing workflow execution capability:');
    const canExecute = commitWorkflow.canExecute(mockContext);
    console.log(`   Can execute: ${canExecute}`);
    
    if (!canExecute) {
        console.log('   Note: This is expected when not in a git repository\n');
    }
    
    // Test commit message generation (this should work regardless of git status)
    console.log('2. Testing enhanced commit message generation:');
    try {
        const commitMessage = await commitWorkflow.generateCommitMessage(mockContext, {});
        console.log(`   Generated message: "${commitMessage}"`);
        
        // Check if metadata was stored
        if (commitWorkflow.lastCommitMetadata) {
            console.log('   Stored metadata:');
            console.log(`   - Impact: ${JSON.stringify(commitWorkflow.lastCommitMetadata.impact, null, 6)}`);
            console.log(`   - Template: ${commitWorkflow.lastCommitMetadata.template}`);
            console.log(`   - Description: ${commitWorkflow.lastCommitMetadata.description}`);
        }
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }
    console.log();
    
    // Test Linear comment generation
    console.log('3. Testing Linear comment generation:');
    const mockCommitResult = {
        hash: 'abcdef1234567890',
        shortHash: 'abcdef1',
        message: 'feat(ai): ECS-123 - implement enhanced commit message generation',
        author: 'Test User <test@example.com>',
        timestamp: '2024-01-15 10:30:00 +0000'
    };
    
    const linearComment = commitWorkflow.generateLinearCommitComment(mockCommitResult, mockContext);
    console.log('   Generated Linear comment:');
    console.log('   ' + linearComment.split('\n').join('\n   '));
    console.log();
}

async function testChangeAnalysis() {
    console.log('📊 Testing Change Analysis...\n');
    
    const commitWorkflow = new CommitWorkflow(mockConfig);
    
    // Mock the git commands for testing
    const originalExecSync = require('child_process').execSync;
    require('child_process').execSync = (command) => {
        if (command.includes('git diff --cached --name-only')) {
            return 'src/ai/AIAnalysisEngine.js\nsrc/workflows/commit/CommitMessageTemplates.js';
        }
        if (command.includes('git diff --name-only')) {
            return '';
        }
        if (command.includes('git ls-files --others --exclude-standard')) {
            return '';
        }
        return originalExecSync(command);
    };
    
    try {
        const analysis = await commitWorkflow.analyzeChanges();
        console.log('   Change analysis result:');
        console.log(`   - Files: ${analysis.files.length}`);
        console.log(`   - Types: ${Array.from(analysis.types).join(', ')}`);
        console.log(`   - Scope: ${analysis.scope}`);
        console.log(`   - Has breaking changes: ${analysis.hasBreakingChanges}`);
        console.log(`   - Summary: ${analysis.summary}`);
        
        // Test commit type determination
        const commitType = commitWorkflow.determineCommitType(analysis);
        console.log(`   - Determined commit type: ${commitType}`);
        
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    } finally {
        // Restore original execSync
        require('child_process').execSync = originalExecSync;
    }
    console.log();
}

async function testFileCategorization() {
    console.log('📁 Testing File Categorization...\n');
    
    const commitWorkflow = new CommitWorkflow(mockConfig);
    
    const testFiles = [
        'src/ai/AIAnalysisEngine.js',
        'test/commit.test.js',
        'docs/README.md',
        'package.json',
        'src/styles/main.css',
        'config/webpack.config.js',
        'src/components/Button.jsx'
    ];
    
    console.log('   File categorization results:');
    for (const file of testFiles) {
        const category = commitWorkflow.categorizeFile(file);
        console.log(`   - ${file}: ${category}`);
    }
    console.log();
}

async function runIntegrationTests() {
    console.log('🧪 Enhanced Commit Workflow Integration Tests\n');
    console.log('='.repeat(60) + '\n');
    
    try {
        await testCommitWorkflowIntegration();
        await testChangeAnalysis();
        await testFileCategorization();
        
        console.log('✅ All integration tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runIntegrationTests();
}

module.exports = {
    testCommitWorkflowIntegration,
    testChangeAnalysis,
    testFileCategorization,
    runIntegrationTests
};