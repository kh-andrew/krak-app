'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SignatureCanvas from 'react-signature-canvas'

interface OrderDetailPageProps {
  order: {
    id: string
    shopifyId: string
    shopifyOrderNumber: string | null
    status: string
    totalAmount: number
    currency: string
    lineItems: any[]
    createdAt: string
    updatedAt: string
    customer: {
      firstName: string | null
      lastName: string | null
      email: string
      phone: string | null
      address: string | null
      city: string | null
      postalCode: string | null
      country: string | null
    } | null
    delivery: {
      id: string
      deliveryAddress: string
      deliveryNotes: string | null
      assignedTo: { name: string; email: string } | null
      signatureUrl: string | null
      photoUrl: string | null
      deliveredAt: string | null
      latitude: number | null
      longitude: number | null
    } | null
    activityLogs: Array<{
      id: string
      action: string
      details: any
      createdAt: string
      actor: { name: string | null; email: string } | null
    }>
  }
  users: Array<{ id: string; name: string | null; email: string }>
}

const STATUS_FLOW: Record<string, { label: string; color: string; next: string[] }> = {
  RECEIVED: { label: 'Received', color: 'bg-blue-100 text-blue-800', next: ['PREPARING'] },
  PREPARING: { label: 'Preparing', color: 'bg-yellow-100 text-yellow-800', next: ['OUT_FOR_DELIVERY'] },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800', next: ['DELIVERED', 'FAILED'] },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', next: [] },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800', next: ['OUT_FOR_DELIVERY'] },
}

