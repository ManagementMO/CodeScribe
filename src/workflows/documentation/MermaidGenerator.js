const chalk = require('chalk');

/**
 * Mermaid Generator - Creates various types of Mermaid diagrams from code analysis
 */
class MermaidGenerator {
    constructor(config) {
        this.config = config;
    }

    /**
     * Generate all relevant Mermaid diagrams based on context
     * @param {Object} context - Analysis context
     * @returns {Promise<Object>} Generated diagrams
     */
    async generateDiagrams(context) {
        console.log(chalk.blue('   - Generating Mermaid diagrams...'));
        
        const diagrams = {
            flowcharts: [],
            dependencyGraphs: [],
            sequenceDiagrams: [],
            architectureDiagrams: []
        };

        try {
            // Generate flowcharts from function and class analysis
            if (context.code && context.code.ast) {
                diagrams.flowcharts = await this.generateFlowcharts(context.code.ast);
            }

            // Generate dependency graphs from code changes
            if (context.code && context.code.dependencies) {
                diagrams.dependencyGraphs = await this.generateDependencyGraphs(context.code);
            }

            // Generate sequence diagrams for API interactions
            if (context.code && context.code.ast) {
                diagrams.sequenceDiagrams = await this.generateSequenceDiagrams(context.code.ast);
            }

            // Generate architecture diagrams from project structure
            if (context.project) {
                diagrams.architectureDiagrams = await this.generateArchitectureDiagrams(context.project);
            }

            console.log(chalk.green(`   - Generated ${this.getTotalDiagramCount(diagrams)} diagrams`));
            return diagrams;

        } catch (error) {
            console.error(chalk.red('   - Error generating diagrams:', error.message));
            return diagrams;
        }
    }

    /**
     * Generate flowcharts from function and class analysis
     * @param {Object} astAnalysis - AST analysis results
     * @returns {Promise<Array>} Array of flowchart diagrams
     */
    async generateFlowcharts(astAnalysis) {
        const flowcharts = [];

        // Generate flowcharts for complex functions
        const complexFunctions = astAnalysis.functions.filter(func => func.params > 3);
        
        for (const func of complexFunctions) {
            const flowchart = await this.generateFunctionFlowchart(func);
            if (flowchart) {
                flowcharts.push({
                    type: 'flowchart',
                    title: `Function Flow: ${func.name}`,
                    file: func.file,
                    mermaid: flowchart
                });
            }
        }

        // Generate class relationship flowcharts
        if (astAnalysis.classes.length > 0) {
            const classFlowchart = this.generateClassRelationshipFlowchart(astAnalysis.classes);
            if (classFlowchart) {
                flowcharts.push({
                    type: 'flowchart',
                    title: 'Class Relationships',
                    mermaid: classFlowchart
                });
            }
        }

        return flowcharts;
    }

    /**
     * Generate flowchart for a specific function
     * @param {Object} func - Function analysis data
     * @returns {Promise<string>} Mermaid flowchart syntax
     */
    async generateFunctionFlowchart(func) {
        // Basic function flowchart template
        return `flowchart TD
    A[${func.name}] --> B{Parameters: ${func.params}}
    B --> C[Process Logic]
    C --> D{Async: ${func.async}}
    D -->|Yes| E[Await Operations]
    D -->|No| F[Synchronous Execution]
    E --> G[Return Result]
    F --> G
    G --> H[End]
    
    style A fill:#e1f5fe
    style G fill:#c8e6c9
    style H fill:#ffcdd2`;
    }

    /**
     * Generate class relationship flowchart
     * @param {Array} classes - Array of class analysis data
     * @returns {string} Mermaid flowchart syntax
     */
    generateClassRelationshipFlowchart(classes) {
        let mermaid = 'flowchart TD\n';
        
        classes.forEach((cls, index) => {
            const nodeId = `C${index}`;
            mermaid += `    ${nodeId}[${cls.name}]\n`;
            
            if (cls.superClass) {
                const superIndex = classes.findIndex(c => c.name === cls.superClass);
                if (superIndex !== -1) {
                    mermaid += `    C${superIndex} --> ${nodeId}\n`;
                }
            }
        });

        // Add styling
        mermaid += '\n    classDef default fill:#e3f2fd,stroke:#1976d2,stroke-width:2px\n';
        
        return mermaid;
    }

