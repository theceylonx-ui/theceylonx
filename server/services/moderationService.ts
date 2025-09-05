import { storage } from '../storage';

export interface ContentFlag {
  id: string;
  contentType: string;
  contentId: string;
  flagType: string;
  severity: number;
  autoDetected: boolean;
  detectionMethod?: string;
  confidenceScore?: number;
  flaggedBy?: string;
  status: 'pending' | 'confirmed' | 'false_positive' | 'resolved';
  createdAt: Date;
}

export interface AutoModerationConfig {
  spamKeywords: string[];
  inappropriateKeywords: string[];
  scamIndicators: string[];
  violenceKeywords: string[];
  harassmentPatterns: string[];
  maxFlagScore: number;
  autoActionThresholds: {
    warn: number;
    hide: number;
    suspend: number;
  };
}

// Default moderation configuration
const DEFAULT_CONFIG: AutoModerationConfig = {
  spamKeywords: [
    'buy now', 'click here', 'make money fast', 'guaranteed income',
    'free money', 'work from home', 'get rich quick', 'no experience needed'
  ],
  inappropriateKeywords: [
    'adult content', 'explicit', 'nsfw', 'inappropriate behavior'
  ],
  scamIndicators: [
    'wire transfer', 'western union', 'prepaid card', 'gift card payment',
    'pay upfront', 'advance fee', 'urgent payment', 'send money first'
  ],
  violenceKeywords: [
    'violence', 'threat', 'harm', 'dangerous', 'weapon', 'hurt'
  ],
  harassmentPatterns: [
    'hate speech', 'discriminat', 'harass', 'bully', 'threaten'
  ],
  maxFlagScore: 100,
  autoActionThresholds: {
    warn: 30,
    hide: 60,
    suspend: 85
  }
};

export class ModerationService {
  private config: AutoModerationConfig;

  constructor(config?: Partial<AutoModerationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze content for potential violations
   */
  async analyzeContent(
    contentType: string,
    contentId: string,
    content: string,
    userId?: string
  ): Promise<ContentFlag[]> {
    const flags: ContentFlag[] = [];
    const normalizedContent = content.toLowerCase().trim();

    // Check for spam indicators
    const spamScore = this.checkSpamPatterns(normalizedContent);
    if (spamScore > 0) {
      flags.push(this.createFlag(
        contentType,
        contentId,
        'spam',
        spamScore,
        'keyword',
        spamScore / 10,
        userId
      ));
    }

    // Check for inappropriate content
    const inappropriateScore = this.checkInappropriateContent(normalizedContent);
    if (inappropriateScore > 0) {
      flags.push(this.createFlag(
        contentType,
        contentId,
        'inappropriate',
        inappropriateScore,
        'keyword',
        inappropriateScore / 10,
        userId
      ));
    }

    // Check for scam indicators
    const scamScore = this.checkScamIndicators(normalizedContent);
    if (scamScore > 0) {
      flags.push(this.createFlag(
        contentType,
        contentId,
        'scam',
        scamScore,
        'keyword',
        scamScore / 10,
        userId
      ));
    }

    // Check for violence/threats
    const violenceScore = this.checkViolenceIndicators(normalizedContent);
    if (violenceScore > 0) {
      flags.push(this.createFlag(
        contentType,
        contentId,
        'violence',
        violenceScore,
        'keyword',
        violenceScore / 10,
        userId
      ));
    }

    // Check for harassment
    const harassmentScore = this.checkHarassmentPatterns(normalizedContent);
    if (harassmentScore > 0) {
      flags.push(this.createFlag(
        contentType,
        contentId,
        'harassment',
        harassmentScore,
        'keyword',
        harassmentScore / 10,
        userId
      ));
    }

    // Store flags in database
    for (const flag of flags) {
      await this.storeContentFlag(flag);
    }

    // Check if automatic action is needed
    const totalScore = flags.reduce((sum, flag) => sum + flag.severity, 0);
    if (totalScore >= this.config.autoActionThresholds.suspend) {
      await this.triggerAutoAction(contentType, contentId, 'suspend', totalScore);
    } else if (totalScore >= this.config.autoActionThresholds.hide) {
      await this.triggerAutoAction(contentType, contentId, 'hide', totalScore);
    } else if (totalScore >= this.config.autoActionThresholds.warn) {
      await this.triggerAutoAction(contentType, contentId, 'warn', totalScore);
    }

    return flags;
  }

  /**
   * Check for spam patterns in content
   */
  private checkSpamPatterns(content: string): number {
    let score = 0;
    
    // Check for spam keywords
    for (const keyword of this.config.spamKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        score += 15; // Each spam keyword adds 15 points
      }
    }

    // Check for excessive capitalization
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.5 && content.length > 20) {
      score += 10; // Excessive caps
    }

