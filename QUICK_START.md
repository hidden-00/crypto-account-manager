# Quick Start Guide - Crypto Account Management App

## Installation & Setup

### Prerequisites
- Node.js v18+ installed
- MongoDB Atlas account (cloud database configured)
- `.env` file with MONGODB_URI

### Step 1: Install Dependencies
```bash
cd d:/mike
npm install
```

### Step 2: Build TypeScript
```bash
npm run build
```

### Step 3: Start the Server
**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Server will start on http://localhost:3000

## Testing the Application

### Test Accounts
```
Account 1:
  Email: john@example.com
  Password: password123

Account 2:
  Email: jane@example.com
  Password: password456

Account 3:
  Email: bob@example.com
  Password: password789
```

### First Time Login
1. Visit http://localhost:3000
2. Enter test account credentials
3. Click Login
4. Redirected to dashboard with pre-seeded accounts

## Feature Walkthrough

### 1. Dashboard (Main Page)
**URL:** `/dashboard`

**What You Can Do:**
- View all your cryptocurrency accounts
- See account verification status
- Create new account (click "Add Account" button)
- Edit existing account (click "Edit" button)
- Delete account (click "Delete" button)
- View account details (click "View" button)
- See daily stats chart

**Example Flow:**
```
Click "Add Account" 
  → Enter account name: "My Wallet"
  → Enter LTC address: "ltc1abc123..."
  → Click "Submit"
  → Account appears on dashboard
```

### 2. Account Details Page
**URL:** `/accounts/{accountId}`

**What You Can Do:**
- View account information (name, address, verification status)
- See transaction history from BlockCypher
- View transaction details (amount, date, confirmations)
- Navigate back to dashboard

### 3. Input Daily Stats (Quick Form)
**URL:** `/input-stats`

**What You Can Do:**
- Quickly add daily earned/pending amounts
- Select account from dropdown
- Set date for the stat
- Preview total before submitting
- Submit and see success confirmation

**Example Flow:**
```
Select Account: "My Wallet"
Date: (auto-fills today)
Earned: 0.5
Pending: 0.3
Preview shows: Total 0.8 LTC
Click "Submit"
```

### 4. Manage Daily Stats
**URL:** `/stats`

**What You Can Do:**
- View all daily stats in table format
- Filter stats by account using dropdown
- Edit any stat (click "Edit" button)
- Delete any stat (click "Delete" button)
- Create new stat (click "Add Stat" button)

**Table Shows:**
- Account Name
- Date
- Earned Amount (LTC)
- Pending Amount (LTC)
- Total (calculated)

## API Endpoints Reference

### Authentication
```
POST /login
  Body: { email, password }
  Returns: Session cookie

POST /logout
  Returns: Redirects to login
```

### Accounts
```
GET /api/accounts
  Returns: [{ _id, name, ltcAddress, createdAt, ... }]

POST /api/accounts
  Body: { name, ltcAddress }
  Returns: { success, message, data: { _id, name, ... } }

PUT /api/accounts/:accountId
  Body: { name, ltcAddress }
  Returns: { success, message, data: { _id, name, ... } }

DELETE /api/accounts/:accountId
  Returns: { success, message }
```

### Daily Stats
```
GET /api/daily-stats
  Returns: [{ _id, accountId, date, earned, pending, ... }]

GET /api/daily-stats?accountId=:id
  Returns: [filtered stats]

GET /api/daily-stats/:accountId
  Returns: [{ _id, accountId, date, earned, pending, ... }]

POST /api/daily-stats
  Body: { accountId, date, earned, pending }
  Returns: { success, message, data: { _id, ... } }

PUT /api/daily-stats/:statId
  Body: { accountId, date, earned, pending }
  Returns: { success, message, data: { _id, ... } }

DELETE /api/daily-stats/:statId
  Returns: { success, message }
```

### Stats Data
```
GET /api/account-stats
  Returns: { accountData: [...], totalEarned, totalPending }

GET /api/accounts/:accountId
  Returns: { account details with verification info }

GET /api/accounts/:accountId/transactions
  Returns: [BlockCypher transaction data]
```

## Database Structure

### Collections

**users**
```
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed with bcrypt),
  name: string,
  role: string,
  createdAt: Date
}
```

**accounts**
```
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  name: string,
  ltcAddress: string,
  createdAt: Date,
  verifiedAt: Date (nullable)
}
```

**dailystats**
```
{
  _id: ObjectId,
  accountId: ObjectId (ref: accounts),
  userId: ObjectId (ref: users),
  date: Date,
  earned: number (decimal),
  pending: number (decimal),
  createdAt: Date,
  updatedAt: Date
}
```

**sessions**
```
{
  _id: ObjectId,
  sessionId: string,
  userId: ObjectId,
  fingerprint: string (hash of user-agent + IP),
  userAgent: string,
  ipAddress: string,
  expiresAt: Date (TTL index for auto-cleanup)
}
```

## Common Tasks

