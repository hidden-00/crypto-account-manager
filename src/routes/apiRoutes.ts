import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { Account, DailyStats } from "../db/mongodb";
import mongoose from "mongoose";

const router = Router();

/**
 * GET /api/account-stats - Lấy daily stats với aggregation
 * Query params: startDate, endDate (ISO format: 2025-01-01)
 */

function subtractOneDay(date: Date): Date {
  const d = new Date(date); // clone, tránh mutate
  d.setDate(d.getDate() - 1);
  return d;
}

router.get(
  "/api/account-stats",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // Lấy query params
      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;

      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let previousDate: Date | undefined;

      if (startDateStr) {
        startDate = new Date(startDateStr);
        previousDate = subtractOneDay(startDate);
        startDate = previousDate; // bắt đầu từ ngày trước đó để tính diff
      }
      if (endDateStr) {
        endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999); // include entire day
      }

      // Lấy accounts của user từ MongoDB với soft-delete
      const accounts = await Account.find({ userId, deleted: false });
      const accountIds = accounts.map((acc) => acc._id.toString());

      // Tính tổng earned + pending từng ngày
      const dailyTotals: Record<
        string,
        { date: Date; earned: number; pending: number; total: number }
      > = {};

      for (const accountId of accountIds) {
        // Query daily stats from MongoDB
        const query: any = { accountId };
        if (startDate) query.date = { ...query.date, $gte: startDate };
        if (endDate) query.date = { ...query.date, $lte: endDate };

        const stats = await DailyStats.find({ ...query, deleted: false });

        for (const stat of stats) {
          const dateKey = stat.date.toISOString().split("T")[0];

          if (!dailyTotals[dateKey]) {
            dailyTotals[dateKey] = {
              date: stat.date,
              earned: 0,
              pending: 0,
              total: 0,
            };
          }

          dailyTotals[dateKey].earned += stat.earned;
          dailyTotals[dateKey].pending += stat.pending;
          dailyTotals[dateKey].total += stat.earned + stat.pending;
        }
      }

      // Convert to array và sort by date
      const data = Object.values(dailyTotals).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      return res.json({
        accountsCount: accounts.length,
        daysCount: data.length,
        data: data,
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
