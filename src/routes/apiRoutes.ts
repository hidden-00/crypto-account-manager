import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { Account, DailyStats } from "../db/mongodb";
import mongoose from "mongoose";

const router = Router();

/**
 * GET /api/account-stats - Lấy daily stats cho 30 ngày gần nhất, kết thúc bằng hôm nay
 */

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

router.get(
  "/api/account-stats",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const today = new Date();
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);

      const dailyTotals: Record<
        string,
        { date: Date; earned: number; pending: number; withdraw: number; total: number }
      > = {};

      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        const key = formatDateKey(cursor);
        dailyTotals[key] = {
          date: new Date(cursor),
          earned: 0,
          pending: 0,
          withdraw: 0,
          total: 0,
        };
        cursor.setDate(cursor.getDate() + 1);
      }

      const stats = await DailyStats.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
        deleted: false,
      }).sort({ date: 1 });

      for (const stat of stats) {
        const dateKey = formatDateKey(stat.date);
        if (!dailyTotals[dateKey]) continue;

        dailyTotals[dateKey].earned += Number(stat.earned || 0);
        dailyTotals[dateKey].pending += Number(stat.pending || 0);
        dailyTotals[dateKey].withdraw += Number(stat.withdraw || 0);
        dailyTotals[dateKey].total += Number(stat.earned || 0) + Number(stat.pending || 0);
      }

      const data = Object.values(dailyTotals).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      return res.json({
        accountsCount: (await Account.countDocuments({ userId, deleted: false })),
        daysCount: data.length,
        data,
      });
    } catch (error) {
      console.error("Error fetching account stats:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * GET /api/accounts - Lấy danh sách accounts của user
 */
router.get(
  "/api/accounts",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const accounts = await Account.find({ userId, deleted: false });

      const accountsWithInfo = accounts.map((acc) => ({
        id: acc._id.toString(),
        name: acc.name,
        createdAt: acc.createdAt,
      }));

      return res.json(accountsWithInfo);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * GET /api/accounts/:accountId - Lấy details của 1 account
 */
router.get(
  "/api/accounts/:accountId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const accountId = req.params.accountId;

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return res.status(404).json({ error: "Account not found" });
      }

      const account = await Account.findOne({
        _id: accountId,
        userId: userId,
        deleted: false,
      });

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      return res.json({
        id: account._id.toString(),
        name: account.name,
        createdAt: account.createdAt,
      });
    } catch (error) {
      console.error("Error fetching account:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
