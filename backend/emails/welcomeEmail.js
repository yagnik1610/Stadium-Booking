const { renderEmailLayout } = require('./layout');

const getWelcomeEmail = ({ name }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const title = 'Welcome to Stadium Booking!';
  const preheader = `Welcome aboard, ${name}! Your athletic journey starts here.`;

  const contentHtml = `
    <h2>Welcome to Stadium Booking, ${name}! 🎉</h2>
    <p>Thank you for creating an account with us. You now have instant access to premier sports venues, turf grounds, and indoor arenas across the city.</p>
    <div class="card">
      <h3 style="margin-top:0;font-size:16px;color:#1e3a8a;">What You Can Do:</h3>
      <ul style="padding-left:20px;margin-bottom:0;color:#334155;">
        <li>Browse verified stadiums with high-res photos and sport filters</li>
        <li>Reserve available 60-minute time slots in real time</li>
        <li>Pay securely using UPI, Credit Cards, or Net Banking</li>
        <li>Manage upcoming matches and view booking receipts from your dashboard</li>
      </ul>
    </div>
    <p>Ready to hit the field? Explore venues and book your first slot today!</p>
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: 'Explore Stadiums',
      url: `${clientUrl}/stadiums`
    }
  });

  const text = `Welcome to Stadium Booking, ${name}!
Thank you for creating an account with us. You now have instant access to premier sports venues, turf grounds, and indoor arenas across the city.
Explore stadiums and book your first slot at: ${clientUrl}/stadiums
Best regards,
Stadium Booking Team`;

  return { subject: 'Welcome to Stadium Booking! 🏟️', html, text };
};

module.exports = { getWelcomeEmail };
