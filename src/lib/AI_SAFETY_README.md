# AI Safety & Billing Protection

This directory contains token tracking and billing safety systems to prevent runaway costs.

## Files

| File | Purpose |
|------|---------|
| `ai-safety.ts` | Core token tracking, circuit breakers, rate limiting |
| `api/ai/route.ts` | API route wrapper with all protections |
| `hooks/useAI.ts` | React hook for frontend AI calls |
| `components/AIUsageDashboard.tsx` | Admin dashboard for monitoring usage |

## Features

### 1. Token Limits
- **Per request:** 4,000 tokens max
- **Per day:** 100,000 tokens max
- **Daily budget:** $50 USD

### 2. Circuit Breaker
- Opens after 5 consecutive failures
- Stays open for 60 seconds
- Prevents cascading failures

### 3. Rate Limiting
- 10 requests per user per minute (default)
- Configurable per endpoint

### 4. Alerts
- 50% of budget: Warning logged
- 80% of budget: Critical alert logged
- 100% of budget: API calls blocked

## Usage

### Backend API Route

```typescript
import { safeAICall } from '@/lib/ai-safety';

const result = await safeAICall(
  userId,
  async () => {
    const response = await kimi.chat.completions.create({
      model: 'kimi-k2-5',
      messages: [{ role: 'user', content: prompt }],
    });
    
    return {
      result: response.choices[0].message.content,
      tokens: {
        requestTokens: response.usage.prompt_tokens,
        responseTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        timestamp: Date.now(),
      },
    };
  },
  { maxTokens: 1000 }
);
```

### Frontend Component

```typescript
import { useAI } from '@/hooks/useAI';

function MyComponent() {
  const { result, loading, error, usage, remaining, callAI } = useAI('user-123');
  
  return (
    <button onClick={() => callAI('Your prompt')} disabled={loading}>
      Call AI
    </button>
  );
}
```

### Admin Dashboard

```typescript
import { AIUsageDashboard } from '@/components/AIUsageDashboard';

// Add to your admin page
<AIUsageDashboard />
```

## Configuration

Edit `ai-safety.ts` to adjust limits:

```typescript
const CONFIG = {
  MAX_TOKENS_PER_REQUEST: 4000,
  MAX_TOKENS_PER_DAY: 100000,
  DAILY_BUDGET_USD: 50,
  // ...
};
```

## Monitoring

Check usage stats:
```bash
curl /api/ai
```

Response:
```json
{
  "status": "ok",
  "dailyUsage": {
    "date": "2026-03-08",
    "totalTokens": 15000,
    "totalCost": 0.015,
    "requestCount": 25
  },
  "limits": {
    "maxTokensPerDay": 100000,
    "dailyBudgetUSD": 50
  }
}
```

## TODO Before Production

1. [ ] Replace mock AI calls with actual Kimi API integration
2. [ ] Add Slack/email alerts in `sendAlert()` function
3. [ ] Move to Redis for multi-server deployments
4. [ ] Add user-specific quotas
5. [ ] Set up daily reset cron job
