/**
 * Validates environment variables on server boot to ensure production safety.
 * Aborts process on critical missing secrets and warns on optional service gaps.
 * NEVER prints secret values in logs or error messages.
 */

const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const missingCritical = [];
  const missingProduction = [];
  const warnings = [];

  // 1. Critical Variables (Required across all environments)
  const criticalVars = [
    { key: 'MONGO_URI', description: 'MongoDB connection string' },
    { key: 'JWT_SECRET', description: 'JSON Web Token signing secret' }
  ];

  criticalVars.forEach(({ key, description }) => {
    if (!process.env[key] || process.env[key].trim() === '') {
      missingCritical.push(`${key} (${description})`);
    }
  });

  if (missingCritical.length > 0) {
    console.error('❌ CRITICAL ENVIRONMENT CONFIGURATION ERROR:');
    missingCritical.forEach(item => console.error(`   - Missing required variable: ${item}`));
    console.error('Server startup aborted to prevent insecure operation.');
    process.exit(1);
  }

  // 2. Production Required Variables (Required when NODE_ENV=production)
  const productionVars = [
    { key: 'CLIENT_URL', description: 'Production Frontend Client URL for CORS' },
    { key: 'RAZORPAY_KEY_ID', description: 'Razorpay Key ID for payment gateway' },
    { key: 'RAZORPAY_KEY_SECRET', description: 'Razorpay Key Secret for payment signature verification' },
    { key: 'RAZORPAY_WEBHOOK_SECRET', description: 'Razorpay Webhook Secret for webhook HMAC validation' }
  ];

  productionVars.forEach(({ key, description }) => {
    if (!process.env[key] || process.env[key].trim() === '') {
      if (isProduction) {
        missingProduction.push(`${key} (${description})`);
      } else {
        warnings.push(`[DEV WARNING] ${key} is not set; payment features will operate in mock/degraded mode.`);
      }
    }
  });

  // 3. Optional External Services (Resend, Cloudinary)
  const externalServices = [
    { key: 'RESEND_API_KEY', name: 'Resend transactional email' },
    { key: 'CLOUDINARY_API_KEY', name: 'Cloudinary media upload' }
  ];

  externalServices.forEach(({ key, name }) => {
    if (!process.env[key] || process.env[key].trim() === '') {
      warnings.push(`[INFO] ${key} is not set; ${name} will operate in stub/mock mode.`);
    }
  });

  if (missingProduction.length > 0) {
    console.error('❌ PRODUCTION CONFIGURATION ERROR (NODE_ENV=production):');
    missingProduction.forEach(item => console.error(`   - Missing variable: ${item}`));
    console.error('Server startup aborted.');
    process.exit(1);
  }

  // In development, log non-fatal warnings
  if (warnings.length > 0 && !isProduction && process.env.NODE_ENV !== 'test') {
    warnings.forEach(w => console.log(`⚠️ ${w}`));
  }

  return {
    valid: true,
    isProduction,
    criticalCount: criticalVars.length
  };
};

module.exports = validateEnv;
