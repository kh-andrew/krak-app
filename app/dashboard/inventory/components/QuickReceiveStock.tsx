'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickReceiveStock() {
  const router = useRouter();
  const [sku, setSku] = useState('KFSB');
  const [quantity, setQuantity] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReceive = async () => {
    if (!quantity || !batchCode) {
      setMessage('Enter quantity and batch code');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/inventory/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          quantity: parseInt(quantity),
          batchCode: batchCode.toUpperCase(),
          notes
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      let bottles = parseInt(quantity);
      if (sku === 'KFSP') bottles *= 12;
      if (sku === 'KFSB') bottles *= 240;

      setMessage(`✓ Received ${quantity} ${sku} (${bottles} bottles)`);
      setQuantity('');
      setBatchCode('');
      setNotes('');
      router.refresh();

    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4 space-y-3">
      <h3 className="text-white font-medium">Quick Receive</h3>
      
      {message && (
        <p className={`text-sm ${message.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}

      {/* SKU */}
      <select 
        value={sku} 
        onChange={(e) => setSku(e.target.value)}
        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white"
      >
        <option value="KFSS">KFSS — Single</option>
        <option value="KFSP">KFSP — Pack (12x)</option>
        <option value="KFSB">KFSB — Box (240x)</option>
      </select>

      {/* Quantity */}
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Qty"
        min="1"
        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500"
      />

      {/* Batch Code */}
      <input
        type="text"
        value={batchCode}
        onChange={(e) => setBatchCode(e.target.value)}
        placeholder="Batch code (e.g., B-20260301-A)"
        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 uppercase"
      />

      {/* Notes */}
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500"
      />

      {/* Button */}
      <button
        onClick={handleReceive}
        disabled={loading}
        className={`w-full py-2 rounded-lg font-medium text-white ${
          loading ? 'bg-gray-600' : 'bg-[#22C55E] hover:bg-[#16A34A]'
        }`}
      >
        {loading ? '...' : 'Receive'}
      </button>
    </div>
  );
}
