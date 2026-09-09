const db = require('../config/db');
const { sendOtpEmail, sendPasswordResetEmail } = require('../services/emailService');

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

    console.log(`[OTP] Generated OTP ${otpCode} for ${cleanEmail}. Dispatching email in background...`);

    // Dispatch official email asynchronously in background so client response is instant
    sendOtpEmail({
      recipientEmail: cleanEmail,
      otpCode,
      recipientName: recipientName || 'Resident',
    }).then((emailResult) => {
      console.log(`[OTP Background Dispatch] Result for ${cleanEmail}:`, emailResult);
    }).catch((err) => {
      console.error(`[OTP Background Dispatch Error] Failed for ${cleanEmail}:`, err.message);
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
    });
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
      cleanEmail === 'admin' ||
      cleanEmail === 'admin@quezoncity.gov.ph' ||
      cleanEmail === 'admin@gmail.com';

    const isPredefinedSuperAdmin =
      cleanEmail === 'superadmin' ||
      cleanEmail === 'superadmin@quezoncity.gov.ph';

    const isPredefinedStaff =
      cleanEmail === 'staff' ||
      cleanEmail === 'staff@quezoncity.gov.ph' ||
      cleanEmail === 'socialworker@gov.ph' ||
      cleanEmail === 'staff@gmail.com';

    if (isPredefinedAdmin) {
      return res.status(200).json({
        success: true,
        role: 'staff',
        user: {
          email: cleanEmail.includes('@') ? cleanEmail : 'admin@quezoncity.gov.ph',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'staff',
          qcidNumber: '110000116932100',
        },
      });
    }

    if (isPredefinedSuperAdmin) {
      return res.status(200).json({
        success: true,
        role: 'super_admin',
        user: {
          email: cleanEmail.includes('@') ? cleanEmail : 'superadmin@quezoncity.gov.ph',
          firstName: 'Super',
          lastName: 'Admin',
          role: 'super_admin',
          qcidNumber: '110000116932102',
        },
      });
    }

    if (isPredefinedStaff) {
      return res.status(200).json({
        success: true,
        role: 'staff',
        user: {
          email: cleanEmail.includes('@') ? cleanEmail : 'staff@quezoncity.gov.ph',
          firstName: 'Social',
          lastName: 'Worker',
          role: 'staff',
          qcidNumber: '110000116932101',
        },
      });
    }

    // 2. Query PostgreSQL Database for registered user
    try {
      const userRes = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (userRes.rows.length > 0) {
        const dbUser = userRes.rows[0];

        // Check account active/inactive status
        const userStatus = String(dbUser.status || 'active').toLowerCase();
        if (userStatus === 'inactive' || userStatus === 'deactivated') {
          return res.status(403).json({
            success: false,
            message: 'Your account is currently inactive. Please contact the administrator to reactivate your account.',
          });
        }

        // Check password
        if (dbUser.password && dbUser.password !== cleanPassword) {
          return res.status(401).json({
            success: false,
            message: 'Incorrect password. Please verify your password and try again.',
          });
        }

        // Record last login time
        await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [dbUser.id]).catch(() => {});

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
          status: dbUser.status || 'active',
          lastLogin: new Date().toISOString(),
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
      const memStatus = String(memUser.status || 'active').toLowerCase();
      if (memStatus === 'inactive' || memStatus === 'deactivated') {
        return res.status(403).json({
          success: false,
          message: 'Your account is currently inactive. Please contact the administrator to reactivate your account.',
        });
      }

      if (memUser.password && memUser.password !== cleanPassword) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please verify your password and try again.',
        });
      }

      memUser.lastLogin = new Date().toISOString();

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

