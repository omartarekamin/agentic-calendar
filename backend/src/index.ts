import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getPool } from './db/pool.js';
import { createConnectionRouter } from './routes/connection.routes.js';

const app = express();
const port = process.env.PORT || 4000;
const appOrigin = process.env.APP_URL || 'http://localhost:3000';

function getErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return undefined;
}

app.use(cors({
  origin: appOrigin,
  credentials: true,
}));
app.use(express.json());
app.use('/api/connections', createConnectionRouter());

app.get("/health", async (req, res) => {
    try {
        await getPool().query("SELECT 1"); // Ensure the database connection is established
        res.status(200).json({ status: "ok", database: "healthy", message: "Server is healthy" });
    } catch (error) {
        res.status(503).json({ status: "error", database: "down", error, message: "Internal Server Error" });
    }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API request error', {
    name: error instanceof Error ? error.name : 'UnknownError',
    code: getErrorCode(error),
  });
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'The request could not be completed',
    },
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});