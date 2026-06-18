import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { generateImageFromEditorData } from "../utils/generateMedia.js";
import { uploadBufferToCloudinary } from "../utils/uploadBuffer.js";

export const imageWorker = new Worker(
    "imageQueue",
    async (job) => {
        const { credentialId } = job.data;
        const imgData = await prisma.credential.findUnique({
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

        if (!imgData) throw new Error("Credential not found");

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const verificationUrl = `${frontendUrl}/verify/${imgData.verificationCode}`;

        const issuedDateStr = imgData.issuedAt
            ? new Date(imgData.issuedAt).toLocaleDateString()
            : new Date().toLocaleDateString(); // Fallback to current date if not issued yet

        const replacements = {
            recipientName: imgData.recipientName,
            recipient_name: imgData.recipientName,
            recipientEmail: imgData.recipientEmail,
            recipient_email: imgData.recipientEmail,
            verificationCode: imgData.verificationCode,
            verification_code: imgData.verificationCode,
            verificationUrl,
            verification_url: verificationUrl,
            issuedAt: issuedDateStr,
            issuedDate: issuedDateStr,
            issued_date: issuedDateStr,
            "issued date": issuedDateStr,
            ...(typeof imgData.credentialData === "object" ? imgData.credentialData : {}),
        };

        const imageBuffer = await generateImageFromEditorData(imgData.template.editorData, replacements);
        
        const uploadResult = await uploadBufferToCloudinary(imageBuffer, 'image');
        
        await prisma.credential.update({
            where: { id: credentialId },
            data: { imageUrl: uploadResult.secure_url }
        });
    },
    { connection: redis }
);

imageWorker.on("completed", (job) => {
    console.log(`[Image Worker] Job ${job.id} completed successfully.`);
});

imageWorker.on("failed", (job, err) => {
    console.error(`[Image Worker] Job ${job.id} failed: ${err.message}`);
});