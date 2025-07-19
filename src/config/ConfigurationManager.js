const fs = require('fs');
const path = require('path');

/**
 * Configuration Manager - Handles user preferences, project settings, and workflow configurations
 */
class ConfigurationManager {
    constructor(initialConfig = {}) {
        this.config = this.mergeWithDefaults(initialConfig);
        this.configPath = this.findConfigFile();
        
        // Load configuration from file if it exists
        if (this.configPath) {
            this.loadFromFile();
        }
    }

    /**
     * Get default configuration
     * @returns {Object} Default configuration object
     */
    getDefaults() {
        return {
            workflows: {
                github: { 
                    enabled: true, 
                    templates: 'default',
                    createDraft: true,
                    autoAssignReviewers: false
                },
                linear: { 
                    enabled: true, 
                    autoTransition: true,
                    addComments: true,
                    trackTime: false
                },
                documentation: { 
                    enabled: false, 
                    formats: ['mermaid', 'markdown'],
                    autoGenerate: false
                },
                quality: { 
                    enabled: false, 
                    thresholds: { 
                        complexity: 10,
                        maintainability: 70
                    }
                }
            },
            ai: {
                provider: 'gemini',
                model: 'gemini-1.5-flash',
                maxRetries: 3,
                fallback: true
            },
            notifications: {
                slack: { enabled: false },
                email: { enabled: false },
                teams: { enabled: false }
            },
            git: {
                autoPush: true,
                defaultBranch: 'main',
                conventionalCommits: true
            },
            logging: {
                level: 'info',
                file: false,
                console: true
            }
        };
    }

    /**
     * Merge user config with defaults
     * @param {Object} userConfig - User-provided configuration
     * @returns {Object} Merged configuration
     */
    mergeWithDefaults(userConfig) {
        return this.deepMerge(this.getDefaults(), userConfig);
    }

    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Find configuration file in current directory or parent directories
     * @returns {string|null} Path to configuration file or null if not found
     */
    findConfigFile() {
        const configNames = [
            '.codescribe.json',
            '.codescribe.js',
            'codescribe.config.json',
            'codescribe.config.js'
        ];

        let currentDir = process.cwd();
        
        while (currentDir !== path.dirname(currentDir)) {
            for (const configName of configNames) {
                const configPath = path.join(currentDir, configName);
                if (fs.existsSync(configPath)) {
                    return configPath;
                }
            }
            currentDir = path.dirname(currentDir);
        }

        return null;
    }

    /**
     * Load configuration from file
     */
    loadFromFile() {
        try {
            if (this.configPath.endsWith('.js')) {
                // Clear require cache to allow reloading
                delete require.cache[require.resolve(this.configPath)];
                const fileConfig = require(this.configPath);
                this.config = this.mergeWithDefaults(fileConfig);
            } else {
                const fileContent = fs.readFileSync(this.configPath, 'utf8');
                const fileConfig = JSON.parse(fileContent);
                this.config = this.mergeWithDefaults(fileConfig);
            }
        } catch (error) {
            console.warn(`Warning: Could not load configuration from ${this.configPath}: ${error.message}`);
        }
    }

    /**
     * Get configuration value by path
     * @param {string} path - Dot-separated path to configuration value
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }

    /**
     * Set configuration value by path
     * @param {string} path - Dot-separated path to configuration value
     * @param {*} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    /**
     * Update configuration with new values
     * @param {Object} updates - Configuration updates
     */
    update(updates) {
        this.config = this.deepMerge(this.config, updates);
    }

    /**
     * Get all configuration
     * @returns {Object} Complete configuration object
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Save configuration to file
     * @param {string} filePath - Optional file path (uses current config path if not provided)
     */
    saveToFile(filePath = null) {
        const targetPath = filePath || this.configPath || path.join(process.cwd(), '.codescribe.json');
        
        try {
            const configContent = JSON.stringify(this.config, null, 2);
            fs.writeFileSync(targetPath, configContent, 'utf8');
            this.configPath = targetPath;
        } catch (error) {
            throw new Error(`Could not save configuration to ${targetPath}: ${error.message}`);
        }
    }

    /**
     * Reset configuration to defaults
     */
    reset() {
        this.config = this.getDefaults();
    }

    /**
     * Validate configuration
     * @returns {Array} Array of validation errors (empty if valid)
     */
    validate() {
        const errors = [];
        
        // Validate required fields based on enabled workflows
        if (this.get('workflows.github.enabled') && !process.env.GITHUB_TOKEN && !this.get('github.token')) {
            errors.push('GitHub workflow is enabled but no GitHub token is configured');
        }
        
        if (this.get('workflows.linear.enabled') && !process.env.LINEAR_API_KEY && !this.get('linear.apiKey')) {
            errors.push('Linear workflow is enabled but no Linear API key is configured');
        }
        
        if (this.get('ai.provider') === 'gemini' && !process.env.GEMINI_API_KEY && !this.get('ai.gemini.apiKey')) {
            errors.push('Gemini AI provider is configured but no API key is available');
        }
        
        return errors;
    }
}

module.exports = ConfigurationManager;