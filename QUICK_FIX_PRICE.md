# Khắc Phục Lỗi: Thiếu Cột 'price'

## Lỗi
```
Could not find the 'price' column of 'lunch_entries' in the schema cache
```

## Nguyên nhân
Cột `price` chưa được thêm vào bảng `lunch_entries` trong Supabase database.

## Giải pháp

### Cách 1: Chạy Migration SQL (Khuyến nghị)

1. Mở [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)
4. Click **New Query**
5. Copy và paste đoạn SQL sau:

```sql
-- Thêm cột price vào bảng lunch_entries
ALTER TABLE lunch_entries 
ADD COLUMN IF NOT EXISTS price INTEGER;

-- Cập nhật comment cho cột
COMMENT ON COLUMN lunch_entries.price IS 'Giá tiền mỗi suất ăn (VND). Nếu NULL, sẽ dùng giá mặc định khi tính nợ.';
```

6. Click **Run** hoặc nhấn `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
7. Đợi thông báo "Success" hoặc "Success. No rows returned"
8. Refresh lại ứng dụng

### Cách 2: Sử dụng file migration

1. Mở file `supabase/migration_add_price.sql` trong dự án
2. Copy toàn bộ nội dung
3. Paste vào Supabase SQL Editor
4. Chạy SQL

## Kiểm tra

Sau khi chạy SQL, bạn có thể kiểm tra:

1. Vào **Table Editor** trong Supabase
2. Chọn bảng `lunch_entries`
3. Xem cột `price` đã xuất hiện chưa

Hoặc chạy query này trong SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lunch_entries' 
AND column_name = 'price';
```

Nếu thấy kết quả có `price` với `data_type = integer` thì đã thành công!

## Lưu ý

- Migration này an toàn, không làm mất dữ liệu hiện có
- Các entry cũ sẽ có `price = NULL` (sẽ dùng giá mặc định khi tính nợ)
- Bạn có thể cập nhật giá cho các entry cũ sau

