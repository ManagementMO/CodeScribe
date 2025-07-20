const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

/**
 * Comprehensive logging system with different verbosity levels
 */
class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info'; // debug, info, warn, error
        this.logFile = options.logFile || path.join(process.cwd(), '.codescribe', 'logs', 'codescribe.log');
        this.enableConsole = options.enableConsole !== false;
        this.enableFile = options.enableFile !== false;
        this.maxLogFiles = options.maxLogFiles || 10;
        this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB
        
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        this.colors = {
            debug: chalk.gray,
            info: chalk.blue,
            warn: chalk.yellow,
            error: chalk.red
        };
        
        this.icons = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌'
        };
        
        this.initializeLogFile();
    }
    
    /**
     * Initialize log file and directory
     */
    async initializeLogFile() {
        if (!this.enableFile) return;
        
        try {
            const logDir = path.dirname(this.logFile);
            await fs.mkdir(logDir, { recursive: true });
            
            // Rotate logs if needed
            await this.rotateLogs();
        } catch (error) {
            console.error('Failed to initialize log file:', error.message);
        }
    }
    
    /**
     * Rotate log files when they get too large
     */
    async rotateLogs() {
        try {
            const stats = await fs.stat(this.logFile).catch(() => null);
            if (!stats || stats.size < this.maxLogSize) return;
            
            // Rotate existing logs
            for (let i = this.maxLogFiles - 1; i > 0; i--) {
                const oldFile = `${this.logFile}.${i}`;
                const newFile = `${this.logFile}.${i + 1}`;
                
                try {
                    await fs.rename(oldFile, newFile);
                } catch (error) {
                    // File doesn't exist, continue
                }
            }
            
            // Move current log to .1
            await fs.rename(this.logFile, `${this.logFile}.1`);
        } catch (error) {
            console.error('Failed to rotate logs:', error.message);
        }
    }
    
    /**
     * Check if a log level should be output
     */
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.level];
    }
    
    /**
     * Format log message
     */
    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }
    
    /**
     * Write to log file
     */
    async writeToFile(formattedMessage) {
        if (!this.enableFile) return;
        
        try {
            await fs.appendFile(this.logFile, formattedMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }
    
    /**
     * Log debug message
     */
    debug(message, meta = {}) {
        if (!this.shouldLog('debug')) return;
        
        const formattedMessage = this.formatMessage('debug', message, meta);
        
        if (this.enableConsole) {
            console.log(this.colors.debug(`${this.icons.debug} ${message}`));
        }
        
        this.writeToFile(formattedMessage);
    }
    
    /**
     * Log info message
     */
    info(message, meta = {}) {
        if (!this.shouldLog('info')) return;
        
        const formattedMessage = this.formatMessage('info', message, meta);
        
        if (this.enableConsole) {
            console.log(this.colors.info(`${this.icons.info} ${message}`));
        }
        
        this.writeToFile(formattedMessage);
    }
    
    /**
     * Log warning message
     */
    warn(message, meta = {}) {
        if (!this.shouldLog('warn')) return;
        
        const formattedMessage = this.formatMessage('warn', message, meta);
        
        if (this.enableConsole) {
            console.warn(this.colors.warn(`${this.icons.warn} ${message}`));
        }
        
        this.writeToFile(formattedMessage);
    }
    
    /**
     * Log error message
     */
    error(message, meta = {}) {
        if (!this.shouldLog('error')) return;
        
        const formattedMessage = this.formatMessage('error', message, meta);
        
        if (this.enableConsole) {
            console.error(this.colors.error(`${this.icons.error} ${message}`));
        }
        
        this.writeToFile(formattedMessage);
    }
    
    /**
     * Log workflow start
     */
    workflowStart(workflowName, context = {}) {
        this.info(`Starting workflow: ${workflowName}`, {
            workflow: workflowName,
            context: {
                branch: context.git?.branch,
                hasChanges: context.git?.hasChanges,
                ticketId: context.linear?.ticketId
            }
        });
    }
    
    /**
     * Log workflow completion
     */
    workflowComplete(workflowName, results = {}) {
        this.info(`Completed workflow: ${workflowName}`, {
            workflow: workflowName,
            results: results
        });
    }
    
    /**
     * Log workflow error
     */
    workflowError(workflowName, error) {
        this.error(`Workflow failed: ${workflowName}`, {
            workflow: workflowName,
            error: error.message,
            stack: error.stack
        });
    }
    
    /**
     * Create a child logger with additional context
     */
    child(context = {}) {
        const childLogger = Object.create(this);
        childLogger.context = { ...this.context, ...context };
        return childLogger;
    }
    
    /**
     * Get log file path
     */
    getLogFile() {
        return this.logFile;
    }
    
    /**
     * Get recent log entries
     */
    async getRecentLogs(lines = 100) {
        try {
            const content = await fs.readFile(this.logFile, 'utf8');
            const logLines = content.split('\n').filter(line => line.trim());
            return logLines.slice(-lines);
        } catch (error) {
            return [];
        }
    }
}

module.exports = Logger;