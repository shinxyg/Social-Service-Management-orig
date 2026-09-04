const fs = require('fs');
const path = require('path');
const db = require('./db');

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.warn('⚠️ schema.sql not found at:', schemaPath);
      return;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schemaSql);

    // Migration patches for solo_parent_applications (New, Renewal, Lost ID)
    await db.query(`
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS solo_parent_id_number VARCHAR(100);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS is_id_verified BOOLEAN DEFAULT false;
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS civil_status VARCHAR(100);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS qcid_number VARCHAR(100);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS email VARCHAR(150);
      CREATE INDEX IF NOT EXISTS idx_solo_parent_type ON solo_parent_applications(application_type);
      CREATE INDEX IF NOT EXISTS idx_solo_parent_id_num ON solo_parent_applications(solo_parent_id_number);

      -- Clean up legacy columns not used by New, Renewal, and Lost ID
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

      -- Migration patches for livelihood_applications (Workflow, Revision, & Approval Columns)
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS revision_notes TEXT;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS admin_notes TEXT;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP WITH TIME ZONE;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      CREATE TABLE IF NOT EXISTS livelihood_assistance (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES livelihood_applications(id) ON DELETE CASCADE,
        reference_number VARCHAR(100) NOT NULL,
        assistance_status VARCHAR(50) DEFAULT 'for_processing',
        approved_financial_amount NUMERIC(12, 2) DEFAULT 0,
        approved_materials JSONB DEFAULT '[]'::jsonb,
        approved_equipment JSONB DEFAULT '[]'::jsonb,
        release_date VARCHAR(100),
        release_time VARCHAR(100),
        release_location VARCHAR(255) DEFAULT 'Quezon City Hall - SSDD Livelihood Center',
        instructions TEXT,
        released_at TIMESTAMP WITH TIME ZONE,
        released_by VARCHAR(150),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS livelihood_monitoring (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES livelihood_applications(id) ON DELETE CASCADE,
        reference_number VARCHAR(100) NOT NULL,
        monitoring_status VARCHAR(50) DEFAULT 'active',
        log_type VARCHAR(50) DEFAULT 'inspection',
        title VARCHAR(255),
        notes TEXT,
        monthly_sales_range VARCHAR(100),
        challenges_needs TEXT,
        officer_name VARCHAR(150),
        inspection_date VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        middle_name VARCHAR(100),
        suffix VARCHAR(50),
        birth_date VARCHAR(50),
        city VARCHAR(100),
        barangay VARCHAR(150),
        street VARCHAR(255),
        house_no VARCHAR(100),
        working_in_qc VARCHAR(10),
        occupation VARCHAR(150),
        sex VARCHAR(20),
        mobile_number VARCHAR(50),
        profile_photo_url TEXT,
        role VARCHAR(50) DEFAULT 'user',
        is_email_verified BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS email_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS qcid_number VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_month VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_day VARCHAR(10);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_year VARCHAR(10);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
    `);

    console.log('✅ PostgreSQL database tables and indexes verified/initialized successfully.');
  } catch (err) {
    console.warn('⚠️ Note during database auto-init:', err.message);
  }
}

module.exports = initDb;
