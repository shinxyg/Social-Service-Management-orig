const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigration() {
  console.log('🔄 Running Beneficiary Table Consolidation Migration...');
  try {
    const sqlPath = path.join(__dirname, 'migrate_consolidate_beneficiary_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await db.query(sql);
    console.log('✅ Beneficiary tables consolidated successfully! beneficiary_verifications migrated and dropped.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
