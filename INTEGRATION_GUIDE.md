## Integration Guide

### 1. Update `src/routes/pageRoutes.ts`
Add this route before the export statement:

```typescript
/**
 * GET /input-stats - Input daily stats page
 */
router.get("/input-stats", authMiddleware, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const accounts = getAccountsByUserId(userId);

  if (accounts.length === 0) {
    return res.render("input-stats", {
      user: req.user,
      accounts: [],
      message: "No accounts found. Please create an account first.",
    });
  }

  res.render("input-stats", { user: req.user, accounts });
});
```

### 2. Update `src/routes/apiRoutes.ts`
Add these endpoints before the export statement:

```typescript
/**
 * POST /api/daily-stats - Create or update daily stat for account
 * Body: { accountId, date, earned, pending }
 */
router.post("/api/daily-stats", requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { accountId, date, earned, pending } = req.body;

  // Validate inputs
  if (!accountId || !date || earned === undefined || pending === undefined) {
    return res.status(400).json({
      error: "Missing required fields: accountId, date, earned, pending",
    });
  }

  // Check user owns this account
  const userAccounts = getAccountsByUserId(userId);
  const account = userAccounts.find((a) => a.id === accountId);

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

  // Normalize date to YYYY-MM-DD
  const statDateNormalized = new Date(statDate.toISOString().split("T")[0]);
  
  // Find existing
  const existingIdx = mockDailyStats.findIndex(
    (s) =>
      s.accountId === accountId &&
      s.date.toISOString().split("T")[0] ===
        statDateNormalized.toISOString().split("T")[0]
  );

  let result;
  if (existingIdx >= 0) {
    // Update
    mockDailyStats[existingIdx].earned = earnedNum;
    mockDailyStats[existingIdx].pending = pendingNum;
    result = mockDailyStats[existingIdx];
  } else {
    // Create
    const newStat = {
      id: Math.max(...mockDailyStats.map((s) => s.id), 0) + 1,
      accountId,
      date: statDateNormalized,
      earned: earnedNum,
      pending: pendingNum,
    };
    mockDailyStats.push(newStat);
    result = newStat;
  }

  return res.json({
    success: true,
    message: existingIdx >= 0 ? "Stat updated" : "Stat created",
    data: result,
  });
});

/**
 * GET /api/daily-stats/:accountId - Get all daily stats for account
 */
router.get(
  "/api/daily-stats/:accountId",
  requireAuth,
  (req: Request, res: Response) => {
    const userId = req.user!.id;
    const accountId = parseInt(req.params.accountId);

    // Check user owns this account
    const userAccounts = getAccountsByUserId(userId);
    const account = userAccounts.find((a) => a.id === accountId);

    if (!account) {
      return res.status(403).json({ error: "Account not found or access denied" });
    }

    const stats = getDailyStats(accountId);
    return res.json(stats);
  }
);
```

### 3. Add import in `src/routes/apiRoutes.ts` (at the top):
```typescript
import { mockDailyStats } from "../db/accountDb";
```

### 4. Files Created:
- `src/db/schema.ts` - MongoDB-ready schema design
- `views/input-stats.ejs` - Input page with account/date selectors

### 5. Usage:
- Navigate to `/input-stats` to input daily stats
- Select account (dropdown) and date (date picker)
- Enter earned and pending amounts
- Click Submit to save

### 6. For MongoDB Migration:
The schema in `src/db/schema.ts` includes MongoDB index recommendations.
When ready to migrate:
1. Replace mockDb functions with MongoDB queries
2. Use `_id` instead of `id` for MongoDB ObjectId
3. Create collections for users, accounts, sessions, daily_stats
4. Apply the recommended indexes
