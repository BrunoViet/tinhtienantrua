#!/usr/bin/env node

/**
 * Script để tạo file .env từ template
 * Chạy: node setup-env.js
 */

const fs = require('fs');
const path = require('path');

const envContent = `# Supabase Configuration
# Lấy các giá trị này từ Supabase Dashboard: https://app.supabase.com

# Project URL - Tìm trong Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Anon/Public Key - Tìm trong Settings > API > Project API keys > anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key - Tìm trong Settings > API > Project API keys > service_role (BẢO MẬT - không chia sẻ)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
`;

const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  File .env đã tồn tại!');
  console.log('Nếu muốn tạo lại, hãy xóa file .env hiện tại trước.');
  process.exit(1);
}

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Đã tạo file .env thành công!');
  console.log('📝 Vui lòng mở file .env và điền các giá trị từ Supabase Dashboard của bạn.');
  console.log('🔗 Xem hướng dẫn chi tiết trong file ENV_SETUP.md');
} catch (error) {
  console.error('❌ Lỗi khi tạo file .env:', error.message);
  process.exit(1);
}