    /**
     * Generate dependency graphs from code change impact analysis
     * @param {Object} codeAnalysis - Code analysis results
     * @returns {Promise<Array>} Array of dependency graph diagrams
     */
    async generateDependencyGraphs(codeAnalysis) {
        const graphs = [];

        // Generate dependency change impact graph
        if (codeAnalysis.dependencies && codeAnalysis.dependencies.added.length > 0) {
            const depGraph = this.generateDependencyChangeGraph(codeAnalysis.dependencies);
            graphs.push({
                type: 'dependency_graph',
                title: 'Dependency Changes Impact',
                mermaid: depGraph
            });
        }

        // Generate module dependency graph from imports/exports
        if (codeAnalysis.ast && codeAnalysis.ast.imports.length > 0) {
            const moduleGraph = this.generateModuleDependencyGraph(codeAnalysis.ast);
            graphs.push({
                type: 'dependency_graph',
                title: 'Module Dependencies',
                mermaid: moduleGraph
            });
        }

        return graphs;
    }

    /**
     * Generate dependency change impact graph
     * @param {Object} dependencies - Dependency analysis results
     * @returns {string} Mermaid graph syntax
     */
    generateDependencyChangeGraph(dependencies) {
        let mermaid = 'graph TD\n';
        
        // Add new dependencies
        dependencies.added.forEach((dep, index) => {
            const nodeId = `NEW${index}`;
            mermaid += `    ${nodeId}[${dep.package}@${dep.version}]\n`;
            mermaid += `    ${nodeId} --> APP[Application]\n`;
        });

        // Add updated dependencies
        dependencies.updated.forEach((dep, index) => {
            const oldNodeId = `OLD${index}`;
            const newNodeId = `UPD${index}`;
            mermaid += `    ${oldNodeId}[${dep.package}@${dep.oldVersion}]\n`;
            mermaid += `    ${newNodeId}[${dep.package}@${dep.newVersion}]\n`;
            mermaid += `    ${oldNodeId} -.-> ${newNodeId}\n`;
            mermaid += `    ${newNodeId} --> APP[Application]\n`;
        });

        // Add styling
        mermaid += '\n    classDef new fill:#c8e6c9,stroke:#4caf50\n';
        mermaid += '    classDef updated fill:#fff3e0,stroke:#ff9800\n';
        mermaid += '    classDef app fill:#e1f5fe,stroke:#2196f3\n';
        
        // Apply styles
        dependencies.added.forEach((_, index) => {
            mermaid += `    class NEW${index} new\n`;
        });
        dependencies.updated.forEach((_, index) => {
            mermaid += `    class UPD${index} updated\n`;
        });
        mermaid += '    class APP app\n';

        return mermaid;
    }

    /**
     * Generate module dependency graph from imports
     * @param {Object} astAnalysis - AST analysis results
     * @returns {string} Mermaid graph syntax
     */
    generateModuleDependencyGraph(astAnalysis) {
        let mermaid = 'graph LR\n';
        
        const fileModules = new Map();
        
        // Group imports by file
        astAnalysis.imports.forEach(imp => {
            if (!fileModules.has(imp.file)) {
                fileModules.set(imp.file, []);
            }
            fileModules.get(imp.file).push(imp);
        });

        let nodeCounter = 0;
        const nodeMap = new Map();

        // Create nodes for each file and its dependencies
        fileModules.forEach((imports, file) => {
            const fileName = file.split('/').pop().replace(/\.[^/.]+$/, '');
            const fileNodeId = `F${nodeCounter++}`;
            nodeMap.set(file, fileNodeId);
            mermaid += `    ${fileNodeId}[${fileName}]\n`;

            imports.forEach(imp => {
                if (!imp.source.startsWith('.')) { // External dependency
                    const depNodeId = `D${nodeCounter++}`;
                    mermaid += `    ${depNodeId}[${imp.source}]\n`;
                    mermaid += `    ${depNodeId} --> ${fileNodeId}\n`;
                }
            });
        });

        // Add internal dependencies
        fileModules.forEach((imports, file) => {
            const fileNodeId = nodeMap.get(file);
            imports.forEach(imp => {
                if (imp.source.startsWith('.')) { // Internal dependency
                    // Try to find the target file
                    const targetFile = Array.from(fileModules.keys()).find(f => 
                        f.includes(imp.source.replace('./', ''))
                    );
                    if (targetFile && nodeMap.has(targetFile)) {
                        const targetNodeId = nodeMap.get(targetFile);
                        mermaid += `    ${targetNodeId} --> ${fileNodeId}\n`;
                    }
                }
            });
        });

        return mermaid;
    }

    /**
     * Generate sequence diagrams for API interactions
     * @param {Object} astAnalysis - AST analysis results
     * @returns {Promise<Array>} Array of sequence diagrams
     */
    async generateSequenceDiagrams(astAnalysis) {
        const diagrams = [];

        // Look for API-related functions (fetch, axios, etc.)
        const apiFunctions = astAnalysis.functions.filter(func => 
            func.name.toLowerCase().includes('api') ||
            func.name.toLowerCase().includes('fetch') ||
            func.name.toLowerCase().includes('request') ||
            func.async
        );

        if (apiFunctions.length > 0) {
            const apiSequence = this.generateAPISequenceDiagram(apiFunctions);
            diagrams.push({
                type: 'sequence',
                title: 'API Interaction Flow',
                mermaid: apiSequence
            });
        }

        return diagrams;
    }

