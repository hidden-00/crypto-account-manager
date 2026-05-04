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
  res.render("dashboard-crm", { user: req.user });
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
        deleted: false,
      });

      if (!account) {
        return res.status(404).render("404", { message: "Account not found" });
      }

      res.render("account-details-crm", { user: req.user, account });
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
    const accounts = await Account.find({ userId: userId, deleted: false }).sort({
      createdAt: -1,
    });

    // Convert _id to string for template rendering
    const accountsData = accounts.map((acc) => ({
      id: acc._id.toString(),
      _id: acc._id,
      name: acc.name,
      createdAt: acc.createdAt,
    }));

    res.render("stats-management-crm", { user: req.user, accounts: accountsData });
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
    const accounts = await Account.find({ userId: userId, deleted: false }).sort({
      createdAt: -1,
    });

    // Format accounts data for the form
    const accountsData = accounts.map((acc) => ({
      id: acc._id.toString(),
      name: acc.name,
    }));

    res.render("input-stats-crm", { user: req.user, accounts: accountsData });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).render("404", { message: "Server error" });
  }
});

export default router;
