import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { Account } from "../db/mongodb";
import mongoose from "mongoose";

const router = Router();

/**
 * GET /input-stats - Input daily stats page
 */
router.get("/input-stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const accounts = await Account.find({ userId });

    if (accounts.length === 0) {
      return res.render("input-stats", {
        user: req.user,
        accounts: [],
        message: "No accounts found. Please create an account first.",
      });
    }

    // Map to include _id for form submission
    const accountsData = accounts.map(acc => ({
      _id: acc._id.toString(),
      name: acc.name,
      ltcAddress: acc.ltcAddress,
    }));

    res.render("input-stats", { user: req.user, accounts: accountsData });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.render("input-stats", {
      user: req.user,
      accounts: [],
      message: "Error loading accounts",
    });
  }
});

export default router;
