import { Request, Response, NextFunction } from "express";
import { User, Session } from "../db/mongodb";
import crypto from "crypto";

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * User type for request object
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

function makeFingerprint(req: Request) {
  const ua = (req.headers["user-agent"] || "").toString();
  const ip = req.ip || req.connection.remoteAddress || "";
  return crypto.createHash("sha256").update(ua + "|" + ip).digest("hex");
}

/**
 * Create a new session in MongoDB
 */
export async function createSession(userId: string, req: Request): Promise<string> {
  const fingerprint = makeFingerprint(req);
  const sessionId = crypto.randomBytes(32).toString("hex");
  
  const expiresAt = new Date(Date.now() + SESSION_TTL);
  
  await Session.create({
    sessionId,
    userId,
    fingerprint,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
    expiresAt,
  });
  
  return sessionId;
}

/**
 * Get session from MongoDB with fingerprint validation
 */
export async function getSession(id: string | undefined, req: Request) {
  if (!id) return null;
  
  try {
    const session = await Session.findOne({ sessionId: id });
    if (!session) return null;
    
    // Check expiration
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ sessionId: id });
      return null;
    }
    
    // Fingerprint check
    const fp = makeFingerprint(req);
    if (fp !== session.fingerprint) return null;
    
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Destroy session in MongoDB
 */
export async function destroySession(id: string | undefined) {
  if (!id) return;
  try {
    await Session.deleteOne({ sessionId: id });
  } catch (error) {
    console.error("Error destroying session:", error);
  }
}

/**
 * Find user by ID from MongoDB
 */
export async function findUserById(userId: string): Promise<User | null> {
  try {
    const user = await User.findById(userId);
    if (!user) return null;
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
}

/**
 * Extend Express Request để thêm user property
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Restore user từ cookie - run trước all routes
 */
export async function restoreUserFromCookie(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.cookies.sessionId;
  const session = await getSession(sessionId, req);
  
  if (session) {
    const user = await findUserById(session.userId.toString());
    if (user) {
      req.user = user;
    } else {
      res.clearCookie("sessionId");
    }
  } else if (sessionId) {
    // invalid session: clear cookie
    res.clearCookie("sessionId");
  }
  next();
}

/**
 * Auth middleware - kiểm tra user đã login chưa (for pages)
 * Redirect tới /login nếu chưa có user
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.redirect("/login");
  }
  // Tiếp tục nếu đã login
  next();
}

/**
 * Require auth middleware - kiểm tra user cho API endpoints
 * Trả về 401 JSON nếu chưa authenticate
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
