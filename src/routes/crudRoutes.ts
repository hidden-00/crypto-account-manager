/**
 * CRUD Routes for Account and DailyStats
 * Includes: Create, Read, Update, Delete operations
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { Account, DailyStats, User } from "../db/mongodb";
import mongoose from "mongoose";

const router = Router();

// ==================== ACCOUNT CRUD ====================

/**
 * POST /api/accounts - Create new account
 * Body: { name, ltcAddress }
 */
router.post("/api/accounts", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, ltcAddress } = req.body;

    // Validate inputs
    if (!name || !ltcAddress) {
      return res.status(400).json({
        error: "Missing required fields: name, ltcAddress",
      });
    }

    // Check if account name already exists for this user
    const existingAccount = await Account.findOne({ userId, name });
    if (existingAccount) {
      return res.status(400).json({
        error: "Account with this name already exists",
      });
    }

    // Create new account
    const newAccount = new Account({
      userId: new mongoose.Types.ObjectId(userId),
      name: name.trim(),
      ltcAddress: ltcAddress.trim(),
      createdAt: new Date(),
    });

    await newAccount.save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        _id: newAccount._id.toString(),
        name: newAccount.name,
        ltcAddress: newAccount.ltcAddress,
        createdAt: newAccount.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * PUT /api/accounts/:accountId - Update account
 * Body: { name, ltcAddress }
 */
