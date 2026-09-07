const db = require('./config/db');

async function cleanup() {
  console.log('Starting cleanup for user Renz Mahinay Millares / QCID 110000572516915...');

  try {
    // 1. Delete appointments for Renz
    const apptRes = await db.query(
      `DELETE FROM appointments 
       WHERE applicant_name ILIKE '%renz%' 
          OR reference_no ILIKE '%110000572516915%' 
          OR qc_id ILIKE '%110000572516915%'`
    );
    console.log(`Deleted ${apptRes.rowCount} appointments.`);

    // 2. Delete financial aid disbursements
    const disbRes = await db.query(
      `DELETE FROM financial_aid_disbursements 
       WHERE applicant_name ILIKE '%renz%' 
          OR application_ref ILIKE '%110000572516915%' 
          OR qc_id ILIKE '%110000572516915%'`
    );
    console.log(`Deleted ${disbRes.rowCount} financial aid disbursements.`);

    // 3. Delete AICS applications & documents
    const aicsApps = await db.query(
      `SELECT id FROM aics_applications 
       WHERE first_name ILIKE '%renz%' 
          OR last_name ILIKE '%millares%' 
          OR reference_no ILIKE '%110000572516915%' 
          OR qc_id ILIKE '%110000572516915%'`
    );
    
    if (aicsApps.rows.length > 0) {
      const ids = aicsApps.rows.map(r => r.id);
      await db.query(`DELETE FROM aics_documents WHERE application_id = ANY($1::int[])`, [ids]);
      const delAics = await db.query(`DELETE FROM aics_applications WHERE id = ANY($1::int[])`, [ids]);
      console.log(`Deleted ${delAics.rowCount} AICS applications.`);
    }

    // 4. Delete PWD / Senior applications
    try {
      const pwdSeniorRes = await db.query(
        `DELETE FROM pwd_senior_applications 
         WHERE first_name ILIKE '%renz%' 
            OR last_name ILIKE '%millares%' 
            OR reference_number ILIKE '%110000572516915%' 
            OR qcid ILIKE '%110000572516915%'`
      );
      console.log(`Deleted ${pwdSeniorRes.rowCount} PWD/Senior applications.`);
    } catch (e) {
      console.log('pwd_senior_applications table check skipped:', e.message);
    }

    console.log('✅ PostgreSQL cleanup completed successfully!');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    process.exit(0);
  }
}

cleanup();
