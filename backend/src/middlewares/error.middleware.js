export const errorHandler = (err, req, res, next) => {
  console.error("Centralized Error Handler:", err);

  if (err.name === "ZodError" || err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors || err.issues || err.message,
    });
  }

  const message = err.message || "";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("not found") || lowerMessage.includes("notfound")) {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }

  if (
    lowerMessage.includes("access denied") ||
    lowerMessage.includes("not a member") ||
    lowerMessage.includes("does not have permission") ||
    lowerMessage.includes("only organization owners")
  ) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
    
  });
}
