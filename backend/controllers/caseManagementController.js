// controllers/caseManagementController.js
const db = require('../config/db');

function formatCaseNumber(ref, id) {
  if (ref && String(ref).startsWith('CM-')) return String(ref).toUpperCase();
  const digits = String(ref || id || '1000').replace(/\D/g, '').slice(-4) || '1001';
  return `CM-2026-${digits.padStart(4, '0')}`;
}

function getProgramTitle(cat, type) {
  const c = String(cat || '').toUpperCase();
  const t = String(type || '').toLowerCase();
  if (c.includes('AICS')) return 'AICS';
  if (c.includes('PWD')) return 'PWD';
  if (c.includes('SENIOR')) return 'Senior Citizen';
  if (c.includes('SOLO')) return 'Solo Parent';
  if (c.includes('CHILD')) return 'Child Welfare';
  if (c.includes('LIVELIHOOD')) return 'Livelihood';
  if (c.includes('TRAIN')) return 'Training Program';
  return 'AICS';
}

function getCaseType(cat, type, specificTitle) {
  if (specificTitle) return specificTitle;
  const c = String(cat || '').toUpperCase();
  const t = String(type || '').toLowerCase();
  if (c.includes('AICS')) return `${type || 'Medical'} Assistance`;
  if (c.includes('PWD')) return t.includes('booklet') ? 'PWD Booklet Issuance' : 'PWD Assistance & Welfare';
  if (c.includes('SENIOR')) return t.includes('booklet') ? 'Senior Citizen Booklet' : 'OSCA Verification & Welfare';
  if (c.includes('SOLO')) return 'Solo Parent ID & Comprehensive Care';
  if (c.includes('CHILD')) return 'Child Welfare & Protection';
  if (c.includes('LIVELIHOOD')) return 'Livelihood Capital Grant & Support';
  if (c.includes('TRAIN')) return 'Skills Training Program';
  return 'Community Welfare Assistance';
}

