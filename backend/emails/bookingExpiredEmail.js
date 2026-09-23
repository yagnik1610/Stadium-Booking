const { renderEmailLayout } = require('./layout');

const getBookingExpiredEmail = ({ booking, stadium, user }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const title = `Reservation Expired: ${booking.bookingReference}`;
  const preheader = `Your pending booking for ${stadium?.name || 'Venue'} has expired.`;

  const contentHtml = `
    <h2>Booking Expired ⏱️</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>Your pending reservation for <strong>${stadium?.name || 'the stadium'}</strong> has expired because payment was not completed within the 15-minute checkout window.</p>

    <div class="card">
      <div style="margin-bottom:12px;">
        <span class="badge badge-warning">EXPIRED</span>
      </div>
      <table style="width:100%;">
        <tr><td class="detail-label">Reference ID</td><td class="detail-value" align="right">${booking.bookingReference}</td></tr>
        <tr><td class="detail-label">Stadium</td><td class="detail-value" align="right">${stadium?.name || 'Venue'}</td></tr>
        <tr><td class="detail-label">Requested Date</td><td class="detail-value" align="right">${booking.bookingDate}</td></tr>
        <tr><td class="detail-label">Time Slot</td><td class="detail-value" align="right">${booking.startTime} - ${booking.endTime}</td></tr>
        <tr><td class="detail-label">Total Amount</td><td class="detail-value" align="right">₹${booking.totalPrice}</td></tr>
      </table>
    </div>

    <p>The time slot has been released back to the schedule. If you still wish to play, you can quickly re-book the slot if it is still available.</p>
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: 'Book Again',
      url: `${clientUrl}/stadiums/${stadium?._id || booking.stadium}`
    }
  });

  const text = `Booking Expired: ${booking.bookingReference}
Stadium: ${stadium?.name || 'Venue'}
Date: ${booking.bookingDate} (${booking.startTime} - ${booking.endTime})
Reason: Payment was not completed within the 15-minute window.
Book again at: ${clientUrl}/stadiums/${stadium?._id || booking.stadium}`;

  return { subject: `Reservation Expired: ${booking.bookingReference}`, html, text };
};

module.exports = { getBookingExpiredEmail };
