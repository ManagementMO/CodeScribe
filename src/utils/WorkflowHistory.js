const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Workflow execution history and replay functionality
 */
class WorkflowHistory {
    constructor(options = {}) {
        this.historyDir = options.historyDir || path.join(process.cwd(), '.codescribe', 'history');
        this.maxHistoryEntries = options.maxHistoryEntries || 100;
        this.enableHistory = options.enableHistory !== false;
        
        this.initializeHistory();
    }
    
    /**
     * Initialize history directory
     */
    async initializeHistory() {
        if (!this.enableHistory) return;
        
        try {
            await fs.mkdir(this.historyDir, { recursive: true });
        } catch (error) {
            console.error('Failed to initialize history directory:', error.message);
        }
    }
    
    /**
     * Record workflow execution
     */
    async recordExecution(workflowData) {
        if (!this.enableHistory) return null;
        
        try {
            const executionId = this.generateExecutionId();
            const timestamp = new Date().toISOString();
            
            const historyEntry = {
                id: executionId,
                timestamp: timestamp,
                command: workflowData.command,
                options: workflowData.options,
                context: this.sanitizeContext(workflowData.context),
                workflows: workflowData.workflows.map(w => w.name),
                results: workflowData.results,
                duration: workflowData.duration,
                success: workflowData.success,
                error: workflowData.error
            };
            
            const historyFile = path.join(this.historyDir, `${executionId}.json`);
            await fs.writeFile(historyFile, JSON.stringify(historyEntry, null, 2));
            
            // Clean up old entries
            await this.cleanupHistory();
            
            return executionId;
        } catch (error) {
            console.error('Failed to record workflow execution:', error.message);
            return null;
        }
    }
    
    /**
     * Get workflow execution history
     */
    async getHistory(limit = 20) {
        if (!this.enableHistory) return [];
        
        try {
            const files = await fs.readdir(this.historyDir);
            const historyFiles = files
                .filter(file => file.endsWith('.json'))
                .sort((a, b) => b.localeCompare(a)) // Sort by filename (timestamp-based)
                .slice(0, limit);
            
            const history = [];
            for (const file of historyFiles) {
                try {
                    const content = await fs.readFile(path.join(this.historyDir, file), 'utf8');
                    const entry = JSON.parse(content);
                    history.push(entry);
                } catch (error) {
                    console.error(`Failed to read history file ${file}:`, error.message);
                }
            }
            
            return history;
        } catch (error) {
            console.error('Failed to get workflow history:', error.message);
            return [];
        }
    }
    
    /**
     * Get specific execution details
     */
    async getExecution(executionId) {
        if (!this.enableHistory) return null;
        
        try {
            const historyFile = path.join(this.historyDir, `${executionId}.json`);
            const content = await fs.readFile(historyFile, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`Failed to get execution ${executionId}:`, error.message);
            return null;
        }
    }
    
    /**
     * Replay a previous workflow execution
     */
    async replayExecution(executionId, options = {}) {
        const execution = await this.getExecution(executionId);
        if (!execution) {
            throw new Error(`Execution ${executionId} not found`);
        }
        
        console.log(`🔄 Replaying execution from ${execution.timestamp}`);
        console.log(`   Command: ${execution.command}`);
        console.log(`   Workflows: ${execution.workflows.join(', ')}`);
        
        // Merge original options with replay options
        const replayOptions = {
            ...execution.options,
            ...options,
            isReplay: true,
            originalExecutionId: executionId
        };
        
        return {
            command: execution.command,
            options: replayOptions,
            originalContext: execution.context
        };
    }
    
    /**
     * Get execution statistics
     */
    async getStats() {
        const history = await this.getHistory(this.maxHistoryEntries);
        
        const stats = {
            totalExecutions: history.length,
            successfulExecutions: history.filter(h => h.success).length,
            failedExecutions: history.filter(h => !h.success).length,
            averageDuration: 0,
            mostUsedCommands: {},
            mostUsedWorkflows: {},
            recentActivity: history.slice(0, 10)
        };
        
        // Calculate average duration
        const durationsSum = history.reduce((sum, h) => sum + (h.duration || 0), 0);
        stats.averageDuration = history.length > 0 ? Math.round(durationsSum / history.length) : 0;
        
        // Count command usage
        history.forEach(h => {
            stats.mostUsedCommands[h.command] = (stats.mostUsedCommands[h.command] || 0) + 1;
            h.workflows.forEach(w => {
                stats.mostUsedWorkflows[w] = (stats.mostUsedWorkflows[w] || 0) + 1;
            });
        });
        
        return stats;
    }
    
    /**
     * Clean up old history entries
     */
    async cleanupHistory() {
        try {
            const files = await fs.readdir(this.historyDir);
            const historyFiles = files
                .filter(file => file.endsWith('.json'))
                .sort((a, b) => b.localeCompare(a)); // Sort by filename (newest first)
            
            if (historyFiles.length > this.maxHistoryEntries) {
                const filesToDelete = historyFiles.slice(this.maxHistoryEntries);
                
                for (const file of filesToDelete) {
                    await fs.unlink(path.join(this.historyDir, file));
                }
            }
        } catch (error) {
            console.error('Failed to cleanup history:', error.message);
        }
    }
    
    /**
     * Generate unique execution ID
     */
    generateExecutionId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `${timestamp}-${random}`;
    }
    
    /**
     * Sanitize context to remove sensitive information
     */
    sanitizeContext(context) {
        const sanitized = JSON.parse(JSON.stringify(context));
        
        // Remove sensitive data
        if (sanitized.git) {
            delete sanitized.git.remoteUrl; // May contain tokens
        }
        
        if (sanitized.linear) {
            delete sanitized.linear.apiKey;
        }
        
        if (sanitized.github) {
            delete sanitized.github.token;
        }
        
        return sanitized;
    }
    
    /**
     * Export history to file
     */
    async exportHistory(outputFile) {
        const history = await this.getHistory(this.maxHistoryEntries);
        const stats = await this.getStats();
        
        const exportData = {
            exportDate: new Date().toISOString(),
            stats: stats,
            history: history
        };
        
        await fs.writeFile(outputFile, JSON.stringify(exportData, null, 2));
        return exportData;
    }
    
    /**
     * Search history by criteria
     */
    async searchHistory(criteria = {}) {
        const history = await this.getHistory(this.maxHistoryEntries);
        
        return history.filter(entry => {
            if (criteria.command && entry.command !== criteria.command) return false;
            if (criteria.success !== undefined && entry.success !== criteria.success) return false;
            if (criteria.workflow && !entry.workflows.includes(criteria.workflow)) return false;
            if (criteria.since && new Date(entry.timestamp) < new Date(criteria.since)) return false;
            if (criteria.until && new Date(entry.timestamp) > new Date(criteria.until)) return false;
            
            return true;
        });
    }
}

module.exports = WorkflowHistory;