    /**
     * Generate API sequence diagram
     * @param {Array} apiFunctions - Array of API-related functions
     * @returns {string} Mermaid sequence diagram syntax
     */
    generateAPISequenceDiagram(apiFunctions) {
        let mermaid = 'sequenceDiagram\n';
        mermaid += '    participant Client\n';
        mermaid += '    participant App\n';
        mermaid += '    participant API\n';
        mermaid += '    participant DB\n\n';

        apiFunctions.forEach((func, index) => {
            mermaid += `    Client->>+App: ${func.name}()\n`;
            
            if (func.async) {
                mermaid += `    App->>+API: HTTP Request\n`;
                mermaid += `    API->>+DB: Query Data\n`;
                mermaid += `    DB-->>-API: Return Data\n`;
                mermaid += `    API-->>-App: HTTP Response\n`;
            } else {
                mermaid += `    App->>App: Process Data\n`;
            }
            
            mermaid += `    App-->>-Client: Return Result\n`;
            
            if (index < apiFunctions.length - 1) {
                mermaid += '\n';
            }
        });

        return mermaid;
    }

    /**
     * Generate architecture diagrams from project structure analysis
     * @param {Object} projectAnalysis - Project structure analysis
     * @returns {Promise<Array>} Array of architecture diagrams
     */
    async generateArchitectureDiagrams(projectAnalysis) {
        const diagrams = [];

        // Generate overall project architecture
        const projectArch = this.generateProjectArchitectureDiagram(projectAnalysis);
        diagrams.push({
            type: 'architecture',
            title: 'Project Architecture',
            mermaid: projectArch
        });

        return diagrams;
    }

    /**
     * Generate project architecture diagram
     * @param {Object} projectAnalysis - Project analysis results
     * @returns {string} Mermaid architecture diagram syntax
     */
    generateProjectArchitectureDiagram(projectAnalysis) {
        let mermaid = 'graph TB\n';
        
        // Basic architecture layers
        mermaid += '    subgraph "Frontend Layer"\n';
        mermaid += '        UI[User Interface]\n';
        mermaid += '        COMP[Components]\n';
        mermaid += '    end\n\n';
        
        mermaid += '    subgraph "Business Logic Layer"\n';
        mermaid += '        SERV[Services]\n';
        mermaid += '        WORK[Workflows]\n';
        mermaid += '    end\n\n';
        
        mermaid += '    subgraph "Data Layer"\n';
        mermaid += '        API[API Clients]\n';
        mermaid += '        CACHE[Cache]\n';
        mermaid += '    end\n\n';
        
        mermaid += '    subgraph "External Services"\n';
        mermaid += '        GH[GitHub API]\n';
        mermaid += '        LIN[Linear API]\n';
        mermaid += '        AI[AI Services]\n';
        mermaid += '    end\n\n';

        // Connections
        mermaid += '    UI --> COMP\n';
        mermaid += '    COMP --> SERV\n';
        mermaid += '    SERV --> WORK\n';
        mermaid += '    WORK --> API\n';
        mermaid += '    API --> GH\n';
        mermaid += '    API --> LIN\n';
        mermaid += '    API --> AI\n';
        mermaid += '    SERV --> CACHE\n';

        // Styling
        mermaid += '\n    classDef frontend fill:#e3f2fd,stroke:#1976d2\n';
        mermaid += '    classDef business fill:#f3e5f5,stroke:#7b1fa2\n';
        mermaid += '    classDef data fill:#e8f5e8,stroke:#388e3c\n';
        mermaid += '    classDef external fill:#fff3e0,stroke:#f57c00\n';
        
        mermaid += '    class UI,COMP frontend\n';
        mermaid += '    class SERV,WORK business\n';
        mermaid += '    class API,CACHE data\n';
        mermaid += '    class GH,LIN,AI external\n';

        return mermaid;
    }

    /**
     * Format diagrams for GitHub and Linear integration
     * @param {Object} diagrams - Generated diagrams
     * @returns {Object} Formatted diagrams for different platforms
     */
    formatDiagramsForPlatforms(diagrams) {
        const formatted = {
            github: {
                markdown: this.formatDiagramsForGitHub(diagrams),
                html: this.formatDiagramsAsHTML(diagrams)
            },
            linear: {
                markdown: this.formatDiagramsForLinear(diagrams),
                text: this.formatDiagramsAsText(diagrams)
            }
        };

        return formatted;
    }

