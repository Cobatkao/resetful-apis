require('dotenv').config('./env')
const { DB_HOST, DB_NAME, DB_PORT, DB_USER, DB_PWD } =  process.env

module.exports = {
    host: DB_HOST,
    database: DB_NAME,
    username: DB_USER,
    password: DB_PWD,
    port: DB_PORT
}