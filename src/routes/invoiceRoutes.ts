/**
 * Invoice Management Routes
 * Includes: Create, Read, Update, Delete, Mark as Paid
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { Invoice } from "../db/mongodb";
import mongoose from "mongoose";

const router = Router();

/**
 * GET /api/invoices - Get all invoices for current user with optional filters
 * Query: ?status=unpaid&month=2&year=2026
 */
router.get("/api/invoices", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, month, year } = req.query;

    // Build filter
    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (status && ["unpaid", "paid", "overdue"].includes(status as string)) {
      filter.status = status;
    }

    // Filter by month and year if provided
    if (month && year) {
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);

      if (monthNum >= 1 && monthNum <= 12 && yearNum > 0) {
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        filter.dueDate = {
          $gte: startDate,
          $lte: endDate,
        };
      }
    }

    const invoices = await Invoice.find(filter).sort({ dueDate: -1 });

    return res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

/**
 * POST /api/invoices - Create new invoice
 * Body: { name, amount, dueDate, description, category }
 */
router.post("/api/invoices", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, amount, dueDate, description, category } = req.body;

    // Validate inputs
    if (!name || amount === undefined || !dueDate || !category) {
      return res.status(400).json({
        error: "Missing required fields: name, amount, dueDate, category",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const validCategories = ["electricity", "water", "rent", "internet", "other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    // Determine status
    const dueDate_obj = new Date(dueDate);
    const now = new Date();
    const status = dueDate_obj < now ? "overdue" : "unpaid";

    // Create new invoice
    const newInvoice = new Invoice({
      userId: new mongoose.Types.ObjectId(userId),
      name: name.trim(),
      amount: parseFloat(amount),
      dueDate: dueDate_obj,
      description: description?.trim() || "",
      category,
      status,
      createdAt: new Date(),
    });

    await newInvoice.save();

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: newInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({ error: "Failed to create invoice" });
  }
});

/**
 * PUT /api/invoices/:id - Update invoice
 * Body: { name, amount, dueDate, description, category }
 */
router.put("/api/invoices/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const invoiceId = req.params.id;
    const { name, amount, dueDate, description, category } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ error: "Invalid invoice ID" });
    }

    // Find invoice and check ownership
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Validate inputs if provided
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    if (category) {
      const validCategories = ["electricity", "water", "rent", "internet", "other"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
    }

    // Update fields
    if (name) invoice.name = name.trim();
    if (amount) invoice.amount = parseFloat(amount);
    if (dueDate) {
      const dueDate_obj = new Date(dueDate);
      invoice.dueDate = dueDate_obj;

      // Update status if date changed and invoice is not paid
      if (invoice.status !== "paid") {
        const now = new Date();
        invoice.status = dueDate_obj < now ? "overdue" : "unpaid";
      }
    }
    if (description) invoice.description = description.trim();
    if (category) invoice.category = category;

    invoice.updatedAt = new Date();
    await invoice.save();

    return res.json({
      success: true,
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).json({ error: "Failed to update invoice" });
  }
});

/**
 * DELETE /api/invoices/:id - Delete invoice
 */
router.delete(
  "/api/invoices/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const invoiceId = req.params.id;

      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        return res.status(400).json({ error: "Invalid invoice ID" });
      }

      // Find and delete invoice
      const invoice = await Invoice.findOneAndDelete({
        _id: invoiceId,
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      return res.json({
        success: true,
        message: "Invoice deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      return res.status(500).json({ error: "Failed to delete invoice" });
    }
  }
);

/**
 * PATCH /api/invoices/:id/pay - Mark invoice as paid
 */
router.patch(
  "/api/invoices/:id/pay",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const invoiceId = req.params.id;

      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        return res.status(400).json({ error: "Invalid invoice ID" });
      }

      // Find invoice
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Mark as paid
      invoice.status = "paid";
      invoice.paidDate = new Date();
      invoice.updatedAt = new Date();
      await invoice.save();

      return res.json({
        success: true,
        message: "Invoice marked as paid",
        invoice,
      });
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      return res.status(500).json({ error: "Failed to mark invoice as paid" });
    }
  }
);

/**
 * GET /api/invoices/stats/summary - Get invoice summary stats
 * Returns: total unpaid, total paid, total overdue, total amount
 */
router.get(
  "/api/invoices/stats/summary",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const invoices = await Invoice.find({
        userId: new mongoose.Types.ObjectId(userId),
      });

      const stats = {
        totalUnpaid: invoices
          .filter((inv) => inv.status === "unpaid")
          .reduce((sum, inv) => sum + inv.amount, 0),
        totalPaid: invoices
          .filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + inv.amount, 0),
        totalOverdue: invoices
          .filter((inv) => inv.status === "overdue")
          .reduce((sum, inv) => sum + inv.amount, 0),
        totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
        countUnpaid: invoices.filter((inv) => inv.status === "unpaid").length,
        countPaid: invoices.filter((inv) => inv.status === "paid").length,
        countOverdue: invoices.filter((inv) => inv.status === "overdue").length,
      };

      return res.json(stats);
    } catch (error) {
      console.error("Error fetching invoice stats:", error);
      return res.status(500).json({ error: "Failed to fetch invoice stats" });
    }
  }
);

export default router;
