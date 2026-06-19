import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { generatePdfFromEditorData } from "../utils/generateMedia.js";
import { uploadBufferToCloudinary } from "../utils/uploadBuffer.js";

export const pdfWorker = new Worker(
    "pdfQueue",
    async (job) => {
        const { credentialId } = job.data;
        const credData = await prisma.credential.findUnique({
            where: {
                id: credentialId
            },
            select: {
                recipientName: true,
                recipientEmail: true,
                verificationCode: true,
                issuedAt: true,
                credentialData: true,
                template: {
                    select: {
                        editorData: true
                    }
                }
            }
        });

        if (!credData) throw new Error("Credential not found");

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const verificationUrl = `${frontendUrl}/verify/${credData.verificationCode}`;

        const issuedDateStr = credData.issuedAt
            ? new Date(credData.issuedAt).toLocaleDateString()
            : new Date().toLocaleDateString(); // Fallback to current date if not issued yet

        const replacements = {
            recipientName: credData.recipientName,
            recipient_name: credData.recipientName,
            recipientEmail: credData.recipientEmail,
            recipient_email: credData.recipientEmail,
            verificationCode: credData.verificationCode,
            verification_code: credData.verificationCode,
            verificationUrl,
            verification_url: verificationUrl,
            issuedAt: issuedDateStr,
            issuedDate: issuedDateStr,
            issued_date: issuedDateStr,
            "issued date": issuedDateStr,
            ...(typeof credData.credentialData === "object" ? credData.credentialData : {}),
        };

        const pdfBuffer = await generatePdfFromEditorData(credData.template.editorData, replacements);
        
        // upload_stream can accept 'raw' or 'image' but pdfs are usually raw or image (as pdf). 
        // Cloudinary handles pdf as 'image' resource type as well, which supports generating thumbnails.
        const uploadResult = await uploadBufferToCloudinary(pdfBuffer, 'image');
        
        await prisma.credential.update({
            where: { id: credentialId },
            data: { pdfUrl: uploadResult.secure_url }
        });
    },
    { connection: redis, concurrency: 5 }
);

pdfWorker.on("completed", (job) => {
    console.log(`[PDF Worker] Job ${job.id} completed successfully.`);
});

pdfWorker.on("failed", (job, err) => {
    console.error(`[PDF Worker] Job ${job.id} failed: ${err.message}`);
});
