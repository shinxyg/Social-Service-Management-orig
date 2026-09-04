const db = require('../config/db');
const { sendOtpEmail } = require('../services/emailService');

// In-memory fallback stores
let memoryOtps = new Map(); // email -> { otpCode, expiresAt, isUsed }
let memoryUsers = [];

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

    // Dispatch official email via Gmail SMTP
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

    const newUser = {
      email: cleanEmail,
      password: password || 'default123',
      firstName: firstName || '',
      lastName: lastName || '',
      middleName: middleName || '',
      suffix: suffix || '',
      birthDate: finalBirthDate,
      city: finalCity,
      barangay: barangay || '',
      street: street || '',
      houseNo: houseNo || '',
      workingInQC: workingInQC || 'No',
      occupation: occupation || '',
      sex: sex || '',
      mobileNumber: mobileNumber || '',
      profilePhotoUrl: profilePhotoUrl || null,
      role: 'user',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
      if (existingUser.rows.length > 0) {
        // Update existing user
        await db.query(
          `UPDATE users SET
            password = $1, first_name = $2, last_name = $3, middle_name = $4, suffix = $5,
            birth_date = $6, city = $7, barangay = $8, street = $9, house_no = $10,
            working_in_qc = $11, occupation = $12, sex = $13, mobile_number = $14,
            profile_photo_url = $15, updated_at = NOW()
           WHERE email = $16`,
          [
            newUser.password, newUser.firstName, newUser.lastName, newUser.middleName, newUser.suffix,
            newUser.birthDate, newUser.city, newUser.barangay, newUser.street, newUser.houseNo,
            newUser.workingInQC, newUser.occupation, newUser.sex, newUser.mobileNumber,
            newUser.profilePhotoUrl, cleanEmail
          ]
        );
      } else {
        // Insert new user
        await db.query(
          `INSERT INTO users (
            email, password, first_name, last_name, middle_name, suffix,
            birth_date, city, barangay, street, house_no,
            working_in_qc, occupation, sex, mobile_number, profile_photo_url,
            role, is_email_verified, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
          )`,
          [
            newUser.email, newUser.password, newUser.firstName, newUser.lastName, newUser.middleName, newUser.suffix,
            newUser.birthDate, newUser.city, newUser.barangay, newUser.street, newUser.houseNo,
            newUser.workingInQC, newUser.occupation, newUser.sex, newUser.mobileNumber,
            newUser.profilePhotoUrl, newUser.role, newUser.isEmailVerified
          ]
        );
      }
    } catch (dbErr) {
      console.warn('[DB Error] Saving user to DB failed, saving to memory fallback:', dbErr.message);
      memoryUsers = memoryUsers.filter(u => u.email !== cleanEmail);
      memoryUsers.push(newUser);
    }

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('Error in register controller:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration', error: err.message });
  }
};

/**
 * POST /api/auth/login
 * Handles user and staff login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isStaff = cleanEmail.includes('admin') || cleanEmail.includes('staff');
    const role = isStaff ? 'staff' : 'user';

    try {
      const userRes = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        return res.status(200).json({
          success: true,
          role: user.role || role,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role || role,
          },
        });
      }
    } catch (dbErr) {
      console.warn('[DB Error] Login DB lookup failed, falling back to role check:', dbErr.message);
    }

    // Default fallback
    return res.status(200).json({
      success: true,
      role,
      user: {
        email: cleanEmail,
        role,
      },
    });
  } catch (err) {
    console.error('Error in login controller:', err);
    return res.status(500).json({ success: false, message: 'Server error during login', error: err.message });
  }
};
