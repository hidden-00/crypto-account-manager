/**
 * MongoDB Data Seeding
 * Initializes users, accounts, and daily stats on first run
 */

import { User, Account, DailyStats } from "./mongodb";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: "user" | "admin";
}

export interface SeedAccount {
  userEmail?: string; // Helper field, not part of Account schema
  name: string;
}

export interface SeedDailyStat {
  userEmail?: string; // Helper field
  accountName?: string; // Helper field
  date: Date;
  earned: number;
  pending: number;
}

const seedUsers: SeedUser[] = [
  {
    email: "john@example.com",
    password: "password123",
    name: "John Doe",
    role: "user",
  },
  {
    email: "jane@example.com",
    password: "password456",
    name: "Jane Smith",
    role: "user",
  },
  {
    email: "bob@example.com",
    password: "password789",
    name: "Bob Johnson",
    role: "user",
  },
];

const seedAccounts: SeedAccount[] = [
  {
    userEmail: "john@example.com",
    name: "hansnosp",
  },
  {
    userEmail: "john@example.com",
    name: "duymanhdol",
  },
  {
    userEmail: "jane@example.com",
    name: "huynoaaa",
  },
  {
    userEmail: "jane@example.com",
    name: "gameez",
  },
  {
    userEmail: "bob@example.com",
    name: "truonglamgjau",
  },
  {
    userEmail: "bob@example.com",
    name: "coderthaighiep",
  },
];

const seedDailyStatsData: Array<{
  userEmail: string;
  accountName: string;
  date: Date;
  earned: number;
  pending: number;
}> = [
  {
    userEmail: "john@example.com",
    accountName: "hansnosp",
    date: new Date("2025-12-28"),
    earned: 0.002,
    pending: 0.001,
  },
  {
    userEmail: "john@example.com",
    accountName: "hansnosp",
    date: new Date("2025-12-27"),
    earned: 0.0015,
    pending: 0.0008,
  },
  {
    userEmail: "john@example.com",
    accountName: "duymanhdol",
    date: new Date("2025-12-28"),
    earned: 0.0025,
    pending: 0.0012,
  },
];

export async function seedDatabase(): Promise<void> {
  try {
    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("Database already seeded, skipping seed operation");
      return;
    }

    console.log("🌱 Starting database seed...");

    // 1. Seed users
    console.log("📝 Creating users...");
    const createdUsers = await User.insertMany(
      await Promise.all(
        seedUsers.map(async (u) => {
          const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
          return {
            email: u.email,
            password: hashedPassword,
            name: u.name,
            role: u.role,
            createdAt: new Date(),
          };
        })
      )
    );
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create a map of email -> userId for accounts
    const userEmailToId = new Map<string, string>();
    createdUsers.forEach((user) => {
      userEmailToId.set(user.email, user._id.toString());
    });

    // 2. Seed accounts
    console.log("📝 Creating accounts...");
    const accountData = seedAccounts.map((acc) => ({
      userId: new mongoose.Types.ObjectId(userEmailToId.get(acc.userEmail!)!),
      name: acc.name,
      createdAt: new Date(),
    }));

    const createdAccounts = await Account.insertMany(accountData);
    console.log(`✅ Created ${createdAccounts.length} accounts`);

    // Create a map of (userEmail, accountName) -> accountId for daily stats
    const accountMap = new Map<string, string>();
    createdAccounts.forEach((account) => {
      // Find the email for this account's userId
      let userEmail = "";
      for (const [email, userId] of userEmailToId.entries()) {
        if (userId === account.userId.toString()) {
          userEmail = email;
          break;
        }
      }
      const key = `${userEmail}|${account.name}`;
      accountMap.set(key, account._id.toString());
    });

    // 3. Seed daily stats
    console.log("📝 Creating daily stats...");
    const statData = seedDailyStatsData.map((stat) => {
      const accountKey = `${stat.userEmail}|${stat.accountName}`;
      const accountId = accountMap.get(accountKey);
      const userId = userEmailToId.get(stat.userEmail);

      if (!accountId || !userId) {
        throw new Error(
          `Could not find account or user for stat: ${accountKey}`
        );
      }

      return {
        accountId: new mongoose.Types.ObjectId(accountId),
        userId: new mongoose.Types.ObjectId(userId),
        date: stat.date,
        earned: stat.earned,
        pending: stat.pending,
        createdAt: new Date(),
      };
    });

    const createdStats = await DailyStats.insertMany(statData);
    console.log(`✅ Created ${createdStats.length} daily stats`);

    console.log("✅ Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}
