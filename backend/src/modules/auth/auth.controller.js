import { googleLogin, register, login } from "./auth.service.js";
import { prisma } from "../../lib/prisma.js";

export const googleAuthController = async (req, res) => {
  try {
    const credential = req.body.credential || req.body.token || req.body.idToken;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Missing token' });
    }
    const { user, accessToken } = await googleLogin(credential);


    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
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

export const registerController = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const { user, accessToken } = await register(email, password, firstName, lastName);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      user,
      accessToken,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Error in Register Controller:", error);
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const { user, accessToken } = await login(email, password);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      user,
      accessToken,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error in Login Controller:", error);
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (error.message.includes("Invalid password")) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    if (error.message.includes("Google OAuth")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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

export const getCurrentUserController = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      user,
      message: "User fetched successfully",
    });
  } catch (err) {
    console.error("Error in Get Current User Controller:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
