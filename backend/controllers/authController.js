const db = require('../config/db');
const { sendOtpEmail } = require('../services/emailService');

// In-memory fallback stores
let memoryOtps = new Map(); // email -> { otpCode, expiresAt, isUsed }
let memoryUsers = [];

/**
 * Generates a standard 15-digit Quezon City Resident ID (QCID)
 */
function generateQcidNumber() {
  const prefix = '110000';
  const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${prefix}${randomPart}`;
}

/**
 * POST /api/auth/send-otp
 * Generates and emails a 6-digit OTP code to the applicant's Gmail address
 */
exports.sendOtp = async (req, res) => {
  try {
    const { email, recipientName } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (!emailRegex.test(cleanEmail) || cleanEmail.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format. Please provide a valid active email address.',
      });
    }

    if (cleanEmail.endsWith('@gmail.com')) {
      const username = cleanEmail.split('@')[0];
      if (username.length < 6 || username.length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Gmail address. Gmail usernames must be between 6 and 30 characters.',
        });
      }
      if (!/^[a-z0-9.]+$/.test(username) || username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Gmail address format.',
        });
      }
    }

    // Generate random 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save to Database
    try {
      await db.query(
        `INSERT INTO email_otps (email, otp_code, expires_at, is_used, created_at)
         VALUES ($1, $2, $3, false, NOW())`,
        [cleanEmail, otpCode, expiresAt]
      );
    } catch (dbErr) {
      console.warn('[DB Error] Saving OTP to DB failed, using memory store:', dbErr.message);
    }

    // Always keep in memory store as fallback
    memoryOtps.set(cleanEmail, {
      otpCode,
      expiresAt: expiresAt.getTime(),
      isUsed: false,
    });

    console.log(`[OTP] Generated OTP ${otpCode} for ${cleanEmail}. Dispatching email...`);

    // Dispatch official email via Gmail SMTP / Fallback
    const emailResult = await sendOtpEmail({
      recipientEmail: cleanEmail,
      otpCode,
      recipientName: recipientName || 'Resident',
    });

    if (emailResult.success) {
      return res.status(200).json({
        success: true,
        message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
        provider: emailResult.provider,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Could not send verification email. Please check your email address and try again.',
        details: emailResult.message,
      });
    }
  } catch (err) {
    console.error('Error in sendOtp controller:', err);
    return res.status(500).json({ success: false, message: 'Server error while sending OTP', error: err.message });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP code
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    // 1. Check in DB
    try {
      const dbRes = await db.query(
        `SELECT * FROM email_otps 
         WHERE email = $1 AND otp_code = $2 AND is_used = false AND expires_at > NOW()
         ORDER BY id DESC LIMIT 1`,
        [cleanEmail, cleanOtp]
      );

      if (dbRes.rows.length > 0) {
        const otpRecord = dbRes.rows[0];
        // Mark as used
        await db.query(`UPDATE email_otps SET is_used = true WHERE id = $1`, [otpRecord.id]);
        memoryOtps.delete(cleanEmail);
        return res.status(200).json({
          success: true,
          message: 'OTP verified successfully.',
        });
      }
    } catch (dbErr) {
      console.warn('[DB Error] Verifying OTP in DB failed, checking memory store:', dbErr.message);
    }

    // 2. Fallback check memory store
    const memRecord = memoryOtps.get(cleanEmail);
    if (memRecord) {
      const now = Date.now();
      if (!memRecord.isUsed && memRecord.otpCode === cleanOtp && memRecord.expiresAt > now) {
        memRecord.isUsed = true;
        memoryOtps.delete(cleanEmail);
        return res.status(200).json({
          success: true,
          message: 'OTP verified successfully.',
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP code. Please request a new code.',
    });
  } catch (err) {
    console.error('Error in verifyOtp controller:', err);
    return res.status(500).json({ success: false, message: 'Server error while verifying OTP', error: err.message });
  }
};

/**
 * POST /api/auth/register
 * Creates and registers a new resident user account in the database
 */
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      suffix,
      birthMonth,
      birthDay,
      birthYear,
      birthDate,
      city,
      specifyCity,
      houseNo,
      street,
      barangay,
      workingInQC,
      occupation,
      sex,
      mobileNumber,
      profilePhotoUrl,
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const finalCity = city === 'Others' && specifyCity ? specifyCity.trim() : (city || 'Quezon City').trim();
    const finalBirthDate = birthDate || (birthMonth && birthDay && birthYear ? `${birthMonth} ${birthDay}, ${birthYear}` : '');
    const qcidNumber = generateQcidNumber();

    const newUser = {
      email: cleanEmail,
      password: password || 'default123',
      firstName: (firstName || '').trim(),
      lastName: (lastName || '').trim(),
      middleName: (middleName || '').trim(),
      suffix: (suffix || '').trim(),
      birthDate: finalBirthDate,
      birthMonth: birthMonth || '',
      birthDay: birthDay || '',
      birthYear: birthYear || '',
      city: finalCity,
      barangay: (barangay || '').trim(),
      street: (street || '').trim(),
      houseNo: (houseNo || '').trim(),
      workingInQC: workingInQC || 'No',
      occupation: (occupation || '').trim(),
      sex: sex || 'FEMALE',
      mobileNumber: (mobileNumber || '').trim(),
      profilePhotoUrl: profilePhotoUrl || null,
      qcidNumber: qcidNumber,
      role: 'user',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const existingUser = await db.query('SELECT id, qcid_number FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (existingUser.rows.length > 0) {
        const existingQcid = existingUser.rows[0].qcid_number || qcidNumber;
        newUser.qcidNumber = existingQcid;

        // Update existing user
        await db.query(
          `UPDATE users SET
            password = $1, first_name = $2, last_name = $3, middle_name = $4, suffix = $5,
            birth_date = $6, birth_month = $7, birth_day = $8, birth_year = $9,
            city = $10, barangay = $11, street = $12, house_no = $13,
            working_in_qc = $14, occupation = $15, sex = $16, mobile_number = $17,
            profile_photo_url = $18, qcid_number = $19, updated_at = NOW()
           WHERE LOWER(email) = $20`,
          [
            newUser.password, newUser.firstName, newUser.lastName, newUser.middleName, newUser.suffix,
            newUser.birthDate, newUser.birthMonth, newUser.birthDay, newUser.birthYear,
            newUser.city, newUser.barangay, newUser.street, newUser.houseNo,
            newUser.workingInQC, newUser.occupation, newUser.sex, newUser.mobileNumber,
            newUser.profilePhotoUrl, newUser.qcidNumber, cleanEmail
          ]
        );
      } else {
        // Insert new user
        const insertRes = await db.query(
          `INSERT INTO users (
            email, password, first_name, last_name, middle_name, suffix,
            birth_date, birth_month, birth_day, birth_year,
            city, barangay, street, house_no,
            working_in_qc, occupation, sex, mobile_number, profile_photo_url,
            qcid_number, role, is_email_verified, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW()
          ) RETURNING id`,
          [
            newUser.email, newUser.password, newUser.firstName, newUser.lastName, newUser.middleName, newUser.suffix,
            newUser.birthDate, newUser.birthMonth, newUser.birthDay, newUser.birthYear,
            newUser.city, newUser.barangay, newUser.street, newUser.houseNo,
            newUser.workingInQC, newUser.occupation, newUser.sex, newUser.mobileNumber,
            newUser.profilePhotoUrl, newUser.qcidNumber, newUser.role, newUser.isEmailVerified
          ]
        );
        if (insertRes.rows.length > 0) {
          newUser.id = insertRes.rows[0].id;
        }
      }
    } catch (dbErr) {
      console.warn('[DB Error] Saving user to DB failed, saving to memory fallback:', dbErr.message);
      memoryUsers = memoryUsers.filter(u => u.email !== cleanEmail);
      memoryUsers.push(newUser);
    }

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: newUser,
    });
  } catch (err) {
    console.error('Error in register controller:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration', error: err.message });
  }
};

/**
 * POST /api/auth/login
 * Handles user and staff login with strict registered user validation
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check for Predefined System Administrator / Staff accounts
    const isPredefinedAdmin =
      cleanEmail === 'admin@quezoncity.gov.ph' ||
      cleanEmail === 'superadmin@quezoncity.gov.ph' ||
      cleanEmail === 'admin@gmail.com';

    const isPredefinedStaff =
      cleanEmail === 'staff@quezoncity.gov.ph' ||
      cleanEmail === 'socialworker@gov.ph' ||
      cleanEmail === 'staff@gmail.com';

    if (isPredefinedAdmin && (cleanPassword === 'Admin@123' || cleanPassword === 'admin123' || cleanPassword === 'admin')) {
      return res.status(200).json({
        success: true,
        role: 'super_admin',
        user: {
          email: cleanEmail,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'super_admin',
        },
      });
    }

    if (isPredefinedStaff && (cleanPassword === 'Staff@123' || cleanPassword === 'staff123' || cleanPassword === 'staff')) {
      return res.status(200).json({
        success: true,
        role: 'staff',
        user: {
          email: cleanEmail,
          firstName: 'Social',
          lastName: 'Worker',
          role: 'staff',
        },
      });
    }

    // 2. Query PostgreSQL Database for registered user
    try {
      const userRes = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (userRes.rows.length > 0) {
        const dbUser = userRes.rows[0];

        // Check password
        if (dbUser.password && dbUser.password !== cleanPassword) {
          return res.status(401).json({
            success: false,
            message: 'Incorrect password. Please verify your password and try again.',
          });
        }

        const userPayload = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.first_name || '',
          lastName: dbUser.last_name || '',
          middleName: dbUser.middle_name || '',
          suffix: dbUser.suffix || '',
          birthDate: dbUser.birth_date || '',
          birthMonth: dbUser.birth_month || '',
          birthDay: dbUser.birth_day || '',
          birthYear: dbUser.birth_year || '',
          city: dbUser.city || 'QUEZON CITY',
          barangay: dbUser.barangay || '',
          street: dbUser.street || '',
          houseNo: dbUser.house_no || '',
          workingInQC: dbUser.working_in_qc || 'No',
          occupation: dbUser.occupation || '',
          sex: dbUser.sex || 'FEMALE',
          mobileNumber: dbUser.mobile_number || '',
          profilePhotoUrl: dbUser.profile_photo_url || null,
          qcidNumber: dbUser.qcid_number || '110000116932100',
          role: dbUser.role || 'user',
        };

        return res.status(200).json({
          success: true,
          role: userPayload.role,
          user: userPayload,
        });
      }
    } catch (dbErr) {
      console.warn('[DB Error] Login DB lookup failed, checking memory fallback:', dbErr.message);
    }

    // 3. Check memory store fallback
    const memUser = memoryUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (memUser) {
      if (memUser.password && memUser.password !== cleanPassword) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please verify your password and try again.',
        });
      }
      return res.status(200).json({
        success: true,
        role: memUser.role || 'user',
        user: memUser,
      });
    }

    // 4. User is NOT found in database or memory store
    return res.status(401).json({
      success: false,
      message: 'Account not found. Please register first before logging in.',
    });
  } catch (err) {
    console.error('Error in login controller:', err);
    return res.status(500).json({ success: false, message: 'Server error during login', error: err.message });
  }
};

/**
 * GET /api/users/profile or GET /api/auth/profile
 * Retrieves registered user profile by email
 */
exports.getProfile = async (req, res) => {
  try {
    const email = (req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email parameter is required' });
    }

    try {
      const userRes = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
      if (userRes.rows.length > 0) {
        const dbUser = userRes.rows[0];
        return res.status(200).json({
          success: true,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.first_name || '',
            lastName: dbUser.last_name || '',
            middleName: dbUser.middle_name || '',
            suffix: dbUser.suffix || '',
            birthDate: dbUser.birth_date || '',
            birthMonth: dbUser.birth_month || '',
            birthDay: dbUser.birth_day || '',
            birthYear: dbUser.birth_year || '',
            city: dbUser.city || 'QUEZON CITY',
            barangay: dbUser.barangay || '',
            street: dbUser.street || '',
            houseNo: dbUser.house_no || '',
            workingInQC: dbUser.working_in_qc || 'No',
            occupation: dbUser.occupation || '',
            sex: dbUser.sex || 'FEMALE',
            mobileNumber: dbUser.mobile_number || '',
            profilePhotoUrl: dbUser.profile_photo_url || null,
            qcidNumber: dbUser.qcid_number || '110000116932100',
            role: dbUser.role || 'user',
          },
        });
      }
    } catch (dbErr) {
      console.warn('[DB Error] getProfile failed:', dbErr.message);
    }

    const memUser = memoryUsers.find(u => u.email.toLowerCase() === email);
    if (memUser) {
      return res.status(200).json({ success: true, user: memUser });
    }

    return res.status(404).json({ success: false, message: 'User profile not found' });
  } catch (err) {
    console.error('Error in getProfile controller:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving profile', error: err.message });
  }
};

/**
 * PUT /api/users/profile or PUT /api/auth/profile
 * Updates editable profile fields for a registered user
 */
exports.updateProfile = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      middleName,
      suffix,
      birthMonth,
      birthDay,
      birthYear,
      city,
      houseNo,
      street,
      barangay,
      workingInQC,
      occupation,
      sex,
      mobileNumber,
      profilePhotoUrl,
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const finalBirthDate = (birthMonth && birthDay && birthYear) ? `${birthMonth} ${birthDay}, ${birthYear}` : '';

    try {
      const updateRes = await db.query(
        `UPDATE users SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          middle_name = COALESCE($3, middle_name),
          suffix = COALESCE($4, suffix),
          birth_date = COALESCE($5, birth_date),
          birth_month = COALESCE($6, birth_month),
          birth_day = COALESCE($7, birth_day),
          birth_year = COALESCE($8, birth_year),
          city = COALESCE($9, city),
          house_no = COALESCE($10, house_no),
          street = COALESCE($11, street),
          barangay = COALESCE($12, barangay),
          working_in_qc = COALESCE($13, working_in_qc),
          occupation = COALESCE($14, occupation),
          sex = COALESCE($15, sex),
          mobile_number = COALESCE($16, mobile_number),
          profile_photo_url = COALESCE($17, profile_photo_url),
          updated_at = NOW()
         WHERE LOWER(email) = $18
         RETURNING *`,
        [
          firstName, lastName, middleName, suffix,
          finalBirthDate, birthMonth, birthDay, birthYear,
          city, houseNo, street, barangay,
          workingInQC, occupation, sex, mobileNumber,
          profilePhotoUrl, cleanEmail
        ]
      );

      if (updateRes.rows.length > 0) {
        const updated = updateRes.rows[0];
        const userPayload = {
          id: updated.id,
          email: updated.email,
          firstName: updated.first_name || '',
          lastName: updated.last_name || '',
          middleName: updated.middle_name || '',
          suffix: updated.suffix || '',
          birthDate: updated.birth_date || '',
          birthMonth: updated.birth_month || '',
          birthDay: updated.birth_day || '',
          birthYear: updated.birth_year || '',
          city: updated.city || 'QUEZON CITY',
          barangay: updated.barangay || '',
          street: updated.street || '',
          houseNo: updated.house_no || '',
          workingInQC: updated.working_in_qc || 'No',
          occupation: updated.occupation || '',
          sex: updated.sex || 'FEMALE',
          mobileNumber: updated.mobile_number || '',
          profilePhotoUrl: updated.profile_photo_url || null,
          qcidNumber: updated.qcid_number || '110000116932100',
          role: updated.role || 'user',
        };

        return res.status(200).json({
          success: true,
          message: 'Profile updated successfully.',
          user: userPayload,
        });
      }
    } catch (dbErr) {
      console.warn('[DB Error] updateProfile DB update failed, updating memory:', dbErr.message);
    }

    // Fallback update memory
    const memUserIdx = memoryUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (memUserIdx !== -1) {
      memoryUsers[memUserIdx] = {
        ...memoryUsers[memUserIdx],
        firstName: firstName ?? memoryUsers[memUserIdx].firstName,
        lastName: lastName ?? memoryUsers[memUserIdx].lastName,
        middleName: middleName ?? memoryUsers[memUserIdx].middleName,
        suffix: suffix ?? memoryUsers[memUserIdx].suffix,
        birthMonth: birthMonth ?? memoryUsers[memUserIdx].birthMonth,
        birthDay: birthDay ?? memoryUsers[memUserIdx].birthDay,
        birthYear: birthYear ?? memoryUsers[memUserIdx].birthYear,
        city: city ?? memoryUsers[memUserIdx].city,
        houseNo: houseNo ?? memoryUsers[memUserIdx].houseNo,
        street: street ?? memoryUsers[memUserIdx].street,
        barangay: barangay ?? memoryUsers[memUserIdx].barangay,
        workingInQC: workingInQC ?? memoryUsers[memUserIdx].workingInQC,
        occupation: occupation ?? memoryUsers[memUserIdx].occupation,
        sex: sex ?? memoryUsers[memUserIdx].sex,
        mobileNumber: mobileNumber ?? memoryUsers[memUserIdx].mobileNumber,
        profilePhotoUrl: profilePhotoUrl ?? memoryUsers[memUserIdx].profilePhotoUrl,
        updatedAt: new Date().toISOString(),
      };

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: memoryUsers[memUserIdx],
      });
    }

    return res.status(404).json({ success: false, message: 'User not found to update' });
  } catch (err) {
    console.error('Error in updateProfile controller:', err);
    return res.status(500).json({ success: false, message: 'Server error updating profile', error: err.message });
  }
};
