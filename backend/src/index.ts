import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import uploadRouter from './routes/upload';
import { pool } from './db';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/upload', uploadRouter);

app.get('/api/v1/uploads', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM uploads ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({error: e.message});
    }
});

app.get('/api/v1/uploads/:id/results', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM processed_claims WHERE upload_id = $1", [req.params.id]);
        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({error: e.message});
    }
});

// Websockets for realtime progress
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
});

// Broadcast changes periodically (in production, use DB triggers + CDC or BullMQ events instead)
setInterval(async () => {
    try {
        const activeUploads = await pool.query("SELECT * FROM uploads WHERE status IN ('pending', 'processing')");
        for (const upload of activeUploads.rows) {
            const stats = await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN processing_status = 'success' THEN 1 ELSE 0 END) as processed,
                    SUM(CASE WHEN processing_status = 'failed' THEN 1 ELSE 0 END) as failed
                 FROM processed_claims WHERE upload_id = $1`, [upload.id]
            );
            
            const processed = parseInt(stats.rows[0].processed || '0');
            const failed = parseInt(stats.rows[0].failed || '0');
            const total = parseInt(stats.rows[0].total || '0');
            
            if (total > 0 && (processed + failed) === total) {
                await pool.query("UPDATE uploads SET status = 'completed', processed_records = $1, failed_records = $2 WHERE id = $3", [processed, failed, upload.id]);
            } else {
                await pool.query("UPDATE uploads SET processed_records = $1, failed_records = $2 WHERE id = $3", [processed, failed, upload.id]);
            }

            io.emit(`progress:${upload.id}`, { total, processed, failed });
        }
    } catch (e) {
        // silently ignore polling errors
    }
}, 2000);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
