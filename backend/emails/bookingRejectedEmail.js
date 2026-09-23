const { renderEmailLayout } = require('./layout');

const getBookingRejectedEmail = ({ booking, stadium, user, reason }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const title = `Booking Request Update: ${booking.bookingReference}`;
  const preheader = `Your reservation request for ${stadium?.name || 'Venue'} could not be confirmed.`;

  const contentHtml = `
    <h2>Booking Request Not Approved ❌</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>We regret to inform you that your booking request for <strong>${stadium?.name || 'the stadium'}</strong> could not be approved by venue management.</p>

    <div class="card">
      <div style="margin-bottom:12px;">
        <span class="badge badge-danger">REJECTED</span>
      </div>
      <table style="width:100%;">
        <tr><td class="detail-label">Reference ID</td><td class="detail-value" align="right">${booking.bookingReference}</td></tr>
        <tr><td class="detail-label">Stadium</td><td class="detail-value" align="right">${stadium?.name || 'Venue'}</td></tr>
        <tr><td class="detail-label">Requested Date</td><td class="detail-value" align="right">${booking.bookingDate}</td></tr>
        <tr><td class="detail-label">Requested Slot</td><td class="detail-value" align="right">${booking.startTime} - ${booking.endTime}</td></tr>
        ${reason ? `<tr><td class="detail-label">Reason Provided</td><td class="detail-value" align="right" style="color:#b91c1c;">${reason}</td></tr>` : ''}
      </table>
    </div>

    <p>If you were charged, a full refund will be processed automatically to your original payment method. You can explore other venues or different time slots on our platform.</p>
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: 'Find Alternative Venues',
      url: `${clientUrl}/stadiums`
    }
  });

  const text = `Booking Request Rejected: ${booking.bookingReference}
Stadium: ${stadium?.name || 'Venue'}
Date: ${booking.bookingDate} (${booking.startTime} - ${booking.endTime})
Reason: ${reason || 'Venue unavailable'}
Explore other stadiums at: ${clientUrl}/stadiums`;

  return { subject: `Booking Request Rejected: ${booking.bookingReference}`, html, text };
};

module.exports = { getBookingRejectedEmail };
