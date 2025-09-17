"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  Trash2,
  ExternalLink,
  Star,
  BarChart3,
  Package,
  Briefcase,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface App {
  id: string;
  name: string;
  version: string;
  description: string;
  vendor: {
    name: string;
    email: string;
  };
  homepage: string;
  category: string;
  tags: string[];
  pricing?: {
    model: string;
    plans: any[];
  };
}

interface InstalledApp {
  id: string;
  appId: string;
  manifest: App;
  installDate: string;
  status: string;
}

const categoryIcons: Record<string, any> = {
  analytics: BarChart3,
  business: Briefcase,
  operations: Package,
};

export default function AppsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("available");
  const [availableApps, setAvailableApps] = useState<App[]>([]);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available and installed apps
  const fetchApps = async () => {
    setLoading(true);
    try {
      // Fetch available apps
      const availableRes = await fetch("/api/apps");
      const availableData = await availableRes.json();
      setAvailableApps(availableData.apps || []);

      // Fetch installed apps
      const installedRes = await fetch("/api/apps?installed=true");
      const installedData = await installedRes.json();
      setInstalledApps(installedData.apps || []);
    } catch (error) {
      console.error("Error fetching apps:", error);
      toast({
        title: "Error",
        description: "Failed to load apps. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // Install an app
  const installApp = async (appId: string) => {
    setInstalling(appId);
    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "App installed successfully!",
        });
        await fetchApps(); // Refresh the lists
      } else {
        const error = await response.json();
        toast({
          title: "Installation Failed",
          description: error.error || "Failed to install app",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error installing app:", error);
      toast({
        title: "Error",
        description: "Failed to install app. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInstalling(null);
    }
  };

  // Uninstall an app
  const uninstallApp = async (installationId: string) => {
    try {
      const response = await fetch(`/api/apps/${installationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "App uninstalled successfully!",
        });
        await fetchApps(); // Refresh the lists
      } else {
        const error = await response.json();
        toast({
          title: "Uninstall Failed",
          description: error.error || "Failed to uninstall app",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uninstalling app:", error);
      toast({
        title: "Error",
        description: "Failed to uninstall app. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if an app is installed
  const isAppInstalled = (appId: string) => {
    return installedApps.some(app => app.appId === appId);
  };

  // Open app in new tab
  const openApp = (homepage: string) => {
    window.open(homepage, "_blank");
  };

  // Filter apps based on search query
  const filteredAvailableApps = availableApps.filter((app) => {
    return (
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredInstalledApps = installedApps.filter((app) => {
    return (
      app.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.manifest.description.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight">App Store</h1>
          <p className="text-muted-foreground">
            Discover and install apps to enhance your platform
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Available Apps ({filteredAvailableApps.length})
          </TabsTrigger>
          <TabsTrigger value="installed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Installed Apps ({filteredInstalledApps.length})
          </TabsTrigger>
        </TabsList>

        {/* Available Apps */}
        <TabsContent value="available" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAvailableApps.map((app) => {
              const Icon = categoryIcons[app.category] || Package;
              const installed = isAppInstalled(app.id);

              return (
                <Card key={app.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{app.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              v{app.version}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {app.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {installed && (
                        <Badge className="bg-green-500">Installed</Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {app.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {app.pricing && app.pricing.plans[0] && (
                        <div className="text-sm">
                          <span className="font-semibold text-primary">
                            {app.pricing.plans[0].price === 0
                              ? "Free"
                              : `$${app.pricing.plans[0].price}/mo`}
                          </span>
                          {app.pricing.plans.length > 1 && (
                            <span className="text-muted-foreground ml-1">
                              ({app.pricing.plans.length} plans)
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!installed ? (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => installApp(app.id)}
                            disabled={installing === app.id}
                          >
                            {installing === app.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 h-4 w-4" />
                            )}
                            Install
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => openApp(app.homepage)}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open App
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      By {app.vendor.name}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredAvailableApps.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No apps found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Installed Apps */}
        <TabsContent value="installed" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInstalledApps.map((installation) => {
              const app = installation.manifest;
              const Icon = categoryIcons[app.category] || Package;

              return (
                <Card key={installation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{app.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              v{app.version}
                            </Badge>
                            <Badge
                              className={
                                installation.status === 'active'
                                  ? "bg-green-500 text-xs"
                                  : "bg-yellow-500 text-xs"
                              }
                            >
                              {installation.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground">
                        Installed: {new Date(installation.installDate).toLocaleDateString()}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => openApp(app.homepage)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => uninstallApp(installation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredInstalledApps.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No installed apps</h3>
              <p className="text-muted-foreground">
                Install apps from the Available Apps tab to get started.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}