### Create a New Account
1. Go to Dashboard (/dashboard)
2. Click green "Add Account" button
3. Fill in form:
   - Account Name: e.g., "Mining Pool 1"
   - LTC Address: e.g., "ltc1abc123..."
4. Click "Submit"
5. Success message appears, account added to dashboard

### Add Daily Stats
**Option 1: Quick Form (/input-stats)**
1. Go to Input Stats page
2. Select account
3. Select date (or use today)
4. Enter Earned amount
5. Enter Pending amount
6. Click "Submit"

**Option 2: Manage Stats Page (/stats)**
1. Go to Manage Stats page
2. Click "Add Stat" button
3. Fill form in modal
4. Click "Save"

### View Account Transactions
1. Go to Dashboard
2. Click "View" button on account card
3. See transaction list from BlockCypher
4. Each row shows: TX ID, Date, Direction, Amount, Confirmations, Status

### Edit a Stat
1. Go to Manage Stats (/stats)
2. Find stat in table
3. Click "Edit" button
4. Modal appears with pre-filled values
5. Modify fields
6. Click "Save"
7. Table updates

### Delete a Stat
1. Go to Manage Stats (/stats)
2. Find stat in table
3. Click "Delete" button
4. Confirmation dialog appears
5. Click "OK" to confirm
6. Stat removed from table

### Delete an Account
⚠️ **Warning: This also deletes all associated stats!**
1. Go to Dashboard
2. Find account card
3. Click "Delete" button
4. Confirmation dialog appears
5. Click "OK" to confirm
6. Account and all stats removed

### Filter Stats by Account
1. Go to Manage Stats (/stats)
2. Use dropdown: "Filter by Account"
3. Select an account or "All Accounts"
4. Table updates immediately with filtered results

## Troubleshooting

### Blank Dashboard After Login
- Check browser console for errors (F12)
- Make sure MongoDB is connected
- Check that /api/accounts endpoint returns data

### Stats Won't Load
- Verify you've created at least one account first
- Check that daily stats exist for that account
- Try refresh page (Ctrl+R)

### Edit/Delete Not Working
- Make sure you're logged in
- Check browser console for errors
- Verify API response is successful

### Account Creation Fails
- Check account name doesn't already exist
- Make sure LTC address is entered
- Check MongoDB connection status

### Session Expires
- Default session: 24 hours
- Just login again
- Your data is safely stored

## Development Tips

### Console Logging
Add to JavaScript to debug:
```javascript
console.log('Debug info:', variable);
```

View console: Press F12 in browser → Console tab

### View HTTP Requests
In browser DevTools:
- Press F12
- Go to "Network" tab
- Refresh page or perform action
- See all API calls and responses

### MongoDB Queries
Test queries in MongoDB Atlas:
- Go to https://cloud.mongodb.com
- Navigate to your cluster
- Use MongoDB shell or web UI

### Modify Styles
All CSS is inline in each EJS file:
```html
<style>
  /* Edit colors, sizes, etc here */
</style>
```

## File Structure Overview

```
d:/mike/
├── src/
│   ├── index.ts                 (Server entry point)
│   ├── db/
│   │   ├── mongodb.ts          (Database connection & schemas)
│   │   └── seed.ts             (Initial data setup)
│   ├── middleware/
│   │   └── auth.ts             (Authentication logic)
│   └── routes/
│       ├── authRoutes.ts       (Login/logout)
│       ├── pageRoutes.ts       (Page rendering)
│       ├── apiRoutes.ts        (Data endpoints)
│       └── crudRoutes.ts       (CRUD operations)
├── views/
│   ├── login.ejs               (Login page)
│   ├── dashboard.ejs           (Main dashboard)
│   ├── account-details.ejs     (Account view)
│   ├── input-stats.ejs         (Quick input form)
│   └── stats-management.ejs    (Stat management)
├── public/                      (Static files)
├── dist/                        (Compiled JavaScript)
├── package.json                 (Dependencies)
├── .env                         (Environment config)
└── tsconfig.json               (TypeScript config)
```

## Next Steps After Setup

1. ✅ Login with test account
2. ✅ Create a new account
3. ✅ Add daily stats for that account
4. ✅ View account details and transactions
5. ✅ Edit and delete stats
6. ✅ Try filtering stats by account
7. ✅ Explore all pages via navigation menu
8. ✅ Review your data in MongoDB Atlas

## Support & Issues

### Where to Check for Errors
1. Browser Console (F12 → Console tab)
2. Terminal where server is running
3. MongoDB Atlas logs
4. Network requests (F12 → Network tab)

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot GET /api/accounts" | API not loaded | Restart server |
| "Account not found" | Wrong account ID | Verify account exists |
| "Invalid objectId" | Malformed ID | Check database |
| "MongoDB connection failed" | DB not running | Check MONGODB_URI in .env |
| "Duplicate key error" | Same account name | Use unique name |

---

**Ready to test?** 
```bash
npm run dev
# Open browser to http://localhost:3000
# Login with john@example.com / password123
```

Happy tracking! 🚀
