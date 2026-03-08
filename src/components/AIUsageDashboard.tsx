// Admin dashboard component for monitoring AI usage
// Add this to your admin panel

'use client';

import { useState, useEffect } from 'react';

interface DailyStats {
  date: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}

export function AIUsageDashboard() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ai');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.dailyUsage);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading usage stats...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!stats) return <div>No data available</div>;

  const MAX_TOKENS = 100000;
  const MAX_BUDGET = 50;
  
  const tokenPercent = (stats.totalTokens / MAX_TOKENS) * 100;
  const budgetPercent = (stats.totalCost / MAX_BUDGET) * 100;

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>AI Usage Dashboard</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Daily Usage ({stats.date})</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Tokens: {stats.totalTokens.toLocaleString()} / {MAX_TOKENS.toLocaleString()}</label>
          <div style={{ 
            width: '100%', 
            height: '20px', 
            background: '#eee',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(tokenPercent, 100)}%`,
              height: '100%',
              background: tokenPercent > 80 ? '#ef4444' : tokenPercent > 50 ? '#f59e0b' : '#22c55e',
              transition: 'width 0.3s'
            }} />
          </div>
          <span>{tokenPercent.toFixed(1)}%</span>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Cost: ${stats.totalCost.toFixed(4)} / ${MAX_BUDGET}</label>
          <div style={{ 
            width: '100%', 
            height: '20px', 
            background: '#eee',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(budgetPercent, 100)}%`,
              height: '100%',
              background: budgetPercent > 80 ? '#ef4444' : budgetPercent > 50 ? '#f59e0b' : '#22c55e',
              transition: 'width 0.3s'
            }} />
          </div>
          <span>{budgetPercent.toFixed(1)}%</span>
        </div>

        <div>
          <strong>Total Requests: {stats.requestCount}</strong>
        </div>
      </div>

      {budgetPercent > 80 && (
        <div style={{ 
          padding: '10px', 
          background: '#fef2f2', 
          border: '1px solid #ef4444',
          borderRadius: '4px',
          color: '#dc2626'
        }}>
          ⚠️ WARNING: Daily budget at {budgetPercent.toFixed(0)}%. Consider throttling usage.
        </div>
      )}

      {budgetPercent > 50 && budgetPercent <= 80 && (
        <div style={{ 
          padding: '10px', 
          background: '#fffbeb', 
          border: '1px solid #f59e0b',
          borderRadius: '4px',
          color: '#d97706'
        }}>
          ℹ️ Daily budget at {budgetPercent.toFixed(0)}%.
        </div>
      )}
    </div>
  );
}

// Usage: Add this component to your admin dashboard page
