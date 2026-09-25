-- =========================================================
-- MIGRATION: Consolidate beneficiary_verifications into beneficiary_history
-- =========================================================

DO $$
BEGIN
  -- 1. Ensure beneficiary_history table exists
  CREATE TABLE IF NOT EXISTS beneficiary_history (
    id SERIAL PRIMARY KEY,
    beneficiary_id INTEGER REFERENCES beneficiaries(id) ON DELETE CASCADE,
    application_id VARCHAR(100),
    program VARCHAR(100) NOT NULL,
    action VARCHAR(150) NOT NULL,
    performed_by VARCHAR(150) NOT NULL,
    status VARCHAR(50),
    detail TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_ben_history_ben_id ON beneficiary_history(beneficiary_id);
  CREATE INDEX IF NOT EXISTS idx_ben_history_created_at ON beneficiary_history(created_at DESC);

  -- 2. If legacy beneficiary_verifications table exists, migrate data into beneficiary_history
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'beneficiary_verifications') THEN
    INSERT INTO beneficiary_history (beneficiary_id, program, action, performed_by, status, detail, remarks, created_at)
    SELECT 
      bv.beneficiary_id,
      'Beneficiary Management',
      CASE 
        WHEN LOWER(COALESCE(bv.status, '')) = 'verified' THEN 'Beneficiary Verified'
        WHEN LOWER(COALESCE(bv.status, '')) = 'unverified' THEN 'Beneficiary Flagged Unverified'
        ELSE 'Beneficiary Under Review'
      END,
      COALESCE(bv.reviewed_by, 'System'),
      bv.status,
      COALESCE(bv.reason, bv.remarks, 'Verification record'),
      bv.remarks,
      COALESCE(bv.created_at, bv.reviewed_at, NOW())
    FROM beneficiary_verifications bv
    WHERE NOT EXISTS (
      SELECT 1 FROM beneficiary_history bh 
      WHERE bh.beneficiary_id = bv.beneficiary_id 
        AND bh.program = 'Beneficiary Management'
        AND bh.status = bv.status
    );

    -- 3. Drop legacy beneficiary_verifications table
    DROP TABLE IF EXISTS beneficiary_verifications CASCADE;
  END IF;
END $$;