    /**
     * Format diagrams for GitHub (Markdown with Mermaid support)
     * @param {Object} diagrams - Generated diagrams
     * @returns {string} GitHub-formatted markdown
     */
    formatDiagramsForGitHub(diagrams) {
        let markdown = '## 📊 Code Analysis Diagrams\n\n';

        const allDiagrams = [
            ...diagrams.flowcharts,
            ...diagrams.dependencyGraphs,
            ...diagrams.sequenceDiagrams,
            ...diagrams.architectureDiagrams
        ];

        allDiagrams.forEach(diagram => {
            markdown += `### ${diagram.title}\n\n`;
            markdown += '```mermaid\n';
            markdown += diagram.mermaid;
            markdown += '\n```\n\n';
        });

        return markdown;
    }

    /**
     * Format diagrams for Linear (Markdown without Mermaid)
     * @param {Object} diagrams - Generated diagrams
     * @returns {string} Linear-formatted markdown
     */
    formatDiagramsForLinear(diagrams) {
        let markdown = '## 📊 Code Analysis Summary\n\n';

        const allDiagrams = [
            ...diagrams.flowcharts,
            ...diagrams.dependencyGraphs,
            ...diagrams.sequenceDiagrams,
            ...diagrams.architectureDiagrams
        ];

        allDiagrams.forEach(diagram => {
            markdown += `### ${diagram.title}\n\n`;
            markdown += '```\n';
            markdown += this.convertMermaidToText(diagram.mermaid);
            markdown += '\n```\n\n';
        });

        return markdown;
    }

    /**
     * Convert Mermaid syntax to text representation
     * @param {string} mermaid - Mermaid diagram syntax
     * @returns {string} Text representation
     */
    convertMermaidToText(mermaid) {
        // Simple conversion of Mermaid to text
        const lines = mermaid.split('\n');
        let text = '';
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('classDef') && !trimmed.startsWith('class ')) {
                // Extract node connections and descriptions
                if (trimmed.includes('-->')) {
                    const parts = trimmed.split('-->');
                    const from = parts[0].replace(/[\[\]]/g, '').trim();
                    const to = parts[1].replace(/[\[\]]/g, '').trim();
                    text += `${from} → ${to}\n`;
                } else if (trimmed.includes('[') && trimmed.includes(']')) {
                    const match = trimmed.match(/(\w+)\[([^\]]+)\]/);
                    if (match) {
                        text += `• ${match[2]}\n`;
                    }
                }
            }
        });

        return text || 'Diagram structure analysis available';
    }

    /**
     * Format diagrams as HTML for embedding
     * @param {Object} diagrams - Generated diagrams
     * @returns {string} HTML formatted diagrams
     */
    formatDiagramsAsHTML(diagrams) {
        let html = '<div class="code-analysis-diagrams">\n';
        html += '<h2>📊 Code Analysis Diagrams</h2>\n';

        const allDiagrams = [
            ...diagrams.flowcharts,
            ...diagrams.dependencyGraphs,
            ...diagrams.sequenceDiagrams,
            ...diagrams.architectureDiagrams
        ];

        allDiagrams.forEach(diagram => {
            html += `<div class="diagram-container">\n`;
            html += `<h3>${diagram.title}</h3>\n`;
            html += `<div class="mermaid">\n${diagram.mermaid}\n</div>\n`;
            html += `</div>\n`;
        });

        html += '</div>\n';
        return html;
    }

    /**
     * Format diagrams as plain text summary
     * @param {Object} diagrams - Generated diagrams
     * @returns {string} Plain text summary
     */
    formatDiagramsAsText(diagrams) {
        let text = '📊 CODE ANALYSIS SUMMARY\n';
        text += '========================\n\n';

        const counts = {
            flowcharts: diagrams.flowcharts.length,
            dependencies: diagrams.dependencyGraphs.length,
            sequences: diagrams.sequenceDiagrams.length,
            architecture: diagrams.architectureDiagrams.length
        };

        text += `Generated Diagrams:\n`;
        text += `• Flowcharts: ${counts.flowcharts}\n`;
        text += `• Dependency Graphs: ${counts.dependencies}\n`;
        text += `• Sequence Diagrams: ${counts.sequences}\n`;
        text += `• Architecture Diagrams: ${counts.architecture}\n\n`;

        return text;
    }

    /**
     * Get total count of generated diagrams
     * @param {Object} diagrams - Generated diagrams
     * @returns {number} Total diagram count
     */
    getTotalDiagramCount(diagrams) {
        return diagrams.flowcharts.length + 
               diagrams.dependencyGraphs.length + 
               diagrams.sequenceDiagrams.length + 
               diagrams.architectureDiagrams.length;
    }
}

module.exports = MermaidGenerator;