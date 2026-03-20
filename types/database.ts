/**
 * Database schema types for KOMT
 * Properly structured for Supabase postgrest-js
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
        Relationships: [
          {
            foreignKeyName: "orders_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "deliveries_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "Inventory_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Inventory_locationId_fkey"
            columns: ["locationId"]
            isOneToOne: false
            referencedRelation: "Location"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "InventoryMovement_inventoryId_fkey"
            columns: ["inventoryId"]
            isOneToOne: false
            referencedRelation: "Inventory"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "activity_logs_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
      }
      Batch: {
        Row: {
          id: string
          batchCode: string
          productId: string
          locationId: string
          initialQty: number
          remainingQty: number
          status: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          batchCode: string
          productId: string
          locationId: string
          initialQty: number
          remainingQty: number
          status?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          batchCode?: string
          productId?: string
          locationId?: string
          initialQty?: number
          remainingQty?: number
          status?: string
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Batch_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Batch_locationId_fkey"
            columns: ["locationId"]
            isOneToOne: false
            referencedRelation: "Location"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
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
