const Razorpay = require('razorpay');

// Ensure Razorpay only instantiates when needed and throws safe errors if configured incorrectly
let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay configuration missing');
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  return razorpayInstance;
};

module.exports = getRazorpayInstance;
