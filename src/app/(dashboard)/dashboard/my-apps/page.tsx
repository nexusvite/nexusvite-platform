"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ExternalLink,
  Settings,
  Trash2,
  MoreVertical,
  Package,
  BarChart3,
  Briefcase,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface InstalledApp {
  id: string;
  appId: string;
  manifest: {
    id: string;
    name: string;
    version: string;
    description: string;
    homepage: string;
    category: string;
    tags: string[];
    vendor: {
      name: string;
      email: string;
    };
    pricing?: {
      model: string;
      plans: {
        name: string;
        price: number;
        features: string[];
      }[];
    };
  };
  installDate: string;
  status: string;
  settings?: {
    embedMode?: boolean;
    [key: string]: unknown;
  };
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  analytics: BarChart3,
  business: Briefcase,
  operations: Package,
};

const statusConfig = {
  active: { icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
  inactive: { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
};

export default function MyAppsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [uninstalling, setUninstalling] = useState<string | null>(null);

  // Fetch installed apps
  const fetchInstalledApps = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/apps?installed=true");
      const data = await response.json();
      setInstalledApps(data.apps || []);
    } catch (error) {
      console.error("Error fetching installed apps:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstalledApps();
  }, []);

  // Uninstall an app
  const uninstallApp = async (installationId: string) => {
    if (!confirm("Are you sure you want to uninstall this app? This action cannot be undone.")) {
      return;
    }

    setUninstalling(installationId);
    try {
      const response = await fetch(`/api/apps/${installationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchInstalledApps();
      } else {
        // Try to parse as JSON, but handle HTML responses (404 pages)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error("Failed to uninstall app:", errorData);
        } else {
          console.error("Failed to uninstall app: Not found (404)");
        }
      }
    } catch (error) {
      console.error("Error uninstalling app:", error);
    } finally {
      setUninstalling(null);
    }
  };

  // Open app based on embed mode setting
  const openApp = (installation: InstalledApp) => {
    const embedMode = installation.settings?.embedMode ?? false;

    if (embedMode) {
      // Open in embedded mode (navigate to embedded view)
      window.location.href = `/dashboard/apps/${installation.id}/view`;
    } else {
      // Open in new tab
      window.open(installation.manifest.homepage, "_blank");
    }
  };

  // Navigate to app settings
  const openSettings = (installationId: string) => {
    window.location.href = `/dashboard/apps/${installationId}/settings`;
  };

  // Filter apps based on search query
  const filteredApps = installedApps.filter((app) => {
    return (
      app.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.manifest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.manifest.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Apps</h1>
          <p className="text-muted-foreground">
            Manage your installed applications and their settings
          </p>
        </div>
        <Button asChild>
          <a href="/dashboard/apps">
            Browse App Store
          </a>
        </Button>
      </div>

      {/* Search */}
      {installedApps.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search your apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Installed Apps Grid */}
      {filteredApps.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map((installation) => {
            const app = installation.manifest;
            const Icon = categoryIcons[app.category] || Package;
            const StatusIcon = statusConfig[installation.status as keyof typeof statusConfig]?.icon || CheckCircle;
            const statusColor = statusConfig[installation.status as keyof typeof statusConfig]?.color || "text-gray-500";
            const statusBgColor = statusConfig[installation.status as keyof typeof statusConfig]?.bgColor || "bg-gray-500/10";

            return (
              <Card key={installation.id} className="relative hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            v{app.version}
                          </Badge>
                          <div className={`flex items-center gap-1 ${statusColor}`}>
                            <StatusIcon className="h-3 w-3" />
                            <span className="text-xs capitalize">{installation.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openApp(installation)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {installation.settings?.embedMode ? "Open App" : "Open in New Tab"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openSettings(installation.id)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => uninstallApp(installation.id)}
                          disabled={uninstalling === installation.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {uninstalling === installation.id ? "Uninstalling..." : "Uninstall"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="mt-2">
                    {app.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {app.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {app.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{app.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Installation Info */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Installed: {new Date(installation.installDate).toLocaleDateString()}</div>
                      <div>By {app.vendor.name}</div>
                      {app.pricing && app.pricing.plans[0] && (
                        <div className="font-semibold text-primary">
                          {app.pricing.plans[0].price === 0
                            ? "Free"
                            : `$${app.pricing.plans[0].price}/mo`}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    className="w-full"
                    onClick={() => openApp(installation)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {installation.settings?.embedMode ? "Open App" : "Open in New Tab"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {searchQuery ? "No apps found" : "No apps installed"}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Browse the app store to discover and install apps"}
            </p>
            <Button asChild className="mt-4">
              <a href="/dashboard/apps">
                Browse App Store
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {installedApps.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Apps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{installedApps.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Apps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {installedApps.filter(app => app.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(installedApps.map(app => app.manifest.category)).size}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}