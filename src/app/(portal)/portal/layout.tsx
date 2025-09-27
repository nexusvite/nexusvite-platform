"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  Users,
  Settings,
  Grid,
  Star,
  Clock,
  LogOut,
  Search,
  Bell,
  HelpCircle,
  Package,
  Shield,
  FileText,
  Activity,
  Zap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  category: "platform" | "apps" | "team" | "settings";
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  requiresPermission?: string;
  isExternal?: boolean;
  appUrl?: string; // Direct URL to the app for iframe loading
  parent?: string; // Parent app ID for sub-navigation items
}

// Platform navigation items
const platformNavItems: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: Home,
    path: "/portal",
    category: "platform",
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
    path: "/portal/analytics",
    category: "platform",
  },
  {
    id: "activity",
    title: "Activity",
    icon: Activity,
    path: "/portal/activity",
    category: "platform",
    badge: "New",
    badgeVariant: "secondary",
  },
  {
    id: "reports",
    title: "Reports",
    icon: FileText,
    path: "/portal/reports",
    category: "platform",
    requiresPermission: "view_reports",
  },
];

// Team navigation items
const teamNavItems: NavItem[] = [
  {
    id: "team",
    title: "Team",
    icon: Users,
    path: "/portal/team",
    category: "team",
    requiresPermission: "view_team",
  },
  {
    id: "permissions",
    title: "Permissions",
    icon: Shield,
    path: "/portal/permissions",
    category: "team",
    requiresPermission: "manage_permissions",
  },
];

