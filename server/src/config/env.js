import 'dotenv/config';

export const env = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clinicppm',
  port: Number(process.env.PORT || 4000)
};