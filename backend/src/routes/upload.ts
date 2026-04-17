import { Router } from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { pool } from '../db';
import { enqueueClaimRecord } from '../queue/producer';

const router = Router();
// Limit to basic streaming in-memory, scale memory limits as needed or use stream to disk for huge datasets
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Create an upload record
        const uploadResult = await pool.query(
            "INSERT INTO uploads (filename, status) VALUES ($1, 'processing') RETURNING id",
            [req.file.originalname]
        );
        const uploadId = uploadResult.rows[0].id;

        const bufferStream = Readable.from(req.file.buffer.toString());
        const records: any[] = [];

        bufferStream
            .pipe(csvParser())
            .on('data', (data) => records.push(data))
            .on('end', async () => {
                // Update total records
                await pool.query(
                    "UPDATE uploads SET total_records = $1 WHERE id = $2",
                    [records.length, uploadId]
                );

                // Start chunked insertion (Simulating line by line for clarity, optimize batch sizes internally for prod scale)
                for (let i = 0; i < records.length; i++) {
                    const row = records[i];
                    // Fallback to various common CSV headers
                    const inputText = row.diagnosis || row.text || row.chief_complaint || 'N/A';
                    
                    const claimResult = await pool.query(
                        `INSERT INTO processed_claims (upload_id, input_text, procedure_description, clinical_notes) 
                         VALUES ($1, $2, $3, $4) RETURNING record_id`,
                        [uploadId, inputText, row.procedure || null, row.notes || null]
                    );

                    const recordId = claimResult.rows[0].record_id;
                    await enqueueClaimRecord(recordId, row);
                }

                return res.status(200).json({ message: 'File is being processed', uploadId });
            });

    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
