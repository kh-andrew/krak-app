-- Reset all inventory quantities to 0
UPDATE inventory SET "currentStock" = 0, "reserved" = 0, "available" = 0;

-- Also clear inventory movements for clean slate
DELETE FROM inventory_movements;