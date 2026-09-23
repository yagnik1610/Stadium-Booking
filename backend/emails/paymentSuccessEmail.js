const { renderEmailLayout } = require('./layout');
const { paiseToRupees } = require('../utils/money');

const getPaymentSuccessEmail = ({ payment, booking, stadium, user }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const amountInRupees = paiseToRupees(payment.amount);
  const title = `Payment Successful: ₹${amountInRupees}`;
  const preheader = `Your payment for ${stadium?.name || 'Stadium Booking'} was successful!`;

  const contentHtml = `
    <h2>Payment Receipt 💳</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>Thank you! Your payment of <strong>₹${amountInRupees}</strong> has been successfully processed.</p>

    <div class="card">
      <div style="margin-bottom:12px;">
        <span class="badge badge-success">PAID</span>
      </div>
      <table style="width:100%;">
        <tr><td class="detail-label">Booking Reference</td><td class="detail-value" align="right">${booking.bookingReference}</td></tr>
        <tr><td class="detail-label">Stadium</td><td class="detail-value" align="right">${stadium?.name || 'Venue'}</td></tr>
        <tr><td class="detail-label">Schedule</td><td class="detail-value" align="right">${booking.bookingDate} (${booking.startTime} - ${booking.endTime})</td></tr>
        <tr><td class="detail-label">Base Price</td><td class="detail-value" align="right">₹${booking.basePrice || booking.totalPrice}</td></tr>
        ${booking.gstAmount ? `<tr><td class="detail-label">GST (${booking.gstRate || 18}%)</td><td class="detail-value" align="right">₹${booking.gstAmount}</td></tr>` : ''}
        <tr><td class="detail-label" style="font-weight:700;">Total Paid</td><td class="detail-value" align="right" style="color:#15803d;font-size:16px;">₹${amountInRupees}</td></tr>
        ${payment.razorpayPaymentId ? `<tr><td class="detail-label">Razorpay Payment ID</td><td class="detail-value" align="right" style="font-family:monospace;font-size:12px;">${payment.razorpayPaymentId}</td></tr>` : ''}
        <tr><td class="detail-label">Payment Date</td><td class="detail-value" align="right">${(payment.paidAt || new Date()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
      </table>
    </div>

    <p>Your official tax invoice and booking pass are available in your account dashboard.</p>
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: 'View Receipt & Booking',
      url: `${clientUrl}/bookings/${booking._id}`
    }
  });

  const text = `Payment Receipt: ₹${amountInRupees}
Booking Reference: ${booking.bookingReference}
Stadium: ${stadium?.name || 'Venue'}
Schedule: ${booking.bookingDate} (${booking.startTime} - ${booking.endTime})
Amount Paid: ₹${amountInRupees}
Payment ID: ${payment.razorpayPaymentId || 'N/A'}
View receipt at: ${clientUrl}/bookings/${booking._id}`;

  return { subject: `Payment Receipt: ₹${amountInRupees} - ${booking.bookingReference}`, html, text };
};

module.exports = { getPaymentSuccessEmail };
