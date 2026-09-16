require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/pharmacy_system'),
  jwtSecret: required('JWT_SECRET', 'dev_change_me_pharmacy_secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  expiringSoonDays: Number(process.env.EXPIRING_SOON_DAYS) || 60,
};
