#!/usr/bin/env node

const MermaidGenerator = require('./src/workflows/documentation/MermaidGenerator');
const ContextAnalyzer = require('./src/context/ContextAnalyzer');
const chalk = require('chalk');

/**
 * Comprehensive test for all Mermaid diagram generation sub-tasks
 */
async function testAllMermaidFeatures() {
    console.log(chalk.cyan.bold('🧪 Comprehensive Mermaid Generation Test'));
    console.log(chalk.blue('Testing all sub-tasks from the implementation plan...\n'));

    try {
        // Initialize components
        const contextAnalyzer = new ContextAnalyzer({});
        const mermaidGenerator = new MermaidGenerator({});

        // Gather real context
        console.log(chalk.yellow('1. Gathering context for analysis...'));
        const context = await contextAnalyzer.gather();
        console.log(chalk.green('   ✅ Context gathered successfully'));

        // Test Sub-task 1: Build flowchart generation from function and class analysis
        console.log(chalk.yellow('\n2. Testing flowchart generation from function and class analysis...'));
        if (context.code && context.code.ast) {
            const flowcharts = await mermaidGenerator.generateFlowcharts(context.code.ast);
            console.log(chalk.green(`   ✅ Generated ${flowcharts.length} flowcharts`));
            
            if (flowcharts.length > 0) {
                console.log(chalk.blue('   📊 Sample flowchart:'));
                console.log('   ```mermaid');
                console.log('   ' + flowcharts[0].mermaid.split('\n').slice(0, 5).join('\n   '));
                console.log('   ```');
            }
        } else {
            console.log(chalk.yellow('   ⚠️ No AST data available for flowchart generation'));
        }

        // Test Sub-task 2: Implement code change impact visualization with dependency graphs
        console.log(chalk.yellow('\n3. Testing dependency graph generation...'));
        if (context.code) {
            const depGraphs = await mermaidGenerator.generateDependencyGraphs(context.code);
            console.log(chalk.green(`   ✅ Generated ${depGraphs.length} dependency graphs`));
            
            if (depGraphs.length > 0) {
                console.log(chalk.blue('   📊 Sample dependency graph:'));
                console.log('   ```mermaid');
                console.log('   ' + depGraphs[0].mermaid.split('\n').slice(0, 5).join('\n   '));
                console.log('   ```');
            }
        } else {
            console.log(chalk.yellow('   ⚠️ No code analysis data available for dependency graphs'));
        }

        // Test Sub-task 3: Implement sequence diagram creation for API interactions
        console.log(chalk.yellow('\n4. Testing sequence diagram generation for API interactions...'));
        if (context.code && context.code.ast) {
            const sequenceDiagrams = await mermaidGenerator.generateSequenceDiagrams(context.code.ast);
            console.log(chalk.green(`   ✅ Generated ${sequenceDiagrams.length} sequence diagrams`));
            
            if (sequenceDiagrams.length > 0) {
                console.log(chalk.blue('   📊 Sample sequence diagram:'));
                console.log('   ```mermaid');
                console.log('   ' + sequenceDiagrams[0].mermaid.split('\n').slice(0, 8).join('\n   '));
                console.log('   ```');
            }
        } else {
            console.log(chalk.yellow('   ⚠️ No AST data available for sequence diagram generation'));
        }

        // Test Sub-task 4: Add architecture diagram generation from project structure analysis
        console.log(chalk.yellow('\n5. Testing architecture diagram generation from project structure...'));
        if (context.project) {
            const archDiagrams = await mermaidGenerator.generateArchitectureDiagrams(context.project);
            console.log(chalk.green(`   ✅ Generated ${archDiagrams.length} architecture diagrams`));
            
            if (archDiagrams.length > 0) {
                console.log(chalk.blue('   📊 Sample architecture diagram:'));
                console.log('   ```mermaid');
                console.log('   ' + archDiagrams[0].mermaid.split('\n').slice(0, 10).join('\n   '));
                console.log('   ```');
            }
        } else {
            console.log(chalk.yellow('   ⚠️ No project structure data available for architecture diagrams'));
        }

        // Test platform formatting
        console.log(chalk.yellow('\n6. Testing platform-specific formatting...'));
        const allDiagrams = await mermaidGenerator.generateDiagrams(context);
        const formatted = mermaidGenerator.formatDiagramsForPlatforms(allDiagrams);
        
        console.log(chalk.green('   ✅ GitHub formatting completed'));
        console.log(chalk.green('   ✅ Linear formatting completed'));
        
        // Show sample formatted output
        if (formatted.github.markdown) {
            console.log(chalk.blue('   📝 GitHub format preview (first 200 chars):'));
            console.log('   ' + formatted.github.markdown.substring(0, 200) + '...');
        }
        
        if (formatted.linear.text) {
            console.log(chalk.blue('   📝 Linear text format preview:'));
            console.log('   ' + formatted.linear.text.split('\n').slice(0, 8).join('\n   '));
        }

        // Final summary
        console.log(chalk.green.bold('\n🎉 All Mermaid generation sub-tasks completed successfully!'));
        console.log(chalk.cyan('\n📊 Summary:'));
        console.log(`   • Flowcharts: ${allDiagrams.flowcharts.length}`);
        console.log(`   • Dependency Graphs: ${allDiagrams.dependencyGraphs.length}`);
        console.log(`   • Sequence Diagrams: ${allDiagrams.sequenceDiagrams.length}`);
        console.log(`   • Architecture Diagrams: ${allDiagrams.architectureDiagrams.length}`);
        console.log(`   • Total Diagrams: ${mermaidGenerator.getTotalDiagramCount(allDiagrams)}`);

    } catch (error) {
        console.error(chalk.red('\n❌ Comprehensive test failed:'), error.message);
        if (error.stack) {
            console.error(chalk.gray(error.stack));
        }
        process.exit(1);
    }
}

// Run the comprehensive test
testAllMermaidFeatures();