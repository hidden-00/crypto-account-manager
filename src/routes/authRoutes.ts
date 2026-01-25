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

export default router;
