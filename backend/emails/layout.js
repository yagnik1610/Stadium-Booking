/**
 * Base responsive HTML email layout for Stadium Booking
 */
const renderEmailLayout = ({ title, preheader = '', contentHtml, callToAction = null }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      padding: 28px 32px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #bfdbfe;
    }
    .content {
      padding: 32px;
      line-height: 1.6;
      font-size: 15px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-success { background-color: #dcfce7; color: #15803d; }
    .badge-warning { background-color: #fef9c3; color: #a16207; }
    .badge-danger { background-color: #fee2e2; color: #b91c1c; }
    .badge-info { background-color: #dbeafe; color: #1d4ed8; }
    .card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #cbd5e1;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #64748b;
      font-size: 13px;
    }
    .detail-value {
      font-weight: 600;
      color: #0f172a;
      font-size: 14px;
    }
    .btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      margin: 20px 0 10px;
      text-align: center;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <h1>🏟️ Stadium Booking</h1>
      <p>Premium Athletic Venues & Real-Time Scheduling</p>
    </div>
    <div class="content">
      ${contentHtml}
      ${callToAction ? `<div style="text-align:center;"><a href="${callToAction.url}" class="btn">${callToAction.text}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>You received this transactional update for your account on <a href="${clientUrl}">Stadium Booking</a>.</p>
      <p>Need assistance? Contact our team at <a href="mailto:${process.env.EMAIL_REPLY_TO || 'support@example.com'}">${process.env.EMAIL_REPLY_TO || 'support@example.com'}</a></p>
      <p style="margin-top:12px;color:#94a3b8;">© ${new Date().getFullYear()} Stadium Booking System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = {
  renderEmailLayout
};
