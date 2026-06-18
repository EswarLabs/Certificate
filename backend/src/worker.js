import "dotenv/config";
import "./workers/job.worker.js";
import "./workers/email.worker.js";
import "./workers/image.worker.js";
import "./workers/pdf.worker.js";

console.log("Background workers successfully started!");
