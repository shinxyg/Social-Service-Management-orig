// backend/controllers/trainingController.js
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'training_applications.json');

const DEFAULT_TRAINING_COURSES = [
  {
    id: 'tr-sewing',
    title: 'Sewing Training',
    category: 'Livelihood & Skills Development',
    description: 'Matutunan ang pattern drafting, pananahi ng mga damit at kurtina, paggamit at pag-aalaga ng sewing machine, at paglikha ng mga produktong maaaring ibenta sa komunidad.',
    date: 'September 15, 2026 - September 18, 2026',
    time: '9:00 AM - 12:00 PM',
    location: 'QC Skills Development Center, Batasan Hills',
    landmark: 'Tapat ng Puregold Batasan / Katabi ng Batasan Hills Barangay Hall',
    totalSlots: 25,
    availableSlots: 18,
    durationHours: 16,
    instructor: 'Gng. Rosa Dimaculangan (Master Tailor)',
    prerequisites: 'QC Resident (18 taong gulang pataas), may interes sa pananahi.',
    materialsProvided: 'Sewing fabric, thread kit, pattern paper, tracing wheel, measuring tape.',
  },
  {
    id: 'tr-cooking',
    title: 'Cooking Training',
    category: 'Livelihood & Skills Development',
    description: 'Matutunan ang commercial cooking, food safety & sanitation, paghahanda ng merienda at lutong ulam na patok sa karenderya, at tamang costing at pagpepresyo.',
    date: 'September 20, 2026 - September 23, 2026',
    time: '1:00 PM - 4:00 PM',
    location: 'QC Skills Development Center, Batasan Hills',
    landmark: '3rd Floor Culinary Lab, malapit sa Batasan Hills Barangay Hall',
    totalSlots: 25,
    availableSlots: 12,
    durationHours: 16,
    instructor: 'Chef Anthony Santos (Culinary Specialist)',
    prerequisites: 'QC Resident, handang sumunod sa kitchen hygiene & food safety guidelines.',
    materialsProvided: 'Ingredients kit, cooking apron, hairnet, recipe guide booklet.',
  },
  {
    id: 'tr-beauty',
    title: 'Beauty Services Training',
    category: 'Livelihood & Skills Development',
    description: 'Pangunahing kasanayan sa haircutting at hairstyling, manicure/pedicure na may nail art, facial cleansing at basic cosmetology para sa salon o home-service livelihood.',
    date: 'September 24, 2026 - September 27, 2026',
    time: '9:00 AM - 12:00 PM',
    location: 'QC Skills Development Center, Batasan Hills',
    landmark: 'Ground Floor Wellness Studio, tapat ng Puregold Batasan',
    totalSlots: 25,
    availableSlots: 15,
    durationHours: 16,
    instructor: 'Bb. Cheryl Mendez (Certified Cosmetologist)',
    prerequisites: 'QC Resident (18 taong gulang pataas), masigasig matuto ng beauty care.',
    materialsProvided: 'Nail grooming kit, salon cape, hair clips, sanitizer and manicure tools.',
  },
  {
    id: 'tr-computer',
    title: 'Basic Computer Training',
    category: 'Livelihood & Skills Development',
    description: 'Pagsasanay sa computer navigation, Microsoft Word document typing, Excel spreadsheet budgeting, internet search, email communication, at online job preparation.',
    date: 'September 28, 2026 - October 01, 2026',
    time: '1:00 PM - 4:00 PM',
    location: 'QC Skills Development Center, Batasan Hills',
    landmark: '2nd Floor Computer Laboratory, Batasan Hills Center',
    totalSlots: 30,
    availableSlots: 22,
    durationHours: 16,
    instructor: 'G. Mark Villanueva (IT Skills Coordinator)',
    prerequisites: 'QC Resident na nais matuto ng computer mula sa basic navigation hanggang office tools.',
    materialsProvided: 'Computer workstation with internet, digital handouts, practice USB drive.',
  },
];

