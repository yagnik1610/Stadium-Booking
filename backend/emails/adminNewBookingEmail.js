const { renderEmailLayout } = require('./layout');

const getAdminNewBookingEmail = ({ booking, stadium, user }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const title = `[Admin Alert] New Booking: ${booking.bookingReference}`;
  const preheader = `A new booking has been placed for ${stadium?.name || 'Venue'} by ${user.name}.`;

  const contentHtml = `
    <h2>New Booking Received 🏟️</h2>
    <p>A new customer booking reservation has been submitted:</p>

    <div class="card">
      <div style="margin-bottom:12px;">
        <span class="badge badge-info">${booking.status.toUpperCase()}</span>
      </div>
      <table style="width:100%;">
        <tr><td class="detail-label">Reference</td><td class="detail-value" align="right">${booking.bookingReference}</td></tr>
        <tr><td class="detail-label">Customer Name</td><td class="detail-value" align="right">${user.name}</td></tr>
        <tr><td class="detail-label">Customer Email</td><td class="detail-value" align="right">${user.email}</td></tr>
        <tr><td class="detail-label">Stadium</td><td class="detail-value" align="right">${stadium?.name || 'Venue'}</td></tr>
        <tr><td class="detail-label">Sport</td><td class="detail-value" align="right">${booking.sport || 'Sports'}</td></tr>
        <tr><td class="detail-label">Schedule</td><td class="detail-value" align="right">${booking.bookingDate} (${booking.startTime} - ${booking.endTime})</td></tr>
        <tr><td class="detail-label">Total Amount</td><td class="detail-value" align="right">₹${booking.totalPrice}</td></tr>
        <tr><td class="detail-label">Payment Status</td><td class="detail-value" align="right">${booking.paymentStatus}</td></tr>
      </table>
    </div>
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: 'View in Admin Dashboard',
      url: `${clientUrl}/admin/bookings`
    }
  });

  const text = `New Booking Alert: ${booking.bookingReference}
Customer: ${user.name} (${user.email})
Stadium: ${stadium?.name || 'Venue'}
Schedule: ${booking.bookingDate} (${booking.startTime} - ${booking.endTime})
Total Amount: ₹${booking.totalPrice}
Payment Status: ${booking.paymentStatus}
Manage in Admin Portal: ${clientUrl}/admin/bookings`;

  return { subject: `[Admin Alert] New Booking: ${booking.bookingReference} - ${stadium?.name || 'Venue'}`, html, text };
};

module.exports = { getAdminNewBookingEmail };
