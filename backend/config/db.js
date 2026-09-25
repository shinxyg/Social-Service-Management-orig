const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = (process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || '').trim();

let poolConfig;

if (connectionString) {

  const isInternalOrLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1') ||
    connectionString.includes('railway.internal');

  poolConfig = {
    connectionString,
    ssl: isInternalOrLocal ? false : { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 4000,
    statement_timeout: 6000,
    query_timeout: 6000,
  };
} else {
  const dbPass = process.env.PGPASSWORD || process.env.DB_PASSWORD;
  poolConfig = {
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    ...(dbPass ? { password: String(dbPass).trim() } : {}),
    database: process.env.PGDATABASE || process.env.DB_NAME || 'railway',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 4000,
    statement_timeout: 6000,
    query_timeout: 6000,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    console.warn('⚠️ Warning: Initial PostgreSQL connection attempt failed:', err.message);
    console.warn('Backend will continue running and retry database queries on incoming requests.');
  } else {
    console.log('✅ Connected to PostgreSQL database successfully!');
    if (typeof release === 'function') release();
    
    // Create performance indexes asynchronously once
    pool.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_ref ON appointments(reference_no);
      CREATE INDEX IF NOT EXISTS idx_appointments_module ON appointments(module);
      CREATE INDEX IF NOT EXISTS idx_pwd_senior_ref ON pwd_senior_applications(reference_number);
      CREATE INDEX IF NOT EXISTS idx_pwd_senior_status ON pwd_senior_applications(status);
      CREATE INDEX IF NOT EXISTS idx_aics_ref ON aics_applications(reference_no);
      CREATE INDEX IF NOT EXISTS idx_aics_qcid ON aics_applications(qc_id);
      CREATE INDEX IF NOT EXISTS idx_sp_cw_ref ON solo_parent_child_welfare_applications(reference_number);
      CREATE INDEX IF NOT EXISTS idx_sp_cw_module ON solo_parent_child_welfare_applications(module_type);
      CREATE INDEX IF NOT EXISTS idx_livelihood_ref ON livelihood_applications(reference_number);
      CREATE INDEX IF NOT EXISTS idx_disbursements_ref ON financial_aid_disbursements(application_ref);
    `).catch((idxErr) => console.warn('[DB Index Notice]:', idxErr.message));
  }
});

module.exports = pool;