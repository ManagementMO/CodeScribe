/**
 * Team Productivity Analyzer - Experimental Feature
 * Analyzes team productivity patterns and provides insights
 */

class TeamProductivityAnalyzer {
  constructor() {
    this.productivityLevels = ['🐌', '🚶', '🏃', '🚀', '⚡', '🔥'];
    this.teamMetrics = [];
    this.insights = [];
  }

  /**
   * Analyze team productivity based on various metrics
   * @param {object} metrics - Team metrics data
   * @returns {object} Productivity analysis
   */
  analyzeTeamProductivity(metrics) {
    const {
      commitsPerDay = 0,
      linesOfCode = 0,
      pullRequestsMerged = 0,
      bugsFixed = 0,
      featuresDelivered = 0,
      codeReviewTime = 0
    } = metrics;

    let productivityScore = 2; // Base level

    // Analyze commit frequency
    if (commitsPerDay > 10) productivityScore += 2;
    else if (commitsPerDay > 5) productivityScore += 1;
    else if (commitsPerDay < 2) productivityScore -= 1;

    // Factor in code quality indicators
    if (pullRequestsMerged > 3) productivityScore += 1;
    if (bugsFixed > 5) productivityScore += 1;
    if (featuresDelivered > 2) productivityScore += 2;

    // Code review efficiency
    if (codeReviewTime < 2) productivityScore += 1; // Fast reviews
    else if (codeReviewTime > 8) productivityScore -= 1; // Slow reviews

    // Clamp score
    productivityScore = Math.max(0, Math.min(5, productivityScore));
    
    const level = this.productivityLevels[productivityScore];
    const analysis = this.generateProductivityInsight(productivityScore, metrics);
    
    this.recordMetrics(level, metrics, analysis);
    
    return {
      level,
      score: productivityScore,
      analysis,
      recommendations: this.getRecommendations(productivityScore)
    };
  }

  /**
   * Generate productivity insight based on metrics
   * @param {number} score - Productivity score
   * @param {object} metrics - Raw metrics
   * @returns {string} Insight message
   */
  generateProductivityInsight(score, metrics) {
    const insights = {
      0: `Team seems to be in planning mode. Low activity detected.`,
      1: `Steady progress but room for improvement. Consider sprint planning review.`,
      2: `Good baseline productivity. Team is maintaining consistent output.`,
      3: `Strong performance! Team is delivering quality work efficiently.`,
      4: `Excellent productivity! Team is in the zone with high-quality output.`,
      5: `Outstanding performance! Team is operating at peak efficiency.`
    };

    let insight = insights[score];
    
    // Add specific observations
    if (metrics.bugsFixed > metrics.featuresDelivered) {
      insight += ` Focus on bug fixes suggests stabilization phase.`;
    }
    if (metrics.codeReviewTime > 6) {
      insight += ` Code review bottleneck detected.`;
    }
    if (metrics.commitsPerDay > 15) {
      insight += ` High commit frequency - ensure code quality isn't compromised.`;
    }

    return insight;
  }

  /**
   * Record team metrics in history
   * @param {string} level - Productivity level emoji
   * @param {object} metrics - Metrics data
   * @param {string} analysis - Analysis text
   */
  recordMetrics(level, metrics, analysis) {
    this.teamMetrics.push({
      level,
      metrics,
      analysis,
      timestamp: new Date().toISOString(),
      date: new Date().toDateString()
    });

    // Keep last 30 days
    if (this.teamMetrics.length > 30) {
      this.teamMetrics.shift();
    }
  }

  /**
   * Get productivity recommendations
   * @param {number} score - Current productivity score
   * @returns {array} Array of recommendations
   */
  getRecommendations(score) {
    const recommendations = {
      0: [
        'Schedule team sync to identify blockers',
        'Review sprint goals and priorities',
        'Consider pair programming sessions'
      ],
      1: [
        'Implement daily standups if not already',
        'Review and optimize development workflow',
        'Identify and remove process bottlenecks'
      ],
      2: [
        'Maintain current momentum',
        'Consider code quality metrics tracking',
        'Plan for upcoming sprint capacity'
      ],
      3: [
        'Document successful practices for replication',
        'Consider mentoring other teams',
        'Explore automation opportunities'
      ],
      4: [
        'Share best practices with organization',
        'Consider taking on stretch goals',
        'Invest in team skill development'
      ],
      5: [
        'Maintain sustainable pace to avoid burnout',
        'Lead innovation initiatives',
        'Become productivity champions for other teams'
      ]
    };

    return recommendations[score] || ['Keep up the great work!'];
  }