function generateReference() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TP-2026-${num}`;
}

function loadPersistentApps() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading training applications:', err.message);
  }
  return [];
}

function savePersistentApps(apps) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving training applications:', err.message);
  }
}

let memoryApplications = loadPersistentApps();

// Ensure at least one initial sample if empty
if (memoryApplications.length === 0) {
  memoryApplications = [
    {
      id: 1,
      referenceNumber: 'TP-2026-1042',
      qcid: '110000116932100',
      userId: '110000116932100',
      trainingId: 'tr-sewing',
      trainingName: 'Sewing Training',
      applicantInfo: {
        fullName: 'CLARISA MAE GALIAS DIMAL',
        firstName: 'CLARISA MAE',
        middleName: 'GALIAS',
        lastName: 'DIMAL',
        suffix: '',
        email: 'clarisa.dimal@example.com',
        contactNo: '09172345678',
        address: '11 Sampaloc Street',
        barangay: 'Sauyo',
        city: 'Quezon City',
        sex: 'Female',
        dateOfBirth: '2004-10-29',
        age: 21,
        occupation: 'Self-employed / Home-based',
      },
      status: 'approved',
      submittedAt: '2026-08-20T08:30:00Z',
      approvedBy: 'QC Skills Development Division',
      approvedDate: '2026-08-22T10:15:00Z',
      schedule: {
        trainingName: 'Sewing Training',
        trainingDate: 'September 15, 2026 - September 18, 2026',
        trainingTime: '9:00 AM - 12:00 PM',
        trainingLocation: 'QC Skills Development Center, Batasan Hills',
        landmark: 'Tapat ng Puregold Batasan / Katabi ng Batasan Hills Barangay Hall',
        trainingStatus: 'Upcoming', // Upcoming | Ongoing | Completed
      },
      attendance: {
        totalHours: 16,
        hoursCompleted: 4,
        completed: false,
        sessions: [
          { day: 1, topic: 'Machine Operation & Basic Safety', attended: true, date: 'September 15, 2026' },
          { day: 2, topic: 'Pattern Drafting & Cutting Techniques', attended: false, date: 'September 16, 2026' },
          { day: 3, topic: 'Garment Assembly & Pocket Construction', attended: false, date: 'September 17, 2026' },
          { day: 4, topic: 'Finishing, Quality Checking & Costing', attended: false, date: 'September 18, 2026' },
        ],
      },
      certificate: null,
    },
  ];
  savePersistentApps(memoryApplications);
}

// GET /api/training/programs
exports.getAvailablePrograms = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      programs: DEFAULT_TRAINING_COURSES,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/training/applications
exports.getApplications = (req, res) => {
  try {
    const { qcid, email } = req.query;
    let list = [...memoryApplications];

    if (qcid) {
      const q = String(qcid).trim();
      list = list.filter((a) => a.qcid === q || a.userId === q);
    } else if (email) {
      const em = String(email).trim().toLowerCase();
      list = list.filter((a) => a.applicantInfo?.email?.toLowerCase() === em);
    }

    return res.status(200).json({
      success: true,
      applications: list,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/training/apply
exports.applyForTraining = (req, res) => {
  try {
    const { trainingId, trainingName, applicantInfo, qcid } = req.body;

    if (!trainingId || !trainingName) {
      return res.status(400).json({ success: false, message: 'Please select a training program.' });
    }

    const matchedCourse = DEFAULT_TRAINING_COURSES.find((c) => c.id === trainingId) || {
      date: 'September 15, 2026 - September 18, 2026',
      time: '9:00 AM - 12:00 PM',
      location: 'QC Skills Development Center, Batasan Hills',
      landmark: 'Near Batasan Hills Barangay Hall / across Puregold Batasan',
      durationHours: 16,
    };

    const userQcid = qcid || applicantInfo?.qcidNo || applicantInfo?.qcidNumber || '110000116932100';
    const refNum = generateReference();

    const newApp = {
      id: Date.now(),
      referenceNumber: refNum,
      qcid: userQcid,
      userId: userQcid,
      trainingId,
      trainingName,
      applicantInfo: {
        fullName: applicantInfo?.fullName || `${applicantInfo?.firstName || ''} ${applicantInfo?.lastName || ''}`.trim(),
        firstName: applicantInfo?.firstName || '',
        middleName: applicantInfo?.middleName || '',
        lastName: applicantInfo?.lastName || '',
        suffix: applicantInfo?.suffix || '',
        email: applicantInfo?.email || '',
        contactNo: applicantInfo?.contactNo || applicantInfo?.mobileNumber || '',
        address: applicantInfo?.address || '',
        barangay: applicantInfo?.barangay || '',
        city: applicantInfo?.city || 'Quezon City',
        sex: applicantInfo?.sex || '',
        dateOfBirth: applicantInfo?.dateOfBirth || applicantInfo?.birthDate || '',
        age: applicantInfo?.age || '',
        occupation: applicantInfo?.occupation || '',
      },
      status: 'pending', // pending | approved | rejected | needs_revision
      submittedAt: new Date().toISOString(),
      schedule: {
        trainingName,
        trainingDate: matchedCourse.date,
        trainingTime: matchedCourse.time,
        trainingLocation: matchedCourse.location,
        landmark: matchedCourse.landmark,
        trainingStatus: 'Upcoming',
      },
      attendance: {
        totalHours: matchedCourse.durationHours || 16,
        hoursCompleted: 0,
        completed: false,
        sessions: [
          { day: 1, topic: 'Orientation & Fundamental Skills', attended: false, date: matchedCourse.date.split('-')[0]?.trim() },
          { day: 2, topic: 'Hands-on Application & Laboratory Work', attended: false, date: '' },
          { day: 3, topic: 'Specialized Techniques & Practical Assessment', attended: false, date: '' },
          { day: 4, topic: 'Final Evaluation, Livelihood Integration & Completion', attended: false, date: matchedCourse.date.split('-')[1]?.trim() },
        ],
      },
      certificate: null,
    };

    memoryApplications.unshift(newApp);
    savePersistentApps(memoryApplications);

    return res.status(201).json({
      success: true,
      message: 'Application for training submitted successfully.',
      application: newApp,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/training/applications/:id/status
exports.updateApplicationStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, revisionNotes, attendance, trainingStatus, approvedBy } = req.body;

    const idx = memoryApplications.findIndex((a) => String(a.id) === String(id) || a.referenceNumber === String(id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const app = memoryApplications[idx];

    if (status) {
      app.status = status;
      if (status === 'approved') {
        app.approvedBy = approvedBy || 'QC Skills Development Division';
        app.approvedDate = new Date().toISOString();
        app.rejectionReason = undefined;
        app.revisionNotes = undefined;
      } else if (status === 'rejected') {
        app.rejectionReason = rejectionReason || 'Requirements incomplete or slot unavailable.';
      } else if (status === 'needs_revision') {
        app.revisionNotes = revisionNotes || 'Please verify or update your contact details or required information.';
      }
    }

    if (trainingStatus && app.schedule) {
      app.schedule.trainingStatus = trainingStatus;
    }

    if (attendance) {
      app.attendance = { ...app.attendance, ...attendance };
      if (app.attendance.hoursCompleted >= app.attendance.totalHours || app.attendance.completed) {
        app.attendance.completed = true;
        if (app.schedule) app.schedule.trainingStatus = 'Completed';

        // Auto issue certificate if not yet issued
        if (!app.certificate) {
          app.certificate = {
            certificateNo: `QC-CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
            issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            title: `Certificate of Completion in ${app.trainingName}`,
            recipientName: app.applicantInfo?.fullName || 'Resident Beneficiary',
            trainingName: app.trainingName,
            hoursCompleted: app.attendance.totalHours,
            status: 'Issued',
          };
        }
      }
    }

    memoryApplications[idx] = app;
    savePersistentApps(memoryApplications);

    return res.status(200).json({
      success: true,
      message: 'Application updated successfully.',
      application: app,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/training/reset
exports.resetApplications = (req, res) => {
  try {
    memoryApplications = [];
    savePersistentApps(memoryApplications);
    return res.status(200).json({ success: true, message: 'Training applications reset.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
