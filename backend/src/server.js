import { execSync } from "child_process";
import app from "./app.js";
import "./worker.js"; // Run background workers in the same process as the API

/* Auto-sync database schema on production boot (Render / Railway deployment fix) */
if (process.env.NODE_ENV === "production") {
  try {
    console.log("[Boot] Synchronizing production database schema with Prisma...");
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("[Boot] Database schema synchronized successfully.");
  } catch (err) {
    console.error("[Boot] Prisma sync notice:", err.message);
  }
}

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
