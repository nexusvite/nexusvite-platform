"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Store,
  Settings,
  Users,
  BarChart3,
  Package,
  CreditCard,
  HelpCircle,
  Zap,
  Activity,
  FileText,
  ChevronRight,
  ChevronDown,
  Puzzle,
  Code2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Store,
  Settings,
  Users,
  BarChart3,
  Package,
  CreditCard,
  HelpCircle,
  Activity,
  FileText,
  Puzzle,
  Code2,
};

const sidebarItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "App Store",
    href: "/dashboard/apps",
    icon: Store,
    badge: "New",
  },
  {
    title: "My Apps",
    href: "/dashboard/my-apps",
    icon: Package,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Team",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Developer Portal",
    href: "/developer",
    icon: Code2,
    badge: "New",
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Help & Support",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
];

interface AppNavItem {
  title: string;
  path: string;
  icon?: string;
  description?: string;
  badge?: string;
  children?: AppNavItem[];
}

interface InstalledApp {
  id: string;
  appId: string;
  manifest: {
    id: string;
    name: string;
    navigation?: AppNavItem[];
  };
  settings?: {
    embedMode?: boolean;
  };
}

interface DashboardSidebarProps {
  className?: string;
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch installed apps with embedMode enabled
  useEffect(() => {
    const fetchInstalledApps = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/apps?installed=true");
        const data = await response.json();

        // Filter apps with embedMode enabled
        const appsWithEmbedMode = (data.apps || []).filter(
          (app: InstalledApp) => app.settings?.embedMode === true
        );

        setInstalledApps(appsWithEmbedMode);
      } catch (error) {
        console.error("Error fetching installed apps:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstalledApps();
  }, [user]);

  const toggleAppExpanded = (appId: string) => {
    setExpandedApps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Puzzle;
    return iconMap[iconName] || Puzzle;
  };

  const renderAppNavigation = (app: InstalledApp) => {
    if (!app.manifest.navigation || app.manifest.navigation.length === 0) {
      return null;
    }

    const isExpanded = expandedApps.has(app.id);
    const basePath = `/dashboard/apps/${app.id}/view`;

    return (
      <div key={app.id} className="mt-6">
        <button
          onClick={() => toggleAppExpanded(app.id)}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Puzzle className="h-4 w-4" />
          <span className="flex-1 text-left">{app.manifest.name}</span>
        </button>

        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {app.manifest.navigation.map((navItem) => {
              const Icon = getIconComponent(navItem.icon);
              const href = `${basePath}${navItem.path === '/' ? '' : navItem.path}`;
              const isActive = pathname === href || pathname?.startsWith(href + '/');

              return (
                <Link key={navItem.path} href={href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{navItem.title}</span>
                    {navItem.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {navItem.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex h-full w-64 flex-col bg-background border-r", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">NexusVite</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-medium text-primary">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-4">
          {/* Platform Navigation */}
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Platform
          </div>
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge
                      variant={isActive ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Installed Apps Navigation */}
          {installedApps.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Installed Apps
              </div>
              {installedApps.map(renderAppNavigation)}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Upgrade Card */}
      <div className="m-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border">
        <div className="text-sm font-medium mb-2">Upgrade to Pro</div>
        <div className="text-xs text-muted-foreground mb-3">
          Unlock advanced features and unlimited apps
        </div>
        <Button size="sm" className="w-full">
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}