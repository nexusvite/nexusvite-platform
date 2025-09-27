"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCw,
  Star,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  slug?: string;
}

interface Params {
  params: Promise<{
    slug: string;
  }>;
}

export default function PortalAppPage({ params }: Params) {
  const { slug } = use(params);
  const router = useRouter();
  const [appDetails, setAppDetails] = useState<AppDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppDetails();
  }, [slug]);

  const fetchAppDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all apps and find by slug
      const appsResponse = await fetch("/api/portal/apps");
      if (appsResponse.ok) {
        const data = await appsResponse.json();

        // First check if this is a sub-page slug (e.g., "analytics-dashboard")
        let appData = null;
        let navigationItem = null;

        // Check all apps and their navigation items
        for (const app of data.apps) {
          // Check if it matches the main app slug
          if (app.slug === slug || app.name.toLowerCase().replace(/\s+/g, '-') === slug) {
            appData = app;
            break;
          }

          // Check if it matches any navigation item slug
          if (app.navigation && Array.isArray(app.navigation)) {
            const navItem = app.navigation.find((item: any) => item.slug === slug);
            if (navItem) {
              appData = app;
              navigationItem = navItem;
              break;
            }
          }
        }

        if (appData) {
          // If we found a navigation item, use its URL
          if (navigationItem) {
            setAppDetails({
              ...appData,
              url: navigationItem.url,
              name: `${appData.name} - ${navigationItem.title}`,
            });
          } else {
            setAppDetails(appData);
          }
          trackAppUsage(appData.id);
        } else {
          setError("Application not found");
        }
      } else {
        setError("Failed to load applications");
      }

      // Check if app is favorited
      const favResponse = await fetch("/api/portal/favorites");
      if (favResponse.ok) {
        const favData = await favResponse.json();
        const appId = appDetails?.id;
        if (appId) {
          setIsFavorite(favData.favoriteAppIds?.includes(appId) || false);
        }
      }
    } catch (error) {
      console.error("Error fetching app details:", error);
      setError("An error occurred while loading the application");
    } finally {
      setLoading(false);
    }
  };

  const trackAppUsage = async (appId: string) => {
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
    if (!appDetails) return;

    try {
      const response = await fetch("/api/portal/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: appDetails.id }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const refreshApp = () => {
    setIframeKey(prev => prev + 1);
  };

  const openInNewTab = () => {
    if (appDetails?.url) {
      window.open(appDetails.url, "_blank");
    }
  };

  const getAppUrl = () => {
    if (!appDetails) return "";

    // For external apps with direct URLs, append authentication parameters
    if (appDetails.external && appDetails.url) {
      const url = new URL(appDetails.url);
      // Add authentication parameters for embedded mode
      url.searchParams.set('embedded', 'true');
      url.searchParams.set('platform_url', window.location.origin);
      url.searchParams.set('installation_id', appDetails.installationId);
      return url.toString();
    }

    // Use the URL from the API which already handles different app types
    return appDetails.url || "";
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

  if (error || !appDetails) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Application Not Available</CardTitle>
            </div>
            <CardDescription>
              {error || "The requested application could not be loaded"}
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
    <div className={cn(
      "flex flex-col h-full",
      isFullscreen && "fixed inset-0 z-50 bg-background"
    )}>
      {/* Compact Header Bar */}
      <div className={cn(
        "flex items-center justify-between border-b bg-card",
        isFullscreen ? "p-3" : "p-4"
      )}>
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">{appDetails.name}</h2>
          {appDetails.version && (
            <Badge variant="outline" className="text-xs">
              v{appDetails.version}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className="h-8 w-8"
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={cn(
              "h-4 w-4",
              isFavorite && "fill-yellow-400 text-yellow-400"
            )} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={refreshApp}
            className="h-8 w-8"
            title="Refresh application"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {appDetails.external && (
            <Button
              variant="ghost"
              size="icon"
              onClick={openInNewTab}
              className="h-8 w-8"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8"
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

      {/* App Content - Full Height iframe */}
      <div className="flex-1 overflow-hidden bg-background">
        <iframe
          key={iframeKey}
          src={getAppUrl()}
          className="w-full h-full border-0"
          title={appDetails.name}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}