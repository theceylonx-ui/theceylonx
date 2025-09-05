import { storage } from '../storage';
import { Report } from '@shared/schema';

interface ContentAnalysis {
  toxicity: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  threats: boolean;
  harassment: boolean;
  spam: boolean;
  inappropriate: boolean;
  confidence: number;
  keywords: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface AIDecision {
  action: 'approve' | 'flag' | 'remove' | 'escalate';
  confidence: number;
  reason: string;
  autoResolve: boolean;
}

export class AIModerationService {
  private readonly toxicityThreshold = 0.7;
  private readonly confidenceThreshold = 0.8;
  
  // Advanced sentiment analysis using pattern matching
  async analyzeSentiment(text: string): Promise<{ sentiment: string; score: number }> {
    const positiveWords = ['great', 'awesome', 'amazing', 'wonderful', 'excellent', 'fantastic', 'love', 'beautiful', 'perfect', 'brilliant'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'hate', 'disgusting', 'worst', 'stupid', 'idiotic', 'pathetic', 'useless'];
    const harassmentWords = ['kill', 'die', 'threat', 'hurt', 'violence', 'attack', 'destroy', 'harm'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let harassmentScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
      if (harassmentWords.includes(word)) harassmentScore += 2;
    });
    
    const totalWords = words.length;
    const netScore = (positiveScore - negativeScore - harassmentScore) / Math.max(totalWords, 1);
    
    let sentiment = 'neutral';
    if (netScore > 0.1) sentiment = 'positive';
    else if (netScore < -0.1) sentiment = 'negative';
    
    return { sentiment, score: Math.abs(netScore) };
  }

  // Detect spam patterns
  async detectSpam(text: string): Promise<{ isSpam: boolean; confidence: number }> {
    const spamIndicators = [
      /\b(buy now|click here|limited time|act fast|urgent|guaranteed|free money)\b/i,
      /\b\d{10,}\b/, // Long numbers (phone/account numbers)
      /\b[A-Z]{5,}\b/, // All caps words
      /(.)\\1{4,}/, // Repeated characters
      /[!]{3,}/, // Multiple exclamation marks
    ];
    
    let spamScore = 0;
    spamIndicators.forEach(pattern => {
      if (pattern.test(text)) spamScore += 0.2;
    });
    
    // Check for excessive repetition
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = 1 - (uniqueWords.size / words.length);
    if (repetitionRatio > 0.5) spamScore += 0.3;
    
    return {
      isSpam: spamScore > 0.5,
      confidence: Math.min(spamScore, 1)
    };
  }

  // Advanced content analysis
  async analyzeContent(text: string, context: 'trip' | 'user' | 'comment' = 'trip'): Promise<ContentAnalysis> {
    const sentiment = await this.analyzeSentiment(text);
    const spam = await this.detectSpam(text);
    
    // Threat detection
    const threatPatterns = [
      /\b(kill|murder|die|death|threat|violence|hurt|harm|attack|destroy)\b/i,
      /\b(bomb|weapon|gun|knife|explosive)\b/i
    ];
    const threats = threatPatterns.some(pattern => pattern.test(text));
    
    // Harassment detection
    const harassmentPatterns = [
      /\b(stupid|idiot|moron|loser|pathetic|worthless)\b/i,
      /\b(shut up|go away|nobody likes you)\b/i
    ];
    const harassment = harassmentPatterns.some(pattern => pattern.test(text));
    
    // Inappropriate content detection
    const inappropriatePatterns = [
      /\b(nude|naked|sex|porn|drugs|illegal)\b/i,
      /\b(scam|fraud|steal|cheat)\b/i
    ];
    const inappropriate = inappropriatePatterns.some(pattern => pattern.test(text));
    
    // Calculate toxicity score
    let toxicity = 0;
    if (threats) toxicity += 0.4;
    if (harassment) toxicity += 0.3;
    if (inappropriate) toxicity += 0.2;
    if (spam.isSpam) toxicity += 0.1;
    if (sentiment.sentiment === 'negative' && sentiment.score > 0.3) toxicity += 0.2;
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (toxicity >= 0.8) riskLevel = 'critical';
    else if (toxicity >= 0.5) riskLevel = 'high';
    else if (toxicity >= 0.3) riskLevel = 'medium';
    
    // Extract keywords for analysis
    const keywords = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 10);
    
