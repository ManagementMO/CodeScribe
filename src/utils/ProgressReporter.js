const chalk = require('chalk');
const cliProgress = require('cli-progress');

/**
 * Progress reporting system for long-running workflows
 */
class ProgressReporter {
    constructor(options = {}) {
        this.enableProgress = options.enableProgress !== false;
        this.enableSpinner = options.enableSpinner !== false;
        this.verbose = options.verbose || false;
        
        this.progressBar = null;
        this.spinner = null;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.stepDetails = [];
        
        // Initialize progress bar
        if (this.enableProgress) {
            this.progressBar = new cliProgress.SingleBar({
                format: chalk.cyan('{bar}') + ' | {percentage}% | {value}/{total} | {step}',
                barCompleteChar: '█',
                barIncompleteChar: '░',
                hideCursor: true
            });
        }
    }
    
    /**
     * Start progress tracking
     */
    start(totalSteps, initialMessage = 'Starting workflow...') {
        this.totalSteps = totalSteps;
        this.currentStep = 0;
        this.stepDetails = [];
        
        if (this.enableProgress && this.progressBar) {
            this.progressBar.start(totalSteps, 0, {
                step: initialMessage
            });
        } else {
            console.log(chalk.cyan(`🚀 ${initialMessage}`));
        }
    }
    
    /**
     * Update progress to next step
     */
    nextStep(stepName, details = {}) {
        this.currentStep++;
        this.stepDetails.push({
            step: this.currentStep,
            name: stepName,
            details: details,
            timestamp: new Date().toISOString(),
            duration: null
        });
        
        if (this.enableProgress && this.progressBar) {
            this.progressBar.update(this.currentStep, {
                step: stepName
            });
        } else {
            const percentage = Math.round((this.currentStep / this.totalSteps) * 100);
            console.log(chalk.blue(`   [${percentage}%] ${stepName}`));
        }
        
        if (this.verbose && Object.keys(details).length > 0) {
            console.log(chalk.gray(`      Details: ${JSON.stringify(details, null, 2)}`));
        }
    }
    
    /**
     * Complete current step with timing
     */
    completeStep(duration = null) {
        if (this.stepDetails.length > 0) {
            const lastStep = this.stepDetails[this.stepDetails.length - 1];
            lastStep.duration = duration;
            
            if (this.verbose && duration) {
                console.log(chalk.gray(`      Completed in ${duration}ms`));
            }
        }
    }
    
    /**
     * Update current step with additional information
     */
    updateStep(message, details = {}) {
        if (this.enableProgress && this.progressBar) {
            this.progressBar.update(this.currentStep, {
                step: message
            });
        } else if (!this.enableProgress) {
            console.log(chalk.gray(`      ${message}`));
        }
        
        if (this.verbose && Object.keys(details).length > 0) {
            console.log(chalk.gray(`      ${JSON.stringify(details, null, 2)}`));
        }
    }
    
    /**
     * Complete progress tracking
     */
    complete(finalMessage = 'Workflow completed successfully!') {
        if (this.enableProgress && this.progressBar) {
            this.progressBar.update(this.totalSteps, {
                step: finalMessage
            });
            this.progressBar.stop();
        } else {
            console.log(chalk.green(`✅ ${finalMessage}`));
        }
        
        if (this.verbose) {
            this.showSummary();
        }
    }
    
    /**
     * Handle error and stop progress
     */
    error(errorMessage, error = null) {
        if (this.enableProgress && this.progressBar) {
            this.progressBar.stop();
        }
        
        console.log(chalk.red(`❌ ${errorMessage}`));
        
        if (this.verbose && error) {
            console.log(chalk.red(`   Error details: ${error.message}`));
            if (error.stack) {
                console.log(chalk.gray(error.stack));
            }
        }
    }
    
    /**
     * Show workflow summary
     */
    showSummary() {
        console.log(chalk.cyan.bold('\n📊 Workflow Summary:'));
        
        const totalDuration = this.stepDetails.reduce((sum, step) => {
            return sum + (step.duration || 0);
        }, 0);
        
        console.log(chalk.blue(`   Total steps: ${this.stepDetails.length}`));
        console.log(chalk.blue(`   Total duration: ${totalDuration}ms`));
        console.log('');
        
        this.stepDetails.forEach((step, index) => {
            const duration = step.duration ? ` (${step.duration}ms)` : '';
            console.log(chalk.gray(`   ${index + 1}. ${step.name}${duration}`));
            
            if (Object.keys(step.details).length > 0) {
                Object.entries(step.details).forEach(([key, value]) => {
                    console.log(chalk.gray(`      ${key}: ${value}`));
                });
            }
        });
        console.log('');
    }
    
    /**
     * Start a spinner for indeterminate progress
     */
    startSpinner(message = 'Processing...') {
        if (!this.enableSpinner) {
            console.log(chalk.blue(`   ${message}`));
            return;
        }
        
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let frameIndex = 0;
        
        this.spinner = setInterval(() => {
            process.stdout.write(`\r${chalk.cyan(frames[frameIndex])} ${message}`);
            frameIndex = (frameIndex + 1) % frames.length;
        }, 100);
    }
    
    /**
     * Stop spinner
     */
    stopSpinner(finalMessage = null) {
        if (this.spinner) {
            clearInterval(this.spinner);
            this.spinner = null;
            process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear line
            
            if (finalMessage) {
                console.log(chalk.green(`✅ ${finalMessage}`));
            }
        }
    }
    
    /**
     * Get progress statistics
     */
    getStats() {
        return {
            currentStep: this.currentStep,
            totalSteps: this.totalSteps,
            percentage: Math.round((this.currentStep / this.totalSteps) * 100),
            stepDetails: this.stepDetails,
            isComplete: this.currentStep >= this.totalSteps
        };
    }
    
    /**
     * Create a sub-progress reporter for nested operations
     */
    createSubProgress(steps, parentStepName) {
        const subReporter = new ProgressReporter({
            enableProgress: false, // Disable progress bar for sub-operations
            enableSpinner: this.enableSpinner,
            verbose: this.verbose
        });
        
        // Update parent when sub-progress completes
        const originalComplete = subReporter.complete.bind(subReporter);
        subReporter.complete = (message) => {
            originalComplete(message);
            this.updateStep(`${parentStepName} - ${message}`);
        };
        
        return subReporter;
    }
}

module.exports = ProgressReporter;