import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { Account, DailyStats } from "../db/mongodb";
import mongoose from "mongoose";

const router = Router();

/**
 * GET / - homepage
 */
router.get("/", (req: Request, res: Response) => {
  if (req.user) {
    return res.redirect("/dashboard");
  }
  res.redirect("/login");
});

/**
 * GET /dashboard - dashboard page (requires auth)
 */
router.get("/dashboard", authMiddleware, (req: Request, res: Response) => {
  res.render("dashboard", { user: req.user });
});

/**
 * GET /accounts/:accountId - account details page (requires auth)
 */
router.get(
  "/accounts/:accountId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const accountId = req.params.accountId;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(404).render("404", { message: "Account not found" });
    }

    try {
      // Check user owns this account
      const account = await Account.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!account) {
        return res.status(404).render("404", { message: "Account not found" });
      }

      res.render("account-details", { user: req.user, account });
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).render("404", { message: "Server error" });
    }
  }
);

/**
 * GET /stats - manage daily stats page (requires auth)
 */
router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    // Get all user's accounts
    const accounts = await Account.find({ userId: userId }).sort({
      createdAt: -1,
    });

    res.render("stats-management", { user: req.user, accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).render("404", { message: "Server error" });
  }
});

/**
 * GET /input-stats - quick input stats page (requires auth)
 */
router.get("/input-stats", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    // Get all user's accounts
    const accounts = await Account.find({ userId: userId }).sort({
      createdAt: -1,
    });

    // Format accounts data for the form
    const accountsData = accounts.map((acc) => ({
      id: acc._id.toString(),
      name: acc.name,
      ltcAddress: acc.ltcAddress,
    }));

    res.render("input-stats", { user: req.user, accounts: accountsData });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).render("404", { message: "Server error" });
  }
});

export default router;