export default function OrderDetailClient({ order, users }: OrderDetailPageProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSignature, setShowSignature] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  
  const signatureRef = useRef<SignatureCanvas>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const currentStatus = STATUS_FLOW[order.status]
  
  async function updateStatus(newStatus: string) {
    setIsUpdating(true)
    
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setIsUpdating(false)
    }
  }
  
  async function assignDelivery(userId: string) {
    setIsUpdating(true)
    
    try {
      const formData = new FormData()
      formData.append('action', 'assign')
      formData.append('userId', userId)
      
      const res = await fetch(`/api/orders/${order.id}/delivery`, {
        method: 'POST',
        body: formData,
      })
      
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setIsUpdating(false)
    }
  }
  
  function clearSignature() {
    signatureRef.current?.clear()
  }
  
  async function startCamera() {
    setShowCamera(true)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      // Get location
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log('Location not available')
      )
    } catch (err) {
      console.error('Camera error:', err)
    }
  }
  
  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)
      
      const dataUrl = canvas.toDataURL('image/jpeg')
      setCapturedPhoto(dataUrl)
      
      // Stop camera
      const stream = video.srcObject as MediaStream
      stream?.getTracks().forEach(track => track.stop())
      setShowCamera(false)
    }
  }
  
  async function completeDelivery() {
    setIsUpdating(true)
    
    try {
      const formData = new FormData()
      formData.append('action', 'complete')
      
      // Add signature if exists
      if (signatureRef.current && !signatureRef.current.isEmpty()) {
        const signatureData = signatureRef.current.toDataURL()
        formData.append('signatureDataUrl', signatureData)
      }
      
      // Add photo if captured
      if (capturedPhoto) {
        const response = await fetch(capturedPhoto)
        const blob = await response.blob()
        formData.append('photo', blob, 'delivery.jpg')
      }
      
      // Add notes
      if (deliveryNotes) {
        formData.append('notes', deliveryNotes)
      }
      
      // Add location
      if (location) {
        formData.append('latitude', location.lat.toString())
        formData.append('longitude', location.lng.toString())
      }
      
      const res = await fetch(`/api/orders/${order.id}/delivery`, {
        method: 'POST',
        body: formData,
      })
      
      if (res.ok) {
        router.refresh()
        setShowSignature(false)
        setCapturedPhoto(null)
      }
    } finally {
      setIsUpdating(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.shopifyOrderNumber || order.id.slice(0, 8)}
          </h1>
          <p className="text-gray-600">
            Shopify ID: {order.shopifyId}
          </p>
        </div>
        
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${currentStatus?.color}`}>
          {currentStatus?.label || order.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Order Details */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">Order Details</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: order.currency,
                }).format(Number(order.totalAmount))}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Line Items</h3>
            <ul className="space-y-1">
              {order.lineItems.map((item: any, idx: number) => (
                <li key={idx} className="text-sm text-gray-600">
                  {item.quantity}x {item.title} ({item.sku || 'No SKU'})
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Customer Details */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">Customer</h2>
          
          {order.customer ? (
            <div className="space-y-2">
              <p className="font-medium">
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p className="text-gray-600">{order.customer.email}</p>
              {order.customer.phone && (
                <p className="text-gray-600">{order.customer.phone}</p>
              )}
              <div className="text-sm text-gray-600">
                {order.customer.address && <p>{order.customer.address}</p>}
                {order.customer.city && order.customer.postalCode && (
                  <p>{order.customer.city}, {order.customer.postalCode}</p>
                )}
                {order.customer.country && <p>{order.customer.country}</p>}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No customer information</p>
          )}
        </div>
      </div>
      
      {/* Delivery Section */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold">Delivery</h2>
        
        {order.delivery ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Delivery Address</p>
                <p>{order.delivery.deliveryAddress}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Assigned To</p>
                <p>{order.delivery.assignedTo?.name || 'Unassigned'}</p>
              </div>
            </div>
            
            {/* Assignment */}
            {order.status !== 'DELIVERED' && (
              <div className="flex items-center gap-4">
                <select
                  onChange={(e) => assignDelivery(e.target.value)}
                  disabled={isUpdating}
                  className="border rounded px-3 py-2"
                  defaultValue=""
                >
                  <option value="" disabled>Assign to...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Delivery Proof */}
            {(order.delivery.signatureUrl || order.delivery.photoUrl) && (
              <div className="grid grid-cols-2 gap-4">
                {order.delivery.signatureUrl && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Signature</p>
                    <img
                      src={order.delivery.signatureUrl}
                      alt="Customer signature"
                      className="border rounded max-h-32"
                    />
                  </div>
                )}
                
                {order.delivery.photoUrl && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Delivery Photo</p>
                    <img
                      src={order.delivery.photoUrl}
                      alt="Delivery proof"
                      className="border rounded max-h-32"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Complete Delivery */}
            {order.status === 'OUT_FOR_DELIVERY' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Complete Delivery</h3>
                
                {/* Signature */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Customer Signature</p>
                  
                  {!showSignature ? (
                    <button
                      onClick={() => setShowSignature(true)}
                      className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Capture Signature
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="border rounded">
                        <SignatureCanvas
                          ref={signatureRef}
                          canvasProps={{
                            className: 'w-full h-40',
                          }}
                        />
                      </div>
                      <button
                        onClick={clearSignature}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Photo */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Delivery Photo</p>
                  
                  {!capturedPhoto && !showCamera ? (
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Take Photo
                    </button>
                  ) : showCamera ? (
                    <div className="space-y-2">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-md border rounded"
                      />
                      <button
                        onClick={capturePhoto}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Capture
                      </button>
                    </div>
                  ) : (
                    <div>
                      <img
                        src={capturedPhoto!}
                        alt="Captured"
                        className="max-h-40 border rounded"
                      />
                      <button
                        onClick={() => setCapturedPhoto(null)}
                        className="text-sm text-gray-600 hover:text-gray-900 mt-2"
                      >
                        Retake
                      </button>
                    </div>
                  )}
                  
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                {/* Notes */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Delivery Notes</p>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    placeholder="Any notes about the delivery..."
                  />
                </div>
                
                {location && (
                  <p className="text-sm text-gray-500">
                    Location captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                )}
                
                <button
                  onClick={completeDelivery}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Completing...' : 'Mark as Delivered'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No delivery information</p>
        )}
      </div>
      
      {/* Status Actions */}
      {currentStatus?.next.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Update Status</h2>
          
          <div className="flex gap-2">
            {currentStatus.next.map((nextStatus) => (
              <button
                key={nextStatus}
                onClick={() => updateStatus(nextStatus)}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Mark as {STATUS_FLOW[nextStatus]?.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Activity Log */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
        
        <div className="space-y-3">
          {order.activityLogs.map((log) => (
            <div key={log.id} className="flex justify-between items-start py-2 border-b last:border-0">
              <div>
                <p className="font-medium">
                  {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                {log.actor && (
                  <p className="text-sm text-gray-600">
                    by {log.actor.name || log.actor.email}
                  </p>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
