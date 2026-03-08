// Token usage tracking and billing safety for AI API calls
// Prevents runaway costs and implements circuit breakers

interface TokenUsage {
  requestTokens: number;
  responseTokens: number;
  totalTokens: number;
  timestamp: number;
}

interface DailyStats {
  date: string;
  totalTokens: number;
  totalCost: number; // Estimated USD
  requestCount: number;
}

// Configuration
const CONFIG = {
  MAX_TOKENS_PER_REQUEST: 4000,
  MAX_TOKENS_PER_DAY: 100000,
  DAILY_BUDGET_USD: 50,
  ALERT_THRESHOLD_1: 0.5, // 50% of budget
  ALERT_THRESHOLD_2: 0.8, // 80% of budget
  CIRCUIT_BREAKER_THRESHOLD: 5, // failures before opening
  CIRCUIT_BREAKER_TIMEOUT: 60000, // 1 minute
  OPERATION_TIMEOUT: 30000, // 30 seconds
} as const;

// In-memory storage (use Redis in production)
class TokenTracker {
  private dailyUsage: Map<string, DailyStats> = new Map();
  private failureCount: number = 0;
  private circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private circuitResetTime: number = 0;
  private alertsSent: Set<string> = new Set();

  // Estimate cost based on token usage (Kimi pricing)
  private estimateCost(tokens: number): number {
    // Kimi K2.5: ~$0.50 per 1M input tokens, $1.50 per 1M output tokens
    // Conservative estimate: $1 per 1M tokens average
    return (tokens / 1000000) * 1.0;
  }

  // Check if daily limit exceeded
  checkDailyLimit(requestTokens: number): void {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.dailyUsage.get(today) || {
      date: today,
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
    };

    if (stats.totalTokens + requestTokens > CONFIG.MAX_TOKENS_PER_DAY) {
      throw new Error(
        `Daily token limit exceeded: ${stats.totalTokens.toLocaleString()} + ${requestTokens.toLocaleString()} > ${CONFIG.MAX_TOKENS_PER_DAY.toLocaleString()}`
      );
    }

    // Check budget thresholds
    const projectedCost = this.estimateCost(stats.totalTokens + requestTokens);
    
    if (projectedCost >= CONFIG.DAILY_BUDGET_USD * CONFIG.ALERT_THRESHOLD_2) {
      this.sendAlert('CRITICAL', `Daily spend at 80%: $${projectedCost.toFixed(2)}`);
    } else if (projectedCost >= CONFIG.DAILY_BUDGET_USD * CONFIG.ALERT_THRESHOLD_1) {
      this.sendAlert('WARNING', `Daily spend at 50%: $${projectedCost.toFixed(2)}`);
    }
  }

  // Track token usage
  trackUsage(usage: TokenUsage): void {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.dailyUsage.get(today) || {
      date: today,
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
    };

    stats.totalTokens += usage.totalTokens;
    stats.totalCost = this.estimateCost(stats.totalTokens);
    stats.requestCount++;

    this.dailyUsage.set(today, stats);

    // Log for monitoring
    console.log(`[TokenTracker] ${usage.totalTokens} tokens | $${stats.totalCost.toFixed(4)} today | ${stats.requestCount} requests`);
  }

  // Circuit breaker pattern
  async executeWithCircuitBreaker<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.circuitState === 'OPEN') {
      if (Date.now() > this.circuitResetTime) {
        this.circuitState = 'HALF_OPEN';
        console.log('[CircuitBreaker] Entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - too many failures');
      }
    }

    try {
      // Execute with timeout
      const result = await this.withTimeout(fn, CONFIG.OPERATION_TIMEOUT);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
      ),
    ]);
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.circuitState === 'HALF_OPEN') {
      this.circuitState = 'CLOSED';
      console.log('[CircuitBreaker] CLOSED - service recovered');
    }
  }

  private onFailure(): void {
    this.failureCount++;
    if (this.failureCount >= CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitState = 'OPEN';
      this.circuitResetTime = Date.now() + CONFIG.CIRCUIT_BREAKER_TIMEOUT;
      console.log(`[CircuitBreaker] OPEN for ${CONFIG.CIRCUIT_BREAKER_TIMEOUT}ms`);
    }
  }

  // Send alert (implement with your notification system)
  private sendAlert(level: 'WARNING' | 'CRITICAL', message: string): void {
    const alertKey = `${level}-${message}`;
    if (this.alertsSent.has(alertKey)) return; // Don't spam

    this.alertsSent.add(alertKey);
    console.error(`[ALERT ${level}] ${message}`);

    // TODO: Send to Slack, email, or PagerDuty
    // Example: await sendSlackNotification(`🚨 ${level}: ${message}`);
  }

  // Get current day's stats
  getTodayStats(): DailyStats {
    const today = new Date().toISOString().split('T')[0];
    return this.dailyUsage.get(today) || {
      date: today,
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
    };
  }

  // Reset daily stats (call at midnight)
  resetDaily(): void {
    this.alertsSent.clear();
    console.log('[TokenTracker] Daily stats reset');
  }
}

// Singleton instance
export const tokenTracker = new TokenTracker();

// Rate limiting per user
class RateLimiter {
  private limits: Map<string, { count: number; resetTime: number }> = new Map();

  checkLimit(userId: string, maxRequests: number = 10, windowMs: number = 60000): void {
    const now = Date.now();
    const userLimit = this.limits.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset window
      this.limits.set(userId, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (userLimit.count >= maxRequests) {
      const waitSeconds = Math.ceil((userLimit.resetTime - now) / 1000);
      throw new Error(`Rate limit exceeded. Try again in ${waitSeconds}s`);
    }

    userLimit.count++;
  }

  getRemaining(userId: string, maxRequests: number = 10): number {
    const now = Date.now();
    const userLimit = this.limits.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - userLimit.count);
  }
}

export const rateLimiter = new RateLimiter();

// Wrapper for AI API calls with all protections
export async function safeAICall<T>(
  userId: string,
  callFn: () => Promise<{ result: T; tokens: TokenUsage }>,
  options: {
    maxTokens?: number;
    rateLimitRequests?: number;
    rateLimitWindow?: number;
  } = {}
): Promise<T> {
  const { maxTokens = CONFIG.MAX_TOKENS_PER_REQUEST } = options;

  // 1. Check rate limit
  rateLimiter.checkLimit(
    userId,
    options.rateLimitRequests || 10,
    options.rateLimitWindow || 60000
  );

  // 2. Check daily token limit
  tokenTracker.checkDailyLimit(maxTokens);

  // 3. Execute with circuit breaker
  const { result, tokens } = await tokenTracker.executeWithCircuitBreaker(async () => {
    return await callFn();
  });

  // 4. Track usage
  tokenTracker.trackUsage(tokens);

  return result;
}

// Example usage:
/*
import { safeAICall, tokenTracker } from '@/lib/ai-safety';

// In your API route:
const result = await safeAICall(
  user.id,
  async () => {
    const response = await kimi.chat.completions.create({
      model: 'kimi-k2-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    });
    
    return {
      result: response.choices[0].message.content,
      tokens: {
        requestTokens: response.usage?.prompt_tokens || 0,
        responseTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        timestamp: Date.now(),
      },
    };
  },
  { maxTokens: 1000 }
);
*/
