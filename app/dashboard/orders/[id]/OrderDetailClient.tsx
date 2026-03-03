'use client';

import React, { useRef, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useRouter } from 'next/navigation';

// Types - matching the actual data structure from page.tsx
interface AssignedTo {
  name: string | null;
  email: string;
}

interface Delivery {
  id: string;
  deliveryAddress: string;
  deliveryNotes: string | null;
  assignedTo: AssignedTo | null;
  signatureUrl: string | null;
  photoUrl: string | null;
  deliveredAt: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Actor {
  name: string | null;
  email: string;
}

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  notes: string | null;
  createdAt: string;
  actor: Actor | null;
}

interface LineItem {
  title: string;
  quantity: number;
  price: string;
  sku: string | null;
}

interface Customer {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
}

interface Order {
  id: string;
  shopifyId: string;
  shopifyOrderNumber: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  lineItems: LineItem[];
  createdAt: string;
  updatedAt: string;
  customer: Customer | null;
  delivery: Delivery | null;
  activityLogs: ActivityLog[];
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface OrderDetailClientProps {
  order: Order;
  users: User[];
}

export default function OrderDetailClient({ order, users }: OrderDetailClientProps) {
  const router = useRouter();
  const signatureRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState(order.delivery?.deliveryNotes || '');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(order.delivery?.photoUrl || null);
  const [signatureData, setSignatureData] = useState<string | null>(order.delivery?.signatureUrl || null);

  const clearSignature = useCallback(() => {
    signatureRef.current?.clear();
    setSignatureData(null);
  }, []);

  const saveSignature = useCallback(() => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataUrl = signatureRef.current.toDataURL('image/png');
      setSignatureData(dataUrl);
    }
  }, []);

  const handlePhotoCapture = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const triggerCamera = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAssignDelivery = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/delivery/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) throw new Error('Failed to assign delivery');
      router.refresh();
    } catch (error) {
      console.error('Error assigning delivery:', error);
    }
  }, [order.id, router]);
  const handleCompleteDelivery = useCallback(async () => {
    if (!signatureData && !capturedPhoto) {
      alert('Please provide a signature or photo to complete delivery');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/orders/${order.id}/delivery/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureUrl: signatureData,
          photoUrl: capturedPhoto,
          notes: deliveryNotes,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to complete delivery');
      router.refresh();
    } catch (error) {
      console.error('Error completing delivery:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [order.id, signatureData, capturedPhoto, deliveryNotes, router]);

  // Status colors with good contrast for dark theme
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RECEIVED: 'bg-[#1A3A2F] text-[#22C55E] border border-[#22C55E]/30',
      PREPARING: 'bg-[#1A2A3A] text-[#3B82F6] border border-[#3B82F6]/30',
      OUT_FOR_DELIVERY: 'bg-[#3A2A1A] text-[#F59E0B] border border-[#F59E0B]/30',
      DELIVERED: 'bg-[#1A3A2F] text-[#22C55E] border border-[#22C55E]/30',
      FAILED: 'bg-[#3A1A1A] text-[#EF4444] border border-[#EF4444]/30',
    };
    return colors[status] || 'bg-[#2A2A2A] text-gray-300 border border-[#3A3A3A]';
  };

  const customerName = order.customer 
    ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Unknown'
    : 'Unknown';

  return (
    <div className="max-w-6xl mx-auto p-6 bg-[#0A0A0A] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Order {order.shopifyOrderNumber || order.shopifyId}
            </h1>
            <p className="text-gray-400 mt-1">
              Created on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
            <div className="space-y-3">
              <p className="text-gray-300">
                <span className="text-gray-500">Name:</span> {customerName}
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">Email:</span> {order.customer?.email || 'N/A'}
              </p>
              {order.customer?.phone && (
                <p className="text-gray-300">
                  <span className="text-gray-500">Phone:</span> {order.customer.phone}
                </p>
              )}
              <p className="text-gray-300">
                <span className="text-gray-500">Address:</span>{' '}
                {order.customer?.address || 'N/A'}
                {order.customer?.city && `, ${order.customer.city}`}
                {order.customer?.postalCode && ` ${order.customer.postalCode}`}
                {order.customer?.country && `, ${order.customer.country}`}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.lineItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-[#2A2A2A] last:border-0">
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-sm text-gray-400">Qty: {item.quantity} {item.sku && `• SKU: ${item.sku}`}</p>
                  </div>
                  <p className="font-medium text-white">${parseFloat(item.price).toFixed(2)}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-[#2A2A2A]">
                <p className="font-semibold text-white">Total</p>
                <p className="font-semibold text-white">${order.totalAmount.toFixed(2)} {order.currency}</p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Activity Log</h2>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {order.activityLogs.length === 0 ? (
                <p className="text-gray-400 text-sm">No activity recorded yet.</p>
              ) : (
                order.activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#FF6B4A]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{log.action}</p>
                      {log.fieldName && (
                        <p className="text-sm text-gray-400">
                          {log.fieldName}: {log.oldValue || '—'} → {log.newValue || '—'}
                        </p>
                      )}
                      {log.notes && <p className="text-sm text-gray-500">{log.notes}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        by {log.actor?.name || log.actor?.email || 'System'} • {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Delivery Management */}
              <div className="space-y-6">
          {/* Delivery Info */}
          <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Delivery Information</h2>
            
            {order.delivery ? (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">Delivery Address</p>
                  <p className="text-gray-300">{order.delivery.deliveryAddress}</p>
                </div>
                
                {order.delivery.assignedTo && (
                  <div>
                    <p className="text-gray-500 text-sm">Assigned To</p>
                    <p className="text-gray-300">
                      {order.delivery.assignedTo.name || order.delivery.assignedTo.email}
                    </p>
                  </div>
                )}

                {/* Assign Delivery */}
                <div className="pt-4 border-t border-[#2A2A2A]">
                  <p className="text-sm font-medium text-white mb-3">Assign to Driver:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleAssignDelivery(user.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          order.delivery?.assignedTo?.email === user.email
                            ? 'border-[#FF6B4A] bg-[#FF6B4A]/10'
                            : 'border-[#2A2A2A] hover:border-[#3A3A3A] hover:bg-[#1A1A1A]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center text-sm font-medium text-white">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-white">{user.name || 'Unnamed User'}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        {order.delivery?.assignedTo?.email === user.email && (
                          <span className="text-[#FF6B4A] text-sm font-medium">Assigned</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No delivery information available.</p>
            )}
          </div>

          {/* Delivery Completion - Signature & Photo */}
        {order.delivery && (
            <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Complete Delivery</h2>
              
              {/* Signature Pad */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Customer Signature
                </label>
                <div className="border-2 border-[#2A2A2A] rounded-lg overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: 'w-full h-48 cursor-crosshair',
                    }}
                    backgroundColor="white"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={clearSignature}
                    className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-[#2A2A2A] rounded-lg hover:bg-[#1A1A1A]"
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveSignature}
                    className="px-3 py-1.5 text-sm text-[#FF6B4A] hover:text-[#FF8566] border border-[#FF6B4A]/30 rounded-lg hover:bg-[#FF6B4A]/10"
                  >
                    Save Signature
                  </button>
                </div>
                {signatureData && (
                  <p className="text-sm text-[#22C55E] mt-2">✓ Signature captured</p>
                )}
              </div>

              {/* Photo Capture */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Delivery Photo (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"        
