// React hook for AI calls with usage tracking
// Use this in components that need AI functionality

import { useState, useCallback } from 'react';

interface AIUsage {
  tokens: number;
  cost: number;
}

interface UseAIResult {
  result: string | null;
  loading: boolean;
  error: string | null;
  usage: AIUsage | null;
  remaining: number;
  callAI: (prompt: string) => Promise<void>;
}

export function useAI(userId: string): UseAIResult {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [remaining, setRemaining] = useState(10);

  const callAI = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userId,
          maxTokens: 1000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI call failed');
      }

      setResult(data.result);
      setUsage(data.usage);
      setRemaining(data.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    result,
    loading,
    error,
    usage,
    remaining,
    callAI,
  };
}

// Usage example:
/*
import { useAI } from '@/hooks/useAI';

function MyComponent() {
  const { result, loading, error, usage, remaining, callAI } = useAI('user-123');

  return (
    <div>
      <button onClick={() => callAI('Summarize this text')} disabled={loading}>
        {loading ? 'Processing...' : 'Call AI'}
      </button>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && <p>{result}</p>}
      {usage && (
        <p>
          Tokens: {usage.tokens.toLocaleString()} | 
          Cost: ${usage.cost.toFixed(4)} | 
          Remaining: {remaining}
        </p>
      )}
    </div>
  );
}
*/
