const { renderEmailLayout } = require('./layout');

const getBookingCreatedEmail = ({ booking, stadium, user }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const title = `Booking Request Received: ${booking.bookingReference}`;
  const preheader = `Your reservation request for ${stadium?.name || 'Stadium'} has been received.`;

  const isPendingPayment = booking.paymentStatus === 'pending';

  const contentHtml = `
    <h2>Booking Request Received 📋</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>We have received your reservation request. ${
      isPendingPayment
        ? 'Please complete your payment within the 15-minute window to secure your slot.'
        : 'Your booking has been received and is being processed.'
    }</p>

    <div class="card">
      <div style="margin-bottom:12px;">
        <span class="badge ${isPendingPayment ? 'badge-warning' : 'badge-info'}">
          ${isPendingPayment ? 'Payment Pending' : booking.status.toUpperCase()}
        </span>
      </div>
      <table style="width:100%;">
        <tr><td class="detail-label">Reference ID</td><td class="detail-value" align="right">${booking.bookingReference}</td></tr>
        <tr><td class="detail-label">Stadium</td><td class="detail-value" align="right">${stadium?.name || 'Venue'}</td></tr>
        <tr><td class="detail-label">Location</td><td class="detail-value" align="right">${stadium?.city || ''}</td></tr>
        <tr><td class="detail-label">Sport</td><td class="detail-value" align="right">${booking.sport || 'Sports'}</td></tr>
        <tr><td class="detail-label">Date</td><td class="detail-value" align="right">${booking.bookingDate}</td></tr>
        <tr><td class="detail-label">Time</td><td class="detail-value" align="right">${booking.startTime} - ${booking.endTime} (${booking.duration} hr)</td></tr>
        <tr><td class="detail-label">Total Amount</td><td class="detail-value" align="right">₹${booking.totalPrice}</td></tr>
      </table>
    </div>

    ${
      isPendingPayment
        ? `<p style="color:#b91c1c;font-size:13px;">⚠️ <strong>Note:</strong> Your time slot is reserved for 15 minutes. Unpaid reservations are automatically released.</p>`
        : ''
    }
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: isPendingPayment ? 'Pay Now & Confirm Slot' : 'View Booking Details',
      url: `${clientUrl}/bookings/${booking._id}`
    }
  });

  const text = `Booking Request Received: ${booking.bookingReference}
Stadium: ${stadium?.name || 'Venue'}
Date: ${booking.bookingDate} (${booking.startTime} - ${booking.endTime})
Total Amount: ₹${booking.totalPrice}
Status: ${booking.status} (Payment: ${booking.paymentStatus})
View booking details at: ${clientUrl}/bookings/${booking._id}`;

  return { subject: `Booking Request Received: ${booking.bookingReference} - ${stadium?.name || 'Venue'}`, html, text };
};

module.exports = { getBookingCreatedEmail };
