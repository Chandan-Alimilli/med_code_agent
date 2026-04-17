import { Worker, Job } from 'bullmq';
import { connection } from './redis';
import { pool } from '../db';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/infer';

const worker = new Worker('claims-processing', async (job: Job) => {
    const { recordId, inputData } = job.data;
    
    // Set status to processing
    await pool.query(
        "UPDATE processed_claims SET processing_status = 'processing', updated_at = NOW() WHERE record_id = $1", 
        [recordId]
    );

    try {
        const inputText = inputData.diagnosis || inputData.text || inputData.chief_complaint || 'UNKNOWN_DIAGNOSIS';
        const procedureDesc = inputData.procedure || null;
        const notes = inputData.notes || null;

        const response = await axios.post(AI_SERVICE_URL, {
            record_id: recordId,
            input_text: inputText,
            procedure_description: procedureDesc,
            clinical_notes: notes
        });

        const result = response.data;

        await pool.query(
            `UPDATE processed_claims SET 
             icd_code = $1, procedure_code = $2, confidence_score = $3, reasoning_summary = $4,
             processing_status = 'success', updated_at = NOW()
             WHERE record_id = $5`,
            [result.icd_code, result.procedure_code, result.confidence, result.reasoning, recordId]
        );
        
    } catch (error: any) {
        // Record failure
        await pool.query(
            `UPDATE processed_claims SET processing_status = 'failed', updated_at = NOW() WHERE record_id = $1`,
            [recordId]
        );
        await pool.query(
            "INSERT INTO failed_records (upload_id, input_data, error_message) VALUES ((SELECT upload_id FROM processed_claims WHERE record_id = $1), $2, $3)",
            [recordId, inputData, error.message || 'Worker processing failed']
        );
        // Important: Re-throw to allow BullMQ to handle retries implicitly 
        throw error;
    }
}, { connection, concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5') });

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("Worker started, waiting for jobs...");
