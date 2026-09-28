export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret_memeini_2026',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_memeini_2026',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    aws: {
      region: process.env.AWS_REGION || 'eu-central-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      bucketName: process.env.AWS_S3_BUCKET_NAME || 'memeini-media',
      endpoint: process.env.AWS_S3_ENDPOINT || undefined,
      publicDomain: process.env.AWS_S3_PUBLIC_DOMAIN || undefined,
    },
  },
});
