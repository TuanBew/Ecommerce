module.exports = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  db: {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
  }
};