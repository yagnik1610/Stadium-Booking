const { renderEmailLayout } = require('./layout');

const getPaymentFailedEmail = ({ payment, booking, stadium, user, reason }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const title = `Payment Attempt Failed: ${booking.bookingReference}`;
  const preheader = `Your payment attempt for ${stadium?.name || 'Stadium Booking'} could not be processed.`;

  const contentHtml = `
    <h2>Payment Attempt Failed ⚠️</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>We were unable to complete your payment for <strong>${stadium?.name || 'the stadium'}</strong>.</p>

    <div class="card">
      <div style="margin-bottom:12px;">
        <span class="badge badge-danger">PAYMENT FAILED</span>
      </div>
      <table style="width:100%;">
        <tr><td class="detail-label">Booking Reference</td><td class="detail-value" align="right">${booking.bookingReference}</td></tr>
        <tr><td class="detail-label">Stadium</td><td class="detail-value" align="right">${stadium?.name || 'Venue'}</td></tr>
        <tr><td class="detail-label">Time Slot</td><td class="detail-value" align="right">${booking.bookingDate} (${booking.startTime} - ${booking.endTime})</td></tr>
        <tr><td class="detail-label">Attempted Amount</td><td class="detail-value" align="right">₹${booking.totalPrice}</td></tr>
        ${reason ? `<tr><td class="detail-label">Failure Reason</td><td class="detail-value" align="right" style="color:#b91c1c;">${reason}</td></tr>` : ''}
      </table>
    </div>

    <div style="background-color:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        <strong>Slot Status:</strong> Your booking is currently still reserved while your payment window remains active. You can retry paying using another payment method (UPI, Card, Net Banking).
      </p>
    </div>
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: 'Retry Payment Now',
      url: `${clientUrl}/bookings/${booking._id}`
    }
  });

  const text = `Payment Attempt Failed: ${booking.bookingReference}
Stadium: ${stadium?.name || 'Venue'}
Schedule: ${booking.bookingDate} (${booking.startTime} - ${booking.endTime})
Reason: ${reason || 'Card/Payment declined'}
Retry payment before window expires at: ${clientUrl}/bookings/${booking._id}`;

  return { subject: `Payment Failed: ${booking.bookingReference} - Please Retry`, html, text };
};

module.exports = { getPaymentFailedEmail };
