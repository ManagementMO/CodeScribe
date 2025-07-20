#!/usr/bin/env node

const CodeScribeCore = require('./src/core/CodeScribeCore');
const chalk = require('chalk');

/**
 * Test script for Mermaid diagram generation functionality
 */
async function testMermaidGeneration() {
    console.log(chalk.cyan.bold('🧪 Testing Mermaid Diagram Generation...'));

    try {
        // Initialize CodeScribe with documentation workflow enabled
        const codescribe = new CodeScribeCore({
            workflows: {
                documentation: { enabled: true }
            }
        });

        // Test with documentation-only command to focus on diagram generation
        console.log(chalk.blue('\n📊 Running documentation workflow...'));
        const results = await codescribe.execute('documentation-only');

        // Display results
        if (results.documentation) {
            const doc = results.documentation;
            console.log(chalk.green('\n✅ Documentation workflow completed successfully!'));
            
            console.log(chalk.yellow('\n📈 Generated Diagrams Summary:'));
            console.log(`   - Total diagrams: ${doc.summary?.totalDiagrams || 0}`);
            console.log(`   - Flowcharts: ${doc.summary?.diagramTypes?.flowcharts || 0}`);
            console.log(`   - Dependency graphs: ${doc.summary?.diagramTypes?.dependencyGraphs || 0}`);
            console.log(`   - Sequence diagrams: ${doc.summary?.diagramTypes?.sequenceDiagrams || 0}`);
            console.log(`   - Architecture diagrams: ${doc.summary?.diagramTypes?.architectureDiagrams || 0}`);

            if (doc.summary?.recommendations?.length > 0) {
                console.log(chalk.yellow('\n💡 Recommendations:'));
                doc.summary.recommendations.forEach(rec => {
                    console.log(`   - ${rec.message} (${rec.priority} priority)`);
                });
            }

            // Show sample diagram if available
            if (doc.diagrams && doc.diagrams.architectureDiagrams.length > 0) {
                console.log(chalk.blue('\n🏗️ Sample Architecture Diagram:'));
                console.log('```mermaid');
                console.log(doc.diagrams.architectureDiagrams[0].mermaid);
                console.log('```');
            }

            // Show formatted output for GitHub
            if (doc.formattedDiagrams?.github?.markdown) {
                console.log(chalk.blue('\n📝 GitHub-formatted output preview:'));
                console.log(doc.formattedDiagrams.github.markdown.substring(0, 500) + '...');
            }

        } else {
            console.log(chalk.yellow('⚠️ No documentation results found'));
        }

    } catch (error) {
        console.error(chalk.red('\n❌ Test failed:'), error.message);
        if (error.stack) {
            console.error(chalk.gray(error.stack));
        }
        process.exit(1);
    }
}

// Run the test
testMermaidGeneration();