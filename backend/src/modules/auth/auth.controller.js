import { googleLogin } from "./auth.service.js";

export const googleAuthController = async (req, res) => {
  try {
    const { credential } = req.body;
    const { user, accessToken } = await googleLogin(credential);
    

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      user,
      accessToken, 
    });
  } catch (error) {
    console.error("Error in Google Auth Controller:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const logoutController = (req, res) => {
  res.clearCookie("accessToken");
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getCurrentUserController = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
