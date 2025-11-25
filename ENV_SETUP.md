# Hướng Dẫn Thiết Lập Biến Môi Trường

## Tạo file .env

Tạo file `.env` trong thư mục gốc của dự án với nội dung sau:

```env
# Supabase Configuration
# Lấy các giá trị này từ Supabase Dashboard: https://app.supabase.com

# Project URL - Tìm trong Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Anon/Public Key - Tìm trong Settings > API > Project API keys > anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key - Tìm trong Settings > API > Project API keys > service_role (BẢO MẬT - không chia sẻ)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Cách lấy thông tin từ Supabase

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn (hoặc tạo project mới)
3. Vào **Settings** > **API**
4. Tìm các giá trị sau:
   - **Project URL**: Copy từ "Project URL"
   - **Anon Key**: Copy từ "Project API keys" > "anon" > "public"
   - **Service Role Key**: Copy từ "Project API keys" > "service_role" (⚠️ BẢO MẬT - không chia sẻ key này)

## Lưu ý

- File `.env` đã được thêm vào `.gitignore` nên sẽ không bị commit lên Git
- Không chia sẻ file `.env` hoặc các key trong đó
- Sau khi tạo file `.env`, khởi động lại server development (`npm run dev`)

