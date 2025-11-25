# Quản Lí Tiền Ăn Trưa

Ứng dụng web quản lý tiền ăn trưa cho công ty, được xây dựng với Next.js và Supabase.

## Tính năng

### 1. Quản Lý Thành Viên (`/members`)
- Thêm, sửa, xóa thành viên
- Quản lý trạng thái hoạt động của thành viên
- Các trường: id, name, isActive

### 2. Quản Lý Lịch Ăn Trưa (`/calendar`)
- Giao diện lịch tuần (Thứ 2 - Chủ nhật)
- Xem danh sách thành viên đặt ăn trưa theo ngày
- Thêm, sửa, xóa mục ăn trưa
- Các trường: id, memberId, date, quantity (mặc định 1), note (tùy chọn)

### 3. Tính Nợ Tuần
- Tính toán tổng tiền mỗi thành viên nợ dựa trên số suất ăn trong tuần
- Giá mỗi suất: 30,000 VND (có thể cấu hình)
- Hiển thị bảng kết quả với tổng tiền

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Thiết lập Supabase

1. Tạo một project mới trên [Supabase](https://supabase.com)
2. Vào SQL Editor và chạy file `supabase/schema.sql` để tạo database schema
3. Lấy các thông tin sau từ Supabase Dashboard:
   - Project URL
   - Anon/Public Key
   - Service Role Key (từ Settings > API)

### 3. Cấu hình biến môi trường

Tạo file `.env.local` trong thư mục gốc:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Chạy ứng dụng

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## Cấu trúc dự án

```
.
├── app/
│   ├── api/
│   │   ├── members/          # API routes cho quản lý thành viên
│   │   ├── lunch-entries/    # API routes cho quản lý ăn trưa
│   │   └── weekly-debt/      # API tính nợ tuần
│   ├── calendar/             # Trang lịch ăn trưa
│   ├── members/              # Trang quản lý thành viên
│   ├── layout.tsx
│   ├── page.tsx              # Trang chủ
│   └── globals.css
├── lib/
│   ├── supabase.ts           # Supabase client configuration
│   └── types.ts              # TypeScript types
├── supabase/
│   └── schema.sql            # Database schema
└── package.json
```

## Database Schema

### Bảng `members`
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Bảng `lunch_entries`
- `id` (UUID, Primary Key)
- `member_id` (UUID, Foreign Key -> members.id)
- `date` (DATE)
- `quantity` (INTEGER, default: 1)
- `note` (TEXT, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- Unique constraint: (member_id, date)

## API Endpoints

### Members
- `GET /api/members` - Lấy danh sách thành viên
- `POST /api/members` - Tạo thành viên mới
- `GET /api/members/[id]` - Lấy thông tin thành viên
- `PUT /api/members/[id]` - Cập nhật thành viên
- `DELETE /api/members/[id]` - Xóa thành viên

### Lunch Entries
- `GET /api/lunch-entries?startDate=&endDate=` - Lấy danh sách mục ăn trưa
- `POST /api/lunch-entries` - Tạo mục ăn trưa mới
- `GET /api/lunch-entries/[id]` - Lấy thông tin mục ăn trưa
- `PUT /api/lunch-entries/[id]` - Cập nhật mục ăn trưa
- `DELETE /api/lunch-entries/[id]` - Xóa mục ăn trưa

### Weekly Debt
- `GET /api/weekly-debt?startDate=&endDate=&mealPrice=` - Tính nợ tuần

## Cấu hình

Giá mỗi suất ăn có thể được thay đổi trong file `lib/types.ts`:

```typescript
export const DEFAULT_MEAL_PRICE = 30000 // VND
```

## Công nghệ sử dụng

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Supabase** - Backend as a Service (Database, API)
- **Tailwind CSS** - Styling
- **date-fns** - Date manipulation
- **lucide-react** - Icons

## License

MIT

