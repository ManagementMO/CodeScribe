/**
 * Code Health Monitor - Experimental Feature
 * Real-time monitoring and analysis of codebase health metrics
 */

class CodeHealthMonitor {
  constructor() {
    this.healthIndicators = ['💀', '🤒', '😷', '😐', '😊', '💪'];
    this.healthHistory = [];
    this.alerts = [];
    this.thresholds = {
      criticalComplexity: 15,
      warningComplexity: 10,
      maxFileSize: 500,
      duplicateThreshold: 0.3,
      testCoverageMin: 70
    };
  }

  /**
   * Analyze overall codebase health
   * @param {object} codeMetrics - Code analysis metrics
   * @returns {object} Health assessment
   */
  analyzeCodeHealth(codeMetrics) {
    const {
      cyclomaticComplexity = 5,
      linesOfCode = 100,
      duplicateCodePercentage = 0.1,
      testCoverage = 80,
      technicalDebtHours = 2,
      codeSmells = 3,
      securityVulnerabilities = 0,
      performanceIssues = 1
    } = codeMetrics;

    let healthScore = 5; // Start with perfect health

    // Analyze complexity
    if (cyclomaticComplexity > this.thresholds.criticalComplexity) {
      healthScore -= 2;
      this.addAlert('🚨 Critical complexity detected', 'high');
    } else if (cyclomaticComplexity > this.thresholds.warningComplexity) {
      healthScore -= 1;
      this.addAlert('⚠️ High complexity warning', 'medium');
    }

    // Check file size
    if (linesOfCode > this.thresholds.maxFileSize) {
      healthScore -= 1;
      this.addAlert('📄 Large file detected - consider splitting', 'medium');
    }

    // Duplicate code analysis
    if (duplicateCodePercentage > this.thresholds.duplicateThreshold) {
      healthScore -= 1;
      this.addAlert('🔄 High code duplication detected', 'medium');
    }

    // Test coverage check
    if (testCoverage < this.thresholds.testCoverageMin) {
      healthScore -= 1;
      this.addAlert('🧪 Low test coverage detected', 'high');
    }

    // Security and performance
    if (securityVulnerabilities > 0) {
      healthScore -= 2;
      this.addAlert('🔒 Security vulnerabilities found', 'critical');
    }

    if (performanceIssues > 3) {
      healthScore -= 1;
      this.addAlert('⚡ Performance issues detected', 'medium');
    }

    // Technical debt factor
    if (technicalDebtHours > 8) {
      healthScore -= 1;
      this.addAlert('💳 High technical debt accumulation', 'medium');
    }

    // Clamp health score
    healthScore = Math.max(0, Math.min(5, healthScore));
    
    const healthLevel = this.healthIndicators[healthScore];
    const assessment = this.generateHealthAssessment(healthScore, codeMetrics);
    
    this.recordHealthMetrics(healthLevel, codeMetrics, assessment);
    
    return {
      level: healthLevel,
      score: healthScore,
      percentage: Math.round((healthScore / 5) * 100),
      assessment,
      alerts: this.getActiveAlerts(),
      recommendations: this.getHealthRecommendations(healthScore)
    };
  }

  /**
   * Generate health assessment message
   * @param {number} score - Health score
   * @param {object} metrics - Code metrics
   * @returns {string} Assessment message
   */
  generateHealthAssessment(score, metrics) {
    const assessments = {
      0: 'Critical health issues detected! Immediate attention required.',
      1: 'Poor code health. Multiple issues need addressing.',
      2: 'Below average health. Several improvements needed.',
      3: 'Fair code health. Some optimization opportunities exist.',
      4: 'Good code health! Minor improvements possible.',
      5: 'Excellent code health! Codebase is in great shape.'
    };

    let assessment = assessments[score];

    // Add specific insights
    if (metrics.testCoverage > 90) {
      assessment += ' Excellent test coverage maintained.';
    }
    if (metrics.securityVulnerabilities === 0) {
      assessment += ' No security vulnerabilities detected.';
    }
    if (metrics.duplicateCodePercentage < 0.1) {
      assessment += ' Low code duplication - great job!';
    }

    return assessment;
  }

  /**
   * Add health alert
   * @param {string} message - Alert message
   * @param {string} severity - Alert severity
   */
  addAlert(message, severity) {
    this.alerts.push({
      message,
      severity,
      timestamp: new Date().toISOString(),
      id: Date.now()
    });

    // Keep only recent alerts
    if (this.alerts.length > 20) {
      this.alerts.shift();
    }
  }

  /**
   * Get active alerts by severity
   * @returns {object} Categorized alerts
   */
  getActiveAlerts() {
    const now = new Date();
    const recentAlerts = this.alerts.filter(alert => {
      const alertTime = new Date(alert.timestamp);
      return (now - alertTime) < 24 * 60 * 60 * 1000; // Last 24 hours
    });

    return {
      critical: recentAlerts.filter(a => a.severity === 'critical'),
      high: recentAlerts.filter(a => a.severity === 'high'),
      medium: recentAlerts.filter(a => a.severity === 'medium'),
      low: recentAlerts.filter(a => a.severity === 'low')
    };
  }

  /**
   * Record health metrics in history
   * @param {string} level - Health level emoji
   * @param {object} metrics - Code metrics
   * @param {string} assessment - Assessment text
   */
  recordHealthMetrics(level, metrics, assessment) {
    this.healthHistory.push({
      level,
      metrics,
      assessment,
      timestamp: new Date().toISOString(),
      date: new Date().toDateString()
    });

    // Keep last 30 days
    if (this.healthHistory.length > 30) {
      this.healthHistory.shift();
    }
  }

