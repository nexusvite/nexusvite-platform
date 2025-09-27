"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCw,
  Star,
  Info,
  Shield,
  Activity
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

interface AppDetails {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  manifest: any;
  status: string;
  installationId: string;
  installedAt: string;
  settings: any;
  icon?: string;
  category?: string;
  external?: boolean;
  url?: string;
}

interface Params {
  params: Promise<{
    appId: string;
  }>;
}

export default function PortalAppView({ params }: Params) {
  const { appId } = use(params);
  const router = useRouter();
  const [appDetails, setAppDetails] = useState<AppDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("app");
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    fetchAppDetails();
    trackAppUsage();
  }, [appId]);

  const fetchAppDetails = async () => {
    try {
      setLoading(true);
      // Get app details
      const appsResponse = await fetch("/api/portal/apps");
      if (appsResponse.ok) {
        const data = await appsResponse.json();
        const app = data.apps.find((a: AppDetails) => a.id === appId);
        if (app) {
          setAppDetails(app);
        } else {
          // App not found or not accessible
          router.push("/portal");
        }
      }

      // Check if app is favorited
      const favResponse = await fetch("/api/portal/favorites");
      if (favResponse.ok) {
        const favData = await favResponse.json();
        setIsFavorite(favData.favoriteAppIds?.includes(appId) || false);
      }
    } catch (error) {
      console.error("Error fetching app details:", error);
    } finally {
      setLoading(false);
    }
  };

  const trackAppUsage = async () => {
    try {
      // Track that user accessed this app
      await fetch("/api/portal/track-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });
    } catch (error) {
      console.error("Error tracking app usage:", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const response = await fetch("/api/portal/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const refreshApp = () => {
    // Refresh the iframe by changing the key
    setIframeKey(prev => prev + 1);
  };

  const openInNewTab = () => {
    if (appDetails?.url || appDetails?.manifest?.url) {
      const appUrl = appDetails.url || appDetails.manifest.url;
      window.open(appUrl, "_blank");
    }
  };

  const getAppUrl = () => {
    if (!appDetails) return "";

    // Check if app has an external URL in manifest
    if (appDetails.manifest?.url) {
      return appDetails.manifest.url;
    }

    // For installed apps, use the standard embedded view URL
    if (appDetails.installationId) {
      return `/dashboard/apps/${appDetails.installationId}/view`;
    }

    // Default to app-specific route
    return `/apps/${appDetails.id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!appDetails) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Application Not Found</CardTitle>
            <CardDescription>
              The requested application could not be found or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/portal")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", isFullscreen && "fixed inset-0 z-50 bg-background")}>
      {/* App Header */}
      {!isFullscreen && (
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{appDetails.name}</h1>
              <p className="text-muted-foreground">{appDetails.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFavorite}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-yellow-400 text-yellow-400")} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshApp}
              title="Refresh application"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            {appDetails.external && (
              <Button
                variant="outline"
                size="icon"
                onClick={openInNewTab}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen Header */}
      {isFullscreen && (
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold">{appDetails.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshApp}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* App Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {!isFullscreen && (
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="app">Application</TabsTrigger>
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="app" className="flex-1 mt-4">
            <Card className="h-full">
              <CardContent className="h-full p-0">
                <iframe
                  key={iframeKey}
                  src={getAppUrl()}
                  className="w-full h-full rounded-lg"
                  title={appDetails.name}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  allow="clipboard-read; clipboard-write"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {!isFullscreen && (
            <>
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Details</CardTitle>
                    <CardDescription>
                      Information about this application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Version</span>
                        <Badge variant="secondary">{appDetails.version}</Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Author</span>
                        <span className="text-sm font-medium">{appDetails.author}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Category</span>
                        <Badge variant="outline">{appDetails.category || "Other"}</Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={appDetails.status === "active" ? "default" : "secondary"}>
                          {appDetails.status}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Installed</span>
                        <span className="text-sm">
                          {new Date(appDetails.installedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {appDetails.manifest?.permissions && Array.isArray(appDetails.manifest.permissions) && appDetails.manifest.permissions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Permissions
                      </CardTitle>
                      <CardDescription>
                        This application has access to the following
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {appDetails.manifest.permissions.map((permission: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-sm">{permission}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                    <CardDescription>
                      Configure this application's settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Application-specific settings will appear here
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive/20">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible actions for this application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" disabled>
                      Uninstall Application
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}