# Hướng Dẫn Thiết Lập Supabase Database

## Bước 1: Tạo Project Supabase

1. Truy cập [https://supabase.com](https://supabase.com)
2. Đăng nhập hoặc đăng ký tài khoản
3. Tạo một project mới:
   - Click "New Project"
   - Điền tên project
   - Chọn database password (lưu lại password này)
   - Chọn region gần bạn nhất
   - Click "Create new project"

## Bước 2: Chạy SQL Schema

1. Sau khi project được tạo, vào **SQL Editor** (menu bên trái)
2. Click **New Query**
3. Copy toàn bộ nội dung từ file `supabase/schema.sql` trong dự án
4. Paste vào SQL Editor
5. Click **Run** hoặc nhấn `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Bước 2.1: Chạy Migration thêm trường Price (Nếu đã có database)

Nếu bạn đã chạy schema.sql trước đó và muốn thêm tính năng giá tiền cho mỗi mục:
1. Vào **SQL Editor**
2. Copy nội dung từ file `supabase/migration_add_price.sql`
3. Paste và chạy trong SQL Editor

## Bước 3: Kiểm tra Tables đã được tạo

1. Vào **Table Editor** (menu bên trái)
2. Bạn sẽ thấy 2 bảng:
   - `members` - Quản lý thành viên
   - `lunch_entries` - Quản lý đơn đặt ăn trưa

## Bước 4: Lấy API Keys

1. Vào **Settings** (biểu tượng bánh răng) > **API**
2. Copy các giá trị sau:
   - **Project URL** → Dán vào `NEXT_PUBLIC_SUPABASE_URL` trong file `.env`
   - **anon public** key → Dán vào `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong file `.env`
   - **service_role** key → Dán vào `SUPABASE_SERVICE_ROLE_KEY` trong file `.env`

## Bước 5: Kiểm tra Row Level Security (RLS)

RLS đã được bật trong schema, nhưng nếu bạn muốn kiểm tra:

1. Vào **Authentication** > **Policies**
2. Bạn sẽ thấy các policies đã được tạo tự động

## Lưu ý quan trọng

- **Service Role Key** là key có quyền cao nhất, KHÔNG BAO GIỜ chia sẻ hoặc commit lên Git
- Nếu gặp lỗi khi chạy SQL, kiểm tra:
  - Bạn đã chọn đúng database trong SQL Editor chưa
  - Có lỗi syntax nào trong SQL không
  - Xem tab "Error" trong SQL Editor để biết chi tiết lỗi

## Troubleshooting

### Lỗi: "Could not find the table 'public.members'"
- **Nguyên nhân**: Bảng chưa được tạo trong database
- **Giải pháp**: Chạy lại file `supabase/schema.sql` trong SQL Editor

### Lỗi: "permission denied for table"
- **Nguyên nhân**: RLS policies chưa được cấu hình đúng
- **Giải pháp**: Kiểm tra lại phần RLS policies trong schema.sql đã chạy thành công chưa

### Lỗi kết nối Supabase
- Kiểm tra file `.env` đã được tạo và điền đúng thông tin chưa
- Kiểm tra Project URL và API keys có đúng không
- Đảm bảo project Supabase vẫn đang hoạt động (không bị pause)

