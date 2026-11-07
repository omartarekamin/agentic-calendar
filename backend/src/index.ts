import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getPool } from './db/pool.js';

const app = express();
const port = process.env.PORT || 4000;
const appOrigin = process.env.APP_URL || 'http://localhost:3000';

app.use(cors({
  origin: appOrigin,
  credentials: true,
}));
app.use(express.json());

app.get("/health", async (req, res) => {
    try {
        await getPool().query("SELECT 1"); // Ensure the database connection is established
        res.status(200).json({ status: "ok", database: "healthy", message: "Server is healthy" });
    } catch (error) {
        res.status(503).json({ status: "error", database: "down", error, message: "Internal Server Error" });
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});