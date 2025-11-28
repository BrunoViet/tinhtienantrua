-- Payments table to track debt payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount INTEGER NOT NULL, -- Số tiền đã thanh toán (VND)
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_start_date ON payments(start_date);
CREATE INDEX IF NOT EXISTS idx_payments_end_date ON payments(end_date);
CREATE INDEX IF NOT EXISTS idx_payments_date_range ON payments(start_date, end_date);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all operations for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on payments" ON payments
  FOR ALL USING (true) WITH CHECK (true);

