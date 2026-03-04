'use client';

import React, { useRef, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useRouter } from 'next/navigation';

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
  const [isAssigning, setIsAssigning] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState(order.deliveries?.deliveryNotes || '');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(order.deliveries?.photoUrl || null);
  const [signatureData, setSignatureData] = useState<string | null>(order.deliveries?.signatureUrl || null);
  const [activeTab, setActiveTab] = useState<'details' | 'delivery'>('details');

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

  const handleRefresh = () => {
    router.refresh();
  };

  const handleAssignDelivery = useCallback(async (userId: string) => {
    setIsAssigning(true);
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
      alert('Failed to assign driver');
    } finally {
      setIsAssigning(false);
    }
  }, [order.id, router]);

  const handleCompleteDelivery = useCallback(async () => {
    if (!signatureData && !capturedPhoto) {
      alert('Please provide a signature or photo to complete delivery');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create FormData - send base64 directly (faster than blob conversion)
      const formData = new FormData();
      formData.append('action', 'complete');
      if (signatureData) {
        formData.append('signatureDataUrl', signatureData);
      }
      if (capturedPhoto) {
        // Extract base64 data and send as string
        const base64Data = capturedPhoto.split(',')[1];
        formData.append('photoBase64', base64Data);
      }
      if (deliveryNotes) {
        formData.append('notes', deliveryNotes);
      }

      const response = await fetch(`/api/orders/${order.id}/delivery`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to complete delivery');
      }
      
      // Redirect to orders page after successful delivery
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing delivery:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete delivery');
    } finally {
      setIsSubmitting(false);
    }
  }, [order.id, signatureData, capturedPhoto, deliveryNotes, router]);

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

  const customerName = order.customers 
    ? `${order.customers.firstName || ''} ${order.customers.lastName || ''}`.trim() || 'Unknown'
    : 'Unknown';

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Header with Refresh */}
      <div className="bg-[#141414] border-b border-[#2A2A2A] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">
              Order {order.shopifyOrderNumber || order.shopifyId.slice(0, 8)}
            </h1>
            <p className="text-gray-400 text-sm">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex border-b border-[#2A2A2A] bg-[#141414]">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'details'
              ? 'text-[#FF6B4A] border-b-2 border-[#FF6B4A]'
              : 'text-gray-400'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'delivery'
              ? 'text-[#FF6B4A] border-b-2 border-[#FF6B4A]'
              : 'text-gray-400'
          }`}
        >
          Delivery
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <>
            {/* Customer Info */}
            <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
              <h2 className="text-base font-semibold text-white mb-3">Customer</h2>
              <div className="space-y-2 text-sm">
                <p className="text-white font-medium">{customerName}</p>
                <p className="text-gray-400">{order.customers?.email}</p>
                {order.customers?.phone && (
                  <p className="text-gray-400">{order.customers.phone}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  {order.customers?.address}
                  {order.customers?.city && `, ${order.customers.city}`}
                  {order.customers?.postalCode && ` ${order.customers.postalCode}`}
                  {order.customers?.country && `, ${order.customers.country}`}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
              <h2 className="text-base font-semibold text-white mb-3">Items</h2>
              <div className="space-y-3">
                {order.lineItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-start py-2 border-b border-[#2A2A2A] last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity} {item.sku && `• ${item.sku}`}</p>
                    </div>
                    <p className="text-sm text-white ml-4">${parseFloat(item.price).toFixed(2)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3">
                  <p className="font-semibold text-white">Total</p>
                  <p className="font-semibold text-white">${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
              <h2 className="text-base font-semibold text-white mb-3">Activity</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {order.activity_logs.length === 0 ? (
                  <p className="text-gray-400 text-sm">No activity yet.</p>
                ) : (
                  order.activity_logs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 mt-2 rounded-full bg-[#FF6B4A] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{log.action}</p>
                        {log.notes && <p className="text-xs text-gray-500">{log.notes}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          {log.users?.name || 'System'} • {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Delivery Tab */}
        {activeTab === 'delivery' && (
          <>
            {/* Delivery Info */}
            <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
              <h2 className="text-base font-semibold text-white mb-3">Delivery Info</h2>
              
              {order.deliveries ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Address</p>
                    <p className="text-gray-300">{order.deliveries.deliveryAddress}</p>
                  </div>
                  
                  {order.deliveries.users && (
                    <div className="bg-[#FF6B4A]/10 border border-[#FF6B4A]/30 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Currently Assigned To</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-8 h-8 rounded-full bg-[#FF6B4A] flex items-center justify-center text-sm font-medium text-white">
                          {(order.deliveries.users.name || order.deliveries.users.email).charAt(0).toUpperCase()}
                        </div>
                        <p className="text-white font-medium">
                          {order.deliveries.users.name || order.deliveries.users.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Assign Driver */}
                  <div className="pt-3 border-t border-[#2A2A2A]">
                    <p className="text-sm font-medium text-white mb-2">{order.deliveries.users ? 'Change Driver' : 'Assign Driver'}</p>
                    {isAssigning && (
                      <p className="text-xs text-gray-400 mb-2">Assigning...</p>
                    )}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {users.map((user) => {
                        const isAssigned = order.deliveries?.users?.email === user.email;
                        return (
                          <button
                            key={user.id}
                            onClick={() => !isAssigned && handleAssignDelivery(user.id)}
                            disabled={isAssigned || isAssigning}
                            className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                              isAssigned
                                ? 'border-[#FF6B4A] bg-[#FF6B4A]/20 cursor-default'
                                : 'border-[#2A2A2A] hover:border-[#FF6B4A]/50 hover:bg-[#1A1A1A]'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                              isAssigned ? 'bg-[#FF6B4A] text-white' : 'bg-[#2A2A2A] text-gray-400'
                            }`}>
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className={`text-sm truncate ${isAssigned ? 'text-white font-medium' : 'text-gray-300'}`}>
                                {user.name || 'Unnamed'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            {isAssigned && (
                              <span className="text-[#FF6B4A] text-xs font-bold flex-shrink-0 bg-[#FF6B4A]/20 px-2 py-1 rounded">
                                ✓ ASSIGNED
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No delivery info available.</p>
              )}
            </div>

            {/* Complete Delivery */}
            {order.deliveries && order.status !== 'DELIVERED' && (
              <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
                <h2 className="text-base font-semibold text-white mb-4">Complete Delivery</h2>
                
                {/* Signature Pad */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Customer Signature {signatureData && <span className="text-[#22C55E]">✓</span>}
                  </label>
                  <div className="border-2 border-[#2A2A2A] rounded-lg overflow-hidden bg-white touch-none">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: 'w-full h-40 touch-none',
                        style: { touchAction: 'none' }
                      }}
                      backgroundColor="white"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={clearSignature}
                      className="flex-1 px-3 py-2 text-sm text-gray-400 border border-[#2A2A2A] rounded-lg hover:bg-[#1A1A1A]"
                    >
                      Clear
                    </button>
                    <button
                      onClick={saveSignature}
                      className="flex-1 px-3 py-2 text-sm text-[#FF6B4A] border border-[#FF6B4A]/30 rounded-lg hover:bg-[#FF6B4A]/10"
                    >
                      Save Signature
                    </button>
                  </div>
                </div>

                {/* Photo Capture / Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Delivery Photo {capturedPhoto && <span className="text-[#22C55E]">✓</span>}
                  </label>
                  
                  {/* Hidden inputs for camera and file upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoCapture}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  {!capturedPhoto ? (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Camera Button */}
                      <button
                        onClick={triggerCamera}
                        className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-[#2A2A2A] rounded-lg hover:border-[#FF6B4A]/50 hover:bg-[#1A1A1A] transition-colors"
                      >
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-400 text-sm">Take Photo</span>
                      </button>
                      
                      {/* Upload Button */}
                      <label 
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-[#2A2A2A] rounded-lg hover:border-[#3B82F6]/50 hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                      >
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-gray-400 text-sm">Upload Photo</span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={capturedPhoto}
                        alt="Delivery"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setCapturedPhoto(null)}
                        className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Add any delivery notes..."
                    rows={3}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6B4A]"
                  />
                </div>

                {/* Complete Button */}
                <button
                  onClick={handleCompleteDelivery}
                  disabled={isSubmitting || (!signatureData && !capturedPhoto)}
                  className={`w-full py-4 px-4 rounded-lg font-bold text-lg text-white transition-all ${
                    isSubmitting || (!signatureData && !capturedPhoto)
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-[#22C55E] hover:bg-[#16A34A] active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    '✓ Mark as Delivered'
                  )}
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-2">
                  {signatureData && capturedPhoto 
                    ? 'Signature + Photo ready'
                    : signatureData 
                      ? 'Signature ready (photo optional)'
                      : capturedPhoto
                        ? 'Photo ready (signature optional)'
                        : 'Signature or photo required'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
