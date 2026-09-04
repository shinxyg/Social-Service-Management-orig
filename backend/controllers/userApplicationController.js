const db = require('../config/db');
const { logActivity } = require('./activityLogController');

/**
 * POST /api/user-applications/archive
 * Archives or soft-deletes any application by ID & category across all tables
 */
exports.archiveApplication = async (req, res) => {
  try {
    const { id, applicationNo, referenceNo, category, assistance, applicantName, email, reason } = req.body;
    const targetId = String(id || applicationNo || referenceNo || '').trim();
    const targetRef = String(referenceNo || applicationNo || id || '').trim();

    if (!targetId && !targetRef) {
      return res.status(400).json({ error: 'Application ID or Reference Number is required' });
    }

    const catUpper = String(category || '').toUpperCase();
    let updatedInDb = false;

    // 1. PWD & Senior Citizen
    if (catUpper.includes('PWD') || catUpper.includes('SENIOR') || catUpper.includes('DISABILITY')) {
      try {
        const q = await db.query(
          `UPDATE pwd_senior_applications
           SET is_archived = true, archived_at = NOW()
           WHERE id = $1 OR reference_number = $1 OR assigned_id_number = $1 OR id = $2 OR reference_number = $2
           RETURNING id, reference_number, category`,
          [targetId, targetRef]
        );
        if (q.rowCount > 0) updatedInDb = true;
      } catch (e) {
        console.warn('PWD archive query failed:', e.message);
      }
    }

    // 2. AICS
    if (catUpper.includes('AICS') || !updatedInDb) {
      try {
        const q = await db.query(
          `UPDATE aics_applications
           SET is_archived = true, archived_at = NOW()
           WHERE id::text = $1 OR qc_id = $1 OR reference_no = $1 OR reference_number = $1 OR id::text = $2 OR qc_id = $2
           RETURNING id, reference_no`,
          [targetId, targetRef]
        );
        if (q.rowCount > 0) updatedInDb = true;
      } catch (e) {
        console.warn('AICS archive query failed:', e.message);
      }
    }

    // 3. Solo Parent
    if (catUpper.includes('SOLO') || !updatedInDb) {
      try {
        const q = await db.query(
          `UPDATE solo_parent_applications
           SET is_archived = true, archived_at = NOW()
           WHERE id::text = $1 OR reference_number = $1 OR qcid_number = $1 OR id::text = $2
           RETURNING id, reference_number`,
          [targetId, targetRef]
        );
        if (q.rowCount > 0) updatedInDb = true;
      } catch (e) {
        console.warn('Solo parent archive query failed:', e.message);
      }
    }

    // 4. Child Welfare
    if (catUpper.includes('CHILD') || catUpper.includes('WELFARE') || !updatedInDb) {
      try {
        const q = await db.query(
          `UPDATE child_welfare_applications
           SET is_archived = true, archived_at = NOW()
           WHERE id::text = $1 OR reference_number = $1 OR id::text = $2
           RETURNING id, reference_number`,
          [targetId, targetRef]
        );
        if (q.rowCount > 0) updatedInDb = true;
      } catch (e) {
        console.warn('Child welfare archive query failed:', e.message);
      }
    }

    // 5. Livelihood
    if (catUpper.includes('LIVELIHOOD') || !updatedInDb) {
      try {
        const q = await db.query(
          `UPDATE livelihood_applications
           SET is_archived = true, archived_at = NOW()
           WHERE id::text = $1 OR reference_number = $1 OR qcid = $1 OR id::text = $2
           RETURNING id, reference_number`,
          [targetId, targetRef]
        );
        if (q.rowCount > 0) updatedInDb = true;
      } catch (e) {
        console.warn('Livelihood archive query failed:', e.message);
      }
    }

    // 6. Training
    if (catUpper.includes('TRAIN') || !updatedInDb) {
      try {
        const q = await db.query(
          `UPDATE training_applications
           SET is_archived = true, archived_at = NOW()
           WHERE id::text = $1 OR reference_number = $1 OR qcid = $1 OR id::text = $2
           RETURNING id, reference_number`,
          [targetId, targetRef]
        );
        if (q.rowCount > 0) updatedInDb = true;
      } catch (e) {
        console.warn('Training archive query failed:', e.message);
      }
    }

    // Save to archived_applications audit table
    try {
      await db.query(
        `INSERT INTO archived_applications (
           application_id, reference_no, category, assistance_title, applicant_name, email, reason, archived_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          targetId,
          targetRef,
          category || 'General',
          assistance || 'Social Service Application',
          applicantName || 'Resident',
          email || null,
          reason || 'Deleted/Archived by user from History Application',
        ]
      );
    } catch (auditErr) {
      console.warn('Could not insert to archived_applications audit log:', auditErr.message);
    }

    // Record activity log
    if (logActivity) {
      logActivity({
        actor: applicantName || 'Resident User',
        actorRole: 'User',
        action: 'deleted',
        module: category || 'History Application',
        referenceNo: targetRef || targetId,
        subject: `Archived & Deleted Application (${assistance || category || 'Social Service'})`,
        detail: `Application ${targetRef} was archived and removed from user history list.`,
      });
    }

    return res.json({
      success: true,
      message: 'Application successfully archived and deleted from active history.',
      id: targetId,
      referenceNo: targetRef,
    });
  } catch (err) {
    console.error('Error archiving application:', err);
    return res.status(500).json({ error: 'Failed to archive application', details: err.message });
  }
};