  /**
   * Get health improvement recommendations
   * @param {number} score - Current health score
   * @returns {array} Recommendations
   */
  getHealthRecommendations(score) {
    const recommendations = {
      0: [
        'Immediate code review and refactoring required',
        'Address all security vulnerabilities immediately',
        'Implement comprehensive testing strategy',
        'Consider architectural redesign for critical components'
      ],
      1: [
        'Prioritize fixing high-complexity functions',
        'Increase test coverage to minimum 70%',
        'Address security vulnerabilities',
        'Reduce code duplication through refactoring'
      ],
      2: [
        'Focus on reducing cyclomatic complexity',
        'Improve test coverage incrementally',
        'Eliminate code smells and technical debt',
        'Implement code quality gates in CI/CD'
      ],
      3: [
        'Continue improving test coverage',
        'Regular refactoring sessions',
        'Monitor performance metrics',
        'Establish code review best practices'
      ],
      4: [
        'Maintain current quality standards',
        'Consider advanced testing strategies',
        'Optimize performance where possible',
        'Share best practices with team'
      ],
      5: [
        'Excellent work! Maintain current practices',
        'Consider mentoring other teams',
        'Explore cutting-edge quality tools',
        'Document successful patterns for reuse'
      ]
    };

    return recommendations[score] || ['Keep monitoring code health!'];
  }

  /**
   * Generate comprehensive health report
   * @returns {string} Formatted health report
   */
  generateHealthReport() {
    if (this.healthHistory.length === 0) {
      return 'No health data available. Start monitoring to see insights!';
    }

    const latest = this.healthHistory[this.healthHistory.length - 1];
    const weeklyData = this.healthHistory.slice(-7);
    const trend = this.calculateHealthTrend(weeklyData);
    const alerts = this.getActiveAlerts();

    return `
🏥 Code Health Monitor Report
=============================
Current Health: ${latest.level} (${latest.assessment})
Health Score: ${Math.round((this.healthIndicators.indexOf(latest.level) / 5) * 100)}%
Weekly Trend: ${trend.direction} ${trend.emoji}

🚨 Active Alerts:
${alerts.critical.length > 0 ? `Critical: ${alerts.critical.length}` : ''}
${alerts.high.length > 0 ? `High: ${alerts.high.length}` : ''}
${alerts.medium.length > 0 ? `Medium: ${alerts.medium.length}` : ''}
${alerts.critical.length + alerts.high.length + alerts.medium.length === 0 ? 'No active alerts 🎉' : ''}

📊 Key Metrics:
• Complexity: ${latest.metrics.cyclomaticComplexity}
• Test Coverage: ${latest.metrics.testCoverage}%
• Code Duplication: ${Math.round(latest.metrics.duplicateCodePercentage * 100)}%
• Technical Debt: ${latest.metrics.technicalDebtHours}h

🎯 Top Recommendations:
${this.getHealthRecommendations(this.healthIndicators.indexOf(latest.level)).slice(0, 3).map(rec => `• ${rec}`).join('\n')}

💡 Health Tip: ${this.getHealthTip(latest.level)}
    `.trim();
  }

  /**
   * Calculate health trend over time
   * @param {array} data - Recent health data
   * @returns {object} Trend information
   */
  calculateHealthTrend(data) {
    if (data.length < 2) return { direction: 'Stable', emoji: '➡️' };

    const scores = data.map(d => this.healthIndicators.indexOf(d.level));
    const recent = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const older = scores.slice(0, -3).reduce((a, b) => a + b, 0) / (scores.length - 3);

    if (recent > older + 0.5) return { direction: 'Improving', emoji: '📈' };
    if (recent < older - 0.5) return { direction: 'Declining', emoji: '📉' };
    return { direction: 'Stable', emoji: '➡️' };
  }

  /**
   * Get contextual health tip
   * @param {string} healthLevel - Current health level
   * @returns {string} Health tip
   */
  getHealthTip(healthLevel) {
    const tips = {
      '💀': 'Emergency mode: Focus on critical fixes before new features',
      '🤒': 'Recovery phase: Prioritize technical debt reduction',
      '😷': 'Healing process: Implement quality gates and monitoring',
      '😐': 'Maintenance mode: Regular health checks and improvements',
      '😊': 'Healthy state: Proactive monitoring and optimization',
      '💪': 'Peak condition: Share your success patterns with others!'
    };
    
    return tips[healthLevel] || 'Keep monitoring your code health!';
  }

  /**
   * Get real-time health dashboard data
   * @returns {object} Dashboard metrics
   */
  getDashboardMetrics() {
    const latest = this.healthHistory[this.healthHistory.length - 1];
    if (!latest) return { status: 'No data' };

    const alerts = this.getActiveAlerts();
    const totalAlerts = alerts.critical.length + alerts.high.length + alerts.medium.length;

    return {
      healthLevel: latest.level,
      healthScore: Math.round((this.healthIndicators.indexOf(latest.level) / 5) * 100),
      totalAlerts,
      criticalAlerts: alerts.critical.length,
      lastUpdated: latest.timestamp,
      keyMetrics: {
        complexity: latest.metrics.cyclomaticComplexity,
        coverage: latest.metrics.testCoverage,
        duplication: Math.round(latest.metrics.duplicateCodePercentage * 100),
        technicalDebt: latest.metrics.technicalDebtHours
      },
      status: totalAlerts === 0 ? 'Healthy' : totalAlerts < 3 ? 'Attention Needed' : 'Critical'
    };
  }
}

module.exports = CodeHealthMonitor;