// Settings navigation items
const settingsNavItems: NavItem[] = [
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    path: "/portal/settings",
    category: "settings",
  },
  {
    id: "help",
    title: "Help & Support",
    icon: HelpCircle,
    path: "/portal/help",
    category: "settings",
  },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [installedApps, setInstalledApps] = useState<NavItem[]>([]);
  const [favoriteApps, setFavoriteApps] = useState<string[]>([]);
  const [recentApps, setRecentApps] = useState<NavItem[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user profile and permissions
  useEffect(() => {
    fetchUserProfile();
    fetchInstalledApps();
    fetchFavoriteApps();
    fetchRecentApps();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchInstalledApps = async () => {
    try {
      const response = await fetch("/api/portal/apps");
      if (response.ok) {
        const data = await response.json();
        const appNavItems: NavItem[] = [];

        // Process each app and its navigation items
        data.apps.forEach((app: any) => {
          // Add main app entry
          appNavItems.push({
            id: app.id,
            title: app.name,
            icon: getAppIcon(app.manifest?.icon || app.icon || "package"),
            path: `/portal/app/${app.slug || app.name.toLowerCase().replace(/\s+/g, '-')}`,
            category: "apps" as const,
            isExternal: app.external || false,
            appUrl: app.url,
          });

          // Add app navigation items as sub-items (without app name prefix)
          if (app.navigation && Array.isArray(app.navigation)) {
            app.navigation.forEach((navItem: any) => {
              appNavItems.push({
                id: navItem.id || `${app.id}-${navItem.title.toLowerCase().replace(/\s+/g, '-')}`,
                title: navItem.title, // Just the page title, no app name prefix
                icon: getAppIcon(navItem.icon || "file"),
                path: navItem.path || `/portal/app/${navItem.slug}`,
                category: "apps" as const,
                isExternal: app.external || false,
                appUrl: navItem.url,
                parent: app.id, // Mark as sub-item
              });
            });
          }
        });

        setInstalledApps(appNavItems);
      }
    } catch (error) {
      console.error("Error fetching installed apps:", error);
    }
  };

  const fetchFavoriteApps = async () => {
    try {
      const response = await fetch("/api/portal/favorites");
      if (response.ok) {
        const data = await response.json();
        setFavoriteApps(data.favoriteAppIds || []);
      }
    } catch (error) {
      console.error("Error fetching favorite apps:", error);
    }
  };

  const fetchRecentApps = async () => {
    try {
      const response = await fetch("/api/portal/recent");
      if (response.ok) {
        const data = await response.json();
        setRecentApps(data.recentApps || []);
      }
    } catch (error) {
      console.error("Error fetching recent apps:", error);
    }
  };

  const getAppIcon = (iconName: string) => {
    // Map icon names to Lucide icons
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      package: Package,
      zap: Zap,
      chart: BarChart3,
      grid: Grid,
      "file": FileText,
      "file-text": FileText,
      "settings": Settings,
      "activity": Activity,
      "analytics": BarChart3,
      "dashboard": Home,
      "reports": FileText,
    };
    return iconMap[iconName] || Package;
  };

  const toggleFavorite = async (appId: string) => {
    try {
      const isFavorite = favoriteApps.includes(appId);
      const response = await fetch("/api/portal/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });

      if (response.ok) {
        if (isFavorite) {
          setFavoriteApps(favoriteApps.filter(id => id !== appId));
        } else {
          setFavoriteApps([...favoriteApps, appId]);
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Filter navigation items based on search
  const filterNavItems = (items: NavItem[]) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Check if user has permission for nav item
  const hasPermission = (item: NavItem) => {
    if (!item.requiresPermission) return true;
    // TODO: Implement actual permission checking
    return true;
  };

  const renderNavItem = (item: NavItem, isSubItem: boolean = false) => {
    if (!hasPermission(item)) return null;

    const Icon = item.icon;
    const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
    const isFavorite = favoriteApps.includes(item.id);

    return (
      <Link
        key={item.id}
        href={item.path}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground",
          isCollapsed && "justify-center px-2",
          isSubItem && !isCollapsed && "ml-6 px-2 py-1.5" // Indent sub-items
        )}
      >
        <Icon className={cn(
          "h-4 w-4",
          isCollapsed && "h-5 w-5",
          isSubItem && "h-3.5 w-3.5" // Smaller icons for sub-items
        )} />
        {!isCollapsed && (
          <>
            <span className={cn(
              "flex-1",
              isSubItem && "text-xs" // Smaller text for sub-items
            )}>{item.title}</span>
            {item.badge && (
              <Badge variant={item.badgeVariant || "default"} className="ml-auto">
                {item.badge}
              </Badge>
            )}
            {item.category === "apps" && !item.parent && ( // Only show star for main app items
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(item.id);
                }}
              >
                <Star
                  className={cn(
                    "h-3 w-3",
                    isFavorite && "fill-yellow-400 text-yellow-400"
                  )}
                />
              </Button>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <Link href="/portal" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary" />
              <span className="text-lg font-semibold">Portal</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(isCollapsed && "mx-auto")}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-4 py-4">
            {/* Platform */}
            <div>
              {!isCollapsed && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Platform
                </h3>
              )}
              <div className="space-y-1">
                {filterNavItems(platformNavItems).map(renderNavItem)}
              </div>
            </div>

            {/* Favorite Apps */}
            {favoriteApps.length > 0 && (
              <div>
                {!isCollapsed && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Favorites
                  </h3>
                )}
                <div className="space-y-1">
                  {filterNavItems(installedApps.filter(app => favoriteApps.includes(app.id) && !app.parent))
                    .map(app => (
                      <div key={app.id}>
                        {renderNavItem(app, false)}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Recent Apps */}
            {recentApps.length > 0 && (
              <div>
                {!isCollapsed && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recent
                  </h3>
                )}
                <div className="space-y-1">
                  {filterNavItems(recentApps).map(renderNavItem)}
                </div>
              </div>
            )}

            {/* All Apps */}
            {installedApps.length > 0 && (
              <div>
                {!isCollapsed && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Applications
                  </h3>
                )}
                <div className="space-y-1">
                  {filterNavItems(installedApps)
                    .filter(item => !item.parent) // Only show parent apps at top level
                    .map(app => (
                      <div key={app.id}>
                        {renderNavItem(app, false)}
                        {/* Render sub-items for this app */}
                        {filterNavItems(installedApps)
                          .filter(item => item.parent === app.id)
                          .map(subItem => renderNavItem(subItem, true))}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Team */}
            {teamNavItems.some(item => hasPermission(item)) && (
              <div>
                {!isCollapsed && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Team
                  </h3>
                )}
                <div className="space-y-1">
                  {filterNavItems(teamNavItems).map(renderNavItem)}
                </div>
              </div>
            )}

            {/* Settings */}
            <div>
              {!isCollapsed && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Support
                </h3>
              )}
              <div className="space-y-1">
                {filterNavItems(settingsNavItems).map(renderNavItem)}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isCollapsed && "justify-center"
                )}
              >
                <Avatar className={cn("h-8 w-8", !isCollapsed && "mr-3")}>
                  <AvatarImage src={userProfile?.image} />
                  <AvatarFallback>
                    {userProfile?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start text-xs">
                    <span className="font-medium">{userProfile?.name || "User"}</span>
                    <span className="text-muted-foreground">{userProfile?.email}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCollapsed ? "center" : "end"} className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/portal/profile">
                  <Users className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/portal/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {pathname === "/portal" ? "Dashboard" : "Portal"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}