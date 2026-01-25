import { Router, Request, Response } from "express";
import { User } from "../db/mongodb";
import { createSession, destroySession } from "../middleware/auth";
import bcrypt from "bcrypt";

const router = Router();

/**
 * GET /login - hiển thị trang login
 * Nếu đã login, redirect tới dashboard
 */
router.get("/login", (req: Request, res: Response) => {
  if (req.user) {
    return res.redirect("/dashboard");
  }
  res.render("login", { error: null });
});

/**
 * POST /login - xử lý form login
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("login", { error: "Email and password required" });
    }

    // Find user in MongoDB
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", { error: "Invalid credentials" });
    }

    // Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.render("login", { error: "Invalid credentials" });
    }

    // Create server-side session and set sessionId cookie
    const sessionId = await createSession(user._id.toString(), req);
    const cookieOpts = {
      httpOnly: true,
      secure: req.secure || process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };
    res.cookie("sessionId", sessionId, cookieOpts);
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      role: user.role,
    };

    return res.redirect("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    return res.render("login", { error: "Server error" });
  }
});

/**
 * POST /logout - logout user
 */
router.post("/logout", async (req: Request, res: Response) => {
  const sid = req.cookies.sessionId;
  await destroySession(sid);
  res.clearCookie("sessionId");
  req.user = undefined;
  res.redirect("/login");
});

/**
 * PATCH /api/user/update-info - cập nhật thông tin user
 */
router.patch("/api/user/update-info", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { name, email } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email required" });
    }

    // Check if email is already used by another user
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email: email.toLowerCase() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update req.user object
    req.user.name = user.name;
    req.user.email = user.email;

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Update info error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PATCH /api/user/change-password - đổi mật khẩu
 */
router.patch("/api/user/change-password", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Get user and verify current password
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
