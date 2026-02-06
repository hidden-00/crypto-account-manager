/**
 * MongoDB-ready Database Schema
 * Ready to migrate to MongoDB with minimal changes
 * (just replace numeric IDs with ObjectId and use actual DB)
 */

/**
 * User Schema
 */
export interface User {
  _id?: string; // MongoDB ObjectId (string) or numeric ID for mock
  email: string;
  password: string; // In production: hashed with bcrypt
  name: string;
  role: "user" | "admin"; // simplified from enum
  createdAt: Date;
}

/**
 * Account Schema - belongs to a user
 */
export interface Account {
  _id?: string; // MongoDB ObjectId
  userId: string | number; // Reference to User._id
  name: string;
  ltcAddress: string;
  createdAt: Date;
  verifiedAt?: Date; // null if pending
}

/**
 * DailyStats Schema - earned/pending for account per day
 */
export interface DailyStats {
  _id?: string; // MongoDB ObjectId
  accountId: string | number; // Reference to Account._id
  userId: string | number; // Denormalized for faster queries (optional, but good practice)
  date: Date; // The date of stats (stored as YYYY-MM-DD for consistency)
  earned: number; // Amount earned (in satoshi or LTC)
  pending: number; // Amount pending
  createdAt: Date; // When this record was created
  updatedAt?: Date; // When this record was last updated
}

/**
 * Session Schema - tracks user login sessions
 */
export interface Session {
  _id?: string; // MongoDB ObjectId or random hex
  userId: string | number; // Reference to User._id
  sessionId: string; // Random session token
  fingerprint: string; // Hash of user-agent + IP for validation
  createdAt: number; // Timestamp in ms
  expiresAt: number; // Timestamp in ms
  userAgent?: string; // Optional: for debugging/display
  ipAddress?: string; // Optional: for logging (anonymized in prod)
}

/**
 * Invoice Schema - monthly bills/invoices for user
 */
export interface Invoice {
  _id?: string; // MongoDB ObjectId
  userId: string | number; // Reference to User._id
  name: string; // Invoice name (e.g., "Electricity Bill")
  amount: number; // Amount to pay (in USD or local currency)
  dueDate: Date; // When payment is due
  status: "unpaid" | "paid" | "overdue"; // Status of invoice
  description?: string; // Additional notes/details
  category: string; // Type: "electricity", "water", "rent", "internet", "other"
  paidDate?: Date; // When it was paid (only if paid)
  createdAt: Date; // When invoice was created
  updatedAt?: Date; // When invoice was last updated
}

/**
 * MongoDB Index Recommendations (add in production):
 *
 * Users Collection:
 *   - db.users.createIndex({ email: 1 }, { unique: true })
 *
 * Accounts Collection:
 *   - db.accounts.createIndex({ userId: 1 })
 *   - db.accounts.createIndex({ ltcAddress: 1 })
 *
 * DailyStats Collection:
 *   - db.dailystats.createIndex({ accountId: 1, date: 1 }, { unique: true })
 *   - db.dailystats.createIndex({ userId: 1, date: 1 })
 *   - db.dailystats.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }) // optional TTL
 *
 * Sessions Collection:
 *   - db.sessions.createIndex({ userId: 1 })
 *   - db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index
 *
 * Invoices Collection:
 *   - db.invoices.createIndex({ userId: 1 })
 *   - db.invoices.createIndex({ userId: 1, dueDate: 1 })
 *   - db.invoices.createIndex({ userId: 1, status: 1 })
 */
