const { renderEmailLayout } = require('./layout');

const getBookingCancelledEmail = ({ booking, stadium, user, refundStatus = null }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const title = `Booking Cancelled: ${booking.bookingReference}`;
  const preheader = `Your reservation for ${stadium?.name || 'Venue'} has been cancelled.`;

  const contentHtml = `
    <h2>Booking Cancelled ℹ️</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>This is to confirm that your booking for <strong>${stadium?.name || 'the stadium'}</strong> has been cancelled and the slot has been released.</p>

    <div class="card">
      <div style="margin-bottom:12px;">
        <span class="badge badge-danger">CANCELLED</span>
      </div>
      <table style="width:100%;">
        <tr><td class="detail-label">Reference ID</td><td class="detail-value" align="right">${booking.bookingReference}</td></tr>
        <tr><td class="detail-label">Stadium</td><td class="detail-value" align="right">${stadium?.name || 'Venue'}</td></tr>
        <tr><td class="detail-label">Booking Date</td><td class="detail-value" align="right">${booking.bookingDate}</td></tr>
        <tr><td class="detail-label">Time Slot</td><td class="detail-value" align="right">${booking.startTime} - ${booking.endTime}</td></tr>
        <tr><td class="detail-label">Cancellation Time</td><td class="detail-value" align="right">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
        ${refundStatus ? `<tr><td class="detail-label">Refund Status</td><td class="detail-value" align="right">${refundStatus}</td></tr>` : ''}
      </table>
    </div>

    <p>We hope to see you on the field again soon! If you have any questions regarding your cancellation, please reach out to our support team.</p>
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: 'Browse Other Venues',
      url: `${clientUrl}/stadiums`
    }
  });

  const text = `Booking Cancelled: ${booking.bookingReference}
Stadium: ${stadium?.name || 'Venue'}
Date: ${booking.bookingDate} (${booking.startTime} - ${booking.endTime})
Status: CANCELLED
${refundStatus ? `Refund Status: ${refundStatus}` : ''}
Explore other venues at: ${clientUrl}/stadiums`;

  return { subject: `Booking Cancelled: ${booking.bookingReference}`, html, text };
};

module.exports = { getBookingCancelledEmail };
