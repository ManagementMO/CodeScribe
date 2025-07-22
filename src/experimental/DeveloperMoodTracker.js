/**
 * Developer Mood Tracker - Experimental Feature
 * Tracks developer mood based on commit patterns and code quality
 */

class DeveloperMoodTracker {
  constructor() {
    this.moods = ['😴', '😤', '🤔', '😊', '🚀', '🔥'];
    this.moodHistory = [];
  }

  /**
   * Analyze developer mood based on commit message and code changes
   * @param {string} commitMessage - The commit message
   * @param {number} linesChanged - Number of lines changed
   * @param {number} filesChanged - Number of files changed
   * @returns {string} Mood emoji
   */
  analyzeMood(commitMessage, linesChanged = 0, filesChanged = 0) {
    let moodScore = 3; // Default neutral mood

    // Analyze commit message sentiment
    if (commitMessage.includes('fix') || commitMessage.includes('bug')) {
      moodScore -= 1; // Frustrated
    }
    if (commitMessage.includes('feat') || commitMessage.includes('add')) {
      moodScore += 1; // Happy
    }
    if (commitMessage.includes('refactor') || commitMessage.includes('clean')) {
      moodScore += 2; // Very productive
    }
    if (commitMessage.includes('WIP') || commitMessage.includes('temp')) {
      moodScore -= 2; // Tired/rushed
    }

    // Factor in code changes
    if (linesChanged > 500) moodScore += 1; // Productive day
    if (filesChanged > 10) moodScore += 1; // Big feature work

    // Clamp mood score
    moodScore = Math.max(0, Math.min(5, moodScore));
    
    const mood = this.moods[moodScore];
    this.recordMood(mood, commitMessage);
    
    return mood;
  }

  /**
   * Record mood in history
   * @param {string} mood - Mood emoji
   * @param {string} context - Context (commit message)
   */
  recordMood(mood, context) {
    this.moodHistory.push({
      mood,
      context,
      timestamp: new Date().toISOString()
    });

    // Keep only last 10 entries
    if (this.moodHistory.length > 10) {
      this.moodHistory.shift();
    }
  }

  /**
   * Get current developer mood trend
   * @returns {object} Mood analysis
   */
  getMoodTrend() {
    if (this.moodHistory.length === 0) {
      return { trend: 'neutral', message: 'No mood data yet!' };
    }

    const recentMoods = this.moodHistory.slice(-5);
    const moodCounts = {};
    
    recentMoods.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });

    const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b
    );

    const messages = {
      '😴': 'Time for coffee! You seem tired.',
      '😤': 'Lots of bug fixes lately. Hang in there!',
      '🤔': 'Deep thinking mode activated.',
      '😊': 'Good vibes! Keep up the great work.',
      '🚀': 'You\'re on fire! Productivity through the roof!',
      '🔥': 'Absolute legend status achieved!'
    };

    return {
      trend: dominantMood,
      message: messages[dominantMood] || 'Keep coding!',
      history: this.moodHistory
    };
  }

  /**
   * Generate mood report for team standup
   * @returns {string} Formatted mood report
   */
  generateMoodReport() {
    const trend = this.getMoodTrend();
    const totalCommits = this.moodHistory.length;
    
    return `
🎯 Developer Mood Report
========================
Current Trend: ${trend.trend} ${trend.message}
Total Tracked Commits: ${totalCommits}
Recent Activity: ${this.moodHistory.slice(-3).map(h => h.mood).join(' ')}

💡 Tip: ${this.getProductivityTip(trend.trend)}
    `.trim();
  }

  /**
   * Get productivity tip based on mood
   * @param {string} mood - Current mood emoji
   * @returns {string} Productivity tip
   */
  getProductivityTip(mood) {
    const tips = {
      '😴': 'Take a break! Fresh air and coffee work wonders.',
      '😤': 'Consider pair programming for tough bugs.',
      '🤔': 'Document your thought process - future you will thank you!',
      '😊': 'Great momentum! Maybe tackle that refactoring task?',
      '🚀': 'Perfect time to mentor a junior developer!',
      '🔥': 'Share your success with the team - inspire others!'
    };
    
    return tips[mood] || 'Keep being awesome!';
  }
}

module.exports = DeveloperMoodTracker;