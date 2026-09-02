-- PostgreSQL Migration Script for Solo Parent Applications
-- Aligned with the 3 official flows:
-- 1. New Application (New Solo Parent ID)
-- 2. Renewal of Solo Parent ID
-- 3. Replacement / Lost Solo Parent ID

-- Step 1: Ensure required columns exist in solo_parent_applications
ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS solo_parent_id_number VARCHAR(100);
ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS is_id_verified BOOLEAN DEFAULT false;
ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS civil_status VARCHAR(100);
ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS qcid_number VARCHAR(100);
ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS email VARCHAR(150);

-- Step 2: Ensure application_type column is present and properly indexed
ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS application_type VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_solo_parent_type ON solo_parent_applications(application_type);
CREATE INDEX IF NOT EXISTS idx_solo_parent_id_num ON solo_parent_applications(solo_parent_id_number);
CREATE INDEX IF NOT EXISTS idx_solo_parent_user_id ON solo_parent_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_solo_parent_reference ON solo_parent_applications(reference_number);
CREATE INDEX IF NOT EXISTS idx_solo_parent_status ON solo_parent_applications(application_status);

-- Step 3: Clean up legacy unused columns not used by New, Renewal, and Lost ID:
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS place_of_birth;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS educational_attainment;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS occupation;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS company_agency;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS monthly_income;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS total_family_income;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS family_members;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS emergency_name;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS emergency_address;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS emergency_contact_no;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS circumstance_details;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS needs_problems;
ALTER TABLE solo_parent_applications DROP COLUMN IF EXISTS family_resources;
