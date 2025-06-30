import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const createDatabasePool = (): Pool => {
    const pool = new Pool({
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME || "toilet_finder",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "password",
        max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
        connectionTimeoutMillis: parseInt(
            process.env.DB_CONNECTION_TIMEOUT || "2000"
        ),
    });

    pool.on("error", (err) => {
        console.error("Unexpected error on idle client", err);
        process.exit(-1);
    });

    return pool;
};
