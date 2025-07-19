const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * Context Analyzer - Enhanced version of current context gathering with deeper code analysis
 */
class ContextAnalyzer {
    constructor(config) {
        this.config = config;
    }

    /**
     * Gather comprehensive context from various sources
     * @returns {Promise<Object>} Complete context object
     */
    async gather() {
        const gitContext = await this.gatherGitContext();
        
        const context = {
            git: gitContext,
            code: await this.analyzeCodeChanges(),
            project: await this.analyzeProjectStructure(),
            linear: this.gatherLinearContext(gitContext.branch)
        };

        return context;
    }

    /**
     * Gather Git-related context information with enhanced analysis
     * @returns {Promise<Object>} Git context
     */
    async gatherGitContext() {
        console.log(chalk.blue('   - Gathering enhanced git context...'));
        
        try {
            const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
            const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
            
            // Handle unpushed commits
            await this.handleUnpushedCommits(branchName);
            
            const diffContent = execSync('git diff origin/main...HEAD').toString().trim();
            
            if (!diffContent) {
                throw new Error('No new commits found on this branch compared to "origin/main". Please commit your changes.');
            }

            console.log(chalk.blue(`   - Found ${diffContent.split('\n').length} lines of changes`));

            // Enhanced git context gathering
            const branchHistory = await this.getBranchHistory(branchName);
            const mergeBaseAnalysis = await this.analyzeMergeBase(branchName);
            const conflictDetection = await this.detectConflicts(branchName);
            const commitAnalysis = await this.analyzeCommitMessages(branchName);
            const branchValidation = this.validateBranchNaming(branchName);

            return {
                branch: branchName,
                remoteUrl,
                diff: diffContent,
                diffStats: execSync('git diff --stat origin/main...HEAD').toString().trim(),
                commits: this.getRecentCommits(branchName),
                branchHistory,
                mergeBaseAnalysis,
                conflictDetection,
                commitAnalysis,
                branchValidation
            };
        } catch (error) {
            throw new Error(`Git context gathering failed: ${error.message}`);
        }
    }

    /**
     * Handle unpushed commits by pushing them to remote
     * @param {string} branchName - Current branch name
     */
    async handleUnpushedCommits(branchName) {
        try {
            const unpushedCommits = execSync(`git log origin/${branchName}..HEAD --oneline`).toString().trim();
            if (unpushedCommits) {
                console.log(chalk.yellow('   - Found unpushed commits, pushing to remote...'));
                execSync(`git push origin ${branchName}`);
                console.log(chalk.green('   - Pushed latest commits to remote'));
            }
        } catch (pushError) {
            // Branch might not exist on remote yet
            console.log(chalk.yellow('   - Branch not on remote, pushing for first time...'));
            try {
                execSync(`git push -u origin ${branchName}`);
                console.log(chalk.green('   - Pushed branch to remote'));
            } catch (firstPushError) {
                console.log(chalk.red('   - Warning: Could not push to remote, continuing anyway...'));
            }
        }
    }

    /**
     * Get recent commits for the current branch
     * @param {string} branchName - Current branch name
     * @returns {Array} Array of commit objects
     */
    getRecentCommits(branchName) {
        try {
            const commitLog = execSync(`git log origin/main..${branchName} --oneline --no-merges`).toString().trim();
            if (!commitLog) return [];
            
            return commitLog.split('\n').map(line => {
                const [hash, ...messageParts] = line.split(' ');
                return {
                    hash: hash,
                    message: messageParts.join(' ')
                };
            });
        } catch (error) {
            return [];
        }
    }

    /**
     * Analyze code changes in the current diff with comprehensive analysis
     * @returns {Promise<Object>} Code analysis results
     */
    async analyzeCodeChanges() {
        console.log(chalk.blue('   - Analyzing code changes...'));
        
        try {
            const diffContent = execSync('git diff origin/main...HEAD').toString();
            const changedFiles = this.getChangedFiles();
            
            const analysis = {
                hasChanges: diffContent.length > 0,
                changedFiles,
                complexity: await this.analyzeCodeComplexity(changedFiles),
                security: await this.performSecurityAnalysis(changedFiles),
                dependencies: await this.analyzeDependencyChanges(),
                ast: await this.performASTAnalysis(changedFiles),
                metrics: this.calculateCodeMetrics(diffContent)
            };
            
            return analysis;
        } catch (error) {
            console.log(chalk.yellow('   - Warning: Code analysis failed:', error.message));
            return {
                hasChanges: true,
                error: error.message,
                complexity: { score: 0, level: 'unknown' },
                security: { vulnerabilities: [] },
                dependencies: [],
                ast: {},
                metrics: {}
            };
        }
    }

    /**
     * Get list of changed files from git diff
     * @returns {Array} Array of changed file objects
     */
    getChangedFiles() {
        try {
            const diffOutput = execSync('git diff --name-status origin/main...HEAD').toString().trim();
            if (!diffOutput) return [];
            
            return diffOutput.split('\n').map(line => {
                const [status, ...pathParts] = line.split('\t');
                const path = pathParts.join('\t');
                return {
                    path,
                    status: this.mapGitStatus(status),
                    extension: path.split('.').pop(),
                    isJavaScript: /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(path),
                    isConfig: /\.(json|yaml|yml|toml|ini)$/.test(path),
                    isTest: /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(path)
                };
            });
        } catch (error) {
            return [];
        }
    }

    /**
     * Map git status codes to readable names
     * @param {string} status - Git status code
     * @returns {string} Readable status
     */
    mapGitStatus(status) {
        const statusMap = {
            'A': 'added',
            'M': 'modified',
            'D': 'deleted',
            'R': 'renamed',
            'C': 'copied',
            'U': 'unmerged'
        };
        return statusMap[status] || status;
    }

    /**
     * Analyze code complexity using AST parsing
     * @param {Array} changedFiles - Array of changed files
     * @returns {Promise<Object>} Complexity analysis
     */
    async analyzeCodeComplexity(changedFiles) {
        const fs = require('fs');
        const parser = require('@babel/parser');
        const traverse = require('@babel/traverse').default;
        
        const complexity = {
            totalScore: 0,
            averageScore: 0,
            level: 'low',
            files: [],
            issues: []
        };
        
        const jsFiles = changedFiles.filter(f => f.isJavaScript && f.status !== 'deleted');
        
        for (const file of jsFiles) {
            try {
                if (!fs.existsSync(file.path)) continue;
                
                const content = fs.readFileSync(file.path, 'utf8');
                const fileComplexity = await this.analyzeFileComplexity(file.path, content);
                
                complexity.files.push(fileComplexity);
                complexity.totalScore += fileComplexity.score;
                
                if (fileComplexity.score > 10) {
                    complexity.issues.push({
                        file: file.path,
                        type: 'high_complexity',
                        score: fileComplexity.score,
                        message: `High complexity score: ${fileComplexity.score}`
                    });
                }
            } catch (error) {
                complexity.issues.push({
                    file: file.path,
                    type: 'parse_error',
                    message: `Could not parse file: ${error.message}`
                });
            }
        }
        
        if (jsFiles.length > 0) {
            complexity.averageScore = complexity.totalScore / jsFiles.length;
            complexity.level = this.getComplexityLevel(complexity.averageScore);
        }
        
        return complexity;
    }