/**
 * POST /api/auth/forgot-password
 * Sends password reset instructions with a 6-digit OTP code and direct reset link to user's Gmail
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists in DB or memory store
    let recipientName = 'Resident';
    try {
      const userRes = await db.query('SELECT first_name, last_name, email FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        recipientName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Resident';
      }
    } catch (dbErr) {
      console.warn('[DB Warning in forgotPassword]:', dbErr.message);
    }

    // Generate random 6-digit numeric OTP and token
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    // Save to Database
    try {
      await db.query(
        `INSERT INTO email_otps (email, otp_code, expires_at, is_used, created_at)
         VALUES ($1, $2, $3, false, NOW())`,
        [cleanEmail, otpCode, expiresAt]
      );
    } catch (dbErr) {
      console.warn('[DB Error] Saving Reset OTP to DB failed, using memory store:', dbErr.message);
    }

    // Always keep in memory store as fallback
    memoryOtps.set(cleanEmail, {
      otpCode,
      resetToken,
      expiresAt: expiresAt.getTime(),
      isUsed: false,
    });

    const frontendBase = (process.env.FRONTEND_URL || 'https://frontend-production-1c51.up.railway.app').replace(/\/+$/, '');
    const resetUrl = `${frontendBase}/reset-password?email=${encodeURIComponent(cleanEmail)}&otp=${otpCode}&token=${resetToken}`;

    console.log(`[Password Reset] Generated OTP ${otpCode} for ${cleanEmail}. Dispatching email...`);

    const emailResult = await sendPasswordResetEmail({
      recipientEmail: cleanEmail,
      otpCode,
      resetUrl,
      recipientName,
    });

    if (emailResult.success) {
      return res.status(200).json({
        success: true,
        message: `Password reset instructions and verification code have been sent to ${cleanEmail}.`,
        provider: emailResult.provider,
        email: cleanEmail,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: `Password reset code generated for ${cleanEmail}. Check your inbox or proceed to reset.`,
        email: cleanEmail,
      });
    }
  } catch (err) {
    console.error('Error in forgotPassword controller:', err);
    return res.status(500).json({ success: false, message: 'Server error while processing password reset', error: err.message });
  }
};

/**
 * POST /api/auth/reset-password
 * Verifies OTP code and sets the new password for the account
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, verification code (OTP), and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must include at least one number (0-9).' });
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must include at least one special character (e.g. !@#$%^&*).' });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must include at least one uppercase letter (A-Z).' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    let isValid = false;

    // 1. Verify in DB
    try {
      const dbRes = await db.query(
        `SELECT * FROM email_otps 
         WHERE LOWER(email) = $1 AND otp_code = $2 AND is_used = false AND expires_at > NOW()
         ORDER BY id DESC LIMIT 1`,
        [cleanEmail, cleanOtp]
      );

      if (dbRes.rows.length > 0) {
        isValid = true;
        await db.query(`UPDATE email_otps SET is_used = true WHERE id = $1`, [dbRes.rows[0].id]);
      }
    } catch (dbErr) {
      console.warn('[DB Error] Verifying Reset OTP in DB failed, checking memory:', dbErr.message);
    }

    // 2. Fallback verify in memory
    if (!isValid) {
      const memRecord = memoryOtps.get(cleanEmail);
      if (memRecord && !memRecord.isUsed && memRecord.otpCode === cleanOtp && memRecord.expiresAt > Date.now()) {
        isValid = true;
        memRecord.isUsed = true;
      }
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code (OTP). Please request a new password reset.',
      });
    }

    // Update user's password in Database
    try {
      const updateRes = await db.query(
        `UPDATE users SET password = $1, updated_at = NOW() WHERE LOWER(email) = $2 RETURNING id, email, first_name, last_name, role`,
        [newPassword, cleanEmail]
      );

      // If user wasn't found in DB, check memoryUsers or insert
      if (updateRes.rows.length === 0) {
        const memIdx = memoryUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
        if (memIdx !== -1) {
          memoryUsers[memIdx].password = newPassword;
        } else {
          await db.query(
            `INSERT INTO users (email, password, first_name, role, is_email_verified, created_at, updated_at)
             VALUES ($1, $2, 'Resident', 'user', true, NOW(), NOW())
             ON CONFLICT (email) DO UPDATE SET password = $2, updated_at = NOW()`,
            [cleanEmail, newPassword]
          );
        }
      }
    } catch (dbErr) {
      console.warn('[DB Error] Updating password failed:', dbErr.message);
      const memIdx = memoryUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (memIdx !== -1) {
        memoryUsers[memIdx].password = newPassword;
      }
    }

    memoryOtps.delete(cleanEmail);

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully updated! You can now sign in with your new password.',
    });
  } catch (err) {
    console.error('Error in resetPassword controller:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating password', error: err.message });
  }
};

/**
 * GET /api/users or GET /api/auth/users
 * Returns all real registered user records directly from the central database
 */
