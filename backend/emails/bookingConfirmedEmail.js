const { renderEmailLayout } = require('./layout');

const getBookingConfirmedEmail = ({ booking, stadium, user, payment }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const title = `Booking Confirmed: ${booking.bookingReference}`;
  const preheader = `Your reservation at ${stadium?.name || 'Venue'} is officially confirmed!`;

  const contentHtml = `
    <h2>Booking Confirmed! ✅</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>Great news! Your booking has been confirmed and the time slot is locked exclusively for you.</p>

    <div class="card">
      <div style="margin-bottom:12px;">
        <span class="badge badge-success">CONFIRMED</span>
      </div>
      <table style="width:100%;">
        <tr><td class="detail-label">Reference ID</td><td class="detail-value" align="right">${booking.bookingReference}</td></tr>
        <tr><td class="detail-label">Stadium</td><td class="detail-value" align="right">${stadium?.name || 'Venue'}</td></tr>
        <tr><td class="detail-label">Address</td><td class="detail-value" align="right">${stadium?.address || ''}, ${stadium?.city || ''}</td></tr>
        <tr><td class="detail-label">Sport</td><td class="detail-value" align="right">${booking.sport || 'Sports'}</td></tr>
        <tr><td class="detail-label">Date</td><td class="detail-value" align="right">${booking.bookingDate}</td></tr>
        <tr><td class="detail-label">Time Slot</td><td class="detail-value" align="right">${booking.startTime} - ${booking.endTime}</td></tr>
        <tr><td class="detail-label">Amount Paid</td><td class="detail-value" align="right">₹${booking.totalPrice}</td></tr>
        ${payment?.razorpayPaymentId ? `<tr><td class="detail-label">Payment ID</td><td class="detail-value" align="right">${payment.razorpayPaymentId}</td></tr>` : ''}
      </table>
    </div>

    <div style="background-color:#eff6ff;border-left:4px solid #2563eb;padding:12px 16px;margin:16px 0;border-radius:4px;">
      <h4 style="margin:0 0 6px;color:#1e40af;font-size:14px;">🏟️ Important Venue Guidelines:</h4>
      <ul style="margin:0;padding-left:18px;font-size:13px;color:#1e3a8a;">
        <li>Please arrive 15 minutes prior to your scheduled start time.</li>
        <li>Carry proper sports footwear (non-marking shoes where required).</li>
        <li>Present this confirmation email or your digital booking pass at the front desk.</li>
      </ul>
    </div>
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: 'View Booking Pass',
      url: `${clientUrl}/bookings/${booking._id}`
    }
  });

  const text = `Booking Confirmed: ${booking.bookingReference}
Stadium: ${stadium?.name || 'Venue'}
Address: ${stadium?.address || ''}, ${stadium?.city || ''}
Date: ${booking.bookingDate} (${booking.startTime} - ${booking.endTime})
Amount Paid: ₹${booking.totalPrice}
Status: CONFIRMED
View booking pass at: ${clientUrl}/bookings/${booking._id}`;

  return { subject: `Booking Confirmed: ${booking.bookingReference} - ${stadium?.name || 'Venue'}`, html, text };
};

module.exports = { getBookingConfirmedEmail };