    /**
     * Analyze complexity of a single file
     * @param {string} filePath - Path to the file
     * @param {string} content - File content
     * @returns {Promise<Object>} File complexity analysis
     */
    async analyzeFileComplexity(filePath, content) {
        const parser = require('@babel/parser');
        const traverse = require('@babel/traverse').default;
        
        let complexity = {
            file: filePath,
            score: 0,
            functions: 0,
            classes: 0,
            conditionals: 0,
            loops: 0,
            depth: 0,
            lines: content.split('\n').length
        };
        
        try {
            const ast = parser.parse(content, {
                sourceType: 'module',
                allowImportExportEverywhere: true,
                allowReturnOutsideFunction: true,
                plugins: [
                    'jsx',
                    'typescript',
                    'decorators-legacy',
                    'classProperties',
                    'objectRestSpread',
                    'asyncGenerators',
                    'functionBind',
                    'exportDefaultFrom',
                    'exportNamespaceFrom',
                    'dynamicImport',
                    'nullishCoalescingOperator',
                    'optionalChaining'
                ]
            });
            
            let currentDepth = 0;
            let maxDepth = 0;
            
            traverse(ast, {
                enter(path) {
                    currentDepth++;
                    maxDepth = Math.max(maxDepth, currentDepth);
                },
                exit() {
                    currentDepth--;
                },
                FunctionDeclaration() { complexity.functions++; complexity.score += 1; },
                FunctionExpression() { complexity.functions++; complexity.score += 1; },
                ArrowFunctionExpression() { complexity.functions++; complexity.score += 1; },
                ClassDeclaration() { complexity.classes++; complexity.score += 2; },
                IfStatement() { complexity.conditionals++; complexity.score += 1; },
                ConditionalExpression() { complexity.conditionals++; complexity.score += 1; },
                SwitchStatement() { complexity.conditionals++; complexity.score += 1; },
                ForStatement() { complexity.loops++; complexity.score += 2; },
                WhileStatement() { complexity.loops++; complexity.score += 2; },
                DoWhileStatement() { complexity.loops++; complexity.score += 2; },
                ForInStatement() { complexity.loops++; complexity.score += 2; },
                ForOfStatement() { complexity.loops++; complexity.score += 2; }
            });
            
            complexity.depth = maxDepth;
            complexity.score += Math.floor(maxDepth / 5); // Add complexity for deep nesting
            
        } catch (error) {
            // If parsing fails, estimate complexity from basic metrics
            complexity.score = Math.floor(complexity.lines / 20);
        }
        
        return complexity;
    }

    /**
     * Get complexity level from score
     * @param {number} score - Complexity score
     * @returns {string} Complexity level
     */
    getComplexityLevel(score) {
        if (score <= 5) return 'low';
        if (score <= 10) return 'medium';
        if (score <= 20) return 'high';
        return 'very_high';
    }

    /**
     * Perform security analysis on changed files
     * @param {Array} changedFiles - Array of changed files
     * @returns {Promise<Object>} Security analysis results
     */
    async performSecurityAnalysis(changedFiles) {
        console.log(chalk.blue('   - Performing security analysis...'));
        
        const security = {
            vulnerabilities: [],
            warnings: [],
            riskLevel: 'low',
            issues: []
        };
        
        // Check for common security patterns in code
        for (const file of changedFiles) {
            if (file.isJavaScript && file.status !== 'deleted') {
                const fileVulns = await this.scanFileForVulnerabilities(file.path);
                security.vulnerabilities.push(...fileVulns);
            }
        }
        
        // Check dependency vulnerabilities
        const depVulns = await this.scanDependencyVulnerabilities();
        security.vulnerabilities.push(...depVulns);
        
        // Assess overall risk level
        security.riskLevel = this.assessSecurityRisk(security.vulnerabilities);
        
        return security;
    }

