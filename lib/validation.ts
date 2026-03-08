// Input sanitization and validation utilities
// Prevents XSS, injection attacks, and data corruption

import { z } from 'zod'

// Email validation with stricter rules
export const emailSchema = z
  .string()
  .min(5)
  .max(254)
  .email()
  .transform((email) => email.toLowerCase().trim())

// Password validation
export const passwordSchema = z
  .string()
  .min(6)
  .max(128)

// UUID validation
export const uuidSchema = z
  .string()
  .uuid()

// SKU validation (alphanumeric, dashes, underscores)
export const skuSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[A-Z0-9-_]+$/)
  .transform((sku) => sku.toUpperCase())

// Quantity validation (positive integer, max 1 million)
export const quantitySchema = z
  .number()
  .int()
  .min(1)
  .max(1000000)

// Notes validation (max 5000 chars, no HTML)
export const notesSchema = z
  .string()
  .max(5000)
  .transform((notes) => {
    // Strip HTML tags
    return notes.replace(/<[^\u003e]*>/g, '').trim()
  })

// Batch code validation
export const batchCodeSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[A-Z0-9-]+$/)
  .transform((code) => code.toUpperCase())

// Sanitize string for display (XSS prevention)
export function sanitizeDisplay(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Validate and sanitize search query
export function sanitizeSearchQuery(query: string | null): string {
  if (!query) return ''
  // Remove special characters that could be used for injection
  return query
    .replace(/[\u003c\u003e\"'%;()\u0026+]/g, '')
    .trim()
    .slice(0, 100) // Max 100 chars
}

// Validate order status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ['PREPARING'],
  PREPARING: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['OUT_FOR_DELIVERY'],
}

export function isValidStatusTransition(from: string, to: string): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from]
  return allowed?.includes(to) ?? false
}

// Validate GPS coordinates
export function isValidGPS(lat: number | null, lng: number | null): boolean {
  if (lat === null || lng === null) return true // Optional is valid
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

// Validate base64 image data
export function isValidBase64Image(data: string): boolean {
  if (!data.startsWith('data:image/')) return false
  const base64Pattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/
  return base64Pattern.test(data.slice(0, 100)) // Check beginning only
}

// Check for suspicious patterns (SQL injection, etc.)
export function containsSuspiciousPatterns(input: string): boolean {
  const suspicious = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /UNION\s+SELECT/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /DROP\s+TABLE/i,
  ]
  return suspicious.some((pattern) => pattern.test(input))
}

// Safe JSON parse with error handling
export function safeJsonParse<T>(json: string | null | undefined, defaultValue: T): T {
  if (!json) return defaultValue
  try {
    return JSON.parse(json) as T
  } catch {
    return defaultValue
  }
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}
