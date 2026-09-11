// controllers/notificationController.js
const db = require('../config/db');

async function ensureTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        is_dismissed BOOLEAN DEFAULT false,
        application_ref VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_notification_state (
        id SERIAL PRIMARY KEY,
        user_identifier VARCHAR(150) NOT NULL,
        notif_id VARCHAR(255) NOT NULL,
        is_read BOOLEAN DEFAULT false,
        is_dismissed BOOLEAN DEFAULT false,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_identifier, notif_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_notif_state_user ON user_notification_state(user_identifier);
      CREATE INDEX IF NOT EXISTS idx_user_notif_state_notif ON user_notification_state(notif_id);
    `);
  } catch (err) {
    console.warn('Warning creating notification tables:', err.message);
  }
}

// Ensure tables exist on load
ensureTables();

function extractIdentifiers(req) {
  const src = { ...req.query, ...req.body };
  const rawList = [
    src.userId,
    src.qcid,
    src.email,
    src.ref,
    src.userIdentifier,
    src.user_id,
    src.qcidNumber,
    src.reference_number,
    src.reference_no,
    src.applicationRef,
    src.assignedId,
    src.assigned_id_number,
  ];
  return Array.from(
    new Set(
      rawList
        .filter(Boolean)
        .map((s) => String(s).trim())
        .filter((s) => s.length > 0 && s !== 'undefined' && s !== 'null')
    )
  );
}

// GET /api/notifications
// Aggregates real-time notifications for user across all services and syncs read/dismissed state
exports.getNotifications = async (req, res) => {
  try {
    await ensureTables();
    let identifiers = extractIdentifiers(req);
    const { email, firstName, lastName } = req.query;
    const userEmail = (email || '').toLowerCase().trim();
    const userFn = (firstName || '').trim().toLowerCase();
    const userLn = (lastName || '').trim().toLowerCase();

    // 0. Auto-discover all application references belonging to this user (by name, email, qcid, or user_id)
    try {
      const nameOrClauses = [];
      const nameParams = [];

      if (identifiers.length > 0) {
        nameParams.push(identifiers);
        nameOrClauses.push(`qcid = ANY($${nameParams.length}::text[]) OR reference_number = ANY($${nameParams.length}::text[])`);
      }
      if (userEmail) {
        nameParams.push(userEmail);
        nameOrClauses.push(`LOWER(email) = $${nameParams.length}`);
      }
      if (userFn && userLn) {
        nameParams.push(userFn, userLn);
        nameOrClauses.push(`(LOWER(first_name) = $${nameParams.length - 1} AND LOWER(last_name) = $${nameParams.length})`);
      }

      if (nameOrClauses.length > 0) {
        // Collect from solo_parent_applications
        const spLookup = await db.query(
          `SELECT id, reference_number, assigned_id_number, solo_parent_id_number, qcid_number FROM solo_parent_applications WHERE ${nameOrClauses.join(' OR ').replace(/qcid/g, 'qcid_number')}`,
          nameParams
        );
        spLookup.rows.forEach((r) => {
          if (r.reference_number) identifiers.push(String(r.reference_number));
          if (r.assigned_id_number) identifiers.push(String(r.assigned_id_number));
          if (r.solo_parent_id_number) identifiers.push(String(r.solo_parent_id_number));
          if (r.qcid_number) identifiers.push(String(r.qcid_number));
        });

        // Collect from pwd_senior_applications
        const pwdLookup = await db.query(
          `SELECT id, reference_number, assigned_id_number, qcid FROM pwd_senior_applications WHERE ${nameOrClauses.join(' OR ')}`,
          nameParams
        );
        pwdLookup.rows.forEach((r) => {
          if (r.reference_number) identifiers.push(String(r.reference_number));
          if (r.assigned_id_number) identifiers.push(String(r.assigned_id_number));
          if (r.qcid) identifiers.push(String(r.qcid));
        });

        // Collect from livelihood_applications
        const livLookup = await db.query(
          `SELECT id, reference_number, qcid FROM livelihood_applications WHERE ${nameOrClauses.join(' OR ')}`,
          nameParams
        );
        livLookup.rows.forEach((r) => {
          if (r.reference_number) identifiers.push(String(r.reference_number));
          if (r.qcid) identifiers.push(String(r.qcid));
        });

        // Collect from aics_applications
        const aicsLookup = await db.query(
          `SELECT id, reference_no, qc_id FROM aics_applications WHERE ${nameOrClauses.join(' OR ').replace(/qcid/g, 'qc_id').replace(/reference_number/g, 'reference_no')}`,
          nameParams
        );
        aicsLookup.rows.forEach((r) => {
          if (r.reference_no) identifiers.push(String(r.reference_no));
          if (r.qc_id) identifiers.push(String(r.qc_id));
        });
      }
      identifiers = Array.from(new Set(identifiers.filter((s) => s && s !== 'undefined' && s !== 'null')));
    } catch (e) {
      console.warn('Error expanding user notification identifiers:', e.message);
    }

    // 1. Fetch persistent read and dismissed state and __ALL__ cutoff for this user
    let userStateMap = {};
    let dismissAllCutoff = null;

    if (identifiers.length > 0) {
      try {
        const stateRes = await db.query(
          `SELECT notif_id, is_read, is_dismissed, updated_at 
           FROM user_notification_state 
           WHERE user_identifier = ANY($1::text[])`,
          [identifiers]
        );
        stateRes.rows.forEach((r) => {
          if (r.notif_id === '__ALL__' && r.is_dismissed) {
            const cutoffDate = new Date(r.updated_at);
            if (!dismissAllCutoff || cutoffDate > dismissAllCutoff) {
              dismissAllCutoff = cutoffDate;
            }
          }
          userStateMap[r.notif_id] = {
            is_read: Boolean(r.is_read),
            is_dismissed: Boolean(r.is_dismissed),
          };
        });
      } catch (e) {
        console.warn('Error fetching notification state:', e.message);
      }
    }

    const isItemDismissed = (notifId, createdAt) => {
      if (userStateMap[notifId]?.is_dismissed) return true;
      if (dismissAllCutoff && createdAt) {
        const itemDate = new Date(createdAt);
        if (!isNaN(itemDate.getTime()) && itemDate.getTime() <= dismissAllCutoff.getTime()) {
          return true;
        }
      }
      return false;
    };

    const items = [];

    // 2. Fetch direct user_notifications
    try {
      let query = `SELECT * FROM user_notifications ORDER BY created_at DESC LIMIT 50`;
      let params = [];
      if (identifiers.length > 0) {
        query = `SELECT * FROM user_notifications 
                 WHERE user_id = ANY($1::text[]) OR application_ref = ANY($1::text[])
                 ORDER BY created_at DESC LIMIT 50`;
        params = [identifiers];
      }
      const directRes = await db.query(query, params);
      directRes.rows.forEach((r) => {
        const notifId = `db-notif-${r.id}`;
        if (!isItemDismissed(notifId, r.created_at) && !r.is_dismissed) {
          items.push({
            id: notifId,
            title: r.title,
            desc: r.description,
            time: new Date(r.created_at).toLocaleString('en-US'),
            unread: userStateMap[notifId]?.is_read !== undefined ? !userStateMap[notifId].is_read : !r.is_read,
            reference_no: r.application_ref || null,
            created_at: r.created_at,
          });
        }
      });
    } catch (_) {}

    // 3. Fetch AICS applications notifications
    if (identifiers.length > 0 || userEmail || (userFn && userLn)) {
      try {
        const aicsRes = await db.query(
          `SELECT id, reference_no, qc_id, assistance_type, status, rejection_reason, created_at, updated_at, email
           FROM aics_applications 
           WHERE qc_id = ANY($1::text[]) OR reference_no = ANY($1::text[]) OR (LOWER(email) = $2 AND $2 != '')
              OR ($3 != '' AND $4 != '' AND (LOWER(first_name) = $3 AND LOWER(last_name) = $4))
           ORDER BY created_at DESC`,
          [identifiers, userEmail, userFn, userLn]
        );
        aicsRes.rows.forEach((app) => {
          if (app.status === 'approved' || app.status === 'rejected' || app.status === 'completed') {
            const notifId = `aics-${app.id}-${app.status}`;
            const appDate = app.updated_at || app.created_at;
            if (!isItemDismissed(notifId, appDate)) {
              const isApproved = app.status === 'approved' || app.status === 'completed';
              items.push({
                id: notifId,
                title: isApproved ? 'AICS Assistance Application: Approved' : 'AICS Assistance Application: Not Approved',
                desc: `${app.assistance_type || 'AICS Financial Aid'} — Ref: ${app.reference_no || app.qc_id}`,
                time: new Date(appDate).toLocaleString('en-US'),
                unread: userStateMap[notifId]?.is_read !== undefined ? !userStateMap[notifId].is_read : true,
                reason: app.rejection_reason || null,
                reference_no: app.reference_no || app.qc_id,
                created_at: appDate,
              });
            }
          }
        });
      } catch (_) {}
    }

    // 4. Fetch PWD & Senior Citizen applications notifications
    if (identifiers.length > 0 || userEmail || (userFn && userLn)) {
      try {
        const pwdRes = await db.query(
          `SELECT id, reference_number, qcid, category, service, status, rejection_reason, approved_date, created_at, email, assigned_id_number, application_type
           FROM pwd_senior_applications 
           WHERE qcid = ANY($1::text[]) OR reference_number = ANY($1::text[]) OR assigned_id_number = ANY($1::text[]) OR (LOWER(email) = $2 AND $2 != '')
              OR ($3 != '' AND $4 != '' AND (LOWER(first_name) = $3 AND LOWER(last_name) = $4))
           ORDER BY created_at DESC`,
          [identifiers, userEmail, userFn, userLn]
        );
        pwdRes.rows.forEach((app) => {
          if (app.status === 'approved' || app.status === 'rejected' || app.status === 'completed' || app.status === 'for_release') {
            const notifId = `pwd-${app.id || app.reference_number}-${app.status}`;
            const appDate = app.approved_date || app.created_at;
            if (!isItemDismissed(notifId, appDate)) {
              const isApproved = app.status === 'approved' || app.status === 'completed' || app.status === 'for_release';
              const isSenior = (app.category || '').toLowerCase().includes('senior');
              const isAssistance = String(app.service || app.category || '').toLowerCase().includes('assistance');
              const isRenewal = app.application_type === 'renewal';
              const isLoss = app.application_type === 'replacement' || app.application_type === 'loss';

              let title = '';
              let serviceLabel = '';
              if (isAssistance) {
                serviceLabel = isSenior ? 'Senior Citizen Social Assistance' : 'PWD Social Assistance';
                title = isApproved ? `${serviceLabel} Application: Approved` : `${serviceLabel} Application: Not Approved`;
              } else if (isSenior) {
                serviceLabel = `Senior Citizen Services (${isRenewal ? 'Renewal' : isLoss ? 'Replacement' : 'New Application'})`;
                title = isApproved
                  ? (isRenewal ? 'Senior Citizen ID (Renewal): Approved' : isLoss ? 'Senior Citizen ID (Replacement): Approved' : 'Senior Citizen ID Application: Approved')
                  : 'Senior Citizen ID Application: Not Approved';
              } else {
                serviceLabel = `PWD Services (${isRenewal ? 'Renewal' : isLoss ? 'Replacement' : 'New Application'})`;
                title = isApproved
                  ? (isRenewal ? 'PWD ID (Renewal): Approved' : isLoss ? 'PWD ID (Replacement): Approved' : 'PWD ID Application: Approved')
                  : 'PWD ID Application: Not Approved';
              }

              items.push({
                id: notifId,
                title,
                desc: `${serviceLabel} — Ref: ${app.assigned_id_number || app.reference_number || app.id}`,
                time: new Date(appDate).toLocaleString('en-US'),
                unread: userStateMap[notifId]?.is_read !== undefined ? !userStateMap[notifId].is_read : true,
                reason: app.rejection_reason || null,
                reference_no: app.assigned_id_number || app.reference_number || app.id,
                created_at: appDate,
              });
            }
          }
        });
      } catch (_) {}
    }

    // 5. Fetch Solo Parent applications notifications
    if (identifiers.length > 0 || userEmail || (userFn && userLn)) {
      try {
        const spRes = await db.query(
          `SELECT id, reference_number, user_id, qcid_number, application_status, rejection_reason, created_at, updated_at, email, assigned_id_number, solo_parent_id_number
           FROM solo_parent_applications 
           WHERE user_id = ANY($1::text[]) OR qcid_number = ANY($1::text[]) OR reference_number = ANY($1::text[]) OR assigned_id_number = ANY($1::text[]) OR (LOWER(email) = $2 AND $2 != '')
              OR ($3 != '' AND $4 != '' AND (LOWER(first_name) = $3 AND LOWER(last_name) = $4))
           ORDER BY created_at DESC`,
          [identifiers, userEmail, userFn, userLn]
        );
        spRes.rows.forEach((app) => {
          if (app.application_status === 'approved' || app.application_status === 'rejected' || app.application_status === 'completed' || app.application_status === 'for_release') {
            const notifId = `sp-${app.id}-${app.application_status}`;
            const appDate = app.updated_at || app.created_at;
            if (!isItemDismissed(notifId, appDate)) {
              const isApproved = app.application_status === 'approved' || app.application_status === 'completed' || app.application_status === 'for_release';
              const idNum = app.assigned_id_number || app.solo_parent_id_number || app.reference_number;
              items.push({
                id: notifId,
                title: isApproved ? 'Solo Parent Application: Approved' : 'Solo Parent Application: Not Approved',
                desc: isApproved
                  ? `Congratulations! Your Solo Parent ID application (ID No. ${idNum}) has been approved and forwarded to Appointments for claiming schedule.`
                  : `Solo Parent Application: ${app.rejection_reason || 'Not approved'} (Ref: ${app.reference_number})`,
                time: new Date(appDate).toLocaleString('en-US'),
                unread: userStateMap[notifId]?.is_read !== undefined ? !userStateMap[notifId].is_read : true,
                reason: app.rejection_reason || null,
                reference_no: idNum,
                created_at: appDate,
              });
            }
          }
        });
      } catch (_) {}
    }

    // 6. Fetch Child Welfare applications notifications
    if (identifiers.length > 0 || userEmail || (userFn && userLn)) {
      try {
        const cwRes = await db.query(
          `SELECT id, reference_number, user_id, application_status, rejection_reason, created_at, updated_at, guardian_email, support_category
           FROM child_welfare_applications 
           WHERE user_id = ANY($1::text[]) OR reference_number = ANY($1::text[]) OR (LOWER(guardian_email) = $2 AND $2 != '')
              OR ($3 != '' AND $4 != '' AND (LOWER(guardian_first_name) = $3 AND LOWER(guardian_last_name) = $4))
           ORDER BY created_at DESC`,
          [identifiers, userEmail, userFn, userLn]
        );
        cwRes.rows.forEach((app) => {
          if (app.application_status === 'approved' || app.application_status === 'rejected' || app.application_status === 'completed') {
            const notifId = `cw-${app.id}-${app.application_status}`;
            const appDate = app.updated_at || app.created_at;
            if (!isItemDismissed(notifId, appDate)) {
              const isApproved = app.application_status === 'approved' || app.application_status === 'completed';
              items.push({
                id: notifId,
                title: isApproved ? 'Child Welfare Application: Approved' : 'Child Welfare Application: Not Approved',
                desc: isApproved
                  ? `Congratulations! Your application for ${app.support_category || 'Child Welfare Assistance'} has been approved and forwarded to Appointments.`
                  : `Child Welfare Assistance: ${app.rejection_reason || 'Not approved'} (Ref: ${app.reference_number})`,
                time: new Date(appDate).toLocaleString('en-US'),
                unread: userStateMap[notifId]?.is_read !== undefined ? !userStateMap[notifId].is_read : true,
                reason: app.rejection_reason || null,
                reference_no: app.reference_number,
                created_at: appDate,
              });
            }
          }
        });
      } catch (_) {}
    }

    // 7. Fetch Livelihood applications notifications
    if (identifiers.length > 0 || userEmail || (userFn && userLn)) {
      try {
        const livRes = await db.query(
          `SELECT id, reference_number, user_id, qcid, application_status, rejection_reason, created_at, updated_at, email, livelihood_type
           FROM livelihood_applications 
           WHERE qcid = ANY($1::text[]) OR user_id = ANY($1::text[]) OR reference_number = ANY($1::text[]) OR (LOWER(email) = $2 AND $2 != '')
              OR ($3 != '' AND $4 != '' AND (LOWER(first_name) = $3 AND LOWER(last_name) = $4))
           ORDER BY created_at DESC`,
          [identifiers, userEmail, userFn, userLn]
        );
        livRes.rows.forEach((app) => {
          if (app.application_status === 'approved' || app.application_status === 'rejected' || app.application_status === 'needs_revision' || app.application_status === 'for_release' || app.application_status === 'released') {
            const notifId = `liv-${app.id}-${app.application_status}`;
            const appDate = app.updated_at || app.created_at;
            if (!isItemDismissed(notifId, appDate)) {
              const isApproved = app.application_status === 'approved' || app.application_status === 'for_release' || app.application_status === 'released';
              items.push({
                id: notifId,
                title: isApproved ? 'Livelihood & Training Application: Approved' : app.application_status === 'needs_revision' ? 'Livelihood Application: Needs Revision' : 'Livelihood & Training Application: Not Approved',
                desc: `${app.livelihood_type || 'Livelihood Program'} — Ref: ${app.reference_number}`,
                time: new Date(appDate).toLocaleString('en-US'),
                unread: userStateMap[notifId]?.is_read !== undefined ? !userStateMap[notifId].is_read : true,
                reason: app.rejection_reason || null,
                reference_no: app.reference_number,
                created_at: appDate,
              });
            }
          }
        });
      } catch (_) {}
    }

    // 8. Fetch Financial Aid Disbursements & Scheduled Appointments Payouts
    if (identifiers.length > 0 || (userFn && userLn)) {
      try {
        const disbRes = await db.query(
          `SELECT f.*, a.scheduled_date, a.scheduled_time, a.office_location, a.status as appt_status
           FROM financial_aid_disbursements f
           LEFT JOIN (
             SELECT DISTINCT ON (reference_no) *
             FROM appointments
             ORDER BY reference_no, created_at DESC
           ) a ON f.application_ref = a.reference_no
           WHERE f.application_ref = ANY($1::text[]) OR a.reference_no = ANY($1::text[])
              OR ($2 != '' AND $3 != '' AND (LOWER(f.applicant_name) ILIKE '%' || $2 || '%' AND LOWER(f.applicant_name) ILIKE '%' || $3 || '%'))`,
          [identifiers, userFn, userLn]
        );

        disbRes.rows.forEach((d) => {
          const apptDate = d.scheduled_date || d.appointment_date;
          const apptTime = d.scheduled_time || d.appointment_time;
          const venue = d.office_location || d.venue || 'Quezon City Hall';
          const disbDate = d.updated_at || d.created_at;

          // Scheduled Appointment Notification
          if (apptDate) {
            const notifId = `disb-appt-${d.id || d.disbursement_id}-${apptDate}`;
            if (!isItemDismissed(notifId, disbDate)) {
              items.push({
                id: notifId,
                title: 'Payout Appointment Scheduled',
                desc: `Scheduled on ${apptDate} ${apptTime ? `at ${apptTime}` : ''} at ${venue} (Ref: ${d.application_ref})`,
                time: new Date(disbDate).toLocaleString('en-US'),
                unread: userStateMap[notifId]?.is_read !== undefined ? !userStateMap[notifId].is_read : true,
                reference_no: d.application_ref,
                created_at: disbDate,
              });
            }
          }

          // Released Notification
          if (d.status === 'RELEASED' || d.appt_status === 'completed') {
            const notifId = `disb-rel-${d.id || d.disbursement_id}`;
            const relDate = d.released_date || d.updated_at || d.created_at;
            if (!isItemDismissed(notifId, relDate)) {
              items.push({
                id: notifId,
                title: 'Financial Aid Released',
                desc: `₱${Number(d.fixed_amount || 15000).toLocaleString()} financial aid officially released at ${venue}.`,
                time: new Date(relDate).toLocaleString('en-US'),
                unread: userStateMap[notifId]?.is_read !== undefined ? !userStateMap[notifId].is_read : true,
                reference_no: d.application_ref,
                created_at: relDate,
              });
            }
          }
        });
      } catch (_) {}
    }

    // Deduplicate by semantic key (reference_no + topic) and sort
    const uniqueMap = new Map();
    items.forEach((item) => {
      const cleanRef = String(item.reference_no || item.id || '').trim();
      const topic = (item.title || '')
        .toLowerCase()
        .replace(/application:?/g, '')
        .replace(/id:?/g, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);

      const dedupeKey = cleanRef ? `${cleanRef}__${topic}` : item.id;

      if (!uniqueMap.has(dedupeKey)) {
        uniqueMap.set(dedupeKey, item);
      } else {
        const existing = uniqueMap.get(dedupeKey);
        const itemDescLen = (item.desc || '').length;
        const existDescLen = (existing.desc || '').length;
        if (item.unread && !existing.unread) {
          uniqueMap.set(dedupeKey, item);
        } else if (itemDescLen > existDescLen) {
          uniqueMap.set(dedupeKey, { ...item, unread: existing.unread && item.unread });
        }
      }
    });

    const finalNotifications = Array.from(uniqueMap.values()).sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return res.json({ success: true, notifications: finalNotifications });
  } catch (err) {
    console.error('Error in getNotifications:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications', details: err.message });
  }
};

// POST /api/notifications
exports.createNotification = async (req, res) => {
  try {
    await ensureTables();
    const { userId, title, description, applicationRef } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }
    const result = await db.query(
      `INSERT INTO user_notifications (user_id, title, description, application_ref)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId || null, title, description, applicationRef || null]
    );
    res.status(201).json({ success: true, message: 'Notification created.', notification: result.rows[0] });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ success: false, error: 'Failed to create notification.' });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const identifiers = extractIdentifiers(req);
    const primaryIdent = identifiers[0] || 'default_user';

    if (id.startsWith('db-notif-')) {
      const dbId = id.replace('db-notif-', '');
      await db.query(`UPDATE user_notifications SET is_read = true WHERE id::text = $1`, [dbId]);
    }

    for (const ident of (identifiers.length > 0 ? identifiers : [primaryIdent])) {
      await db.query(
        `INSERT INTO user_notification_state (user_identifier, notif_id, is_read, is_dismissed)
         VALUES ($1, $2, true, false)
         ON CONFLICT (user_identifier, notif_id)
         DO UPDATE SET is_read = true, updated_at = NOW()`,
        [ident, id]
      );
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error updating notification read state:', err);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read.' });
  }
};

// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await ensureTables();
    const identifiers = extractIdentifiers(req);
    const { notifIds = [] } = req.body;
    const primaryIdent = identifiers[0] || 'default_user';

    if (Array.isArray(notifIds) && notifIds.length > 0) {
      for (const notifId of notifIds) {
        if (notifId.startsWith('db-notif-')) {
          const dbId = notifId.replace('db-notif-', '');
          await db.query(`UPDATE user_notifications SET is_read = true WHERE id::text = $1`, [dbId]);
        }

        for (const ident of (identifiers.length > 0 ? identifiers : [primaryIdent])) {
          await db.query(
            `INSERT INTO user_notification_state (user_identifier, notif_id, is_read, is_dismissed)
             VALUES ($1, $2, true, false)
             ON CONFLICT (user_identifier, notif_id)
             DO UPDATE SET is_read = true, updated_at = NOW()`,
            [ident, notifId]
          );
        }
      }
    }

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ success: false, error: 'Failed to mark all as read.' });
  }
};

// DELETE /api/notifications/:id
exports.dismissNotification = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const identifiers = extractIdentifiers(req);
    const primaryIdent = identifiers[0] || 'default_user';

    if (id.startsWith('db-notif-')) {
      const dbId = id.replace('db-notif-', '');
      await db.query(`UPDATE user_notifications SET is_dismissed = true WHERE id::text = $1`, [dbId]);
    }

    for (const ident of (identifiers.length > 0 ? identifiers : [primaryIdent])) {
      await db.query(
        `INSERT INTO user_notification_state (user_identifier, notif_id, is_read, is_dismissed, updated_at)
         VALUES ($1, $2, true, true, NOW())
         ON CONFLICT (user_identifier, notif_id)
         DO UPDATE SET is_dismissed = true, updated_at = NOW()`,
        [ident, id]
      );
    }

    res.json({ success: true, message: 'Notification dismissed.' });
  } catch (err) {
    console.error('Error dismissing notification:', err);
    res.status(500).json({ success: false, error: 'Failed to dismiss notification.' });
  }
};

