const { renderEmailLayout } = require('./layout');
const { paiseToRupees } = require('../utils/money');

const getRefundProcessedEmail = ({ payment, booking, stadium, user }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const refundAmount = paiseToRupees(payment.amount);
  const title = `Refund Processed: ₹${refundAmount}`;
  const preheader = `A refund of ₹${refundAmount} has been processed for your booking.`;

  const contentHtml = `
    <h2>Refund Processed 💸</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>We have processed a refund of <strong>₹${refundAmount}</strong> for your booking at <strong>${stadium?.name || 'the stadium'}</strong>.</p>

    <div class="card">
      <div style="margin-bottom:12px;">
        <span class="badge badge-success">REFUNDED</span>
      </div>
      <table style="width:100%;">
        <tr><td class="detail-label">Booking Reference</td><td class="detail-value" align="right">${booking.bookingReference}</td></tr>
        <tr><td class="detail-label">Stadium</td><td class="detail-value" align="right">${stadium?.name || 'Venue'}</td></tr>
        <tr><td class="detail-label">Original Schedule</td><td class="detail-value" align="right">${booking.bookingDate} (${booking.startTime} - ${booking.endTime})</td></tr>
        <tr><td class="detail-label">Refund Amount</td><td class="detail-value" align="right" style="color:#15803d;font-weight:700;">₹${refundAmount}</td></tr>
        ${payment.razorpayPaymentId ? `<tr><td class="detail-label">Payment ID</td><td class="detail-value" align="right">${payment.razorpayPaymentId}</td></tr>` : ''}
        <tr><td class="detail-label">Processed Date</td><td class="detail-value" align="right">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
      </table>
    </div>

    <p>Depending on your bank or payment provider, refunds typically appear in your account statement within 5–7 business days.</p>
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: 'View Booking History',
      url: `${clientUrl}/bookings/my`
    }
  });

  const text = `Refund Processed: ₹${refundAmount}
Booking Reference: ${booking.bookingReference}
Stadium: ${stadium?.name || 'Venue'}
Refund Amount: ₹${refundAmount}
Status: REFUNDED
View booking history at: ${clientUrl}/bookings/my`;

  return { subject: `Refund Processed: ₹${refundAmount} - ${booking.bookingReference}`, html, text };
};

module.exports = { getRefundProcessedEmail };
