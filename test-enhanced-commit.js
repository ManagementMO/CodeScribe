#!/usr/bin/env node

/**
 * Test script for enhanced commit message generation
 */

const AIAnalysisEngine = require('./src/ai/AIAnalysisEngine');
const CommitMessageTemplates = require('./src/workflows/commit/CommitMessageTemplates');
const ConfigurationManager = require('./src/config/ConfigurationManager');

// Mock configuration
const mockConfig = {
    get: (key, defaultValue) => {
        const config = {
            'ai.model': 'gemini-1.5-flash',
            'ai.maxRetries': 3,
            'ai.gemini.apiKey': process.env.GEMINI_API_KEY || null
        };
        return config[key] || defaultValue;
    }
};

// Mock context and change analysis data
const mockContext = {
    git: {
        branch: 'feature/enhanced-commit-messages',
        diff: `diff --git a/src/ai/AIAnalysisEngine.js b/src/ai/AIAnalysisEngine.js
index 1234567..abcdefg 100644
--- a/src/ai/AIAnalysisEngine.js
+++ b/src/ai/AIAnalysisEngine.js
@@ -50,6 +50,25 @@ class AIAnalysisEngine {
     }
 
+    /**
+     * Generate enhanced commit message with detailed context and impact analysis
+     * @param {Object} context - Current execution context
+     * @param {Object} changeAnalysis - Detailed change analysis
+     * @returns {Promise<Object>} Enhanced commit message with metadata
+     */
+    async generateEnhancedCommitMessage(context, changeAnalysis) {
+        console.log(chalk.blue('   - Generating enhanced commit message with AI analysis...'));
+
+        const prompt = this.buildCommitAnalysisPrompt(context, changeAnalysis);
+        
+        try {
+            const result = await this.generateWithRetry(prompt);
+            console.log(chalk.green('   - Enhanced commit message generated.'));
+            return result;
+        } catch (error) {
+            console.log(chalk.red('   - AI service unavailable, using fallback commit message...'));
+            return this.generateFallbackCommitMessage(context, changeAnalysis);
+        }
+    }
+
     /**
      * Build prompt for PR content analysis`
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

const mockChangeAnalysis = {
    complexity: mockContext.code.complexity,
    security: mockContext.code.security,
    dependencies: {
        added: [],
        updated: [],
        removed: [],
        breakingChanges: []
    },
    metrics: mockContext.code.metrics,
    code: mockContext.code
};

async function testCommitMessageTemplates() {
    console.log('🧪 Testing Commit Message Templates...\n');
    
    const templates = new CommitMessageTemplates();
    
    // Test template suggestions
    console.log('1. Testing template suggestions:');
    const suggestions = templates.getTemplateSuggestions(mockChangeAnalysis);
    console.log(`   Primary suggestion: ${suggestions.primary.type} (${suggestions.primary.reason})`);
    console.log(`   Alternatives: ${suggestions.alternatives.map(alt => alt.type).join(', ')}\n`);
    
    // Test message generation
    console.log('2. Testing message generation:');
    const message = templates.generateMessage(
        suggestions.primary.type,
        'ai',
        'implement enhanced commit message generation with AI analysis',
        {
            body: 'Added comprehensive AI-powered commit message generation with impact analysis',
            footer: null
        }
    );
    console.log(`   Generated message: ${message}\n`);
    
    // Test all template types
    console.log('3. Testing all template types:');
    const allTemplates = templates.getAllTemplates();
    for (const [type, template] of Object.entries(allTemplates)) {
        console.log(`   ${type}: ${template.format}`);
    }
    console.log();
}

async function testAIAnalysisEngine() {
    console.log('🤖 Testing AI Analysis Engine...\n');
    
    const aiEngine = new AIAnalysisEngine(mockConfig);
    
    console.log(`AI service available: ${aiEngine.isAvailable()}`);
    
    // Test fallback commit message generation
    console.log('\n1. Testing fallback commit message generation:');
    const fallbackMessage = aiEngine.generateFallbackCommitMessage(mockContext, mockChangeAnalysis);
    console.log('   Fallback message result:');
    console.log(`   - Message: ${fallbackMessage.message}`);
    console.log(`   - Type: ${fallbackMessage.type}`);
    console.log(`   - Scope: ${fallbackMessage.scope}`);
    console.log(`   - Description: ${fallbackMessage.description}`);
    console.log(`   - Impact: ${JSON.stringify(fallbackMessage.impact, null, 4)}`);
    console.log(`   - Template: ${fallbackMessage.template}`);
    console.log(`   - Rationale: ${fallbackMessage.rationale}\n`);
    
    // Test commit suggestions
    console.log('2. Testing commit message suggestions:');
    const suggestions = await aiEngine.generateCommitSuggestions(mockContext, mockChangeAnalysis);
    suggestions.forEach((suggestion, index) => {
        console.log(`   Suggestion ${index + 1} (${suggestion.confidence} confidence):`);
        console.log(`   - Type: ${suggestion.type}`);
        console.log(`   - Message: ${suggestion.message}`);
        console.log(`   - Reason: ${suggestion.reason}\n`);
    });
    
    // Test enhanced commit message generation (will use fallback if no API key)
    console.log('3. Testing enhanced commit message generation:');
    try {
        const enhancedMessage = await aiEngine.generateEnhancedCommitMessage(mockContext, mockChangeAnalysis);
        console.log('   Enhanced message result:');
        console.log(`   - Message: ${enhancedMessage.message}`);
        console.log(`   - Type: ${enhancedMessage.type}`);
        console.log(`   - Impact: ${JSON.stringify(enhancedMessage.impact, null, 4)}`);
        console.log(`   - Rationale: ${enhancedMessage.rationale}\n`);
    } catch (error) {
        console.log(`   Error: ${error.message}\n`);
    }
}

async function testCommitTypeDetection() {
    console.log('🔍 Testing Commit Type Detection...\n');
    
    const aiEngine = new AIAnalysisEngine(mockConfig);
    
    // Test different scenarios
    const scenarios = [
        {
            name: 'Feature addition',
            changeAnalysis: {
                code: {
                    changedFiles: [
                        { path: 'src/new-feature.js', status: 'added', isJavaScript: true, isTest: false, isConfig: false }
                    ]
                },
                dependencies: { added: [], updated: [], removed: [] }
            }
        },
        {
            name: 'Bug fix',
            changeAnalysis: {
                code: {
                    changedFiles: [
                        { path: 'src/existing-file.js', status: 'modified', isJavaScript: true, isTest: false, isConfig: false }
                    ]
                },
                dependencies: { added: [], updated: [], removed: [] }
            }
        },
        {
            name: 'Test updates',
            changeAnalysis: {
                code: {
                    changedFiles: [
                        { path: 'test/feature.test.js', status: 'modified', isJavaScript: true, isTest: true, isConfig: false }
                    ]
                },
                dependencies: { added: [], updated: [], removed: [] }
            }
        },
        {
            name: 'Configuration changes',
            changeAnalysis: {
                code: {
                    changedFiles: [
                        { path: 'package.json', status: 'modified', isJavaScript: false, isTest: false, isConfig: true }
                    ]
                },
                dependencies: { added: [{ package: 'new-dep', version: '1.0.0' }], updated: [], removed: [] }
            }
        }
    ];
    
    for (const scenario of scenarios) {
        const commitType = aiEngine.determineCommitType(scenario.changeAnalysis);
        console.log(`   ${scenario.name}: ${commitType}`);
    }
    console.log();
}

async function runTests() {
    console.log('🚀 Enhanced Commit Message Generation Tests\n');
    console.log('='.repeat(50) + '\n');
    
    try {
        await testCommitMessageTemplates();
        await testAIAnalysisEngine();
        await testCommitTypeDetection();
        
        console.log('✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testCommitMessageTemplates,
    testAIAnalysisEngine,
    testCommitTypeDetection,
    runTests
};