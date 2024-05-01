import { createPool } from 'mysql2/promise';

export const pool = createPool({
    user: "root",
    password: "Nano",
    host: "localhost",
    port: 8000,
    database: "users"
})