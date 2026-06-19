import app from "./app.js";
import "./worker.js"; // Run background workers in the same process as the API

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
