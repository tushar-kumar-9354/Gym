const fs = require('fs');

const required = [
  'USDA_API_KEY',
  'GROQ_API_KEY',
  'GROQ_API_KEY_2',
  'GEMINI_API_KEY',
  'RESEND_API_KEY',
  'AUTH_SECRET',
];

const missing = required.filter((k) => !process.env[k]);
const isCI = Boolean(process.env.CI) || process.env.NODE_ENV === 'production';

if (fs.existsSync('.env.local')) {
  console.warn('\n[verify-env] Warning: .env.local exists in the project root.\n' +
    'Make sure you remove it from the git index and set secrets in your deployment platform (Vercel/Netlify).\n');
}

if (isCI && missing.length) {
  console.error('\n[verify-env] Missing required environment variables in CI/production:\n' + missing.join('\n') + '\n\n' +
    'Set these in your deployment environment (Vercel dashboard, vercel env add, or your CI secrets).\n');
  process.exit(1);
}

// For local development, just print a helpful message if any are missing.
if (!isCI && missing.length) {
  console.warn('\n[verify-env] Missing env vars (development): ' + missing.join(', ') + '\n' +
    'You can create a local .env.local for development, but DO NOT commit it to git.\n');
}

console.log('[verify-env] Environment verification complete.');