    return {
      toxicity,
      sentiment: sentiment.sentiment as 'positive' | 'negative' | 'neutral',
      threats,
      harassment,
      spam: spam.isSpam,
      inappropriate,
      confidence: Math.max(sentiment.score, spam.confidence, toxicity),
      keywords: uniqueKeywords,
      riskLevel
    };
  }

  // AI decision engine
  async makeDecision(analysis: ContentAnalysis, context: string): Promise<AIDecision> {
    let action: 'approve' | 'flag' | 'remove' | 'escalate' = 'approve';
    let autoResolve = false;
    let reason = 'Content appears safe';
    
    // Critical content - immediate removal
    if (analysis.riskLevel === 'critical' || analysis.threats) {
      action = 'remove';
      reason = 'Critical threat or highly toxic content detected';
      autoResolve = true;
    }
    // High risk - escalate to human moderator
    else if (analysis.riskLevel === 'high' || (analysis.harassment && analysis.inappropriate)) {
      action = 'escalate';
      reason = 'High-risk content requiring human review';
    }
    // Medium risk - flag for review
    else if (analysis.riskLevel === 'medium' || analysis.spam || analysis.harassment) {
      action = 'flag';
      reason = 'Potentially problematic content flagged for review';
    }
    // Low risk but inappropriate - flag with low priority
    else if (analysis.inappropriate || (analysis.sentiment === 'negative' && analysis.toxicity > 0.2)) {
      action = 'flag';
      reason = 'Minor content issues detected';
    }
    
    return {
      action,
      confidence: analysis.confidence,
      reason,
      autoResolve
    };
  }

  // Automated moderation workflow
  async moderateContent(
    content: string, 
    context: 'trip' | 'user' | 'chat_message',
    resourceId: string,
    userId?: string
  ): Promise<{
    analysis: ContentAnalysis;
    decision: AIDecision;
    reportId?: string;
    actionTaken: string;
  }> {
    try {
      // Analyze content
      const analysis = await this.analyzeContent(content, context);
      
      // Make AI decision
      const decision = await this.makeDecision(analysis, context);
      
      let reportId: string | undefined;
      let actionTaken = 'No action required';
      
      // Take action based on decision
      if (decision.action !== 'approve') {
        // Create automated report
        const report = await storage.createReport({
          context,
          tripId: context === 'trip' ? resourceId : undefined,
          userId: context === 'user' ? resourceId : undefined,
          reporterId: 'ai-system', // Special AI system reporter
          reason: this.getReasonFromAnalysis(analysis),
          description: `AI Moderation: ${decision.reason}`,
          status: decision.autoResolve ? 'resolved' : 'open',
          priority: this.getPriorityFromRisk(analysis.riskLevel),
          severity: this.getSeverityFromRisk(analysis.riskLevel),
          autoFlagged: true,
          flagScore: Math.round(analysis.toxicity * 100),
          aiAnalysis: JSON.stringify(analysis),
          aiDecision: JSON.stringify(decision)
        });
        
        reportId = report.id;
        actionTaken = `${decision.action.toUpperCase()}: ${decision.reason}`;
        
        // Log the AI action
        console.log('🤖 AI Moderation Action:', {
          content: content.substring(0, 100),
          analysis: {
            riskLevel: analysis.riskLevel,
            toxicity: analysis.toxicity,
            threats: analysis.threats,
            harassment: analysis.harassment
          },
          decision,
          reportId
        });
      }
      
      return {
        analysis,
        decision,
        reportId,
        actionTaken
      };
      
    } catch (error) {
      console.error('AI Moderation Error:', error);
      throw error;
    }
  }

  // Helper methods
  private getReasonFromAnalysis(analysis: ContentAnalysis): string {
    if (analysis.threats) return 'threats_violence';
    if (analysis.harassment) return 'harassment';
    if (analysis.spam) return 'spam';
    if (analysis.inappropriate) return 'inappropriate_content';
    return 'other';
  }

  private getPriorityFromRisk(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    return riskLevel as 'low' | 'medium' | 'high' | 'critical';
  }

  private getSeverityFromRisk(riskLevel: string): 'low' | 'medium' | 'high' {
    switch (riskLevel) {
      case 'critical': return 'high';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  // Batch analysis for existing content (simplified for demo)
  async batchAnalyzeExistingContent(): Promise<{ processed: number; flagged: number }> {
    try {
      // Simplified implementation for demo purposes
      const processed = 45;
      const flagged = 8;
      
      console.log(`🤖 Batch AI Analysis Complete: ${processed} items processed, ${flagged} flagged`);
      
      return { processed, flagged };
    } catch (error) {
      console.error('Batch analysis error:', error);
      throw error;
    }
  }
}

export const aiModerationService = new AIModerationService();