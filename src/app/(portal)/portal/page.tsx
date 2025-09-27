"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Package,
  Users,
  Activity,
  Star,
  Clock,
  TrendingUp,
  Grid,
  ArrowRight,
  Calendar,
  Bell,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AppStats {
  totalApps: number;
  activeApps: number;
  recentlyUsed: number;
  favorites: number;
}

interface RecentActivity {
  id: string;
  type: "app_access" | "team_activity" | "system";
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
}

interface QuickLaunchApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  lastAccessed?: Date;
  isFavorite: boolean;
  status: "active" | "inactive";
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "error";
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: Date;
}

export default function PortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [appStats, setAppStats] = useState<AppStats>({
    totalApps: 0,
    activeApps: 0,
    recentlyUsed: 0,
    favorites: 0,
  });
  const [quickLaunchApps, setQuickLaunchApps] = useState<QuickLaunchApp[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [teamStats, setTeamStats] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all dashboard data in parallel
      const [profileRes, statsRes, appsRes, activityRes, announcementsRes, teamRes] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/portal/stats"),
        fetch("/api/portal/apps?limit=6"),
        fetch("/api/portal/activity?limit=5"),
        fetch("/api/portal/announcements"),
        fetch("/api/portal/team-stats"),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile(profileData.user);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAppStats(statsData);
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setQuickLaunchApps(appsData.apps || []);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.activities || []);
      }

      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData.announcements || []);
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamStats(teamData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "app_access":
        return Package;
      case "team_activity":
        return Users;
      default:
        return Activity;
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case "success":
        return CheckCircle;
      case "warning":
        return AlertCircle;
      case "error":
        return XCircle;
      default:
        return Bell;
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-blue-500";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {userProfile?.name || "User"}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your workspace today
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/portal/apps">
              <Grid className="mr-2 h-4 w-4" />
              Browse Apps
            </Link>
          </Button>
          <Button asChild>
            <Link href="/portal/analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Announcements</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.slice(0, 2).map((announcement) => {
              const Icon = getAnnouncementIcon(announcement.type);
              const color = getAnnouncementColor(announcement.type);

              return (
                <div key={announcement.id} className="flex gap-3">
                  <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", color)} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{announcement.title}</p>
                      {announcement.priority === "urgent" && (
                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                      )}
                      {announcement.priority === "high" && (
                        <Badge variant="default" className="text-xs">Important</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apps</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appStats.totalApps}</div>
            <p className="text-xs text-muted-foreground">
              {appStats.activeApps} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Apps</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appStats.favorites}</div>
            <p className="text-xs text-muted-foreground">
              Quick access enabled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.memberCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {teamStats?.activeMembers || 0} active today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appStats.recentlyUsed}</div>
            <p className="text-xs text-muted-foreground">
              Apps used this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Quick Launch Apps */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Launch</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/apps">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              Your frequently used and favorite applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quickLaunchApps.map((app) => (
                <Link
                  key={app.id}
                  href={`/portal/apps/${app.id}`}
                  className="group relative flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    {app.isFavorite && (
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{app.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                  {app.lastAccessed && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(app.lastAccessed)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/activity">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              Latest actions in your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);

                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      activity.iconColor || "bg-muted"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Analytics Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>
                Your application usage patterns this month
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                Detailed Analytics
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                Daily usage chart will be displayed here
              </div>
            </TabsContent>
            <TabsContent value="weekly" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                Weekly usage chart will be displayed here
              </div>
            </TabsContent>
            <TabsContent value="monthly" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                Monthly usage chart will be displayed here
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}