exports.getAllCases = async (req, res) => {
  try {
    // 1. Fetch Approved Applications from all modules
    const [
      aicsRes,
      pwdSeniorRes,
      soloRes,
      childRes,
      livelihoodRes,
      trainingRes,
      apptRes,
      financialRes,
      caseRecordsRes,
      referralsRes,
      monitoringRes,
    ] = await Promise.all([
      db.query(`SELECT * FROM aics_applications WHERE LOWER(status) IN ('approved', 'completed', 'for_release', 'released') ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM pwd_senior_applications WHERE LOWER(status) IN ('approved', 'completed', 'for_release', 'released', 'verified') ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM solo_parent_applications WHERE LOWER(application_status) = 'approved' AND (is_archived IS NOT true) ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM child_welfare_applications WHERE LOWER(application_status) = 'approved' AND (is_archived IS NOT true) ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM livelihood_applications WHERE LOWER(status) IN ('approved', 'completed', 'for_processing', 'for_release', 'released') AND (is_archived IS NOT true) ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM training_applications WHERE LOWER(status) IN ('approved', 'completed', 'enrolled', 'graduated') AND (is_archived IS NOT true) ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM appointments ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM financial_aid_disbursements ORDER BY created_at DESC`).catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM case_records`).catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM case_referrals ORDER BY created_at ASC`).catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM case_monitoring ORDER BY created_at ASC`).catch(() => ({ rows: [] })),
    ]);

    const appointments = apptRes.rows;
    const financialAids = financialRes.rows;
    const caseRecordsMap = new Map();
    caseRecordsRes.rows.forEach((r) => {
      caseRecordsMap.set(r.application_ref, r);
      caseRecordsMap.set(r.case_number, r);
    });

    const referralsMap = new Map();
    referralsRes.rows.forEach((ref) => {
      const key = ref.application_ref || ref.case_number;
      if (!referralsMap.has(key)) referralsMap.set(key, []);
      referralsMap.get(key).push({
        id: `REF-${ref.id}`,
        date: ref.referral_date || new Date(ref.created_at).toISOString().split('T')[0],
        referredTo: ref.referred_to,
        reason: ref.service_reason,
        referredBy: ref.referred_by || 'Admin Social Worker',
        status: ref.status || 'pending',
        remarks: ref.remarks || '',
      });
    });

    const monitoringMap = new Map();
    monitoringRes.rows.forEach((mon) => {
      const key = mon.application_ref || mon.case_number;
      if (!monitoringMap.has(key)) monitoringMap.set(key, []);
      monitoringMap.get(key).push({
        id: `MON-${mon.id}`,
        date: mon.monitoring_date || new Date(mon.created_at).toISOString().split('T')[0],
        officer: mon.officer_name || 'Admin Social Worker',
        notes: mon.notes,
        progressStatus: mon.progress_status || 'In Progress',
        nextAction: mon.next_action || '',
      });
    });

    const cases = [];

    // Helper to match appointment
    function findAppointment(ref, qcid, email) {
      const cleanRef = String(ref || '').trim().toLowerCase();
      const cleanQcid = String(qcid || '').trim().toLowerCase();
      const cleanEmail = String(email || '').trim().toLowerCase();
      return appointments.find((a) => {
        const aRef = String(a.reference_number || a.reference_no || a.application_id || '').trim().toLowerCase();
        const aQcid = String(a.qcid_number || a.qc_id || '').trim().toLowerCase();
        const aEmail = String(a.email || '').trim().toLowerCase();
        return (
          (cleanRef && aRef === cleanRef) ||
          (cleanQcid && aQcid === cleanQcid) ||
          (cleanEmail && aEmail === cleanEmail)
        );
      });
    }

    // Helper to match financial aid
    function findFinancialAid(ref, qcid) {
      const cleanRef = String(ref || '').trim().toLowerCase();
      const cleanQcid = String(qcid || '').trim().toLowerCase();
      return financialAids.find((f) => {
        const fRef = String(f.application_ref || f.reference_number || f.reference_no || '').trim().toLowerCase();
        const fQcid = String(f.beneficiary_id || f.qcid_number || f.qc_id || '').trim().toLowerCase();
        return (cleanRef && fRef === cleanRef) || (cleanQcid && fQcid === cleanQcid);
      });
    }

    // Process AICS
    aicsRes.rows.forEach((row, idx) => {
      const ref = row.reference_no;
      const qcid = row.qc_id || ref;
      const caseNum = formatCaseNumber(ref, idx + 1);
      const override = caseRecordsMap.get(ref) || caseRecordsMap.get(caseNum) || {};
      const appt = findAppointment(ref, qcid, row.email);
      const fin = findFinancialAid(ref, qcid);
      const refs = referralsMap.get(ref) || referralsMap.get(caseNum) || [];
      const mons = monitoringMap.get(ref) || monitoringMap.get(caseNum) || [];

      const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim() || 'AICS Beneficiary';
      const dateApplied = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-08-15';
      const dateApproved = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : dateApplied;

      // Status resolution
      let resolvedStatus = override.status || 'open';
      if (!override.status) {
        if (mons.length > 0) resolvedStatus = 'monitoring';
        else if (refs.length > 0) resolvedStatus = 'referred';
        else if (appt?.status === 'completed' && (!fin || fin.status === 'RELEASED')) resolvedStatus = 'open';
      }

      // Build real chronological timeline
      const timeline = [
        {
          id: `TL-SUB-${ref}`,
          title: 'Application Submitted',
          detail: `Submitted AICS ${row.assistance_type || 'Financial'} Assistance application (Ref: ${ref}).`,
          date: dateApplied,
          type: 'submission',
        },
        {
          id: `TL-APP-${ref}`,
          title: 'Application Approved',
          detail: `Application reviewed and officially approved by Admin Social Worker. Case ${caseNum} automatically created.`,
          date: dateApproved,
          type: 'approval',
        },
      ];

      if (appt) {
        timeline.push({
          id: `TL-APPT-${appt.id}`,
          title: appt.status === 'completed' ? 'Appointment Completed' : 'Appointment Scheduled',
          detail: `Appointment scheduled at ${appt.scheduled_date || appt.appointment_date || 'QC Hall'} ${appt.scheduled_time || appt.appointment_time || '09:00 AM'} - Venue: ${appt.venue || appt.location || 'Quezon City Social Services Building'}. (Status: ${appt.status || 'Scheduled'})`,
          date: appt.scheduled_date || dateApproved,
          type: 'appointment',
        });
      }

      if (fin) {
        if (fin.status === 'RELEASED') {
          timeline.push({
            id: `TL-FIN-REL-${fin.id}`,
            title: 'Financial Aid Released',
            detail: `Disbursement ${fin.disbursement_id || 'FA-DISB'} of ₱${Number(fin.fixed_amount || 5000).toLocaleString()} successfully released to beneficiary.`,
            date: fin.released_date ? new Date(fin.released_date).toISOString().split('T')[0] : dateApproved,
            type: 'financial',
          });
        } else {
          timeline.push({
            id: `TL-FIN-PEND-${fin.id}`,
            title: 'Financial Aid Pending Release',
            detail: `Financial disbursement ${fin.disbursement_id || 'FA-DISB'} queued for payout of ₱${Number(fin.fixed_amount || 5000).toLocaleString()}. Schedule: ${fin.payout_schedule || 'TBA'} at ${fin.payout_location || 'QC Hall Cashier'}.`,
            date: dateApproved,
            type: 'financial',
          });
        }
      }

      refs.forEach((r) => {
        timeline.push({
          id: `TL-${r.id}`,
          title: `Referral Created: ${r.referredTo}`,
          detail: `Reason: ${r.reason}. Status: ${r.status.toUpperCase()}. (Referred by: ${r.referredBy})`,
          date: r.date,
          type: 'referral',
        });
      });

      mons.forEach((m) => {
        timeline.push({
          id: `TL-${m.id}`,
          title: `Monitoring Check-in (${m.progressStatus})`,
          detail: `${m.notes}${m.nextAction ? ` | Next Action: ${m.nextAction}` : ''} (Officer: ${m.officer})`,
          date: m.date,
          type: 'monitoring',
        });
      });

      if (resolvedStatus === 'closed') {
        timeline.push({
          id: `TL-CLS-${ref}`,
          title: 'Case Closed',
          detail: override.closed_reason || 'All assistance and aftercare monitoring successfully concluded.',
          date: override.closed_at ? new Date(override.closed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'closure',
        });
      }

      cases.push({
        id: caseNum,
        caseNumber: caseNum,
        applicationId: ref,
        beneficiaryId: qcid,
        beneficiaryName: fullName,
        age: String(row.age || '—'),
        sex: row.gender || row.sex || '—',
        civilStatus: row.civil_status || 'Single',
        contactNo: row.phone || row.contact_no || '09170000000',
        email: row.email || '',
        address: row.address || 'Quezon City',
        linkedProgram: 'AICS',
        caseType: getCaseType('AICS', row.assistance_type),
        priority: override.priority || 'high',
        dateOpened: dateApproved,
        assignedSocialWorker: override.assigned_social_worker || 'Admin Social Worker',
        status: resolvedStatus,
        summary: row.details?.primaryConcern || row.details?.problemEncountered || 'AICS assistance approved for community welfare aid.',
        linkedAppointment: appt
          ? {
              id: String(appt.id),
              date: appt.scheduled_date || appt.appointment_date || '',
              time: appt.scheduled_time || appt.appointment_time || '',
              location: appt.venue || appt.location || 'Quezon City Hall - Social Services Hall',
              status: appt.status || 'Scheduled',
            }
          : null,
        linkedFinancialAid: fin
          ? {
              id: String(fin.id),
              disbursementId: fin.disbursement_id || `FA-${ref}`,
              assistanceType: fin.assistance_type || row.assistance_type || 'Medical Assistance',
              fixedAmount: Number(fin.fixed_amount || 5000),
              payoutSchedule: fin.payout_schedule || `${appt?.scheduled_date || 'TBA'} ${appt?.scheduled_time || ''}`.trim(),
              payoutLocation: fin.payout_location || 'QC Hall - Financial Aid Payout Center',
              status: fin.status || 'PENDING',
            }
          : null,
        referrals: refs,
        monitoringLogs: mons,
        timeline,
      });
    });

    // Process PWD & Senior Citizen
    pwdSeniorRes.rows.forEach((row, idx) => {
      const ref = row.reference_number || row.id;
      const qcid = row.qcid_number || row.existing_id_number || ref;
      const caseNum = formatCaseNumber(ref, idx + 100);
      const override = caseRecordsMap.get(ref) || caseRecordsMap.get(caseNum) || {};
      const isPwd = String(row.category || '').toUpperCase().includes('PWD');
      const prog = isPwd ? 'PWD' : 'Senior Citizen';
      const appt = findAppointment(ref, qcid, row.email);
      const fin = findFinancialAid(ref, qcid);
      const refs = referralsMap.get(ref) || referralsMap.get(caseNum) || [];
      const mons = monitoringMap.get(ref) || monitoringMap.get(caseNum) || [];

      const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim() || `${prog} Beneficiary`;
      const dateApplied = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-08-14';
      const dateApproved = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : dateApplied;

      let resolvedStatus = override.status || 'open';
      if (!override.status) {
        if (mons.length > 0) resolvedStatus = 'monitoring';
        else if (refs.length > 0) resolvedStatus = 'referred';
        else if (appt?.status === 'completed' && (!fin || fin.status === 'RELEASED')) resolvedStatus = 'open';
      }

      const timeline = [
        {
          id: `TL-SUB-${ref}`,
          title: 'Application Submitted',
          detail: `Submitted ${prog} application (Type: ${row.type || 'New'}, Ref: ${ref}).`,
          date: dateApplied,
          type: 'submission',
        },
        {
          id: `TL-APP-${ref}`,
          title: 'Application Approved',
          detail: `${prog} application verified and approved. Case ${caseNum} automatically linked.`,
          date: dateApproved,
          type: 'approval',
        },
      ];

      if (appt) {
        timeline.push({
          id: `TL-APPT-${appt.id}`,
          title: appt.status === 'completed' ? 'Appointment Completed' : 'Appointment Scheduled',
          detail: `Verification appointment scheduled at ${appt.scheduled_date || appt.appointment_date || 'QC Hall'} - Venue: ${appt.venue || appt.location || 'Office of Senior Citizens Affairs (OSCA) / PWD Affairs Office'}.`,
          date: appt.scheduled_date || dateApproved,
          type: 'appointment',
        });
      }

      if (fin) {
        timeline.push({
          id: `TL-FIN-${fin.id}`,
          title: fin.status === 'RELEASED' ? 'Financial Aid Released' : 'Financial Aid Pending',
          detail: `Disbursement ${fin.disbursement_id || 'DISB'} for ${fin.assistance_type || prog} amount ₱${Number(fin.fixed_amount || 3000).toLocaleString()}. (Status: ${fin.status})`,
          date: fin.status === 'RELEASED' ? (fin.released_date ? new Date(fin.released_date).toISOString().split('T')[0] : dateApproved) : dateApproved,
          type: 'financial',
        });
      }

      refs.forEach((r) => {
        timeline.push({
          id: `TL-${r.id}`,
          title: `Referral Created: ${r.referredTo}`,
          detail: `Reason: ${r.reason}. Status: ${r.status.toUpperCase()}.`,
          date: r.date,
          type: 'referral',
        });
      });

      mons.forEach((m) => {
        timeline.push({
          id: `TL-${m.id}`,
          title: `Monitoring: ${m.progressStatus}`,
          detail: `${m.notes} (Officer: ${m.officer})`,
          date: m.date,
          type: 'monitoring',
        });
      });

      if (resolvedStatus === 'closed') {
        timeline.push({
          id: `TL-CLS-${ref}`,
          title: 'Case Closed',
          detail: override.closed_reason || 'Official ID/Booklet released and aftercare concluded.',
          date: override.closed_at ? new Date(override.closed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'closure',
        });
      }

      cases.push({
        id: caseNum,
        caseNumber: caseNum,
        applicationId: ref,
        beneficiaryId: qcid,
        beneficiaryName: fullName,
        age: String(row.age || '—'),
        sex: row.sex || '—',
        civilStatus: row.civil_status || 'Single',
        contactNo: row.contact_number || row.phone || '09170000000',
        email: row.email || '',
        address: row.address || 'Quezon City',
        linkedProgram: prog,
        caseType: getCaseType(prog, row.type),
        priority: override.priority || 'medium',
        dateOpened: dateApproved,
        assignedSocialWorker: override.assigned_social_worker || 'Admin Social Worker',
        status: resolvedStatus,
        summary: row.admin_notes || `${prog} ${row.type || 'ID'} issuance and welfare assessment.`,
        linkedAppointment: appt
          ? {
              id: String(appt.id),
              date: appt.scheduled_date || appt.appointment_date || '',
              time: appt.scheduled_time || appt.appointment_time || '',
              location: appt.venue || appt.location || 'Quezon City Hall - PWD / Senior Affairs Office',
              status: appt.status || 'Scheduled',
            }
          : null,
        linkedFinancialAid: fin
          ? {
              id: String(fin.id),
              disbursementId: fin.disbursement_id || `FA-${ref}`,
              assistanceType: fin.assistance_type || `${prog} Assistance`,
              fixedAmount: Number(fin.fixed_amount || 3000),
              payoutSchedule: fin.payout_schedule || `${appt?.scheduled_date || 'TBA'} ${appt?.scheduled_time || ''}`.trim(),
              payoutLocation: fin.payout_location || 'QC Hall OSCA/PWD Center',
              status: fin.status || 'PENDING',
            }
          : null,
        referrals: refs,
        monitoringLogs: mons,
        timeline,
      });
    });

    // Process Solo Parent
    soloRes.rows.forEach((row, idx) => {
      const ref = row.reference_number || `SP-${row.id}`;
      const qcid = row.qcid_number || row.solo_parent_id_number || ref;
      const caseNum = formatCaseNumber(ref, idx + 200);
      const override = caseRecordsMap.get(ref) || caseRecordsMap.get(caseNum) || {};
      const appt = findAppointment(ref, qcid, row.email);
      const fin = findFinancialAid(ref, qcid);
      const refs = referralsMap.get(ref) || referralsMap.get(caseNum) || [];
      const mons = monitoringMap.get(ref) || monitoringMap.get(caseNum) || [];

      const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim() || 'Solo Parent Beneficiary';
      const dateApplied = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-08-15';
      const dateApproved = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : dateApplied;

      let resolvedStatus = override.status || 'open';
      if (!override.status) {
        if (mons.length > 0) resolvedStatus = 'monitoring';
        else if (refs.length > 0) resolvedStatus = 'referred';
      }

      const timeline = [
        {
          id: `TL-SUB-${ref}`,
          title: 'Application Submitted',
          detail: `Submitted Solo Parent ID Application (Classification: ${row.classification_title || 'General Solo Parent'}).`,
          date: dateApplied,
          type: 'submission',
        },
        {
          id: `TL-APP-${ref}`,
          title: 'Application Approved',
          detail: `Solo Parent ID approved (Assigned ID: ${row.assigned_id_number || row.solo_parent_id_number || 'Official QC ID Assigned'}). Case ${caseNum} opened.`,
          date: dateApproved,
          type: 'approval',
        },
      ];

      if (appt) {
        timeline.push({
          id: `TL-APPT-${appt.id}`,
          title: appt.status === 'completed' ? 'Appointment Completed' : 'Appointment Scheduled',
          detail: `ID Claiming & orientation appointment at ${appt.venue || 'QC Hall Solo Parent Center'} on ${appt.scheduled_date || 'TBA'} ${appt.scheduled_time || ''}.`,
          date: appt.scheduled_date || dateApproved,
          type: 'appointment',
        });
      }

      if (fin) {
        timeline.push({
          id: `TL-FIN-${fin.id}`,
          title: fin.status === 'RELEASED' ? 'Financial Aid Released' : 'Financial Aid Pending',
          detail: `Solo Parent Welfare Assistance of ₱${Number(fin.fixed_amount || 5000).toLocaleString()}. Status: ${fin.status}`,
          date: dateApproved,
          type: 'financial',
        });
      }

      refs.forEach((r) => {
        timeline.push({
          id: `TL-${r.id}`,
          title: `Referral Created: ${r.referredTo}`,
          detail: `${r.reason} (Status: ${r.status})`,
          date: r.date,
          type: 'referral',
        });
      });

      mons.forEach((m) => {
        timeline.push({
          id: `TL-${m.id}`,
          title: `Monitoring: ${m.progressStatus}`,
          detail: `${m.notes} (Officer: ${m.officer})`,
          date: m.date,
          type: 'monitoring',
        });
      });

      if (resolvedStatus === 'closed') {
        timeline.push({
          id: `TL-CLS-${ref}`,
          title: 'Case Closed',
          detail: override.closed_reason || 'Solo Parent ID claimed and welfare onboarding complete.',
          date: override.closed_at ? new Date(override.closed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'closure',
        });
      }

      cases.push({
        id: caseNum,
        caseNumber: caseNum,
        applicationId: ref,
        beneficiaryId: qcid,
        beneficiaryName: fullName,
        age: String(row.age || '—'),
        sex: row.sex || '—',
        civilStatus: row.civil_status || 'Single Parent',
        contactNo: row.contact_no || '09170000000',
        email: row.email || '',
        address: [row.address_house_no, row.address_street, row.address_barangay, row.address_city_municipality].filter(Boolean).join(', ') || 'Quezon City',
        linkedProgram: 'Solo Parent',
        caseType: 'Solo Parent Welfare & ID Support',
        priority: override.priority || 'medium',
        dateOpened: dateApproved,
        assignedSocialWorker: override.assigned_social_worker || 'Admin Social Worker',
        status: resolvedStatus,
        summary: row.classification_title || row.circumstance_details || 'Solo parent benefits and assistance program case.',
        linkedAppointment: appt
          ? {
              id: String(appt.id),
              date: appt.scheduled_date || appt.appointment_date || '',
              time: appt.scheduled_time || appt.appointment_time || '',
              location: appt.venue || appt.location || 'Quezon City Hall - Solo Parent Section',
              status: appt.status || 'Scheduled',
            }
          : null,
        linkedFinancialAid: fin
          ? {
              id: String(fin.id),
              disbursementId: fin.disbursement_id || `FA-${ref}`,
              assistanceType: fin.assistance_type || 'Solo Parent Assistance',
              fixedAmount: Number(fin.fixed_amount || 5000),
              payoutSchedule: fin.payout_schedule || `${appt?.scheduled_date || 'TBA'} ${appt?.scheduled_time || ''}`.trim(),
              payoutLocation: fin.payout_location || 'QC Hall Payout Center',
              status: fin.status || 'PENDING',
            }
          : null,
        referrals: refs,
        monitoringLogs: mons,
        timeline,
      });
    });

    // Process Child Welfare
    childRes.rows.forEach((row, idx) => {
      const ref = row.reference_number || `CW-${row.id}`;
      const qcid = row.guardian_valid_id || ref;
      const caseNum = formatCaseNumber(ref, idx + 300);
      const override = caseRecordsMap.get(ref) || caseRecordsMap.get(caseNum) || {};
      const appt = findAppointment(ref, qcid, row.guardian_email);
      const fin = findFinancialAid(ref, qcid);
      const refs = referralsMap.get(ref) || referralsMap.get(caseNum) || [];
      const mons = monitoringMap.get(ref) || monitoringMap.get(caseNum) || [];

      const fullName = [row.guardian_first_name, row.guardian_middle_name, row.guardian_last_name].filter(Boolean).join(' ').trim() || 'Child Welfare Guardian';
      const dateApplied = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-08-18';
      const dateApproved = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : dateApplied;

      let resolvedStatus = override.status || 'open';
      if (!override.status) {
        if (mons.length > 0) resolvedStatus = 'monitoring';
        else if (refs.length > 0) resolvedStatus = 'referred';
      }

      const timeline = [
        {
          id: `TL-SUB-${ref}`,
          title: 'Application Submitted',
          detail: `Child Welfare application for ${row.child_name || 'Child'} (${row.category_title || 'Support'}).`,
          date: dateApplied,
          type: 'submission',
        },
        {
          id: `TL-APP-${ref}`,
          title: 'Application Approved',
          detail: `Approved by City Social Worker (Approved Amount: ₱${Number(row.approved_amount || 5000).toLocaleString()}). Case ${caseNum} opened.`,
          date: dateApproved,
          type: 'approval',
        },
      ];

      if (appt) {
        timeline.push({
          id: `TL-APPT-${appt.id}`,
          title: appt.status === 'completed' ? 'Appointment Completed' : 'Appointment Scheduled',
          detail: `Counseling / Assessment appointment scheduled at ${appt.venue || 'QC Child Welfare Center'} on ${appt.scheduled_date || 'TBA'} ${appt.scheduled_time || ''}.`,
          date: appt.scheduled_date || dateApproved,
          type: 'appointment',
        });
      }

      if (fin) {
        timeline.push({
          id: `TL-FIN-${fin.id}`,
          title: fin.status === 'RELEASED' ? 'Financial Aid Released' : 'Financial Aid Pending',
          detail: `Child Welfare grant of ₱${Number(fin.fixed_amount || row.approved_amount || 5000).toLocaleString()}. Status: ${fin.status}`,
          date: dateApproved,
          type: 'financial',
        });
      }

      refs.forEach((r) => {
        timeline.push({
          id: `TL-${r.id}`,
          title: `Referral Created: ${r.referredTo}`,
          detail: `${r.reason} (Status: ${r.status})`,
          date: r.date,
          type: 'referral',
        });
      });

      mons.forEach((m) => {
        timeline.push({
          id: `TL-${m.id}`,
          title: `Monitoring: ${m.progressStatus}`,
          detail: `${m.notes} (Officer: ${m.officer})`,
          date: m.date,
          type: 'monitoring',
        });
      });

      if (resolvedStatus === 'closed') {
        timeline.push({
          id: `TL-CLS-${ref}`,
          title: 'Case Closed',
          detail: override.closed_reason || 'Child support grant and intervention concluded.',
          date: override.closed_at ? new Date(override.closed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'closure',
        });
      }

      cases.push({
        id: caseNum,
        caseNumber: caseNum,
        applicationId: ref,
        beneficiaryId: qcid,
        beneficiaryName: fullName,
        age: String(row.guardian_age || '—'),
        sex: row.guardian_sex || '—',
        civilStatus: row.guardian_civil_status || 'Single',
        contactNo: row.guardian_contact_no || '09170000000',
        email: row.guardian_email || '',
        address: [row.address_house_no, row.address_street, row.address_barangay, row.address_city_municipality].filter(Boolean).join(', ') || 'Quezon City',
        linkedProgram: 'Child Welfare',
        caseType: row.category_title || 'Child Welfare & Protection Assistance',
        priority: override.priority || 'high',
        dateOpened: dateApproved,
        assignedSocialWorker: override.assigned_social_worker || 'Admin Social Worker',
        status: resolvedStatus,
        summary: `Child: ${row.child_name || 'N/A'} (${row.child_age || 'N/A'} y/o) — Primary Reason: ${row.primary_reason_for_assistance || 'Support'}`,
        linkedAppointment: appt
          ? {
              id: String(appt.id),
              date: appt.scheduled_date || appt.appointment_date || '',
              time: appt.scheduled_time || appt.appointment_time || '',
              location: appt.venue || appt.location || 'Quezon City Hall - Child Protection Center',
              status: appt.status || 'Scheduled',
            }
          : null,
        linkedFinancialAid: fin
          ? {
              id: String(fin.id),
              disbursementId: fin.disbursement_id || `FA-${ref}`,
              assistanceType: fin.assistance_type || 'Child Welfare Support',
              fixedAmount: Number(fin.fixed_amount || row.approved_amount || 5000),
              payoutSchedule: fin.payout_schedule || `${appt?.scheduled_date || 'TBA'} ${appt?.scheduled_time || ''}`.trim(),
              payoutLocation: fin.payout_location || 'QC Hall Payout Center',
              status: fin.status || 'PENDING',
            }
          : null,
        referrals: refs,
        monitoringLogs: mons,
        timeline,
      });
    });

    // Process Livelihood
    livelihoodRes.rows.forEach((row, idx) => {
      const ref = row.reference_number || `LV-${row.id}`;
      const qcid = row.qcid_number || ref;
      const caseNum = formatCaseNumber(ref, idx + 400);
      const override = caseRecordsMap.get(ref) || caseRecordsMap.get(caseNum) || {};
      const appt = findAppointment(ref, qcid, row.email);
      const fin = findFinancialAid(ref, qcid);
      const refs = referralsMap.get(ref) || referralsMap.get(caseNum) || [];
      const mons = monitoringMap.get(ref) || monitoringMap.get(caseNum) || [];

      const fullName = [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ').trim() || 'Livelihood Beneficiary';
      const dateApplied = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-08-15';
      const dateApproved = row.approved_date ? new Date(row.approved_date).toISOString().split('T')[0] : (row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : dateApplied);

      let resolvedStatus = override.status || 'open';
      if (!override.status) {
        if (mons.length > 0) resolvedStatus = 'monitoring';
        else if (refs.length > 0) resolvedStatus = 'referred';
      }

      const timeline = [
        {
          id: `TL-SUB-${ref}`,
          title: 'Application Submitted',
          detail: `Submitted Livelihood Program Application (${row.business_name || row.program_type || 'Micro-Enterprise'}).`,
          date: dateApplied,
          type: 'submission',
        },
        {
          id: `TL-APP-${ref}`,
          title: 'Application Approved',
          detail: `Livelihood grant approved for business capitalization. Case ${caseNum} opened.`,
          date: dateApproved,
          type: 'approval',
        },
      ];

      if (appt) {
        timeline.push({
          id: `TL-APPT-${appt.id}`,
          title: appt.status === 'completed' ? 'Appointment Completed' : 'Appointment Scheduled',
          detail: `Business orientation and kit distribution scheduled at ${appt.venue || 'QC Livelihood Center'}.`,
          date: appt.scheduled_date || dateApproved,
          type: 'appointment',
        });
      }

      if (fin) {
        timeline.push({
          id: `TL-FIN-${fin.id}`,
          title: fin.status === 'RELEASED' ? 'Financial Aid Released' : 'Financial Aid Pending',
          detail: `Livelihood financial assistance of ₱${Number(fin.fixed_amount || 15000).toLocaleString()}. (Status: ${fin.status})`,
          date: dateApproved,
          type: 'financial',
        });
      }

      refs.forEach((r) => {
        timeline.push({
          id: `TL-${r.id}`,
          title: `Referral Created: ${r.referredTo}`,
          detail: `${r.reason} (Status: ${r.status})`,
          date: r.date,
          type: 'referral',
        });
      });

      mons.forEach((m) => {
        timeline.push({
          id: `TL-${m.id}`,
          title: `Monitoring: ${m.progressStatus}`,
          detail: `${m.notes} (Officer: ${m.officer})`,
          date: m.date,
          type: 'monitoring',
        });
      });

      if (resolvedStatus === 'closed') {
        timeline.push({
          id: `TL-CLS-${ref}`,
          title: 'Case Closed',
          detail: override.closed_reason || 'Livelihood assistance completed and enterprise sustainable.',
          date: override.closed_at ? new Date(override.closed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'closure',
        });
      }

      cases.push({
        id: caseNum,
        caseNumber: caseNum,
        applicationId: ref,
        beneficiaryId: qcid,
        beneficiaryName: fullName,
        age: String(row.age || '—'),
        sex: row.sex || '—',
        civilStatus: row.civil_status || 'Single',
        contactNo: row.mobile_number || row.contact_no || '09170000000',
        email: row.email || '',
        address: [row.house_no, row.street, row.barangay, row.city].filter(Boolean).join(', ') || 'Quezon City',
        linkedProgram: 'Livelihood',
        caseType: `Livelihood: ${row.business_name || row.business_type || 'Capitalization Grant'}`,
        priority: override.priority || 'medium',
        dateOpened: dateApproved,
        assignedSocialWorker: override.assigned_social_worker || 'Admin Social Worker',
        status: resolvedStatus,
        summary: `Proposed Business: ${row.business_name || 'N/A'} — Category: ${row.business_type || 'Micro-enterprise'}`,
        linkedAppointment: appt
          ? {
              id: String(appt.id),
              date: appt.scheduled_date || appt.appointment_date || '',
              time: appt.scheduled_time || appt.appointment_time || '',
              location: appt.venue || appt.location || 'Quezon City Hall - Livelihood Center',
              status: appt.status || 'Scheduled',
            }
          : null,
        linkedFinancialAid: fin
          ? {
              id: String(fin.id),
              disbursementId: fin.disbursement_id || `FA-${ref}`,
              assistanceType: fin.assistance_type || 'Livelihood Capital Grant',
              fixedAmount: Number(fin.fixed_amount || 15000),
              payoutSchedule: fin.payout_schedule || `${appt?.scheduled_date || 'TBA'} ${appt?.scheduled_time || ''}`.trim(),
              payoutLocation: fin.payout_location || 'QC Livelihood Center',
              status: fin.status || 'PENDING',
            }
          : null,
        referrals: refs,
        monitoringLogs: mons,
        timeline,
      });
    });

    // Process Training
    trainingRes.rows.forEach((row, idx) => {
      const ref = row.reference_number || `TR-${row.id}`;
      const qcid = row.qcid_number || ref;
      const caseNum = formatCaseNumber(ref, idx + 500);
      const override = caseRecordsMap.get(ref) || caseRecordsMap.get(caseNum) || {};
      const appt = findAppointment(ref, qcid, row.email);
      const fin = findFinancialAid(ref, qcid);
      const refs = referralsMap.get(ref) || referralsMap.get(caseNum) || [];
      const mons = monitoringMap.get(ref) || monitoringMap.get(caseNum) || [];

      const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Training Beneficiary';
      const dateApplied = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-08-20';
      const dateApproved = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : dateApplied;

      let resolvedStatus = override.status || 'open';
      if (!override.status) {
        if (mons.length > 0) resolvedStatus = 'monitoring';
        else if (refs.length > 0) resolvedStatus = 'referred';
      }

      const timeline = [
        {
          id: `TL-SUB-${ref}`,
          title: 'Application Submitted',
          detail: `Submitted Training Program Application (${row.course_title || 'Skills Training'}).`,
          date: dateApplied,
          type: 'submission',
        },
        {
          id: `TL-APP-${ref}`,
          title: 'Application Approved',
          detail: `Enrolled in ${row.course_title || 'Skills Development'}. Case ${caseNum} opened.`,
          date: dateApproved,
          type: 'approval',
        },
      ];

      if (appt) {
        timeline.push({
          id: `TL-APPT-${appt.id}`,
          title: appt.status === 'completed' ? 'Appointment Completed' : 'Appointment Scheduled',
          detail: `Training Orientation at ${appt.venue || 'QC Skills Center'} on ${appt.scheduled_date || 'TBA'} ${appt.scheduled_time || ''}.`,
          date: appt.scheduled_date || dateApproved,
          type: 'appointment',
        });
      }

      refs.forEach((r) => {
        timeline.push({
          id: `TL-${r.id}`,
          title: `Referral Created: ${r.referredTo}`,
          detail: `${r.reason} (Status: ${r.status})`,
          date: r.date,
          type: 'referral',
        });
      });

      mons.forEach((m) => {
        timeline.push({
          id: `TL-${m.id}`,
          title: `Monitoring: ${m.progressStatus}`,
          detail: `${m.notes} (Officer: ${m.officer})`,
          date: m.date,
          type: 'monitoring',
        });
      });

      if (resolvedStatus === 'closed') {
        timeline.push({
          id: `TL-CLS-${ref}`,
          title: 'Case Closed',
          detail: override.closed_reason || 'Training course completed and certification awarded.',
          date: override.closed_at ? new Date(override.closed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'closure',
        });
      }

      cases.push({
        id: caseNum,
        caseNumber: caseNum,
        applicationId: ref,
        beneficiaryId: qcid,
        beneficiaryName: fullName,
        age: String(row.age || '—'),
        sex: row.sex || '—',
        civilStatus: 'Single',
        contactNo: row.contact_no || '09170000000',
        email: row.email || '',
        address: row.address || 'Quezon City',
        linkedProgram: 'Training Program',
        caseType: `Training: ${row.course_title || 'Vocational Skills'}`,
        priority: override.priority || 'low',
        dateOpened: dateApproved,
        assignedSocialWorker: override.assigned_social_worker || 'Admin Social Worker',
        status: resolvedStatus,
        summary: `Enrolled Course: ${row.course_title || 'Skills Training'} — Preferred Schedule: ${row.preferred_schedule || 'Weekday'}`,
        linkedAppointment: appt
          ? {
              id: String(appt.id),
              date: appt.scheduled_date || appt.appointment_date || '',
              time: appt.scheduled_time || appt.appointment_time || '',
              location: appt.venue || appt.location || 'QC Skills Academy',
              status: appt.status || 'Scheduled',
            }
          : null,
        linkedFinancialAid: null,
        referrals: refs,
        monitoringLogs: mons,
        timeline,
      });
    });

    // Sort cases by latest opened date descending
    cases.sort((a, b) => new Date(b.dateOpened).getTime() - new Date(a.dateOpened).getTime());

    res.status(200).json({
      success: true,
      count: cases.length,
      cases,
    });
  } catch (err) {
    console.error('Error in getAllCases:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch cases', error: err.message });
  }
};

exports.updateCaseStatus = async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { status, priority, assignedSocialWorker, notes, closedReason, applicationId } = req.body;

    const validStatuses = ['open', 'monitoring', 'referred', 'closed'];
    if (status && !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Invalid case status' });
    }

    const appRef = applicationId || caseNumber;
    const newStatus = status ? status.toLowerCase() : 'open';
    const closedAt = newStatus === 'closed' ? new Date() : null;

    const query = `
      INSERT INTO case_records (
        case_number, application_ref, program, status, priority,
        assigned_social_worker, notes, closed_at, closed_reason, updated_at
      )
      VALUES ($1, $2, 'AICS', $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (case_number)
      DO UPDATE SET
        status = EXCLUDED.status,
        priority = COALESCE(EXCLUDED.priority, case_records.priority),
        assigned_social_worker = COALESCE(EXCLUDED.assigned_social_worker, case_records.assigned_social_worker),
        notes = COALESCE(EXCLUDED.notes, case_records.notes),
        closed_at = EXCLUDED.closed_at,
        closed_reason = EXCLUDED.closed_reason,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await db.query(query, [
      caseNumber,
      appRef,
      newStatus,
      priority || 'medium',
      assignedSocialWorker || 'Admin Social Worker',
      notes || null,
      closedAt,
      closedReason || null,
    ]);

    res.status(200).json({
      success: true,
      message: 'Case status updated successfully',
      caseRecord: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating case status:', err);
    res.status(500).json({ success: false, message: 'Error updating case status', error: err.message });
  }
};

exports.addReferral = async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { referredTo, serviceReason, referredBy, referralDate, status, remarks, applicationId } = req.body;

    if (!referredTo || !serviceReason) {
      return res.status(400).json({ success: false, message: 'referredTo and serviceReason are required' });
    }

    const appRef = applicationId || caseNumber;
    const dateStr = referralDate || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `INSERT INTO case_referrals (
        case_number, application_ref, referred_to, service_reason,
        referred_by, referral_date, status, remarks, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
      [
        caseNumber,
        appRef,
        referredTo,
        serviceReason,
        referredBy || 'Admin Social Worker',
        dateStr,
        status || 'pending',
        remarks || null,
      ]
    );

    // Also ensure case status is updated to 'referred' if currently open
    await db.query(
      `INSERT INTO case_records (case_number, application_ref, program, status, updated_at)
       VALUES ($1, $2, 'AICS', 'referred', NOW())
       ON CONFLICT (case_number)
       DO UPDATE SET status = CASE WHEN case_records.status = 'open' THEN 'referred' ELSE case_records.status END, updated_at = NOW()`,
      [caseNumber, appRef]
    ).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Referral added successfully',
      referral: result.rows[0],
    });
  } catch (err) {
    console.error('Error adding referral:', err);
    res.status(500).json({ success: false, message: 'Error adding referral', error: err.message });
  }
};

exports.addMonitoring = async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { officerName, monitoringDate, notes, progressStatus, nextAction, applicationId } = req.body;

    if (!notes) {
      return res.status(400).json({ success: false, message: 'Monitoring notes are required' });
    }

    const appRef = applicationId || caseNumber;
    const dateStr = monitoringDate || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `INSERT INTO case_monitoring (
        case_number, application_ref, officer_name, monitoring_date,
        notes, progress_status, next_action, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        caseNumber,
        appRef,
        officerName || 'Admin Social Worker',
        dateStr,
        notes,
        progressStatus || 'In Progress',
        nextAction || null,
      ]
    );

    // Also ensure case status is updated to 'monitoring' if currently open
    await db.query(
      `INSERT INTO case_records (case_number, application_ref, program, status, updated_at)
       VALUES ($1, $2, 'AICS', 'monitoring', NOW())
       ON CONFLICT (case_number)
       DO UPDATE SET status = CASE WHEN case_records.status = 'open' THEN 'monitoring' ELSE case_records.status END, updated_at = NOW()`,
      [caseNumber, appRef]
    ).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Monitoring log recorded successfully',
      monitoring: result.rows[0],
    });
  } catch (err) {
    console.error('Error adding monitoring:', err);
    res.status(500).json({ success: false, message: 'Error adding monitoring log', error: err.message });
  }
};
