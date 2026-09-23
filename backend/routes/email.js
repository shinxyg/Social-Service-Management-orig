const express = require('express');
const router = express.Router();
const {
  sendPwdApprovalEmail,
  sendPwdApplicationReceivedEmail,
  sendPwdInterviewScheduledEmail,
  sendPwdPayoutScheduledEmail,
  sendPwdPayoutReleaseReceiptEmail,
  sendSeniorCitizenApprovalEmail,
  sendSeniorBookletApprovalEmail,
  sendSoloParentApprovalEmail,
} = require('../services/emailService');

router.post('/send-pwd-received', async (req, res) => {
  try {
    const { recipientEmail, recipientName, referenceNumber, submissionDate } = req.body;
    if (!recipientEmail) return res.status(400).json({ error: 'Recipient email is required' });
    const result = await sendPwdApplicationReceivedEmail({ recipientEmail, recipientName, referenceNumber, submissionDate });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/send-pwd-interview-scheduled', async (req, res) => {
  try {
    const { recipientEmail, recipientName, referenceNumber, interviewDate, interviewTime, venue, officeLocation } = req.body;
    if (!recipientEmail) return res.status(400).json({ error: 'Recipient email is required' });
    const result = await sendPwdInterviewScheduledEmail({ recipientEmail, recipientName, referenceNumber, interviewDate, interviewTime, venue, officeLocation });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/send-pwd-payout-scheduled', async (req, res) => {
  try {
    const { recipientEmail, recipientName, pwdIdNumber, referenceNumber, payoutDate, payoutTime, venue, amount } = req.body;
    if (!recipientEmail) return res.status(400).json({ error: 'Recipient email is required' });
    const result = await sendPwdPayoutScheduledEmail({ recipientEmail, recipientName, pwdIdNumber, referenceNumber, payoutDate, payoutTime, venue, amount });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/send-pwd-payout-released', async (req, res) => {
  try {
    const { recipientEmail, recipientName, disbursementId, pwdIdNumber, referenceNumber, releasedDate, amount } = req.body;
    if (!recipientEmail) return res.status(400).json({ error: 'Recipient email is required' });
    const result = await sendPwdPayoutReleaseReceiptEmail({ recipientEmail, recipientName, disbursementId, pwdIdNumber, referenceNumber, releasedDate, amount });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

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

router.post('/send-senior-id', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      seniorIdNumber,
      referenceNumber,
      applicationType,
      bloodType,
      approvedDate,
      contactNumber,
      address,
    } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const result = await sendSeniorCitizenApprovalEmail({
      recipientEmail,
      recipientName,
      seniorIdNumber,
      referenceNumber,
      applicationType,
      bloodType,
      approvedDate,
      contactNumber,
      address,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in send-senior-id endpoint:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

router.post('/send-solo-parent-id', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      soloParentIdNumber,
      referenceNumber,
      classification,
      applicationType,
      approvedDate,
      contactNumber,
      address,
    } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const result = await sendSoloParentApprovalEmail({
      recipientEmail,
      recipientName,
      soloParentIdNumber,
      referenceNumber,
      classification,
      applicationType,
      approvedDate,
      contactNumber,
      address,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in send-solo-parent-id endpoint:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

router.post('/send-senior-booklet', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      bookletNumber,
      oscaIdNumber,
      referenceNumber,
      bookletType,
      applicationType,
      approvedDate,
      contactNumber,
      address,
    } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const result = await sendSeniorBookletApprovalEmail({
      recipientEmail,
      recipientName,
      bookletNumber,
      oscaIdNumber,
      referenceNumber,
      bookletType: bookletType || 'medicine',
      applicationType: applicationType || 'Renewal',
      approvedDate,
      contactNumber,
      address,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in send-senior-booklet endpoint:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
