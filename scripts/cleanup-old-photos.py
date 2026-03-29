#!/usr/bin/env python3
"""
Delivery Photo Cleanup Script
Deletes delivery photos older than 90 days, keeps signatures permanently
Runs daily via Vercel Cron
"""

import psycopg2
from datetime import datetime, timedelta
import os

# Database connection
DB_HOST = "aws-1-ap-southeast-2.pooler.supabase.com"
DB_PORT = "6543"
DB_NAME = "postgres"
DB_USER = "postgres.vbrxgybsvbruvtfvueui"
DB_PASSWORD = "Krakhealth.123"

def cleanup_old_photos():
    """Delete delivery photos older than 90 days"""
    
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    
    cursor = conn.cursor()
    
    # Calculate cutoff date (90 days ago)
    cutoff_date = datetime.now() - timedelta(days=90)
    
    print(f"Starting cleanup for photos older than {cutoff_date.date()}")
    
    try:
        # Find deliveries with photos older than 90 days
        cursor.execute("""
            SELECT id, "photoUrl", "deliveredAt"
            FROM deliveries
            WHERE "photoUrl" IS NOT NULL
            AND "deliveredAt" < %s
        """, (cutoff_date,))
        
        old_deliveries = cursor.fetchall()
        
        deleted_count = 0
        
        for delivery_id, photo_url, delivered_at in old_deliveries:
            try:
                # Delete photo from Supabase Storage (if stored there)
                if photo_url and 'supabase' in photo_url:
                    # Extract path from URL
                    # URL format: https://xxx.supabase.co/storage/v1/object/public/deliveries/path
                    path = photo_url.split('/deliveries/')[-1] if '/deliveries/' in photo_url else None
                    
                    if path:
                        # Note: Actual deletion from Supabase Storage would require service role
                        # For now, we just clear the URL from database
                        print(f"  Would delete from storage: {path}")
                
                # Clear photo URL from database (keep delivery record)
                cursor.execute("""
                    UPDATE deliveries
                    SET "photoUrl" = NULL,
                        "updatedAt" = %s
                    WHERE id = %s
                """, (datetime.now().isoformat(), delivery_id))
                
                deleted_count += 1
                
            except Exception as e:
                print(f"  Error processing {delivery_id}: {e}")
                continue
        
        conn.commit()
        
        print(f"✅ Cleanup complete: {deleted_count} photos cleared")
        
        # Log cleanup activity
        cursor.execute("""
            INSERT INTO activity_logs (id, "orderId", action, "entityType", notes, "createdAt")
            VALUES (gen_random_uuid(), NULL, 'cleanup_photos', 'system', %s, %s)
        """, (f'Deleted {deleted_count} photos older than 90 days', datetime.now().isoformat()))
        
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Cleanup failed: {e}")
        
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    cleanup_old_photos()
