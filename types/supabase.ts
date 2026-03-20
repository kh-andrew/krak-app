// Generated types for Supabase database
// Based on KOMT database schema

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
          lineItems: any
          status: string
          shopifySyncStatus: string | null
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
          lineItems?: any
          status?: string
          shopifySyncStatus?: string | null
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
          lineItems?: any
          status?: string
          shopifySyncStatus?: string | null
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
          type: string
          quantity: number
          reason: string | null
          notes: string | null
          performedBy: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          inventoryId: string
          type: string
          quantity: number
          reason?: string | null
          notes?: string | null
          performedBy?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          inventoryId?: string
          type?: string
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
          type: string
          address: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          type?: string
          address?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          type?: string
          address?: string | null
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
          payload: any
          processed: boolean
          createdAt: string
        }
        Insert: {
          id?: string
          shopifyId?: string | null
          topic: string
          payload?: any
          processed?: boolean
          createdAt?: string
        }
        Update: {
          id?: string
          shopifyId?: string | null
          topic?: string
          payload?: any
          processed?: boolean
          createdAt?: string
        }
      }
    }
  }
}