router.put(
  "/api/accounts/:accountId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const accountId = req.params.accountId;
      const { name, ltcAddress } = req.body;

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
        return res.status(404).json({ error: "Account not found" });
      }

      // Update fields if provided
      if (name) {
        // Check if new name already exists
        const duplicate = await Account.findOne({
          userId,
          name: name.trim(),
          _id: { $ne: accountId },
        });
        if (duplicate) {
          return res.status(400).json({
            error: "Account with this name already exists",
          });
        }
        account.name = name.trim();
      }

      if (ltcAddress) {
        account.ltcAddress = ltcAddress.trim();
      }

      await account.save();

      return res.json({
        success: true,
        message: "Account updated successfully",
        data: {
          _id: account._id.toString(),
          name: account.name,
          ltcAddress: account.ltcAddress,
          createdAt: account.createdAt,
          verifiedAt: account.verifiedAt,
        },
      });
    } catch (error) {
      console.error("Error updating account:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * DELETE /api/accounts/:accountId - Delete account
 */
router.delete(
  "/api/accounts/:accountId",
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
        return res.status(404).json({ error: "Account not found" });
      }

      // Delete associated daily stats
      await DailyStats.deleteMany({ accountId });

      // Delete account
      await Account.deleteOne({ _id: accountId });

      return res.json({
        success: true,
        message: "Account and associated stats deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * PATCH /api/accounts/:accountId/verify - Verify an account
 */
router.patch(
  "/api/accounts/:accountId/verify",
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
        return res.status(404).json({ error: "Account not found" });
      }

      // Check if already verified
      if (account.verifiedAt) {
        return res.status(400).json({
          error: "Account is already verified",
        });
      }

      // Mark as verified
      account.verifiedAt = new Date();
      await account.save();

      return res.json({
        success: true,
        message: "Account verified successfully",
        data: {
          _id: account._id.toString(),
          name: account.name,
          ltcAddress: account.ltcAddress,
          createdAt: account.createdAt,
          verifiedAt: account.verifiedAt,
          isVerified: true,
        },
      });
    } catch (error) {
      console.error("Error verifying account:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * PATCH /api/accounts/:accountId/unverify - Unverify an account
 */
router.patch(
  "/api/accounts/:accountId/unverify",
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
        return res.status(404).json({ error: "Account not found" });
      }

      // Check if verified
      if (!account.verifiedAt) {
        return res.status(400).json({
          error: "Account is not verified",
        });
      }

      // Mark as unverified
      account.verifiedAt = undefined;
      await account.save();

      return res.json({
        success: true,
        message: "Account unverified successfully",
        data: {
          _id: account._id.toString(),
          name: account.name,
          ltcAddress: account.ltcAddress,
          createdAt: account.createdAt,
          verifiedAt: account.verifiedAt,
          isVerified: false,
        },
      });
    } catch (error) {
      console.error("Error unverifying account:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * GET /api/accounts - Get all accounts for authenticated user
 */
router.get("/api/accounts", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all user's accounts
    const accounts = await Account.find({ userId: userId }).sort({
      createdAt: -1,
    });

    // Format response to include _id as string
    const formattedAccounts = accounts.map((account) => ({
      _id: account._id.toString(),
      name: account.name,
      ltcAddress: account.ltcAddress,
      createdAt: account.createdAt,
      verifiedAt: account.verifiedAt,
      isVerified: !!account.verifiedAt,
    }));

    return res.json(formattedAccounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// ==================== DAILY STATS CRUD ====================

/**
 * POST /api/daily-stats - Create new daily stat
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
      _id: accountId,
      userId: userId,
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

    // Check if stat already exists for this date
    const existingStat = await DailyStats.findOne({
      accountId,
      date: statDateNormalized,
    });

    if (existingStat) {
      return res.status(400).json({
        error: "Daily stat already exists for this date",
      });
    }

    // Create new daily stat
    const newStat = new DailyStats({
      accountId: new mongoose.Types.ObjectId(accountId),
      userId: new mongoose.Types.ObjectId(userId),
      date: statDateNormalized,
      earned: earnedNum,
      pending: pendingNum,
      createdAt: new Date(),
    });

    await newStat.save();

    return res.status(201).json({
      success: true,
      message: "Daily stat created successfully",
      data: newStat,
    });
  } catch (error) {
    console.error("Error creating daily stat:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * PUT /api/daily-stats/:statId - Update daily stat
 * Body: { accountId, date, earned, pending }
 */
router.put(
  "/api/daily-stats/:statId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const statId = req.params.statId;
      const { accountId, date, earned, pending } = req.body;

      // Validate MongoDB ObjectId for stat
      if (!mongoose.Types.ObjectId.isValid(statId)) {
        return res.status(400).json({ error: "Invalid stat ID" });
      }

      // Find the stat and verify ownership
      const stat = await DailyStats.findById(statId);

      if (!stat) {
        return res.status(404).json({ error: "Daily stat not found" });
      }

      // Verify user owns the current stat's account
      const currentAccount = await Account.findOne({
        _id: stat.accountId,
        userId: userId,
      });

      if (!currentAccount) {
        return res.status(403).json({ error: "Access denied" });
      }

      // If accountId is being changed, verify user owns the new account
      if (accountId && accountId !== stat.accountId.toString()) {
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
          return res.status(400).json({ error: "Invalid accountId" });
        }

        const newAccount = await Account.findOne({
          _id: accountId,
          userId: userId,
        });

        if (!newAccount) {
          return res.status(403).json({ error: "New account not found or access denied" });
        }

        stat.accountId = new mongoose.Types.ObjectId(accountId);
      }

      // Update date if provided
      if (date) {
        const statDate = new Date(date);
        if (isNaN(statDate.getTime())) {
          return res.status(400).json({ error: "Invalid date format" });
        }
        stat.date = new Date(statDate.toISOString().split("T")[0]);
      }

      // Check if there's a duplicate stat for the same account and date
      // (excluding the current stat being updated)
      const accountIdToCheck = accountId ? new mongoose.Types.ObjectId(accountId) : stat.accountId;
      const dateToCheck = date ? new Date(date).toISOString().split("T")[0] : stat.date.toISOString().split("T")[0];
      
      const duplicateStat = await DailyStats.findOne({
        accountId: accountIdToCheck,
        date: new Date(dateToCheck),
        _id: { $ne: statId }, // Exclude current stat
      });

      if (duplicateStat) {
        return res.status(400).json({
          error: "Daily stat already exists for this account on this date",
        });
      }

      // Update earned and pending
      if (earned !== undefined && pending !== undefined) {
        const earnedNum = parseFloat(String(earned));
        const pendingNum = parseFloat(String(pending));

        if (isNaN(earnedNum) || isNaN(pendingNum)) {
          return res.status(400).json({ error: "Earned and pending must be numbers" });
        }

        stat.earned = earnedNum;
        stat.pending = pendingNum;
      }

      stat.updatedAt = new Date();
      await stat.save();

      return res.json({
        success: true,
        message: "Daily stat updated successfully",
        data: stat,
      });
    } catch (error) {
      console.error("Error updating daily stat:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * DELETE /api/daily-stats/:statId - Delete daily stat
 */
router.delete(
  "/api/daily-stats/:statId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const statId = req.params.statId;

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(statId)) {
        return res.status(400).json({ error: "Invalid stat ID" });
      }

      // Find the stat and verify ownership
      const stat = await DailyStats.findById(statId);

      if (!stat) {
        return res.status(404).json({ error: "Daily stat not found" });
      }

      // Verify user owns this stat's account
      const account = await Account.findOne({
        _id: stat.accountId,
        userId: userId,
      });

      if (!account) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Delete stat
      await DailyStats.deleteOne({ _id: statId });

      return res.json({
        success: true,
        message: "Daily stat deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting daily stat:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * GET /api/daily-stats - Get all daily stats for user (without accountId) or by accountId
 */
router.get(
  "/api/daily-stats",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const accountId = req.query.accountId as string;

      let query: any = { userId };

      if (accountId) {
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

        query.accountId = accountId;
      }

      const stats = await DailyStats.find(query)
        .populate("accountId", "name ltcAddress")
        .sort({ date: -1 });

      return res.json(stats);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

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

      const stats = await DailyStats.find({ accountId })
        .populate("accountId", "name ltcAddress")
        .sort({ date: -1 });
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
