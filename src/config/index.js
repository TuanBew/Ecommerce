const port = process.env.PORT || 3000
const host = process.env.HOST || 'localhost'

module.exports = {
    port,
    host,
    db: {
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE
    }
}