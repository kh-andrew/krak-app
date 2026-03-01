'use client';

import React, { useRef, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useRouter } from 'next/navigation';

// Types
interface AssignedTo {
  name: string | null;
  email: string;
}

interface Delivery {
  id: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  assignedTo: AssignedTo | null;
  signatureUrl: string | null;
  photoUrl: string | null;
  deliveredAt: string | null;
  notes: string | null;
}

interface Actor {
  name: string | null;
  email: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  actor: Actor | null;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
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
  const [deliveryNotes, setDeliveryNotes] = useState(order.delivery?.notes || '');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(order.delivery?.photoUrl || null);
  const [signatureData, setSignatureData] = useState<string | null>(order.delivery?.signatureUrl || null);
  const [selectedStatus, setSelectedStatus] = useState<Delivery['status']>(order.delivery?.status || 'pending');

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

  const handleStatusChange = useCallback(async (status: Delivery['status']) => {
    setSelectedStatus(status);
    
    try {
      const response = await fetch(`/api/orders/${order.id}/delivery/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, [order.id, router]);

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <p className="text-gray-500 mt-1">Created on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-2">
              <p className="text-gray-700"><span className="font-medium">Name:</span> {order.customer.name}</p>
              <p className="text-gray-700"><span className="font-medium">Email:</span> {order.customer.email}</p>
              {order.customer.phone && (
                <p className="text-gray-700"><span className="font-medium">Phone:</span> {order.customer.phone}</p>
              )}
              <p className="text-gray-700"><span className="font-medium">Address:</span> {order.customer.address}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900">${item.price.toFixed(2)}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <p className="font-semibold text-gray-900">Total</p>
                <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h2>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {order.activityLogs.length === 0 ? (
                <p className="text-gray-500 text-sm">No activity recorded yet.</p>
              ) : (
                order.activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      {log.details && <p className="text-sm text-gray-600">{log.details}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        by {log.actor?.name || log.actor?.email || 'Unknown'} • {new Date(log.createdAt).toLocaleString()}
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
          {/* Delivery Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status</h2>
            
            {order.delivery ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.delivery.status)}`}>
                    {order.delivery.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {order.delivery.assignedTo && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Assigned To:</span>
                    <span className="text-gray-900">
                      {order.delivery.assignedTo.name || order.delivery.assignedTo.email}
                    </span>
                  </div>
                )}

                {order.delivery.deliveredAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Delivered At:</span>
                    <span className="text-gray-900">
                      {new Date(order.delivery.deliveredAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Status Buttons */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Update Status:</p>
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'in_transit', 'delivered', 'failed', 'cancelled'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={selectedStatus === status}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          selectedStatus === status
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No delivery information available.</p>
            )}
          </div>

          {/* Assign Delivery */}
          {order.delivery && order.delivery.status !== 'delivered' && order.delivery.status !== 'cancelled' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Delivery</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAssignDelivery(user.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-md border transition-colors ${
                      order.delivery?.assignedTo?.email === user.email
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{user.name || 'Unnamed User'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {order.delivery?.assignedTo?.email === user.email && (
                      <span className="text-blue-600 text-sm font-medium">Assigned</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Completion - Signature & Photo */}
          {order.delivery && order.delivery.status !== 'delivered' && order.delivery.status !== 'cancelled' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Complete Delivery</h2>
              
              {/* Signature Pad */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Signature
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
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
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveSignature}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
                  >
                    Save Signature
                  </button>
                </div>
                {signatureData && (
                  <p className="text-sm text-green-600 mt-2">✓ Signature captured</p>
                )}
              </div>

              {/* Photo Capture */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Photo (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                <button
                  onClick={triggerCamera}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-600">Take Photo</span>
                </button>
                {capturedPhoto && (
                  <div className="mt-3">
                    <img
                      src={capturedPhoto}
                      alt="Delivery proof"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setCapturedPhoto(null)}
                      className="text-sm text-red-600 hover:text-red-800 mt-2"
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>

              {/* Delivery Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Notes
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Add any notes about the delivery..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Complete Button */}
              <button
                onClick={handleCompleteDelivery}
                disabled={isSubmitting || (!signatureData && !capturedPhoto)}
                className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                  isSubmitting || (!signatureData && !capturedPhoto)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting ? 'Completing...' : 'Mark as Delivered'}
              </button>
            </div>
          )}

          {/* Delivery Proof Display (if already delivered) */}
          {order.delivery?.status === 'delivered' && (order.delivery.signatureUrl || order.delivery.photoUrl) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Proof</h2>
              
              {order.delivery.signatureUrl && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Signature</p>
                  <img
                    src={order.delivery.signatureUrl}
                    alt="Customer signature"
                    className="w-full h-48 object-contain border border-gray-200 rounded-lg bg-white"
                  />
                </div>
              )}
              
              {order.delivery.photoUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Photo</p>
                  <img
                    src={order.delivery.photoUrl}
                    alt="Delivery photo"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {order.delivery.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Notes:</p>
                  <p className="text-sm text-gray-600 mt-1">{order.delivery.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