    /**
     * Scan a file for security vulnerabilities
     * @param {string} filePath - Path to the file
     * @returns {Promise<Array>} Array of vulnerabilities found
     */
    async scanFileForVulnerabilities(filePath) {
        const fs = require('fs');
        const vulnerabilities = [];
        
        try {
            if (!fs.existsSync(filePath)) return [];
            
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Common security patterns to check
            const securityPatterns = [
                {
                    pattern: /eval\s*\(/g,
                    type: 'code_injection',
                    severity: 'high',
                    message: 'Use of eval() can lead to code injection'
                },
                {
                    pattern: /innerHTML\s*=/g,
                    type: 'xss',
                    severity: 'medium',
                    message: 'innerHTML assignment can lead to XSS'
                },
                {
                    pattern: /document\.write\s*\(/g,
                    type: 'xss',
                    severity: 'medium',
                    message: 'document.write can lead to XSS'
                },
                {
                    pattern: /password\s*[:=]\s*['"]/gi,
                    type: 'hardcoded_secret',
                    severity: 'high',
                    message: 'Hardcoded password detected'
                },
                {
                    pattern: /api[_-]?key\s*[:=]\s*['"]/gi,
                    type: 'hardcoded_secret',
                    severity: 'high',
                    message: 'Hardcoded API key detected'
                },
                {
                    pattern: /token\s*[:=]\s*['"]/gi,
                    type: 'hardcoded_secret',
                    severity: 'medium',
                    message: 'Hardcoded token detected'
                },
                {
                    pattern: /Math\.random\(\)/g,
                    type: 'weak_random',
                    severity: 'low',
                    message: 'Math.random() is not cryptographically secure'
                }
            ];
            
            for (const { pattern, type, severity, message } of securityPatterns) {
                const matches = content.matchAll(pattern);
                for (const match of matches) {
                    const lineNumber = content.substring(0, match.index).split('\n').length;
                    vulnerabilities.push({
                        file: filePath,
                        type,
                        severity,
                        message,
                        line: lineNumber,
                        code: match[0]
                    });
                }
            }
            
        } catch (error) {
            // Ignore file read errors
        }
        
        return vulnerabilities;
    }

    /**
     * Scan for dependency vulnerabilities
     * @returns {Promise<Array>} Array of dependency vulnerabilities
     */
    async scanDependencyVulnerabilities() {
        const vulnerabilities = [];
        
        try {
            // Run npm audit to check for known vulnerabilities
            const auditOutput = execSync('npm audit --json', { stdio: 'pipe' }).toString();
            const auditData = JSON.parse(auditOutput);
            
            if (auditData.vulnerabilities) {
                for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
                    vulnerabilities.push({
                        type: 'dependency_vulnerability',
                        package: packageName,
                        severity: vulnData.severity,
                        message: `Vulnerability in ${packageName}: ${vulnData.title || 'Unknown issue'}`,
                        via: vulnData.via
                    });
                }
            }
        } catch (error) {
            // npm audit might fail if no package-lock.json or other issues
            // This is not critical, so we continue
        }
        
        return vulnerabilities;
    }

    /**
     * Assess overall security risk level
     * @param {Array} vulnerabilities - Array of vulnerabilities
     * @returns {string} Risk level
     */
    assessSecurityRisk(vulnerabilities) {
        const highSeverity = vulnerabilities.filter(v => v.severity === 'high').length;
        const mediumSeverity = vulnerabilities.filter(v => v.severity === 'medium').length;
        
        if (highSeverity > 0) return 'high';
        if (mediumSeverity > 2) return 'medium';
        if (vulnerabilities.length > 0) return 'low';
        return 'none';
    }

    /**
     * Analyze dependency changes
     * @returns {Promise<Object>} Dependency analysis results
     */
    async analyzeDependencyChanges() {
        console.log(chalk.blue('   - Analyzing dependency changes...'));
        
        const fs = require('fs');
        const semver = require('semver');
        
        const analysis = {
            added: [],
            updated: [],
            removed: [],
            devDependencies: [],
            securityUpdates: [],
            breakingChanges: []
        };
        
        try {
            // Check if package.json was modified
            const packageJsonDiff = execSync('git diff origin/main...HEAD -- package.json').toString();
            
            if (packageJsonDiff) {
                const changes = this.parsePackageJsonDiff(packageJsonDiff);
                analysis.added = changes.added;
                analysis.updated = changes.updated;
                analysis.removed = changes.removed;
                analysis.devDependencies = changes.devDependencies;
                
                // Analyze version changes for breaking changes
                for (const update of changes.updated) {
                    if (semver.major(update.newVersion) > semver.major(update.oldVersion)) {
                        analysis.breakingChanges.push({
                            package: update.package,
                            oldVersion: update.oldVersion,
                            newVersion: update.newVersion,
                            type: 'major_version_bump'
                        });
                    }
                }
            }
            
        } catch (error) {
            // If we can't analyze package.json changes, that's okay
        }
        
        return analysis;
    }

    /**
     * Parse package.json diff to extract dependency changes
     * @param {string} diff - Git diff content for package.json
     * @returns {Object} Parsed dependency changes
     */
    parsePackageJsonDiff(diff) {
        const changes = {
            added: [],
            updated: [],
            removed: [],
            devDependencies: []
        };
        
        const lines = diff.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('+') && line.includes(':') && line.includes('"')) {
                const match = line.match(/\+\s*"([^"]+)":\s*"([^"]+)"/);
                if (match) {
                    const [, packageName, version] = match;
                    changes.added.push({ package: packageName, version });
                }
            } else if (line.startsWith('-') && line.includes(':') && line.includes('"')) {
                const match = line.match(/-\s*"([^"]+)":\s*"([^"]+)"/);
                if (match) {
                    const [, packageName, version] = match;
                    // Check if this is an update (next line is addition of same package)
                    const nextLine = lines[i + 1];
                    if (nextLine && nextLine.startsWith('+')) {
                        const nextMatch = nextLine.match(/\+\s*"([^"]+)":\s*"([^"]+)"/);
                        if (nextMatch && nextMatch[1] === packageName) {
                            changes.updated.push({
                                package: packageName,
                                oldVersion: version,
                                newVersion: nextMatch[2]
                            });
                            i++; // Skip next line as we've processed it
                            continue;
                        }
                    }
                    changes.removed.push({ package: packageName, version });
                }
            }
        }
        
        return changes;
    }

    /**
     * Perform AST analysis on changed JavaScript/TypeScript files
     * @param {Array} changedFiles - Array of changed files
     * @returns {Promise<Object>} AST analysis results
     */
    async performASTAnalysis(changedFiles) {
        const fs = require('fs');
        const parser = require('@babel/parser');
        const traverse = require('@babel/traverse').default;
        
        const analysis = {
            totalFiles: 0,
            parsedFiles: 0,
            functions: [],
            classes: [],
            imports: [],
            exports: [],
            issues: []
        };
        
        const jsFiles = changedFiles.filter(f => f.isJavaScript && f.status !== 'deleted');
        analysis.totalFiles = jsFiles.length;
        
        for (const file of jsFiles) {
            try {
                if (!fs.existsSync(file.path)) continue;
                
                const content = fs.readFileSync(file.path, 'utf8');
                const fileAnalysis = await this.analyzeFileAST(file.path, content);
                
                analysis.functions.push(...fileAnalysis.functions);
                analysis.classes.push(...fileAnalysis.classes);
                analysis.imports.push(...fileAnalysis.imports);
                analysis.exports.push(...fileAnalysis.exports);
                analysis.parsedFiles++;
                
            } catch (error) {
                analysis.issues.push({
                    file: file.path,
                    type: 'ast_parse_error',
                    message: error.message
                });
            }
        }
        
        return analysis;
    }

    /**
     * Analyze AST of a single file
     * @param {string} filePath - Path to the file
     * @param {string} content - File content
     * @returns {Promise<Object>} File AST analysis
     */
    async analyzeFileAST(filePath, content) {
        const parser = require('@babel/parser');
        const traverse = require('@babel/traverse').default;
        
        const analysis = {
            functions: [],
            classes: [],
            imports: [],
            exports: []
        };
        
        const ast = parser.parse(content, {
            sourceType: 'module',
            allowImportExportEverywhere: true,
            allowReturnOutsideFunction: true,
            plugins: [
                'jsx',
                'typescript',
                'decorators-legacy',
                'classProperties',
                'objectRestSpread',
                'asyncGenerators',
                'functionBind',
                'exportDefaultFrom',
                'exportNamespaceFrom',
                'dynamicImport',
                'nullishCoalescingOperator',
                'optionalChaining'
            ]
        });
        
        traverse(ast, {
            FunctionDeclaration(path) {
                analysis.functions.push({
                    file: filePath,
                    name: path.node.id ? path.node.id.name : 'anonymous',
                    type: 'function',
                    async: path.node.async,
                    params: path.node.params.length,
                    line: path.node.loc ? path.node.loc.start.line : null
                });
            },
            FunctionExpression(path) {
                analysis.functions.push({
                    file: filePath,
                    name: 'anonymous',
                    type: 'function_expression',
                    async: path.node.async,
                    params: path.node.params.length,
                    line: path.node.loc ? path.node.loc.start.line : null
                });
            },
            ArrowFunctionExpression(path) {
                analysis.functions.push({
                    file: filePath,
                    name: 'arrow_function',
                    type: 'arrow_function',
                    async: path.node.async,
                    params: path.node.params.length,
                    line: path.node.loc ? path.node.loc.start.line : null
                });
            },
            ClassDeclaration(path) {
                analysis.classes.push({
                    file: filePath,
                    name: path.node.id ? path.node.id.name : 'anonymous',
                    superClass: path.node.superClass ? path.node.superClass.name : null,
                    line: path.node.loc ? path.node.loc.start.line : null
                });
            },
            ImportDeclaration(path) {
                analysis.imports.push({
                    file: filePath,
                    source: path.node.source.value,
                    specifiers: path.node.specifiers.map(spec => ({
                        type: spec.type,
                        local: spec.local.name,
                        imported: spec.imported ? spec.imported.name : null
                    })),
                    line: path.node.loc ? path.node.loc.start.line : null
                });
            },
            ExportDeclaration(path) {
                analysis.exports.push({
                    file: filePath,
                    type: path.node.type,
                    line: path.node.loc ? path.node.loc.start.line : null
                });
            }
        });
        
        return analysis;
    }

    /**
     * Calculate basic code metrics from diff content
     * @param {string} diffContent - Git diff content
     * @returns {Object} Code metrics
     */
    calculateCodeMetrics(diffContent) {
        const lines = diffContent.split('\n');
        const metrics = {
            totalLines: lines.length,
            addedLines: 0,
            removedLines: 0,
            modifiedFiles: 0,
            addedFiles: 0,
            removedFiles: 0
        };
        
        for (const line of lines) {
            if (line.startsWith('+') && !line.startsWith('+++')) {
                metrics.addedLines++;
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                metrics.removedLines++;
            } else if (line.startsWith('diff --git')) {
                metrics.modifiedFiles++;
            }
        }
        
        return metrics;
    }

    /**
     * Analyze project structure and configuration with comprehensive analysis
     * @returns {Promise<Object>} Project analysis results
     */
    async analyzeProjectStructure() {
        console.log(chalk.blue('   - Analyzing project structure...'));
        
        try {
            const structure = await this.analyzeDirectoryStructure();
            const configuration = await this.analyzeConfigurationFiles();
            const projectType = await this.detectProjectType(configuration);
            const framework = await this.detectFramework(configuration);
            const testCoverage = await this.analyzeTestCoverage();
            const buildSystem = await this.analyzeBuildSystem(configuration);
            
            return {
                structure,
                configuration,
                projectType,
                framework,
                testCoverage,
                buildSystem,
                metadata: {
                    hasTests: structure.testFiles > 0,
                    hasDocumentation: structure.documentationFiles > 0,
                    hasCI: structure.ciFiles > 0,
                    packageManager: this.detectPackageManager(),
                    nodeVersion: this.detectNodeVersion(configuration)
                }
            };
        } catch (error) {
            console.log(chalk.yellow('   - Warning: Project structure analysis failed:', error.message));
            return {
                error: error.message,
                structure: {},
                configuration: {},
                metadata: {}
            };
        }
    }

    /**
     * Analyze directory structure and file organization
     * @returns {Promise<Object>} Directory structure analysis
     */
    async analyzeDirectoryStructure() {
        const fs = require('fs');
        const path = require('path');
        
        const structure = {
            totalFiles: 0,
            directories: [],
            fileTypes: {},
            testFiles: 0,
            documentationFiles: 0,
            configFiles: 0,
            ciFiles: 0,
            sourceFiles: 0,
            depth: 0
        };
        
        const analyzeDirectory = (dirPath, currentDepth = 0) => {
            if (currentDepth > 10) return; // Prevent infinite recursion
            
            structure.depth = Math.max(structure.depth, currentDepth);
            
            try {
                const items = fs.readdirSync(dirPath);
                
                for (const item of items) {
                    const fullPath = path.join(dirPath, item);
                    const relativePath = path.relative('.', fullPath);
                    
                    // Skip node_modules and other common ignore patterns
                    if (this.shouldSkipPath(relativePath)) continue;
                    
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isDirectory()) {
                        structure.directories.push({
                            path: relativePath,
                            depth: currentDepth
                        });
                        analyzeDirectory(fullPath, currentDepth + 1);
                    } else {
                        structure.totalFiles++;
                        
                        const ext = path.extname(item);
                        structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
                        
                        // Categorize files
                        if (this.isTestFile(relativePath)) {
                            structure.testFiles++;
                        } else if (this.isDocumentationFile(relativePath)) {
                            structure.documentationFiles++;
                        } else if (this.isConfigFile(relativePath)) {
                            structure.configFiles++;
                        } else if (this.isCIFile(relativePath)) {
                            structure.ciFiles++;
                        } else if (this.isSourceFile(relativePath)) {
                            structure.sourceFiles++;
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };
        
        analyzeDirectory('.');
        return structure;
    }

    /**
     * Check if a path should be skipped during analysis
     * @param {string} path - File or directory path
     * @returns {boolean} Whether to skip this path
     */
    shouldSkipPath(path) {
        const skipPatterns = [
            'node_modules',
            '.git',
            '.next',
            '.nuxt',
            'dist',
            'build',
            'coverage',
            '.nyc_output',
            '.cache',
            'tmp',
            'temp'
        ];
        
        return skipPatterns.some(pattern => path.includes(pattern));
    }

    /**
     * Check if a file is a test file
     * @param {string} filePath - File path
     * @returns {boolean} Whether it's a test file
     */
    isTestFile(filePath) {
        return /\.(test|spec)\.(js|jsx|ts|tsx|mjs)$/.test(filePath) ||
               filePath.includes('__tests__') ||
               filePath.includes('/test/') ||
               filePath.includes('/tests/');
    }

    /**
     * Check if a file is a documentation file
     * @param {string} filePath - File path
     * @returns {boolean} Whether it's a documentation file
     */
    isDocumentationFile(filePath) {
        return /\.(md|txt|rst|adoc)$/i.test(filePath) ||
               filePath.toLowerCase().includes('readme') ||
               filePath.toLowerCase().includes('changelog') ||
               filePath.includes('/docs/');
    }

    /**
     * Check if a file is a configuration file
     * @param {string} filePath - File path
     * @returns {boolean} Whether it's a configuration file
     */
    isConfigFile(filePath) {
        const configPatterns = [
            /\.(json|yaml|yml|toml|ini|conf)$/,
            /^\..*rc$/,
            /^\..*ignore$/,
            /package\.json$/,
            /tsconfig\.json$/,
            /webpack\.config\./,
            /babel\.config\./,
            /jest\.config\./,
            /eslint\.config\./
        ];
        
        return configPatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * Check if a file is a CI/CD file
     * @param {string} filePath - File path
     * @returns {boolean} Whether it's a CI/CD file
     */
    isCIFile(filePath) {
        return filePath.includes('.github/workflows') ||
               filePath.includes('.gitlab-ci') ||
               filePath.includes('Jenkinsfile') ||
               filePath.includes('.travis.yml') ||
               filePath.includes('azure-pipelines') ||
               filePath.includes('.circleci');
    }

    /**
     * Check if a file is a source code file
     * @param {string} filePath - File path
     * @returns {boolean} Whether it's a source file
     */
    isSourceFile(filePath) {
        return /\.(js|jsx|ts|tsx|mjs|cjs|vue|svelte|py|java|go|rs|cpp|c|h)$/.test(filePath) &&
               !this.isTestFile(filePath);
    }

    /**
     * Analyze configuration files in the project
     * @returns {Promise<Object>} Configuration analysis
     */
    async analyzeConfigurationFiles() {
        const fs = require('fs');
        const configuration = {
            packageJson: null,
            tsconfig: null,
            eslint: null,
            prettier: null,
            jest: null,
            webpack: null,
            babel: null,
            vite: null,
            nextConfig: null,
            tailwind: null,
            docker: null
        };
        
        // Analyze package.json
        if (fs.existsSync('package.json')) {
            try {
                configuration.packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            } catch (error) {
                configuration.packageJson = { error: 'Invalid JSON' };
            }
        }
        
        // Analyze TypeScript config
        const tsconfigFiles = ['tsconfig.json', 'tsconfig.build.json', 'tsconfig.app.json'];
        for (const file of tsconfigFiles) {
            if (fs.existsSync(file)) {
                try {
                    configuration.tsconfig = JSON.parse(fs.readFileSync(file, 'utf8'));
                    break;
                } catch (error) {
                    configuration.tsconfig = { error: 'Invalid JSON' };
                }
            }
        }
        
        // Analyze ESLint config
        const eslintFiles = ['.eslintrc.json', '.eslintrc.js', '.eslintrc.yml', 'eslint.config.js'];
        for (const file of eslintFiles) {
            if (fs.existsSync(file)) {
                configuration.eslint = { configFile: file, exists: true };
                break;
            }
        }
        
        // Analyze Prettier config
        const prettierFiles = ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'];
        for (const file of prettierFiles) {
            if (fs.existsSync(file)) {
                configuration.prettier = { configFile: file, exists: true };
                break;
            }
        }
        
        // Analyze Jest config
        const jestFiles = ['jest.config.js', 'jest.config.json', 'jest.config.ts'];
        for (const file of jestFiles) {
            if (fs.existsSync(file)) {
                configuration.jest = { configFile: file, exists: true };
                break;
            }
        }
        
        // Check for other common config files
        if (fs.existsSync('webpack.config.js')) {
            configuration.webpack = { exists: true };
        }
        
        if (fs.existsSync('babel.config.js') || fs.existsSync('.babelrc')) {
            configuration.babel = { exists: true };
        }
        
        if (fs.existsSync('vite.config.js') || fs.existsSync('vite.config.ts')) {
            configuration.vite = { exists: true };
        }
        
        if (fs.existsSync('next.config.js')) {
            configuration.nextConfig = { exists: true };
        }
        
        if (fs.existsSync('tailwind.config.js')) {
            configuration.tailwind = { exists: true };
        }
        
        if (fs.existsSync('Dockerfile') || fs.existsSync('docker-compose.yml')) {
            configuration.docker = { exists: true };
        }
        
        return configuration;
    }

    /**
     * Detect project type based on configuration and structure
     * @param {Object} configuration - Configuration analysis
     * @returns {Promise<Object>} Project type detection
     */
    async detectProjectType(configuration) {
        const projectType = {
            primary: 'unknown',
            secondary: [],
            confidence: 0,
            indicators: []
        };
        
        const pkg = configuration.packageJson;
        if (!pkg) return projectType;
        
        // Check for specific project types
        const typeIndicators = [
            {
                type: 'react-app',
                indicators: ['react', 'react-dom', 'react-scripts'],
                confidence: 0.9
            },
            {
                type: 'next-app',
                indicators: ['next'],
                confidence: 0.95
            },
            {
                type: 'vue-app',
                indicators: ['vue', '@vue/cli-service'],
                confidence: 0.9
            },
            {
                type: 'angular-app',
                indicators: ['@angular/core', '@angular/cli'],
                confidence: 0.9
            },
            {
                type: 'express-api',
                indicators: ['express', 'cors', 'helmet'],
                confidence: 0.8
            },
            {
                type: 'fastify-api',
                indicators: ['fastify'],
                confidence: 0.9
            },
            {
                type: 'node-cli',
                indicators: ['commander', 'yargs', 'inquirer'],
                confidence: 0.7
            },
            {
                type: 'electron-app',
                indicators: ['electron'],
                confidence: 0.95
            },
            {
                type: 'react-native',
                indicators: ['react-native', '@react-native-community'],
                confidence: 0.9
            },
            {
                type: 'library',
                indicators: ['rollup', 'microbundle', 'tsdx'],
                confidence: 0.8
            }
        ];
        
        const allDeps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
            ...pkg.peerDependencies
        };
        
        for (const { type, indicators, confidence } of typeIndicators) {
            const matches = indicators.filter(indicator => 
                Object.keys(allDeps).some(dep => dep.includes(indicator))
            );
            
            if (matches.length > 0) {
                const matchConfidence = (matches.length / indicators.length) * confidence;
                
                if (matchConfidence > projectType.confidence) {
                    projectType.primary = type;
                    projectType.confidence = matchConfidence;
                }
                
                projectType.secondary.push({
                    type,
                    confidence: matchConfidence,
                    matches
                });
                
                projectType.indicators.push(...matches);
            }
        }
        
        // Check for TypeScript
        if (configuration.tsconfig || allDeps.typescript) {
            projectType.secondary.push({
                type: 'typescript',
                confidence: 0.9,
                matches: ['typescript']
            });
        }
        
        return projectType;
    }

    /**
     * Detect framework and tools used in the project
     * @param {Object} configuration - Configuration analysis
     * @returns {Promise<Object>} Framework detection
     */
    async detectFramework(configuration) {
        const framework = {
            frontend: [],
            backend: [],
            testing: [],
            build: [],
            styling: [],
            database: []
        };
        
        const pkg = configuration.packageJson;
        if (!pkg) return framework;
        
        const allDeps = {
            ...pkg.dependencies,
            ...pkg.devDependencies
        };
        
        // Frontend frameworks
        const frontendFrameworks = [
            { name: 'React', indicators: ['react', 'react-dom'] },
            { name: 'Vue', indicators: ['vue'] },
            { name: 'Angular', indicators: ['@angular/core'] },
            { name: 'Svelte', indicators: ['svelte'] },
            { name: 'Next.js', indicators: ['next'] },
            { name: 'Nuxt.js', indicators: ['nuxt'] },
            { name: 'Gatsby', indicators: ['gatsby'] }
        ];
        
        // Backend frameworks
        const backendFrameworks = [
            { name: 'Express', indicators: ['express'] },
            { name: 'Fastify', indicators: ['fastify'] },
            { name: 'Koa', indicators: ['koa'] },
            { name: 'NestJS', indicators: ['@nestjs/core'] },
            { name: 'Hapi', indicators: ['@hapi/hapi'] }
        ];
        
        // Testing frameworks
        const testingFrameworks = [
            { name: 'Jest', indicators: ['jest'] },
            { name: 'Mocha', indicators: ['mocha'] },
            { name: 'Vitest', indicators: ['vitest'] },
            { name: 'Cypress', indicators: ['cypress'] },
            { name: 'Playwright', indicators: ['@playwright/test'] },
            { name: 'Testing Library', indicators: ['@testing-library/react', '@testing-library/vue'] }
        ];
        
        // Build tools
        const buildTools = [
            { name: 'Webpack', indicators: ['webpack'] },
            { name: 'Vite', indicators: ['vite'] },
            { name: 'Rollup', indicators: ['rollup'] },
            { name: 'Parcel', indicators: ['parcel'] },
            { name: 'esbuild', indicators: ['esbuild'] }
        ];
        
        // Styling frameworks
        const stylingFrameworks = [
            { name: 'Tailwind CSS', indicators: ['tailwindcss'] },
            { name: 'Bootstrap', indicators: ['bootstrap'] },
            { name: 'Material-UI', indicators: ['@mui/material', '@material-ui/core'] },
            { name: 'Ant Design', indicators: ['antd'] },
            { name: 'Styled Components', indicators: ['styled-components'] },
            { name: 'Emotion', indicators: ['@emotion/react'] }
        ];
        
        // Database libraries
        const databaseLibs = [
            { name: 'Mongoose', indicators: ['mongoose'] },
            { name: 'Prisma', indicators: ['prisma', '@prisma/client'] },
            { name: 'TypeORM', indicators: ['typeorm'] },
            { name: 'Sequelize', indicators: ['sequelize'] },
            { name: 'Knex', indicators: ['knex'] }
        ];
        
        const detectFrameworks = (frameworks, category) => {
            for (const { name, indicators } of frameworks) {
                const found = indicators.some(indicator => allDeps[indicator]);
                if (found) {
                    framework[category].push(name);
                }
            }
        };
        
        detectFrameworks(frontendFrameworks, 'frontend');
        detectFrameworks(backendFrameworks, 'backend');
        detectFrameworks(testingFrameworks, 'testing');
        detectFrameworks(buildTools, 'build');
        detectFrameworks(stylingFrameworks, 'styling');
        detectFrameworks(databaseLibs, 'database');
        
        return framework;
    }

    /**
     * Analyze test coverage and testing setup
     * @returns {Promise<Object>} Test coverage analysis
     */
    async analyzeTestCoverage() {
        console.log(chalk.blue('   - Analyzing test coverage...'));
        
        const fs = require('fs');
        const coverage = {
            hasTests: false,
            testFiles: 0,
            coverageReports: [],
            testFrameworks: [],
            coverageThreshold: null,
            lastCoverageRun: null,
            summary: null
        };
        
        // Count test files using Node.js (cross-platform)
        try {
            coverage.testFiles = this.countTestFilesManually();
            coverage.hasTests = coverage.testFiles > 0;
        } catch (error) {
            coverage.testFiles = 0;
            coverage.hasTests = false;
        }
        
        // Check for coverage reports
        const coverageFiles = [
            'coverage/lcov-report/index.html',
            'coverage/index.html',
            'coverage.json',
            '.nyc_output'
        ];
        
        for (const file of coverageFiles) {
            if (fs.existsSync(file)) {
                coverage.coverageReports.push(file);
                
                // Try to get last modified time
                try {
                    const stats = fs.statSync(file);
                    if (!coverage.lastCoverageRun || stats.mtime > coverage.lastCoverageRun) {
                        coverage.lastCoverageRun = stats.mtime;
                    }
                } catch (error) {
                    // Ignore stat errors
                }
            }
        }
        
        // Try to read coverage summary
        if (fs.existsSync('coverage/coverage-summary.json')) {
            try {
                const summaryData = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
                coverage.summary = summaryData.total;
            } catch (error) {
                // Ignore JSON parse errors
            }
        }
        
        // Check package.json for test scripts and coverage config
        try {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            if (pkg.scripts) {
                if (pkg.scripts.test) coverage.testFrameworks.push('npm test');
                if (pkg.scripts['test:coverage']) coverage.testFrameworks.push('coverage script');
            }
            
            if (pkg.jest && pkg.jest.coverageThreshold) {
                coverage.coverageThreshold = pkg.jest.coverageThreshold;
            }
        } catch (error) {
            // Ignore package.json read errors
        }
        
        return coverage;
    }

    /**
     * Manually count test files as fallback
     * @returns {number} Number of test files
     */
    countTestFilesManually() {
        const fs = require('fs');
        const path = require('path');
        let count = 0;
        
        const countInDirectory = (dirPath) => {
            try {
                const items = fs.readdirSync(dirPath);
                
                for (const item of items) {
                    const fullPath = path.join(dirPath, item);
                    
                    if (this.shouldSkipPath(fullPath)) continue;
                    
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isDirectory()) {
                        countInDirectory(fullPath);
                    } else if (this.isTestFile(fullPath)) {
                        count++;
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };
        
        countInDirectory('.');
        return count;
    }

    /**
     * Analyze build system and tooling
     * @param {Object} configuration - Configuration analysis
     * @returns {Promise<Object>} Build system analysis
     */
    async analyzeBuildSystem(configuration) {
        const buildSystem = {
            bundler: null,
            taskRunner: null,
            packageManager: this.detectPackageManager(),
            scripts: [],
            buildOutput: null,
            hasCI: false
        };
        
        const pkg = configuration.packageJson;
        if (pkg && pkg.scripts) {
            buildSystem.scripts = Object.keys(pkg.scripts);
        }
        
        // Detect bundler
        if (configuration.webpack) buildSystem.bundler = 'webpack';
        else if (configuration.vite) buildSystem.bundler = 'vite';
        else if (pkg && pkg.devDependencies) {
            if (pkg.devDependencies.rollup) buildSystem.bundler = 'rollup';
            else if (pkg.devDependencies.parcel) buildSystem.bundler = 'parcel';
            else if (pkg.devDependencies.esbuild) buildSystem.bundler = 'esbuild';
        }
        
        // Detect task runner
        if (pkg && pkg.scripts) {
            if (pkg.scripts.build) buildSystem.taskRunner = 'npm scripts';
        }
        
        // Check for build output directories
        const fs = require('fs');
        const buildDirs = ['dist', 'build', '.next', 'out'];
        for (const dir of buildDirs) {
            if (fs.existsSync(dir)) {
                buildSystem.buildOutput = dir;
                break;
            }
        }
        
        // Check for CI configuration
        const ciFiles = ['.github/workflows', '.gitlab-ci.yml', 'Jenkinsfile', '.travis.yml'];
        buildSystem.hasCI = ciFiles.some(file => fs.existsSync(file));
        
        return buildSystem;
    }

    /**
     * Detect package manager used in the project
     * @returns {string} Package manager name
     */
    detectPackageManager() {
        const fs = require('fs');
        
        if (fs.existsSync('yarn.lock')) return 'yarn';
        if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
        if (fs.existsSync('package-lock.json')) return 'npm';
        if (fs.existsSync('bun.lockb')) return 'bun';
        
        return 'unknown';
    }

    /**
     * Detect Node.js version requirements
     * @param {Object} configuration - Configuration analysis
     * @returns {string|null} Node version requirement
     */
    detectNodeVersion(configuration) {
        const pkg = configuration.packageJson;
        
        if (pkg && pkg.engines && pkg.engines.node) {
            return pkg.engines.node;
        }
        
        // Check .nvmrc
        const fs = require('fs');
        if (fs.existsSync('.nvmrc')) {
            try {
                return fs.readFileSync('.nvmrc', 'utf8').trim();
            } catch (error) {
                return null;
            }
        }
        
        return null;
    }

    /**
     * Get comprehensive branch history including creation, merges, and divergence
     * @param {string} branchName - Current branch name
     * @returns {Promise<Object>} Branch history analysis
     */
    async getBranchHistory(branchName) {
        try {
            console.log(chalk.blue('   - Analyzing branch history...'));
            
            // Get branch creation point
            const creationPoint = execSync(`git merge-base origin/main ${branchName}`).toString().trim();
            const creationDate = execSync(`git show -s --format=%ci ${creationPoint}`).toString().trim();
            
            // Get all commits on this branch
            const branchCommits = execSync(`git log ${creationPoint}..${branchName} --oneline --no-merges`).toString().trim();
            const commitCount = branchCommits ? branchCommits.split('\n').length : 0;
            
            // Check for merge commits
            const mergeCommits = execSync(`git log ${creationPoint}..${branchName} --merges --oneline`).toString().trim();
            const mergeCount = mergeCommits ? mergeCommits.split('\n').length : 0;
            
            // Get branch age in days
            const ageInDays = Math.floor((Date.now() - new Date(creationDate).getTime()) / (1000 * 60 * 60 * 24));
            
            return {
                creationPoint,
                creationDate,
                commitCount,
                mergeCount,
                ageInDays,
                commits: branchCommits ? branchCommits.split('\n').map(line => {
                    const [hash, ...messageParts] = line.split(' ');
                    return { hash, message: messageParts.join(' ') };
                }) : []
            };
        } catch (error) {
            console.log(chalk.yellow('   - Warning: Could not analyze branch history'));
            return { error: error.message };
        }
    }

    /**
     * Analyze merge base and divergence from main branch
     * @param {string} branchName - Current branch name
     * @returns {Promise<Object>} Merge base analysis
     */
    async analyzeMergeBase(branchName) {
        try {
            console.log(chalk.blue('   - Analyzing merge base...'));
            
            const mergeBase = execSync(`git merge-base origin/main ${branchName}`).toString().trim();
            const mainHead = execSync('git rev-parse origin/main').toString().trim();
            
            // Count commits ahead and behind
            const aheadCount = execSync(`git rev-list --count ${mergeBase}..${branchName}`).toString().trim();
            const behindCount = execSync(`git rev-list --count ${mergeBase}..origin/main`).toString().trim();
            
            // Check if merge base is up to date
            const isUpToDate = mergeBase === mainHead;
            
            // Get commits that would be merged
            const commitsToMerge = execSync(`git log ${mergeBase}..${branchName} --oneline --no-merges`).toString().trim();
            
            return {
                mergeBase,
                mainHead,
                aheadCount: parseInt(aheadCount),
                behindCount: parseInt(behindCount),
                isUpToDate,
                needsRebase: parseInt(behindCount) > 0,
                commitsToMerge: commitsToMerge ? commitsToMerge.split('\n').length : 0
            };
        } catch (error) {
            console.log(chalk.yellow('   - Warning: Could not analyze merge base'));
            return { error: error.message };
        }
    }

    /**
     * Detect potential merge conflicts
     * @param {string} branchName - Current branch name
     * @returns {Promise<Object>} Conflict detection results
     */
    async detectConflicts(branchName) {
        try {
            console.log(chalk.blue('   - Detecting potential conflicts...'));
            
            // Check current merge conflicts
            let hasActiveConflicts = false;
            try {
                execSync('git diff --name-only --diff-filter=U', { stdio: 'pipe' });
            } catch (error) {
                const conflictFiles = error.stdout ? error.stdout.toString().trim() : '';
                hasActiveConflicts = conflictFiles.length > 0;
            }
            
            // Simulate merge to detect potential conflicts
            let potentialConflicts = [];
            try {
                // Create a temporary branch to test merge
                const tempBranch = `temp-merge-test-${Date.now()}`;
                execSync(`git checkout -b ${tempBranch} origin/main`, { stdio: 'pipe' });
                
                try {
                    execSync(`git merge --no-commit --no-ff ${branchName}`, { stdio: 'pipe' });
                    // If merge succeeds, no conflicts
                    execSync('git merge --abort', { stdio: 'pipe' });
                } catch (mergeError) {
                    // Merge failed, likely due to conflicts
                    const conflictOutput = mergeError.stderr ? mergeError.stderr.toString() : '';
                    if (conflictOutput.includes('CONFLICT')) {
                        potentialConflicts = this.parseConflictOutput(conflictOutput);
                    }
                    try {
                        execSync('git merge --abort', { stdio: 'pipe' });
                    } catch (abortError) {
                        // Ignore abort errors
                    }
                }
                
                // Switch back and delete temp branch
                execSync(`git checkout ${branchName}`, { stdio: 'pipe' });
                execSync(`git branch -D ${tempBranch}`, { stdio: 'pipe' });
                
            } catch (error) {
                // If we can't create temp branch, fall back to file-based analysis
                potentialConflicts = await this.analyzeFileConflicts(branchName);
            }
            
            return {
                hasActiveConflicts,
                potentialConflicts,
                conflictCount: potentialConflicts.length,
                riskLevel: this.assessConflictRisk(potentialConflicts.length)
            };
        } catch (error) {
            console.log(chalk.yellow('   - Warning: Could not detect conflicts'));
            return { error: error.message };
        }
    }

    /**
     * Parse conflict output from git merge
     * @param {string} conflictOutput - Git merge conflict output
     * @returns {Array} Array of conflict information
     */
    parseConflictOutput(conflictOutput) {
        const conflicts = [];
        const lines = conflictOutput.split('\n');
        
        for (const line of lines) {
            if (line.includes('CONFLICT')) {
                const match = line.match(/CONFLICT \((.+?)\): (.+)/);
                if (match) {
                    conflicts.push({
                        type: match[1],
                        file: match[2],
                        description: line
                    });
                }
            }
        }
        
        return conflicts;
    }

    /**
     * Analyze potential file conflicts based on changed files
     * @param {string} branchName - Current branch name
     * @returns {Promise<Array>} Array of potential conflicts
     */
    async analyzeFileConflicts(branchName) {
        try {
            // Get files changed in this branch
            const branchFiles = execSync(`git diff --name-only origin/main...${branchName}`).toString().trim().split('\n').filter(f => f);
            
            // Get files changed in main since branch creation
            const mergeBase = execSync(`git merge-base origin/main ${branchName}`).toString().trim();
            const mainFiles = execSync(`git diff --name-only ${mergeBase}..origin/main`).toString().trim().split('\n').filter(f => f);
            
            // Find overlapping files
            const overlappingFiles = branchFiles.filter(file => mainFiles.includes(file));
            
            return overlappingFiles.map(file => ({
                type: 'content',
                file,
                description: `File modified in both branches: ${file}`
            }));
        } catch (error) {
            return [];
        }
    }

    /**
     * Assess conflict risk level
     * @param {number} conflictCount - Number of potential conflicts
     * @returns {string} Risk level
     */
    assessConflictRisk(conflictCount) {
        if (conflictCount === 0) return 'low';
        if (conflictCount <= 2) return 'medium';
        return 'high';
    }

    /**
     * Analyze commit messages for conventional commit compliance and quality
     * @param {string} branchName - Current branch name
     * @returns {Promise<Object>} Commit message analysis
     */
    async analyzeCommitMessages(branchName) {
        try {
            console.log(chalk.blue('   - Analyzing commit messages...'));
            
            const commits = this.getRecentCommits(branchName);
            const analysis = {
                totalCommits: commits.length,
                conventionalCommits: 0,
                nonConventionalCommits: 0,
                commitTypes: {},
                issues: [],
                suggestions: []
            };
            
            const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?: .+/;
            const breakingChangePattern = /BREAKING CHANGE:|!/;
            
            for (const commit of commits) {
                const message = commit.message;
                
                if (conventionalPattern.test(message)) {
                    analysis.conventionalCommits++;
                    
                    // Extract commit type
                    const typeMatch = message.match(/^([^(:]+)/);
                    if (typeMatch) {
                        const type = typeMatch[1];
                        analysis.commitTypes[type] = (analysis.commitTypes[type] || 0) + 1;
                    }
                    
                    // Check for breaking changes
                    if (breakingChangePattern.test(message)) {
                        analysis.issues.push({
                            commit: commit.hash,
                            type: 'breaking_change',
                            message: 'Breaking change detected'
                        });
                    }
                } else {
                    analysis.nonConventionalCommits++;
                    analysis.issues.push({
                        commit: commit.hash,
                        type: 'non_conventional',
                        message: `Non-conventional commit: "${message}"`
                    });
                }
                
                // Check for common issues
                if (message.length < 10) {
                    analysis.issues.push({
                        commit: commit.hash,
                        type: 'too_short',
                        message: 'Commit message too short'
                    });
                }
                
                if (message.length > 72) {
                    analysis.issues.push({
                        commit: commit.hash,
                        type: 'too_long',
                        message: 'Commit message too long'
                    });
                }
            }
            
            // Generate suggestions
            if (analysis.nonConventionalCommits > 0) {
                analysis.suggestions.push('Consider using conventional commit format (feat:, fix:, docs:, etc.)');
            }
            
            if (analysis.issues.some(i => i.type === 'breaking_change')) {
                analysis.suggestions.push('Breaking changes detected - ensure proper versioning and documentation');
            }
            
            return analysis;
        } catch (error) {
            console.log(chalk.yellow('   - Warning: Could not analyze commit messages'));
            return { error: error.message };
        }
    }

    /**
     * Validate branch naming conventions
     * @param {string} branchName - Current branch name
     * @returns {Object} Branch naming validation results
     */
    validateBranchNaming(branchName) {
        console.log(chalk.blue('   - Validating branch naming...'));
        
        const validation = {
            branchName,
            isValid: true,
            issues: [],
            suggestions: [],
            conventions: {
                hasTicketId: false,
                hasType: false,
                hasDescription: false,
                followsKebabCase: false
            }
        };
        
        // Check for ticket ID (Linear format)
        const ticketPattern = /[A-Z]+-\d+/;
        if (ticketPattern.test(branchName)) {
            validation.conventions.hasTicketId = true;
        } else {
            validation.issues.push('Missing ticket ID (e.g., TIX-123)');
            validation.suggestions.push('Include Linear ticket ID in branch name');
            validation.isValid = false;
        }
        
        // Check for branch type prefix
        const typePattern = /^(feature|feat|fix|hotfix|bugfix|chore|docs|refactor|test)[\/-]/i;
        if (typePattern.test(branchName)) {
            validation.conventions.hasType = true;
        } else {
            validation.issues.push('Missing branch type prefix');
            validation.suggestions.push('Use prefixes like feature/, fix/, hotfix/, etc.');
        }
        
        // Check for descriptive name
        const parts = branchName.split(/[\/-]/);
        const hasDescription = parts.some(part => part.length > 3 && !/^[A-Z]+-\d+$/.test(part));
        if (hasDescription) {
            validation.conventions.hasDescription = true;
        } else {
            validation.issues.push('Missing descriptive name');
            validation.suggestions.push('Add descriptive words about the change');
        }
        
        // Check for kebab-case
        const kebabPattern = /^[a-z0-9-\/]+$/;
        if (kebabPattern.test(branchName.toLowerCase())) {
            validation.conventions.followsKebabCase = true;
        } else {
            validation.issues.push('Not in kebab-case format');
            validation.suggestions.push('Use lowercase letters, numbers, and hyphens only');
        }
        
        // Check length
        if (branchName.length > 50) {
            validation.issues.push('Branch name too long');
            validation.suggestions.push('Keep branch names under 50 characters');
            validation.isValid = false;
        }
        
        // Check for invalid characters
        const invalidChars = branchName.match(/[^a-zA-Z0-9\-\/]/g);
        if (invalidChars) {
            validation.issues.push(`Invalid characters: ${invalidChars.join(', ')}`);
            validation.suggestions.push('Use only letters, numbers, hyphens, and forward slashes');
            validation.isValid = false;
        }
        
        return validation;
    }

    /**
     * Gather Linear ticket context from branch name
     * @param {string} branchName - Current branch name
     * @returns {Object} Linear context
     */
    gatherLinearContext(branchName) {
        console.log(chalk.blue(`   - Parsing branch name "${branchName}"...`));
        const ticketIdMatch = branchName.match(/([A-Z]+-\d+)/);
        
        if (!ticketIdMatch) {
            throw new Error(`Could not find a Linear ticket ID (e.g., TIX-123) in branch "${branchName}".`);
        }
        
        const linearTicketId = ticketIdMatch[0];
        console.log(chalk.green(`   - Found Linear Ticket: ${linearTicketId}`));

        return {
            ticketId: linearTicketId,
            ticketData: null, // Will be populated by Linear workflow
            projectData: null
        };
    }
}

module.exports = ContextAnalyzer;