const express = require('express');
const router = express.Router();
const { sendPwdApprovalEmail } = require('../services/emailService');

// POST /api/email/send-pwd-id
router.post('/send-pwd-id', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      pwdIdNumber,
      referenceNumber,
      disabilityType,
      bloodType,
      approvedDate,
      contactNumber,
      address,
    } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const result = await sendPwdApprovalEmail({
      recipientEmail,
      recipientName,
      pwdIdNumber,
      referenceNumber,
      disabilityType,
      bloodType,
      approvedDate,
      contactNumber,
      address,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in send-pwd-id endpoint:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
