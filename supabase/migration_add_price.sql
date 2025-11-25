-- Migration: Thêm cột price vào bảng lunch_entries
-- Chạy file này trong Supabase SQL Editor sau khi đã chạy schema.sql

-- Thêm cột price (INTEGER, nullable, mặc định NULL)
ALTER TABLE lunch_entries 
ADD COLUMN IF NOT EXISTS price INTEGER;

-- Cập nhật comment cho cột (tùy chọn)
COMMENT ON COLUMN lunch_entries.price IS 'Giá tiền mỗi suất ăn (VND). Nếu NULL, sẽ dùng giá mặc định khi tính nợ.';

