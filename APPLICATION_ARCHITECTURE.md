# Complete Application Architecture & User Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE (Browser)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Views (EJS Templates):                                          │
│  ├── login.ejs              (Authentication)                    │
│  ├── dashboard.ejs          (Account Management)                │
│  ├── account-details.ejs    (Account Transactions)              │
│  ├── input-stats.ejs        (Quick Stat Input)                  │
│  └── stats-management.ejs   (Stat Management Hub)               │
│                                                                   │
│  JavaScript CRUD Functions:                                      │
│  ├── Account Operations (Create, Read, Update, Delete)          │
│  └── Daily Stats Operations (Create, Read, Update, Delete)      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
              ↓                        ↑
         HTTP Requests           JSON Responses
              ↓                        ↑
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER (TypeScript)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Middleware:                                                      │
│  ├── cookieParser()         (Parse cookies)                     │
│  ├── express.json()         (Parse JSON)                        │
│  ├── restoreUserFromCookie  (Session authentication)            │
│  └── authMiddleware         (Page-level protection)             │
│  └── requireAuth            (API-level protection)              │
│                                                                   │
│  Routes:                                                          │
│  ├── authRoutes.ts          (/login, /logout)                   │
│  ├── pageRoutes.ts          (/, /dashboard, /accounts, /stats)  │
│  ├── apiRoutes.ts           (/api/accounts, /api/account-stats) │
│  └── crudRoutes.ts          (Full CRUD for accounts & stats)    │
│                                                                   │
│  Session Management:                                              │
│  ├── createSession()        (Create fingerprinted session)      │
│  ├── getSession()           (Validate and retrieve session)     │
│  └── destroySession()       (Remove session on logout)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
              ↓                        ↑
    MongoDB Queries           Database Results
              ↓                        ↑
