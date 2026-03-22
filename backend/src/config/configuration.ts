export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    uri: process.env.MONGO_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'producSync_default_secret',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },
});