  /**
   * Generate weekly team report
   * @returns {string} Formatted team report
   */
  generateWeeklyReport() {
    if (this.teamMetrics.length === 0) {
      return 'No team metrics available yet. Start tracking to see insights!';
    }

    const weeklyData = this.teamMetrics.slice(-7);
    const avgScore = weeklyData.reduce((sum, day) => {
      return sum + this.productivityLevels.indexOf(day.level);
    }, 0) / weeklyData.length;

    const currentLevel = this.productivityLevels[Math.round(avgScore)];
    const trend = this.calculateTrend(weeklyData);

    return `
📊 Weekly Team Productivity Report
==================================
Current Level: ${currentLevel} (${this.getLevelName(currentLevel)})
Weekly Trend: ${trend.direction} ${trend.emoji}
Days Tracked: ${weeklyData.length}

📈 Key Insights:
${weeklyData.slice(-3).map(day => `• ${day.date}: ${day.level} - ${day.analysis}`).join('\n')}

🎯 Focus Areas:
${this.getRecommendations(Math.round(avgScore)).slice(0, 3).map(rec => `• ${rec}`).join('\n')}

💡 Team Health Score: ${Math.round(avgScore * 20)}%
    `.trim();
  }

  /**
   * Calculate productivity trend
   * @param {array} data - Recent metrics data
   * @returns {object} Trend information
   */
  calculateTrend(data) {
    if (data.length < 2) return { direction: 'Stable', emoji: '➡️' };

    const recent = data.slice(-3).map(d => this.productivityLevels.indexOf(d.level));
    const older = data.slice(-6, -3).map(d => this.productivityLevels.indexOf(d.level));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

    if (recentAvg > olderAvg + 0.5) return { direction: 'Improving', emoji: '📈' };
    if (recentAvg < olderAvg - 0.5) return { direction: 'Declining', emoji: '📉' };
    return { direction: 'Stable', emoji: '➡️' };
  }

  /**
   * Get human-readable level name
   * @param {string} emoji - Level emoji
   * @returns {string} Level name
   */
  getLevelName(emoji) {
    const names = {
      '🐌': 'Planning Phase',
      '🚶': 'Steady Progress',
      '🏃': 'Good Momentum',
      '🚀': 'High Performance',
      '⚡': 'Peak Efficiency',
      '🔥': 'Exceptional Output'
    };
    return names[emoji] || 'Unknown';
  }

  /**
   * Get team productivity insights for stakeholders
   * @returns {object} Executive summary
   */
  getExecutiveSummary() {
    const recentMetrics = this.teamMetrics.slice(-7);
    if (recentMetrics.length === 0) {
      return { status: 'No data available' };
    }

    const avgProductivity = recentMetrics.reduce((sum, day) => {
      return sum + this.productivityLevels.indexOf(day.level);
    }, 0) / recentMetrics.length;

    const healthScore = Math.round(avgProductivity * 20);
    const status = healthScore > 80 ? 'Excellent' : healthScore > 60 ? 'Good' : healthScore > 40 ? 'Fair' : 'Needs Attention';

    return {
      status,
      healthScore,
      currentLevel: this.productivityLevels[Math.round(avgProductivity)],
      keyMetrics: {
        averageCommitsPerDay: Math.round(recentMetrics.reduce((sum, d) => sum + (d.metrics.commitsPerDay || 0), 0) / recentMetrics.length),
        averagePRsMerged: Math.round(recentMetrics.reduce((sum, d) => sum + (d.metrics.pullRequestsMerged || 0), 0) / recentMetrics.length),
        averageReviewTime: Math.round(recentMetrics.reduce((sum, d) => sum + (d.metrics.codeReviewTime || 0), 0) / recentMetrics.length)
      },
      recommendations: this.getRecommendations(Math.round(avgProductivity)).slice(0, 2)
    };
  }
}

module.exports = TeamProductivityAnalyzer;