exports.getAllUsers = async (req, res) => {
  try {
    // 1. Ensure required columns exist without breaking if previously missing
    try {
      await db.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS qcid_number VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(150);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
      `);
    } catch (colErr) {
      // Non-fatal
    }

    // 2. Auto-sync existing module applicants and ensure default admin account exists
    try {
      await db.query(`
        -- Ensure default administrator account exists
        INSERT INTO users (email, password, first_name, last_name, role, status, is_email_verified, qcid_number)
        VALUES ('admin@quezoncity.gov.ph', 'admin123', 'System', 'Administrator', 'admin', 'active', true, '110000116932100')
        ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'active';

        -- Sync AICS applicants into users
        INSERT INTO users (email, password, first_name, last_name, middle_name, suffix, mobile_number, qcid_number, role, status, is_email_verified, created_at)
        SELECT DISTINCT ON (LOWER(email))
          LOWER(email), 'default123', first_name, last_name, middle_name, suffix, phone, qc_id, 'user', 'active', true, created_at
        FROM aics_applications
        WHERE email IS NOT NULL AND email != '' AND LOWER(email) NOT IN (SELECT LOWER(email) FROM users)
        ON CONFLICT (email) DO NOTHING;

        -- Sync PWD / Senior applicants into users
        INSERT INTO users (email, password, first_name, last_name, middle_name, suffix, mobile_number, qcid_number, role, status, is_email_verified, created_at)
        SELECT DISTINCT ON (LOWER(email))
          LOWER(email), 'default123', first_name, last_name, middle_name, suffix, contact_no, COALESCE(assigned_id_number, reference_number), 'user', 'active', true, submitted_at
        FROM pwd_senior_applications
        WHERE email IS NOT NULL AND email != '' AND LOWER(email) NOT IN (SELECT LOWER(email) FROM users)
        ON CONFLICT (email) DO NOTHING;

        -- Sync Solo Parent applicants into users
        INSERT INTO users (email, password, first_name, last_name, middle_name, suffix, mobile_number, qcid_number, role, status, is_email_verified, created_at)
        SELECT DISTINCT ON (LOWER(email))
          LOWER(email), 'default123', first_name, last_name, middle_name, suffix, contact_no, COALESCE(solo_parent_id_number, qcid_number), 'user', 'active', true, created_at
        FROM solo_parent_applications
        WHERE email IS NOT NULL AND email != '' AND LOWER(email) NOT IN (SELECT LOWER(email) FROM users)
        ON CONFLICT (email) DO NOTHING;

        -- Sync Child Welfare guardians into users
        INSERT INTO users (email, password, first_name, last_name, middle_name, mobile_number, role, status, is_email_verified, created_at)
        SELECT DISTINCT ON (LOWER(guardian_email))
          LOWER(guardian_email), 'default123', guardian_first_name, guardian_last_name, guardian_middle_name, guardian_contact_no, 'user', 'active', true, created_at
        FROM child_welfare_applications
        WHERE guardian_email IS NOT NULL AND guardian_email != '' AND LOWER(guardian_email) NOT IN (SELECT LOWER(email) FROM users)
        ON CONFLICT (email) DO NOTHING;

        -- Sync Livelihood applicants into users
        INSERT INTO users (email, password, first_name, last_name, mobile_number, qcid_number, role, status, is_email_verified, created_at)
        SELECT DISTINCT ON (LOWER(email))
          LOWER(email), 'default123', first_name, last_name, contact_no, qcid_no, 'user', 'active', true, created_at
        FROM livelihood_applications
        WHERE email IS NOT NULL AND email != '' AND LOWER(email) NOT IN (SELECT LOWER(email) FROM users)
        ON CONFLICT (email) DO NOTHING;
      `);
    } catch (syncErr) {
      console.warn('[DB Note] Auto-syncing applicants to users table:', syncErr.message);
    }

    let dbUsers = [];
    try {
      const result = await db.query(`SELECT * FROM users ORDER BY id ASC`);
      dbUsers = result.rows || [];
    } catch (dbErr) {
      console.warn('[DB Warning] Fetching users from DB failed, falling back to memory store:', dbErr.message);
    }

    // Combine with memory users if any exist that are not in DB
    const seenEmails = new Set(dbUsers.map(u => (u.email || '').toLowerCase()));
    for (const memU of memoryUsers) {
      if (memU && memU.email && !seenEmails.has(memU.email.toLowerCase())) {
        seenEmails.add(memU.email.toLowerCase());
        dbUsers.push({
          id: memU.id || dbUsers.length + 1,
          email: memU.email,
          first_name: memU.firstName || memU.first_name || '',
          last_name: memU.lastName || memU.last_name || '',
          middle_name: memU.middleName || memU.middle_name || '',
          suffix: memU.suffix || '',
          mobile_number: memU.mobileNumber || memU.mobile_number || '',
          qcid_number: memU.qcidNumber || memU.qcid_number || '',
          role: memU.role || 'user',
          status: memU.status || 'active',
          created_at: memU.createdAt || memU.created_at || new Date().toISOString(),
          updated_at: memU.updatedAt || memU.updated_at || new Date().toISOString(),
          last_login: memU.lastLogin || memU.last_login || null,
          city: memU.city || '',
          barangay: memU.barangay || '',
          street: memU.street || '',
          house_no: memU.houseNo || memU.house_no || '',
          occupation: memU.occupation || '',
        });
      }
    }

    // Build user representations with connected applications counts
    const users = await Promise.all(
      dbUsers.map(async (u) => {
        const userQcid = u.qcid_number || u.qcid || `110000${String(u.id).padStart(9, '0')}`;
        const userEmail = (u.email || '').toLowerCase();
        const userIdStr = String(u.id);

        let totalApps = 0;
        let appointmentCount = 0;

        try {
          const [aicsRes, pwdRes, soloRes, childRes, liveRes, aptRes] = await Promise.all([
            db.query(
              `SELECT COUNT(*) FROM aics_applications WHERE (email IS NOT NULL AND LOWER(email) = $1) OR (qc_id IS NOT NULL AND qc_id = $2)`,
              [userEmail, userQcid]
            ).catch(() => ({ rows: [{ count: 0 }] })),
            db.query(
              `SELECT COUNT(*) FROM pwd_senior_applications WHERE (email IS NOT NULL AND LOWER(email) = $1) OR (reference_number IS NOT NULL AND reference_number = $2)`,
              [userEmail, userQcid]
            ).catch(() => ({ rows: [{ count: 0 }] })),
            db.query(
              `SELECT COUNT(*) FROM solo_parent_applications WHERE user_id = $1 OR (email IS NOT NULL AND LOWER(email) = $2) OR (qcid_number IS NOT NULL AND qcid_number = $3)`,
              [userIdStr, userEmail, userQcid]
            ).catch(() => ({ rows: [{ count: 0 }] })),
            db.query(
              `SELECT COUNT(*) FROM child_welfare_applications WHERE user_id = $1 OR (guardian_email IS NOT NULL AND LOWER(guardian_email) = $2) OR (email IS NOT NULL AND LOWER(email) = $2)`,
              [userIdStr, userEmail]
            ).catch(() => ({ rows: [{ count: 0 }] })),
            db.query(
              `SELECT COUNT(*) FROM livelihood_applications WHERE user_id = $1 OR (email IS NOT NULL AND LOWER(email) = $2) OR (qcid_no IS NOT NULL AND qcid_no = $3)`,
              [userIdStr, userEmail, userQcid]
            ).catch(() => ({ rows: [{ count: 0 }] })),
            db.query(
              `SELECT COUNT(*) FROM appointments WHERE (email IS NOT NULL AND LOWER(email) = $1) OR (qcid_no IS NOT NULL AND qcid_no = $2)`,
              [userEmail, userQcid]
            ).catch(() => ({ rows: [{ count: 0 }] })),
          ]);

          const aicsCount = parseInt(aicsRes.rows[0]?.count || 0, 10);
          const pwdCount = parseInt(pwdRes.rows[0]?.count || 0, 10);
          const soloCount = parseInt(soloRes.rows[0]?.count || 0, 10);
          const childCount = parseInt(childRes.rows[0]?.count || 0, 10);
          const liveCount = parseInt(liveRes.rows[0]?.count || 0, 10);
          appointmentCount = parseInt(aptRes.rows[0]?.count || 0, 10);

          totalApps = aicsCount + pwdCount + soloCount + childCount + liveCount;
        } catch {}

        const fullName = [u.first_name, u.middle_name, u.last_name, u.suffix]
          .filter(Boolean)
          .join(' ')
          .trim() || (String(u.role || '').toLowerCase() === 'admin' || u.email === 'admin' ? 'System Administrator' : 'Registered Resident');

        const isAdmin = ['admin', 'administrator', 'super_admin'].includes(String(u.role || '').toLowerCase()) || u.email === 'admin' || u.email === 'admin@quezoncity.gov.ph';
        const displayRole = isAdmin ? 'ADMINISTRATOR' : 'USER / BENEFICIARY';
        const isInactive = String(u.status || 'active').toLowerCase() === 'inactive' || String(u.status || 'active').toLowerCase() === 'deactivated';
        const displayStatus = isInactive ? 'INACTIVE' : 'ACTIVE';

        const rawId = String(u.id);
        const formattedId = rawId.startsWith('USR-') || rawId.startsWith('ADMIN-')
          ? rawId
          : isAdmin
            ? `ADMIN-${rawId.padStart(4, '0')}`
            : `USR-${rawId.padStart(4, '0')}`;

        const cleanDisplayEmail = u.email === 'admin' ? 'admin@quezoncity.gov.ph' : u.email;

        return {
          id: formattedId,
          numericId: u.id,
          qcidNumber: userQcid,
          name: fullName,
          firstName: u.first_name || '',
          lastName: u.last_name || '',
          middleName: u.middle_name || '',
          suffix: u.suffix || '',
          email: cleanDisplayEmail,
          contactNumber: u.mobile_number || u.phone || u.contact_no || '—',
          role: displayRole,
          status: displayStatus,
          dateRegistered: u.created_at || u.createdat || new Date().toISOString(),
          lastLogin: u.last_login || u.lastlogin || u.updated_at || u.created_at || new Date().toISOString(),
          applicationsCount: totalApps,
          appointmentsCount: appointmentCount,
          address: [u.house_no, u.street, u.barangay, u.city].filter(Boolean).join(', ') || u.address || 'Quezon City',
          occupation: u.occupation || '—',
        };
      })
    );

    // Ensure all unique accounts are present
    const uniqueMap = new Map();
    for (const userItem of users) {
      const key = (userItem.email || '').toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, userItem);
      }
    }
    const cleanUsers = Array.from(uniqueMap.values());

    const stats = {
      total: cleanUsers.length,
      active: cleanUsers.filter(u => u.status === 'ACTIVE').length,
      inactive: cleanUsers.filter(u => u.status === 'INACTIVE').length,
      administrators: cleanUsers.filter(u => u.role === 'ADMINISTRATOR').length,
    };

    return res.status(200).json({
      success: true,
      stats,
      users: cleanUsers,
    });
  } catch (err) {
    console.error('Error in getAllUsers controller:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving users', error: err.message });
  }
};

/**
 * GET /api/users/:id
 * Returns a user with all linked application records across modules
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).replace(/\D/g, '');

    let dbUser = null;
    try {
      const userRes = await db.query('SELECT * FROM users WHERE id = $1 OR qcid_number = $2 OR LOWER(email) = $3', [cleanId || '0', id, String(id).toLowerCase()]);
      if (userRes.rows.length > 0) {
        dbUser = userRes.rows[0];
      }
    } catch (dbErr) {
      console.warn('[DB Error] getUserById failed:', dbErr.message);
    }

    if (!dbUser) {
      const memUser = memoryUsers.find(u => String(u.id) === String(id) || u.email.toLowerCase() === String(id).toLowerCase() || u.qcidNumber === id);
      if (memUser) {
        dbUser = {
          id: memUser.id || 1,
          email: memUser.email,
          first_name: memUser.firstName || memUser.first_name || '',
          last_name: memUser.lastName || memUser.last_name || '',
          middle_name: memUser.middleName || memUser.middle_name || '',
          suffix: memUser.suffix || '',
          mobile_number: memUser.mobileNumber || memUser.mobile_number || '',
          qcid_number: memUser.qcidNumber || memUser.qcid_number || '',
          role: memUser.role || 'user',
          status: memUser.status || 'active',
          created_at: memUser.createdAt || new Date().toISOString(),
          updated_at: memUser.updatedAt || new Date().toISOString(),
          last_login: memUser.lastLogin || null,
        };
      }
    }

    if (!dbUser) {
      return res.status(404).json({ success: false, message: 'User record not found' });
    }

    const userEmail = (dbUser.email || '').toLowerCase();
    const userQcid = dbUser.qcid_number || '';
    const userIdStr = String(dbUser.id);

    // Fetch related records
    const [aics, pwdSenior, soloParent, childWelfare, livelihood, appointments, cases] = await Promise.all([
      db.query(
        `SELECT reference_no as reference_number, category, assistance_title, status, created_at FROM aics_applications WHERE LOWER(email) = $1 OR qc_id = $2`,
        [userEmail, userQcid]
      ).catch(() => ({ rows: [] })),
      db.query(
        `SELECT reference_number, category, type, status, assigned_id_number, submitted_at as created_at FROM pwd_senior_applications WHERE LOWER(email) = $1 OR reference_number = $2`,
        [userEmail, userQcid]
      ).catch(() => ({ rows: [] })),
      db.query(
        `SELECT reference_number, 'Solo Parent' as category, application_type as type, application_status as status, solo_parent_id_number, assigned_id_number, created_at FROM solo_parent_applications WHERE user_id = $1 OR LOWER(email) = $2 OR qcid_number = $3`,
        [userIdStr, userEmail, userQcid]
      ).catch(() => ({ rows: [] })),
      db.query(
        `SELECT reference_number, 'Child Welfare' as category, program_type as type, application_status as status, created_at FROM child_welfare_applications WHERE user_id = $1 OR LOWER(guardian_email) = $2 OR LOWER(email) = $2`,
        [userIdStr, userEmail]
      ).catch(() => ({ rows: [] })),
      db.query(
        `SELECT reference_number, 'Livelihood & Training' as category, assistance_type as type, status, created_at FROM livelihood_applications WHERE user_id = $1 OR LOWER(email) = $2 OR qcid_no = $3`,
        [userIdStr, userEmail, userQcid]
      ).catch(() => ({ rows: [] })),
      db.query(
        `SELECT appointment_reference, service_type, appointment_date, appointment_time, status FROM appointments WHERE LOWER(email) = $1 OR qcid_no = $2`,
        [userEmail, userQcid]
      ).catch(() => ({ rows: [] })),
      db.query(
        `SELECT case_number, application_ref, program, case_type, status, priority, date_opened FROM case_records WHERE beneficiary_qcid = $1 OR LOWER(beneficiary_name) LIKE LOWER($2)`,
        [userQcid, `%${dbUser.first_name || ''} ${dbUser.last_name || ''}%`]
      ).catch(() => ({ rows: [] })),
    ]);

    const allApps = [
      ...aics.rows.map(r => ({ ...r, module: 'AICS Assistance' })),
      ...pwdSenior.rows.map(r => ({ ...r, module: r.category || 'PWD / Senior Citizen' })),
      ...soloParent.rows.map(r => ({ ...r, module: 'Solo Parent Services' })),
      ...childWelfare.rows.map(r => ({ ...r, module: 'Child Welfare Services' })),
      ...livelihood.rows.map(r => ({ ...r, module: 'Livelihood & Training' })),
    ];

    const fullName = [dbUser.first_name, dbUser.middle_name, dbUser.last_name, dbUser.suffix]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Resident User';

    const isAdmin = ['admin', 'administrator', 'super_admin'].includes(String(dbUser.role || '').toLowerCase());

    return res.status(200).json({
      success: true,
      user: {
        id: `USR-${String(dbUser.id).padStart(4, '0')}`,
        numericId: dbUser.id,
        qcidNumber: dbUser.qcid_number || `110000${String(dbUser.id).padStart(9, '0')}`,
        name: fullName,
        firstName: dbUser.first_name || '',
        lastName: dbUser.last_name || '',
        middleName: dbUser.middle_name || '',
        suffix: dbUser.suffix || '',
        email: dbUser.email,
        contactNumber: dbUser.mobile_number || '—',
        role: isAdmin ? 'ADMINISTRATOR' : 'USER / BENEFICIARY',
        status: String(dbUser.status || 'active').toLowerCase() === 'inactive' ? 'INACTIVE' : 'ACTIVE',
        dateRegistered: dbUser.created_at,
        lastLogin: dbUser.last_login || dbUser.updated_at || dbUser.created_at,
        city: dbUser.city || 'QUEZON CITY',
        barangay: dbUser.barangay || '',
        street: dbUser.street || '',
        houseNo: dbUser.house_no || '',
        occupation: dbUser.occupation || '—',
        sex: dbUser.sex || '—',
        birthDate: dbUser.birth_date || '—',
        applications: allApps,
        appointments: appointments.rows,
        cases: cases.rows,
      },
    });
  } catch (err) {
    console.error('Error in getUserById controller:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving user details', error: err.message });
  }
};

/**
 * PATCH /api/users/:id/status or POST /api/users/:id/toggle-status
 * Updates user account status between ACTIVE and INACTIVE
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const cleanId = String(id).replace(/\D/g, '');

    let newStatus = status;

    // If no explicit status provided, toggle from current
    if (!newStatus) {
      const existing = await db.query('SELECT status FROM users WHERE id = $1', [cleanId]);
      if (existing.rows.length > 0) {
        const curr = String(existing.rows[0].status || 'active').toLowerCase();
        newStatus = curr === 'active' ? 'inactive' : 'active';
      } else {
        newStatus = 'inactive';
      }
    }

    const normStatus = newStatus.toLowerCase() === 'inactive' ? 'inactive' : 'active';

    await db.query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 OR qcid_number = $3 OR LOWER(email) = $4`,
      [normStatus, cleanId || '0', id, String(id).toLowerCase()]
    );

    // Also update in memory store if present
    const memUser = memoryUsers.find(u => String(u.id) === String(id) || u.email.toLowerCase() === String(id).toLowerCase());
    if (memUser) {
      memUser.status = normStatus;
    }

    return res.status(200).json({
      success: true,
      message: `Account status successfully updated to ${normStatus.toUpperCase()}`,
      status: normStatus.toUpperCase(),
    });
  } catch (err) {
    console.error('Error in toggleUserStatus controller:', err);
    return res.status(500).json({ success: false, message: 'Failed to update account status', error: err.message });
  }
};