// DELETE /api/notifications/all
exports.dismissAllNotifications = async (req, res) => {
  try {
    await ensureTables();
    const identifiers = extractIdentifiers(req);
    const { notifIds = [] } = req.body || req.query;
    const primaryIdent = identifiers[0] || 'default_user';

    // 1. Mark __ALL__ with current timestamp for all identifiers
    for (const ident of (identifiers.length > 0 ? identifiers : [primaryIdent])) {
      await db.query(
        `INSERT INTO user_notification_state (user_identifier, notif_id, is_read, is_dismissed, updated_at)
         VALUES ($1, '__ALL__', true, true, NOW())
         ON CONFLICT (user_identifier, notif_id)
         DO UPDATE SET is_dismissed = true, updated_at = NOW()`,
        [ident]
      );
    }

    // 2. Mark specific notifIds if provided
    if (Array.isArray(notifIds) && notifIds.length > 0) {
      for (const notifId of notifIds) {
        if (notifId.startsWith('db-notif-')) {
          const dbId = notifId.replace('db-notif-', '');
          await db.query(`UPDATE user_notifications SET is_dismissed = true WHERE id::text = $1`, [dbId]);
        }

        for (const ident of (identifiers.length > 0 ? identifiers : [primaryIdent])) {
          await db.query(
            `INSERT INTO user_notification_state (user_identifier, notif_id, is_read, is_dismissed, updated_at)
             VALUES ($1, $2, true, true, NOW())
             ON CONFLICT (user_identifier, notif_id)
             DO UPDATE SET is_dismissed = true, updated_at = NOW()`,
            [ident, notifId]
          );
        }
      }
    }

    // 3. Mark direct user_notifications as dismissed
    if (identifiers.length > 0) {
      await db.query(
        `UPDATE user_notifications SET is_dismissed = true 
         WHERE user_id = ANY($1::text[]) OR application_ref = ANY($1::text[])`,
        [identifiers]
      );
    }

    res.json({ success: true, message: 'All notifications dismissed.' });
  } catch (err) {
    console.error('Error dismissing all notifications:', err);
    res.status(500).json({ success: false, error: 'Failed to dismiss all notifications.' });
  }
};
