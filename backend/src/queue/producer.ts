import { Queue } from 'bullmq';
import { connection } from './redis';

export const claimsQueue = new Queue('claims-processing', { connection });

// Helper to push a claim ID to the queue
export async function enqueueClaimRecord(recordId: string, inputData: any) {
    await claimsQueue.add('process-claim', {
        recordId,
        inputData
    }, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 1000 // keep the last 1000 failed jobs
    });
}