┌─────────────────────────────────────────────────────────────────┐
│                    MONGODB ATLAS CLOUD DATABASE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Collections:                                                     │
│  ├── users                  (Email, hashed password, name, role) │
│  ├── accounts               (User's crypto accounts)             │
│  ├── dailystats             (Daily earned/pending tracking)      │
│  └── sessions               (Active user sessions)               │
│                                                                   │
│  Indexes:                                                         │
│  ├── TTL on sessions        (Auto-cleanup expired sessions)      │
│  ├── Unique email on users  (Prevent duplicate emails)          │
│  ├── Compound on dailystats ((accountId, date) unique)          │
│  └── userId foreign keys    (Fast user lookups)                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## User Authentication Flow

```
┌─────────────────────────────────────────┐
│     User Visits /login (Not Logged In)   │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│    login.ejs Form Rendered               │
│  [Email Input] [Password Input] [Submit] │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│   POST /login                            │
│   - Extract email & password             │
│   - Query MongoDB for user               │
│   - bcrypt.compare(password, hashed)     │
└─────────────────────────────────────────┘
         ↓ (Success)
┌─────────────────────────────────────────┐
│   createSession()                        │
│   - Generate sessionId                   │
│   - Hash user-agent + IP (fingerprint)   │
│   - Save to MongoDB sessions collection  │
│   - Set httpOnly cookie                  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│   Redirect to /dashboard                 │
│   Cookie: sessionId={encrypted_id}       │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  restoreUserFromCookie Middleware        │
│  - Read sessionId from cookie            │
│  - Call getSession(sessionId)            │
│  - Validate fingerprint                  │
│  - Check TTL expiration                  │
│  - Attach user to req.user               │
└─────────────────────────────────────────┘
         ↓ (User Restored)
┌─────────────────────────────────────────┐
│   GET /dashboard                         │
│   dashboard.ejs rendered with req.user   │
└─────────────────────────────────────────┘
```

## Account Management Flow

```
┌────────────────────────────────────────────────────────┐
│           Dashboard - View All Accounts                 │
├────────────────────────────────────────────────────────┤
│                                                         │
│   [Add Account] Button                                  │
│                                                         │
│   Account Cards:                                        │
│   ┌─────────────────────┐  ┌──────────────────────┐   │
│   │ My Wallet 1         │  │ My Wallet 2          │   │
│   │ ltc1abc123...       │  │ ltc1def456...        │   │
│   │ [View][Edit][Delete]│  │ [View][Edit][Delete] │   │
│   └─────────────────────┘  └──────────────────────┘   │
└────────────────────────────────────────────────────────┘

USER ACTIONS:
├─ Click "Add Account"
│  └─ openAccountModal() → Modal appears
│     ├─ Enter: Account Name
│     ├─ Enter: LTC Address
│     └─ Submit Button
│        └─ POST /api/accounts
│           └─ MongoDB: Insert new Account
│           └─ Response: Success message
│           └─ displayAccounts() refreshes list
│
├─ Click "View"
│  └─ viewAccount(accountId)
│     └─ Navigate to /accounts/{accountId}
│        └─ account-details.ejs loads
│           └─ Displays transactions from BlockCypher
│
├─ Click "Edit"
│  └─ editAccount(id, name, address)
│     └─ Pre-fill modal with current values
│     └─ Modal appears
│        └─ User modifies fields
│        └─ Submit Button
│           └─ PUT /api/accounts/{accountId}
│              └─ MongoDB: Update Account
│              └─ Response: Success message
│              └─ displayAccounts() refreshes list
│
└─ Click "Delete"
   └─ deleteAccount(id, name)
      └─ Show browser confirm dialog
         ├─ If OK:
         │  └─ DELETE /api/accounts/{accountId}
         │     └─ MongoDB: Delete Account
         │     └─ MongoDB: Cascade delete associated DailyStats
         │     └─ Response: Success message
         │     └─ displayAccounts() refreshes list
         │
         └─ If Cancel:
            └─ No action taken
```

## Daily Stats Management Flow

```
┌────────────────────────────────────────────────────────┐
│         Manage Daily Stats - Table View                 │
├────────────────────────────────────────────────────────┤
│                                                         │
│   [Add Stat] Button                                     │
│                                                         │
│   Filter by Account: [Dropdown]                         │
│                                                         │
│   Stats Table:                                          │
│   ┌──────────────────────────────────────────────────┐ │
│   │ Account | Date      | Earned | Pending | Total   │ │
│   ├──────────────────────────────────────────────────┤ │
│   │ Wallet1 | Jan 15    | 0.5    | 0.3     | 0.8    │ │
│   │ [Edit] [Delete]                                 │ │
│   │ Wallet2 | Jan 14    | 0.25   | 0.1     | 0.35   │ │
│   │ [Edit] [Delete]                                 │ │
│   └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘

USER ACTIONS:
├─ Click "Add Stat"
│  └─ openStatModal() → Modal appears
│     ├─ Select: Account (dropdown)
│     ├─ Select: Date (date picker)
│     ├─ Enter: Earned Amount (LTC)
│     ├─ Enter: Pending Amount (LTC)
│     └─ Submit Button
│        └─ POST /api/daily-stats
│           └─ MongoDB: Insert new DailyStats
│           └─ Response: Success message
│           └─ loadStats() refreshes table
│
├─ Click Account Filter Dropdown
│  └─ accountFilter.addEventListener('change')
│     └─ loadStats(accountId)
│        └─ GET /api/daily-stats/{accountId}
│           └─ MongoDB: Query DailyStats by account
│           └─ Table updates with filtered results
│
├─ Click "Edit" on stat row
│  └─ editStat(id, accountId, date, earned, pending)
│     └─ Pre-fill modal with current values
│     └─ Modal appears
│        └─ User modifies fields
│        └─ Submit Button
│           └─ PUT /api/daily-stats/{statId}
│              └─ MongoDB: Update DailyStats
│              └─ Response: Success message
│              └─ loadStats() refreshes table
│
└─ Click "Delete" on stat row
   └─ deleteStat(id)
      └─ Show browser confirm dialog
         ├─ If OK:
         │  └─ DELETE /api/daily-stats/{statId}
         │     └─ MongoDB: Delete DailyStats document
         │     └─ Response: Success message
         │     └─ loadStats() refreshes table
         │
         └─ If Cancel:
            └─ No action taken
```

## Quick Input Stats Flow

```
┌──────────────────────────────────────┐
│     Input Daily Stats Form            │
├──────────────────────────────────────┤
│                                       │
│ Select Account:  [Dropdown ▼]        │
│ Select Date:     [Date Picker]       │
│ Earned (LTC):    [0.00000000]        │
│ Pending (LTC):   [0.00000000]        │
│                                       │
│ Preview:                              │
│ ├─ Total: 0.00000000 LTC             │
│ ├─ Account: My Wallet                │
│ └─ Date: 2024-01-15                  │
│                                       │
│ [Submit] [Clear]                      │
└──────────────────────────────────────┘

FORM SUBMISSION:
1. User fills all fields
2. Click "Submit"
3. JavaScript validates:
   ├─ Account selected
   ├─ Date selected
   ├─ Earned is valid number
   └─ Pending is valid number
4. POST /api/daily-stats
   └─ MongoDB: Insert DailyStats
      ├─ Check for duplicate (accountId, date)
      ├─ If exists: Update instead
      └─ If new: Create record
5. Success message appears
6. Form resets
7. Redirect to /stats (optional)

QUICK INPUT USE CASE:
- User has multiple accounts
- Wants to quickly add daily stats
- Needs minimal form fields
- Doesn't need to see all stats at once
- Perfect for daily routine data entry
```

## Account Verification Status

```
Account States:
├─ Unverified (New accounts)
│  └─ Show "⏳ Pending" badge
│  └─ verifiedAt: null
│
└─ Verified (Confirmed on blockchain)
   └─ Show "✓ Verified" badge
   └─ verifiedAt: timestamp
```

## Data Relationships

```
User (1)
  ↓
  ├──→ Many Accounts
  │       ↓
  │       └──→ Many DailyStats
  │
  └──→ One Session (at a time)
        ├─ sessionId
        ├─ fingerprint (user-agent + IP)
        ├─ expiresAt (24 hours from creation)
        └─ Auto-deleted when expired


Account (1)
  ↓
  ├─ userId (reference to User)
  ├─ name (Account Name)
  ├─ ltcAddress (Litecoin Address)
  ├─ createdAt
  ├─ verifiedAt (nullable)
  └─ Many DailyStats

DailyStats (Many)
  ├─ accountId (reference to Account)
  ├─ userId (reference to User)
  ├─ date (YYYY-MM-DD)
  ├─ earned (decimal)
  ├─ pending (decimal)
  ├─ createdAt
  └─ updatedAt

Constraints:
├─ User.email is UNIQUE
├─ Account.name is UNIQUE per User
├─ (DailyStats.accountId, DailyStats.date) is UNIQUE
└─ Deleting Account cascades to delete all associated DailyStats
```

## Error Handling Strategy

```
Client-Side Errors:
├─ Form validation errors
│  └─ Display alert before submission
│
├─ Network errors
│  └─ Display error message from catch block
│
└─ API validation errors (400)
   └─ Display error message from API response

Server-Side Errors:
├─ Missing required fields (400)
│  └─ Return JSON error message
│
├─ Duplicate entries (400)
│  └─ Return JSON error message
│  └─ Example: "Account with this name already exists"
│
├─ Not found / access denied (403/404)
│  └─ Return JSON error message
│
└─ Server error (500)
   └─ Return JSON error message
   └─ Log error to console for debugging

User Feedback:
├─ Success messages
│  └─ Green alert boxes that auto-dismiss
│
├─ Error messages
│  └─ Red alert boxes that persist
│
└─ Loading states
   └─ "Loading..." text during async operations
```

## Security Measures

### 1. Session Security
- Server-side sessions stored in MongoDB
- Fingerprint binding: user-agent + IP hash
- TTL-based auto-cleanup (24 hours)
- HTTPOnly cookies (no JavaScript access)

### 2. Password Security
- Bcrypt hashing (10 salt rounds)
- No plain text storage
- Constant-time comparison during login

### 3. Authorization
- User ownership validation on all endpoints
- ObjectId validation for MongoDB queries
- req.user verification on protected routes

### 4. Data Integrity
- Cascade delete prevents orphaned records
- Unique constraints on important fields
- Proper indexing for query performance

## Performance Optimizations

```
Database Queries:
├─ Population of foreign keys
│  └─ accountId populated with account details
│
├─ Sorting
│  └─ Date descending (most recent first)
│
├─ Indexing
│  ├─ TTL index on sessions.expiresAt
│  ├─ Unique index on users.email
│  ├─ Compound index on (accountId, date)
│  └─ userId indexes for fast lookups
│
└─ Connection Pooling
   └─ maxPoolSize: 10 for MongoDB

Client-Side:
├─ Lazy loading of stats table
├─ Modal dialogs (no page reload)
├─ JavaScript fetch API for async operations
└─ Chart.js for efficient data visualization
```

## Deployment Considerations

```
Environment Variables:
├─ MONGODB_URI      (Connection string)
├─ NODE_ENV         (development/production)
├─ PORT             (Server port)
└─ SESSION_SECRET   (For future cookie signing)

Build Process:
├─ npm run build    (TypeScript → JavaScript)
├─ npm start        (Run compiled code)
└─ npm run dev      (Development mode with hot reload)

Files Served:
├─ Static: /public  (CSS, JavaScript, images)
├─ Views: /views    (EJS templates)
└─ API: /api/*      (JSON endpoints)
```

---

## Complete User Journey Example

```
Day 1: User Registration/First Login
1. Visit http://localhost:3000
2. Redirected to /login
3. Enter: john@example.com / password123
4. Server validates credentials with bcrypt
5. Session created with fingerprint
6. Redirected to /dashboard
7. See empty accounts list

Day 1: Create First Account
1. Click "Add Account" button
2. Modal opens
3. Enter: "Mining Wallet" / "ltc1abc123def456"
4. Click "Submit"
5. POST /api/accounts sent
6. Account added to database
7. Dashboard updates showing new account card

Day 2: Add Daily Stats
1. Click "Input Stats" in navigation
2. Select: "Mining Wallet" from dropdown
3. Date automatically set to today
4. Enter: Earned = 0.5, Pending = 0.3
5. Click "Submit"
6. Stat saved to database
7. See success message

Day 3: Manage All Stats
1. Click "Manage Stats" in navigation
2. See table with all daily stats
3. Want to edit yesterday's entry
4. Click "Edit" on that row
5. Modal pre-fills with values
6. Change Earned to 0.6
7. Click "Save"
8. Stat updated in database
9. Table refreshes showing new value

Day 4: View Account Details
1. Back on Dashboard
2. Click "View" button on account card
3. Taken to /accounts/{accountId}
4. See account information and transaction history
5. Transactions fetched from BlockCypher
6. Can see all received/sent LTC

Day 5: Delete Old Account
1. Dashboard
2. Click "Delete" on old account
3. Confirmation dialog appears
4. Click "OK" to confirm
5. Account and all associated stats deleted
6. Dashboard updates
```

This comprehensive architecture ensures a scalable, secure, and user-friendly crypto account management application.
