const ContactMessage = require('../models/ContactMessage');
const { sendAdminContactInquiryEmail } = require('../utils/emailService');

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
const submitContactMessage = async (req, res, next) => {
  try {
    const {
      name,
      email,
      mobile,
      subject,
      bookingId,
      message
    } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const contact = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile ? mobile.trim() : undefined,
      subject: subject ? subject.trim() : 'General Inquiry',
      bookingId: bookingId ? bookingId.trim() : '',
      message: message.trim()
    });

    // Dispatch admin contact notification email asynchronously (failure-safe)
    sendAdminContactInquiryEmail(contact).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Your inquiry has been received. Our operations team will contact you shortly.',
      contactId: contact._id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContactMessage
};
