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
    const recipientEmail = req.body.recipientEmail || req.body.to || req.body.email;
    const recipientName = req.body.recipientName || req.body.applicantName || req.body.name || 'Valued QCitizen';
    const referenceNumber = req.body.referenceNumber || req.body.refNo || req.body.referenceNo || '';
    const submissionDate = req.body.submissionDate || req.body.date || new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (!recipientEmail) return res.status(400).json({ error: 'Recipient email is required' });
    const result = await sendPwdApplicationReceivedEmail({ recipientEmail, recipientName, referenceNumber, submissionDate });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/send-pwd-interview-scheduled', async (req, res) => {
  try {
    const recipientEmail = req.body.recipientEmail || req.body.to || req.body.email;
    const recipientName = req.body.recipientName || req.body.applicantName || req.body.name || 'Valued QCitizen';
    const referenceNumber = req.body.referenceNumber || req.body.refNo || req.body.referenceNo || '';
    const interviewDate = req.body.interviewDate || req.body.date || '';
    const interviewTime = req.body.interviewTime || req.body.time || '';
    const venue = req.body.venue || 'Quezon City Hall';
    const officeLocation = req.body.officeLocation || req.body.venue || 'Quezon City Hall';

    if (!recipientEmail) return res.status(400).json({ error: 'Recipient email is required' });
    const result = await sendPwdInterviewScheduledEmail({ recipientEmail, recipientName, referenceNumber, interviewDate, interviewTime, venue, officeLocation });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/send-pwd-payout-scheduled', async (req, res) => {
  try {
    const recipientEmail = req.body.recipientEmail || req.body.to || req.body.email;
    const recipientName = req.body.recipientName || req.body.applicantName || req.body.name || 'Valued QCitizen';
    const pwdIdNumber = req.body.pwdIdNumber || req.body.idNumber || '';
    const referenceNumber = req.body.referenceNumber || req.body.refNo || req.body.referenceNo || '';
    const payoutDate = req.body.payoutDate || req.body.date || '';
    const payoutTime = req.body.payoutTime || req.body.time || '8:00 AM - 5:00 PM';
    const venue = req.body.venue || 'Quezon City Hall';
    const amount = req.body.amount || '₱1,500.00';

    if (!recipientEmail) return res.status(400).json({ error: 'Recipient email is required' });
    const result = await sendPwdPayoutScheduledEmail({ recipientEmail, recipientName, pwdIdNumber, referenceNumber, payoutDate, payoutTime, venue, amount });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/send-pwd-payout-released', async (req, res) => {
  try {
    const recipientEmail = req.body.recipientEmail || req.body.to || req.body.email;
    const recipientName = req.body.recipientName || req.body.applicantName || req.body.name || 'Valued QCitizen';
    const disbursementId = req.body.disbursementId || req.body.id || '';
    const pwdIdNumber = req.body.pwdIdNumber || req.body.idNumber || '';
    const referenceNumber = req.body.referenceNumber || req.body.refNo || req.body.referenceNo || '';
    const releasedDate = req.body.releasedDate || req.body.date || new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const amount = req.body.amount || '₱1,500.00';

    if (!recipientEmail) return res.status(400).json({ error: 'Recipient email is required' });
    const result = await sendPwdPayoutReleaseReceiptEmail({ recipientEmail, recipientName, disbursementId, pwdIdNumber, referenceNumber, releasedDate, amount });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const handlePwdApproval = async (req, res) => {
  try {
    const recipientEmail = req.body.recipientEmail || req.body.to || req.body.email;
    const recipientName = req.body.recipientName || req.body.applicantName || req.body.name || 'Valued QCitizen';
    const pwdIdNumber = req.body.pwdIdNumber || req.body.idNumber || '';
    const referenceNumber = req.body.referenceNumber || req.body.refNo || req.body.referenceNo || '';
    const disabilityType = req.body.disabilityType || 'Physical Disability';
    const bloodType = req.body.bloodType || 'N/A';
    const approvedDate = req.body.approvedDate || req.body.approvalDate || new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const contactNumber = req.body.contactNumber || req.body.contactNo || '';
    const address = req.body.address || 'Quezon City';

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
    console.error('Error in pwd approval endpoint:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

router.post('/send-pwd-id', handlePwdApproval);
router.post('/send-pwd-approval', handlePwdApproval);

router.post('/send-senior-id', async (req, res) => {
  try {
    const recipientEmail = req.body.recipientEmail || req.body.to || req.body.email;
    const recipientName = req.body.recipientName || req.body.applicantName || req.body.name || 'Valued Senior Citizen';
    const seniorIdNumber = req.body.seniorIdNumber || req.body.idNumber || '';
    const referenceNumber = req.body.referenceNumber || req.body.refNo || req.body.referenceNo || '';
    const applicationType = req.body.applicationType || 'New Application';
    const bloodType = req.body.bloodType || 'N/A';
    const approvedDate = req.body.approvedDate || req.body.approvalDate || new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const contactNumber = req.body.contactNumber || req.body.contactNo || '';
    const address = req.body.address || 'Quezon City';

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
    const recipientEmail = req.body.recipientEmail || req.body.to || req.body.email;
    const recipientName = req.body.recipientName || req.body.applicantName || req.body.name || 'Valued Solo Parent';
    const soloParentIdNumber = req.body.soloParentIdNumber || req.body.idNumber || '';
    const referenceNumber = req.body.referenceNumber || req.body.refNo || req.body.referenceNo || '';
    const classification = req.body.classification || 'Solo Parent';
    const applicationType = req.body.applicationType || 'New Application';
    const approvedDate = req.body.approvedDate || req.body.approvalDate || new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const contactNumber = req.body.contactNumber || req.body.contactNo || '';
    const address = req.body.address || 'Quezon City';

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
    const recipientEmail = req.body.recipientEmail || req.body.to || req.body.email;
    const recipientName = req.body.recipientName || req.body.applicantName || req.body.name || 'Valued Senior Citizen';
    const bookletNumber = req.body.bookletNumber || req.body.idNumber || '';
    const oscaIdNumber = req.body.oscaIdNumber || '';
    const referenceNumber = req.body.referenceNumber || req.body.refNo || req.body.referenceNo || '';
    const bookletType = req.body.bookletType || 'medicine';
    const applicationType = req.body.applicationType || 'Renewal';
    const approvedDate = req.body.approvedDate || req.body.approvalDate || new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const contactNumber = req.body.contactNumber || req.body.contactNo || '';
    const address = req.body.address || 'Quezon City';

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const result = await sendSeniorBookletApprovalEmail({
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
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in send-senior-booklet endpoint:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