    // Check for excessive punctuation
    const punctuationRatio = (content.match(/[!?]{2,}/g) || []).length;
    if (punctuationRatio > 2) {
      score += 5; // Multiple exclamation/question marks
    }

    // Check for repetitive content
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
      score += 10; // Very repetitive content
    }

    return Math.min(score, 50); // Cap at 50 points
  }

  /**
   * Check for inappropriate content patterns
   */
  private checkInappropriateContent(content: string): number {
    let score = 0;
    
    for (const keyword of this.config.inappropriateKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        score += 25; // High score for inappropriate content
      }
    }

    return Math.min(score, 40);
  }

  /**
   * Check for scam indicators
   */
  private checkScamIndicators(content: string): number {
    let score = 0;
    
    for (const indicator of this.config.scamIndicators) {
      if (content.includes(indicator.toLowerCase())) {
        score += 20; // High score for scam indicators
      }
    }

    // Check for urgency phrases
    const urgencyPhrases = ['urgent', 'hurry', 'limited time', 'act now', 'expires soon'];
    for (const phrase of urgencyPhrases) {
      if (content.includes(phrase)) {
        score += 10;
      }
    }

    return Math.min(score, 45);
  }

  /**
   * Check for violence/threat indicators
   */
  private checkViolenceIndicators(content: string): number {
    let score = 0;
    
    for (const keyword of this.config.violenceKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        score += 30; // Very high score for violence
      }
    }

    return Math.min(score, 50);
  }

  /**
   * Check for harassment patterns
   */
  private checkHarassmentPatterns(content: string): number {
    let score = 0;
    
    for (const pattern of this.config.harassmentPatterns) {
      if (content.includes(pattern.toLowerCase())) {
        score += 25; // High score for harassment
      }
    }

    return Math.min(score, 40);
  }

  /**
   * Create a content flag object
   */
  private createFlag(
    contentType: string,
    contentId: string,
    flagType: string,
    severity: number,
    detectionMethod: string,
    confidenceScore: number,
    flaggedBy?: string
  ): ContentFlag {
    return {
      id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentType,
      contentId,
      flagType,
      severity,
      autoDetected: true,
      detectionMethod,
      confidenceScore,
      flaggedBy,
      status: 'pending',
      createdAt: new Date()
    };
  }

  /**
   * Store content flag in database
   */
  private async storeContentFlag(flag: ContentFlag): Promise<void> {
    try {
      await storage.executeRawQuery(
        `INSERT INTO content_flags (
          content_type, content_id, flag_type, severity, auto_detected,
          detection_method, confidence_score, flagged_by, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          flag.contentType,
          flag.contentId,
          flag.flagType,
          flag.severity,
          flag.autoDetected,
          flag.detectionMethod,
          flag.confidenceScore,
          flag.flaggedBy,
          flag.status,
          flag.createdAt
        ]
      );
    } catch (error) {
      console.error('Error storing content flag:', error);
    }
  }

  /**
   * Trigger automatic moderation action
   */
  private async triggerAutoAction(
    contentType: string,
    contentId: string,
    action: string,
    score: number
  ): Promise<void> {
    try {
      console.log(`🚨 Auto-moderation triggered: ${action} for ${contentType}:${contentId} (score: ${score})`);
      
      // Create moderation action record
      await storage.executeRawQuery(
        `INSERT INTO moderation_actions (
          moderator_id, action_type, target_type, target_id, reason, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'system', // System-generated action
          action,
          contentType,
          contentId,
          `Automatic action triggered by content analysis (score: ${score})`,
          JSON.stringify({ autoTrigger: true, score, timestamp: new Date().toISOString() })
        ]
      );

      // Execute the actual action based on type
      switch (action) {
        case 'warn':
          // Could send warning notification to user
          break;
        case 'hide':
          // Hide the content temporarily
          await this.hideContent(contentType, contentId);
          break;
        case 'suspend':
          // Create a report for manual review
          await this.createAutoReport(contentType, contentId, score);
          break;
      }
    } catch (error) {
      console.error('Error triggering auto action:', error);
    }
  }

  /**
   * Hide content temporarily
   */
  private async hideContent(contentType: string, contentId: string): Promise<void> {
    // Implementation depends on content type
    switch (contentType) {
      case 'trip':
        await storage.executeRawQuery(
          'UPDATE trips SET status = $1 WHERE id = $2',
          ['inactive', contentId]
        );
        break;
      case 'comment':
        // Hide comment logic
        break;
      case 'message':
        // Hide message logic
        break;
    }
  }

  /**
   * Create automatic report for high-score content
   */
  private async createAutoReport(
    contentType: string,
    contentId: string,
    score: number
  ): Promise<void> {
    try {
      await storage.executeRawQuery(
        `INSERT INTO reports (
          context, ${contentType === 'trip' ? 'trip_id' : 'user_id'}, reporter_id, 
          reason, description, status, priority, severity, auto_flagged, flag_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          contentType,
          contentId,
          'system', // System reporter
          'auto_flagged_content',
          `Content automatically flagged for review (score: ${score})`,
          'open',
          score >= 85 ? 'critical' : score >= 60 ? 'high' : 'medium',
          score >= 85 ? 'critical' : score >= 60 ? 'high' : 'medium',
          true,
          score
        ]
      );
    } catch (error) {
      console.error('Error creating auto report:', error);
    }
  }

  /**
   * Manual flag content
   */
  async manualFlag(
    contentType: string,
    contentId: string,
    flagType: string,
    flaggedBy: string,
    reason?: string
  ): Promise<void> {
    const flag = this.createFlag(
      contentType,
      contentId,
      flagType,
      20, // Standard manual flag severity
      'manual',
      1.0, // Manual flags have 100% confidence
      flaggedBy
    );

    flag.autoDetected = false;
    await this.storeContentFlag(flag);

    // Create report for manual review
    await storage.executeRawQuery(
      `INSERT INTO reports (
        context, ${contentType === 'trip' ? 'trip_id' : 'user_id'}, reporter_id, 
        reason, description, status, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        contentType,
        contentId,
        flaggedBy,
        flagType,
        reason || `Content manually flagged as ${flagType}`,
        'open',
        'medium'
      ]
    );
  }

  /**
   * Get content flags for review
   */
  async getContentFlags(filters: {
    status?: string;
    flagType?: string;
    contentType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ContentFlag[]> {
    const { status, flagType, contentType, limit = 20, offset = 0 } = filters;
    
    let query = 'SELECT * FROM content_flags WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      query += ` AND status = $${++paramCount}`;
      params.push(status);
    }

    if (flagType) {
      query += ` AND flag_type = $${++paramCount}`;
      params.push(flagType);
    }

    if (contentType) {
      query += ` AND content_type = $${++paramCount}`;
      params.push(contentType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    return await storage.executeRawQuery(query, params);
  }
}

export const moderationService = new ModerationService();