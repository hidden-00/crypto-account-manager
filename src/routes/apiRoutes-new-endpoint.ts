/**
 * POST /api/daily-stats - Create or update daily stat for account
 * Body: { accountId, date, earned, pending }
 */
import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { Account, DailyStats } from "../db/mongodb";
import mongoose from "mongoose";

const router = Router();

/**
 * POST /api/daily-stats - Create or update daily stat for account
 * Body: { accountId, date, earned, pending }
 */
router.post("/api/daily-stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { accountId, date, earned, pending } = req.body;

    // Validate inputs
    if (!accountId || !date || earned === undefined || pending === undefined) {
      return res.status(400).json({
        error: "Missing required fields: accountId, date, earned, pending",
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ error: "Invalid accountId" });
    }

    // Check user owns this account
    const account = await Account.findOne({
      _id: new mongoose.Types.ObjectId(accountId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!account) {
      return res.status(403).json({ error: "Account not found or access denied" });
    }

    // Parse and validate date
    const statDate = new Date(date);
    if (isNaN(statDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Validate earned/pending are numbers
    const earnedNum = parseFloat(String(earned));
    const pendingNum = parseFloat(String(pending));

    if (isNaN(earnedNum) || isNaN(pendingNum)) {
      return res.status(400).json({ error: "Earned and pending must be numbers" });
    }

    // Normalize date to midnight UTC
    const statDateNormalized = new Date(statDate.toISOString().split("T")[0]);

    // Upsert daily stat in MongoDB
    const result = await DailyStats.findOneAndUpdate(
      {
        accountId: accountId,
        date: statDateNormalized,
      },
      {
        $set: {
          earned: earnedNum,
          pending: pendingNum,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: "Stat upserted",
      data: result,
    });
  } catch (error) {
    console.error("Error upserting daily stat:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/daily-stats/:accountId - Get all daily stats for account
 */
router.get(
  "/api/daily-stats/:accountId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const accountId = req.params.accountId;

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return res.status(400).json({ error: "Invalid accountId" });
      }

      // Check user owns this account
      const account = await Account.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!account) {
        return res.status(403).json({ error: "Account not found or access denied" });
      }

      const stats = await DailyStats.find({ accountId }).sort({ date: -1 });
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
