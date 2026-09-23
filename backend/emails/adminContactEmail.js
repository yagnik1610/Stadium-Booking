const { renderEmailLayout } = require('./layout');

const getAdminContactEmail = ({ contactMessage }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const title = `[Contact Inquiry] ${contactMessage.subject || 'General Inquiry'}`;
  const preheader = `Inquiry received from ${contactMessage.name} (${contactMessage.email}).`;

  const contentHtml = `
    <h2>Customer Inquiry Received 💬</h2>
    <p>A new message was submitted via the platform contact form:</p>

    <div class="card">
      <table style="width:100%;">
        <tr><td class="detail-label">Sender Name</td><td class="detail-value" align="right">${contactMessage.name}</td></tr>
        <tr><td class="detail-label">Sender Email</td><td class="detail-value" align="right">${contactMessage.email}</td></tr>
        ${contactMessage.mobile ? `<tr><td class="detail-label">Mobile</td><td class="detail-value" align="right">${contactMessage.mobile}</td></tr>` : ''}
        <tr><td class="detail-label">Subject</td><td class="detail-value" align="right">${contactMessage.subject || 'General Inquiry'}</td></tr>
        <tr><td class="detail-label">Submitted At</td><td class="detail-value" align="right">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
      </table>
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;">
        <span class="detail-label" style="display:block;margin-bottom:6px;">Message Content:</span>
        <div style="background-color:#ffffff;padding:12px;border-radius:6px;border:1px solid #cbd5e1;font-size:14px;color:#334155;white-space:pre-wrap;">${contactMessage.message}</div>
      </div>
    </div>
  `;

  const html = renderEmailLayout({
    title,
    preheader,
    contentHtml,
    callToAction: {
      text: 'Open Admin Portal',
      url: `${clientUrl}/admin/dashboard`
    }
  });

  const text = `Customer Contact Inquiry: ${contactMessage.subject}
From: ${contactMessage.name} (${contactMessage.email})
Mobile: ${contactMessage.mobile || 'N/A'}
Message:
${contactMessage.message}
Submitted at: ${new Date().toISOString()}`;

  return { subject: `[Inquiry] ${contactMessage.subject || 'General Inquiry'} - from ${contactMessage.name}`, html, text };
};

module.exports = { getAdminContactEmail };
