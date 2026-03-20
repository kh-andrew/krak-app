/**
 * Database schema types for KOMT
 * Generated from Supabase schema
 * 
 * DO NOT EDIT MANUALLY - Update via: npm run db:types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          shopifyId: string | null
          shopifyOrderNumber: string | null
          customerId: string | null
          totalAmount: number
          currency: string
          lineItems: Json | null
          status: 'RECEIVED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED'
          shopifySyncStatus: 'SYNCED' | 'FAILED' | 'PENDING' | null
          shopifyUpdatedAt: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          shopifyId?: string | null
          shopifyOrderNumber?: string | null
          customerId?: string | null
          totalAmount: number
          currency?: string
          lineItems?: Json | null
          status?: 'RECEIVED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED'
          shopifySyncStatus?: 'SYNCED' | 'FAILED' | 'PENDING' | null
          shopifyUpdatedAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          shopifyId?: string | null
          shopifyOrderNumber?: string | null
          customerId?: string | null
          totalAmount?: number
          currency?: string
          lineItems?: Json | null
          status?: 'RECEIVED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED'
          shopifySyncStatus?: 'SYNCED' | 'FAILED' | 'PENDING' | null
          shopifyUpdatedAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      customers: {
        Row: {
          id: string
          shopifyId: string | null
          email: string
          firstName: string | null
          lastName: string | null
          phone: string | null
          address: string | null
          city: string | null
          postalCode: string | null
          country: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          shopifyId?: string | null
          email: string
          firstName?: string | null
          lastName?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postalCode?: string | null
          country?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          shopifyId?: string | null
          email?: string
          firstName?: string | null
          lastName?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postalCode?: string | null
          country?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      deliveries: {
        Row: {
          id: string
          orderId: string
          assignedToId: string | null
          assignedAt: string | null
          deliveredAt: string | null
          deliveryAddress: string | null
          signatureUrl: string | null
          photoUrl: string | null
          latitude: number | null
          longitude: number | null
          deliveryNotesInternal: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          orderId: string
          assignedToId?: string | null
          assignedAt?: string | null
          deliveredAt?: string | null
          deliveryAddress?: string | null
          signatureUrl?: string | null
          photoUrl?: string | null
          latitude?: number | null
          longitude?: number | null
          deliveryNotesInternal?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          orderId?: string
          assignedToId?: string | null
          assignedAt?: string | null
          deliveredAt?: string | null
          deliveryAddress?: string | null
          signatureUrl?: string | null
          photoUrl?: string | null
          latitude?: number | null
          longitude?: number | null
          deliveryNotesInternal?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      Inventory: {
        Row: {
          id: string
          productId: string
          locationId: string
          currentStock: number
          reserved: number
          available: number
          reorderPoint: number | null
          reorderQty: number | null
          lastMovementAt: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          productId: string
          locationId: string
          currentStock?: number
          reserved?: number
          available?: number
          reorderPoint?: number | null
          reorderQty?: number | null
          lastMovementAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          productId?: string
          locationId?: string
          currentStock?: number
          reserved?: number
          available?: number
          reorderPoint?: number | null
          reorderQty?: number | null
          lastMovementAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      InventoryMovement: {
        Row: {
          id: string
          inventoryId: string
          type: 'in' | 'out' | 'adjustment'
          quantity: number
          reason: string | null
          notes: string | null
          performedBy: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          inventoryId: string
          type: 'in' | 'out' | 'adjustment'
          quantity: number
          reason?: string | null
          notes?: string | null
          performedBy?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          inventoryId?: string
          type?: 'in' | 'out' | 'adjustment'
          quantity?: number
          reason?: string | null
          notes?: string | null
          performedBy?: string | null
          createdAt?: string
        }
      }
      Product: {
        Row: {
          id: string
          sku: string
          name: string
          description: string | null
          basePrice: number
          costPrice: number
          isBundle: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          description?: string | null
          basePrice?: number
          costPrice?: number
          isBundle?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          description?: string | null
          basePrice?: number
          costPrice?: number
          isBundle?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      Location: {
        Row: {
          id: string
          code: string
          name: string
          type: 'warehouse' | 'store' | 'hub'
          address: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          type?: 'warehouse' | 'store' | 'hub'
          address?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          type?: 'warehouse' | 'store' | 'hub'
          address?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'admin' | 'driver' | 'staff' | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: 'admin' | 'driver' | 'staff' | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'admin' | 'driver' | 'staff' | null
          createdAt?: string
          updatedAt?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          orderId: string
          actorId: string | null
          actorEmail: string | null
          action: string
          entityType: string
          fieldName: string | null
          oldValue: string | null
          newValue: string | null
          notes: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          orderId: string
          actorId?: string | null
          actorEmail?: string | null
          action: string
          entityType: string
          fieldName?: string | null
          oldValue?: string | null
          newValue?: string | null
          notes?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          orderId?: string
          actorId?: string | null
          actorEmail?: string | null
          action?: string
          entityType?: string
          fieldName?: string | null
          oldValue?: string | null
          newValue?: string | null
          notes?: string | null
          createdAt?: string
        }
      }
      webhook_events: {
        Row: {
          id: string
          shopifyId: string | null
          topic: string
          payload: Json
          processed: boolean
          createdAt: string
        }
        Insert: {
          id?: string
          shopifyId?: string | null
          topic: string
          payload?: Json
          processed?: boolean
          createdAt?: string
        }
        Update: {
          id?: string
          shopifyId?: string | null
          topic?: string
          payload?: Json
          processed?: boolean
          createdAt?: string
        }
      }
    }
  }
}

// Helper types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Common table types
export type Order = Tables<'orders'>
export type Customer = Tables<'customers'>
export type Delivery = Tables<'deliveries'>
export type Inventory = Tables<'Inventory'>
export type InventoryMovement = Tables<'InventoryMovement'>
export type Product = Tables<'Product'>
export type Location = Tables<'Location'>
export type User = Tables<'users'>
export type ActivityLog = Tables<'activity_logs'>
export type WebhookEvent = Tables<'webhook_events'>
