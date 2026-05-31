const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'AI_ENGINE_URL'];

module.exports.loadEnv = function loadEnv() {
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`\n  ✗  Missing required environment variables:\n     ${missing.join(', ')}`);
    console.error('  →  Copy .env.example to .env and fill in the values.\n');
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('  ⚠  JWT_SECRET is short — use at least 64 random characters in production.');
  }
};