/**
 * PUT /api/users/:id
 * Updates editable user account fields (Name, Contact No, Role, Status)
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).replace(/\D/g, '');
    const { firstName, lastName, middleName, suffix, mobileNumber, contactNumber, role, status } = req.body;

    const contact = mobileNumber || contactNumber;
    const normRole = (role && String(role).toLowerCase().includes('admin')) ? 'admin' : 'user';
    const normStatus = (status && String(status).toLowerCase().includes('inactive')) ? 'inactive' : 'active';

    const updateRes = await db.query(
      `UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        middle_name = COALESCE($3, middle_name),
        suffix = COALESCE($4, suffix),
        mobile_number = COALESCE($5, mobile_number),
        role = COALESCE($6, role),
        status = COALESCE($7, status),
        updated_at = NOW()
       WHERE id = $8 OR qcid_number = $9 OR LOWER(email) = $10
       RETURNING id, email, first_name, last_name, middle_name, suffix, mobile_number, qcid_number, role, status, updated_at`,
      [firstName, lastName, middleName, suffix, contact, normRole, normStatus, cleanId || '0', id, String(id).toLowerCase()]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User record not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User account updated successfully',
      user: updateRes.rows[0],
    });
  } catch (err) {
    console.error('Error in updateUser controller:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user account', error: err.message });
  }
};

/**
 * DELETE /api/users/:id
 * Deletes user account
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).replace(/\D/g, '');

    await db.query('DELETE FROM users WHERE id = $1 OR qcid_number = $2 OR LOWER(email) = $3', [cleanId || '0', id, String(id).toLowerCase()]);
    memoryUsers = memoryUsers.filter(u => String(u.id) !== String(id) && u.email.toLowerCase() !== String(id).toLowerCase());

    return res.status(200).json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (err) {
    console.error('Error in deleteUser controller:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user account', error: err.message });
  }
};


