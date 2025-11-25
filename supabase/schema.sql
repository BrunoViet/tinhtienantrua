-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Lunch entries table
CREATE TABLE IF NOT EXISTS lunch_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER, -- Giá tiền mỗi suất (VND). Nếu NULL, sẽ dùng giá mặc định khi tính nợ.
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(member_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lunch_entries_date ON lunch_entries(date);
CREATE INDEX IF NOT EXISTS idx_lunch_entries_member_id ON lunch_entries(member_id);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lunch_entries_updated_at BEFORE UPDATE ON lunch_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_entries ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on members" ON members
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on lunch_entries" ON lunch_entries
  FOR ALL USING (true) WITH CHECK (true);

