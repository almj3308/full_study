// src/config/configuration.ts
export default () => ({
  database: {
    host: process.env.DEV_DB_HOST,
    port: Number(process.env.DEV_DB_PORT),
    username: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_DATABASE,
    charset: process.env.DEV_DB_CHARSET,
    connectionLimit: Number(process.env.DB_CONNECTIONLIMIT),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
});
