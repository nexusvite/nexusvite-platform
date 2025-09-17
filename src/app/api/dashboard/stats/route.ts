import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/database";
import { apps, installations, users } from "@/core/database/schemas";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // For now, we'll use a hardcoded user ID for testing
    // TODO: Get actual user ID from session
    const userId = "glr5k48b47k5ybhqav0v3nit"; // test@example.com user

    // Get installed apps count for the user
    const installedAppsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(installations)
      .where(eq(installations.userId, userId));

    const installedAppsCount = Number(installedAppsResult[0]?.count) || 0;

    // Get total users count
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const totalUsers = Number(totalUsersResult[0]?.count) || 0;

    // Get recent installations with app details
    const recentInstallations = await db
      .select({
        appName: apps.name,
        appId: installations.appId,
        installedAt: installations.installedAt,
        status: installations.status
      })
      .from(installations)
      .innerJoin(apps, eq(installations.appId, apps.id))
      .where(eq(installations.userId, userId))
      .orderBy(desc(installations.installedAt))
      .limit(4);

    // Get all available apps for recommendations
    const availableApps = await db
      .select({
        id: apps.id,
        name: apps.name,
        description: apps.description,
        category: apps.category,
        status: apps.status
      })
      .from(apps)
      .where(eq(apps.status, 'active'))
      .limit(3);

    // Calculate mock values for demo
    const monthlySpend = (installedAppsCount * 3.77).toFixed(2);
    const apiRequests = Math.floor(Math.random() * 1000) + 100;

    return NextResponse.json({
      stats: {
        installedApps: {
          count: installedAppsCount,
          change: `+2 from last month`,
          growth: "20.0"
        },
        apiRequests: {
          count: apiRequests,
          change: `+180.1% from last month`,
          growth: "180.1"
        },
        activeUsers: {
          count: totalUsers,
          change: `+${Math.floor(totalUsers * 0.35)} since last hour`,
          growth: "35.0"
        },
        monthlySpend: {
          amount: `$${monthlySpend}`,
          change: "+19% from last month",
          growth: "19.0"
        }
      },
      recentActivity: recentInstallations.map((installation) => ({
        name: installation.appName || "Unknown App",
        description: `Installed ${getRelativeTime(installation.installedAt)}`,
        icon: (installation.appName || "U").charAt(0).toUpperCase(),
        status: installation.status === 'active' ? 'installed' : installation.status
      })),
      recommendedApps: availableApps.map(app => ({
        id: app.id,
        name: app.name || "Unknown App",
        description: app.description || "No description available",
        category: app.category || "General",
        installs: `${Math.floor(Math.random() * 50) + 10}K+`,
        rating: (4.5 + Math.random() * 0.4).toFixed(1)
      }))
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    // Return a minimal valid response structure even on error
    return NextResponse.json({
      stats: {
        installedApps: { count: 0, change: "No data", growth: "0" },
        apiRequests: { count: 0, change: "No data", growth: "0" },
        activeUsers: { count: 0, change: "No data", growth: "0" },
        monthlySpend: { amount: "$0.00", change: "No data", growth: "0" }
      },
      recentActivity: [],
      recommendedApps: []
    });
  }
}

function getRelativeTime(date: Date | null): string {
  if (!date) return "recently";

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
}