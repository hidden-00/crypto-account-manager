import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { Account, DailyStats } from "../db/mongodb";
import mongoose from "mongoose";

const router = Router();

/**
 * In-memory cache cho prices
 * Format: { "key": { price: 123456, timestamp: Date } }
 */
const priceCache: Record<
  string,
  { price: number | null; timestamp: number }
> = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Lấy tỷ giá LTCUSDT từ Binance klines (lịch sử)
 * Trả về giá closing tại ngày được yêu cầu
 */
async function getLTCUSDTPrice(date: Date): Promise<number | null> {
  try {
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const cacheKey = `ltcusdt-${dateStr}`;

    // Check cache
    if (priceCache[cacheKey]) {
      const cached = priceCache[cacheKey];
      const now = Date.now();
      if (now - cached.timestamp < CACHE_DURATION) {
        return cached.price;
      }
    }

    // Tính timestamp cho ngày hôm đó (00:00 UTC)
    const startTime = new Date(date);
    startTime.setUTCHours(0, 0, 0, 0);
    const startTimeMs = startTime.getTime();

    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=LTCUSDT&interval=1d&startTime=${startTimeMs}&limit=1`
    );

    if (!response.ok) {
      priceCache[cacheKey] = { price: null, timestamp: Date.now() };
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      priceCache[cacheKey] = { price: null, timestamp: Date.now() };
      return null;
    }

    // data[4] là closing price
    const closePrice = parseFloat(data[0][4]);

    priceCache[cacheKey] = { price: closePrice, timestamp: Date.now() };
    // console.log(`Cached LTCUSDT price for ${dateStr}: ${closePrice}`);
    return closePrice;
  } catch (error) {
    console.error("Error fetching LTC/USDT from Binance:", error);
    return null;
  }
}

/**
 * GET /api/account-stats - Lấy daily stats với aggregation
 * Query params: startDate, endDate (ISO format: 2025-01-01)
 */
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

      if (startDateStr) {
        startDate = new Date(startDateStr);
      }
      if (endDateStr) {
        endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999); // include entire day
      }

      // Lấy accounts của user từ MongoDB
      const accounts = await Account.find({ userId });
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

        const stats = await DailyStats.find(query);

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

      const accounts = await Account.find({ userId });

      // Map với verification info
      const accountsWithInfo = accounts.map((acc) => ({
        id: acc._id.toString(),
        name: acc.name,
        ltcAddress: acc.ltcAddress,
        createdAt: acc.createdAt,
        verifiedAt: acc.verifiedAt,
        isVerified: acc.verifiedAt !== undefined && acc.verifiedAt !== null,
        verificationDays: acc.verifiedAt
          ? Math.floor(
              (Date.now() - acc.verifiedAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null,
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
      });

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      const verificationDays = account.verifiedAt
        ? Math.floor(
            (Date.now() - account.verifiedAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      return res.json({
        id: account._id.toString(),
        name: account.name,
        ltcAddress: account.ltcAddress,
        createdAt: account.createdAt,
        verifiedAt: account.verifiedAt,
        isVerified: account.verifiedAt !== undefined && account.verifiedAt !== null,
        verificationDays: verificationDays,
        verificationInfo:
          verificationDays !== null
            ? `Verified in ${verificationDays} day(s)`
            : "Pending verification",
      });
    } catch (error) {
      console.error("Error fetching account:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * GET /api/accounts/:accountId/transactions - Lấy transaction history từ BlockCypher
 */
router.get(
  "/api/accounts/:accountId/transactions",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const accountId = req.params.accountId;

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Verify user owns this account
      const account = await Account.findOne({
        _id: accountId,
        userId: userId,
      });

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Call BlockCypher API
      const ltcAddress = account.ltcAddress;
      const blockcypherUrl = `https://api.blockcypher.com/v1/ltc/main/addrs/${ltcAddress}?txlimit=100&includetx=true`;

      const response = await fetch(blockcypherUrl);

      if (!response.ok) {
        return res.status(response.status).json({
          error: "Failed to fetch from BlockCypher",
          details: await response.text(),
        });
      }

      const data = await response.json();

      // Extract transactions
      const transactionsData = (data.txrefs || []).map((tx: any) => {
        const amountLTC = tx.value / 1e8;

        return {
          txid: tx.tx_hash,
          confirmed: tx.confirmed,
          value: tx.value,
          confirmations: tx.confirmations,
          blockHeight: tx.block_height,
          doublespend: tx.double_spend,
          direction: tx.tx_input_n === -1 ? "received" : "sent",
          amountLTC: amountLTC,
        };
      });

      return res.json({
        address: ltcAddress,
        totalReceived: data.total_received || 0,
        totalSent: data.total_sent || 0,
        balance: data.balance || 0,
        finalBalance: data.final_balance || 0,
        txCount: data.n_tx || 0,
        unconfirmedTxCount: data.unconfirmed_n_tx || 0,
        transactions: transactionsData,
      });
    } catch (error: any) {
      console.error("BlockCypher API error:", error);
      return res.status(500).json({
        error: "Server error",
        message: error.message,
      });
    }
  }
);
export default router;
