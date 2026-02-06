/**
 * MongoDB Connection & Mongoose Schemas
 * Using Mongoose for schema validation and type safety
 */

import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== INTERFACES ====================

export interface IUser extends Document {
  email: string;
  password: string; // hashed in production
  name: string;
  role: "user" | "admin";
  createdAt: Date;
}

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  ltcAddress: string;
  createdAt: Date;
  verifiedAt?: Date;
}

export interface IDailyStats extends Document {
  accountId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  earned: number;
  pending: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  fingerprint: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  dueDate: Date;
  status: "unpaid" | "paid" | "overdue";
  description?: string;
  category: string;
  paidDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// ==================== SCHEMAS ====================

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: false }
);

const accountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    ltcAddress: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
);

const dailyStatsSchema = new Schema<IDailyStats>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    earned: {
      type: Number,
      required: true,
      default: 0,
    },
    pending: {
      type: Number,
      required: true,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
);

// Compound unique index: one entry per account per day
dailyStatsSchema.index({ accountId: 1, date: 1 }, { unique: true });

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    fingerprint: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false }
);

// TTL index: automatically delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["unpaid", "paid", "overdue"],
      default: "unpaid",
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      enum: ["electricity", "water", "rent", "internet", "other"],
    },
    paidDate: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
);

// Indexes for invoices
invoiceSchema.index({ userId: 1 });
invoiceSchema.index({ userId: 1, dueDate: 1 });
invoiceSchema.index({ userId: 1, status: 1 });

// ==================== MODELS ====================

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export const Account: Model<IAccount> = mongoose.model<IAccount>(
  "Account",
  accountSchema
);
export const DailyStats: Model<IDailyStats> = mongoose.model<IDailyStats>(
  "DailyStats",
  dailyStatsSchema
);
export const Session: Model<ISession> = mongoose.model<ISession>(
  "Session",
  sessionSchema
);
export const Invoice: Model<IInvoice> = mongoose.model<IInvoice>(
  "Invoice",
  invoiceSchema
);

// ==================== CONNECTION ====================

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI not defined in .env");
  }

  try {
    await mongoose.connect(mongoUri, {
      // Connection options
      maxPoolSize: 10,
    });

    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    isConnected = false;
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("✅ MongoDB disconnected");
  } catch (error) {
    console.error("❌ MongoDB disconnection failed:", error);
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
