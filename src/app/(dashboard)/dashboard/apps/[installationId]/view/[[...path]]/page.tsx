"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, AlertCircle, RefreshCw, Settings, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

interface InstalledApp {
  id: string;
  appId: string;
  manifest: {
    id: string;
    name: string;
    version: string;
    description: string;
    homepage: string;
    vendor: {
      name: string;
    };
    navigation?: Array<{
      title: string;
      path: string;
    }>;
  };
  settings?: {
    embedMode?: boolean;
  };
  status: string;
}

interface PageProps {
  params: Promise<{
    installationId: string;
    path?: string[];
  }>;
}

export default function AppEmbeddedView({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [app, setApp] = useState<InstalledApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    const fetchAppDetails = async () => {
      try {
        const response = await fetch(`/api/apps/${resolvedParams.installationId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch app details");
        }
        const data = await response.json();
        setApp(data);

        // Check if embed mode is enabled
        if (!data.settings?.embedMode) {
          // If not in embed mode, open in new tab and redirect back
          const appPath = resolvedParams.path ? `/${resolvedParams.path.join('/')}` : '';
          window.open(`${data.manifest.homepage}${appPath}`, "_blank");
          router.push("/dashboard/my-apps");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load app");
      } finally {
        setLoading(false);
      }
    };

    fetchAppDetails();
  }, [resolvedParams.installationId, resolvedParams.path, router]);

  const handleIframeError = () => {
    setIframeError(true);
  };

  const reloadIframe = () => {
    setIframeError(false);
    const iframe = document.getElementById("app-iframe") as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const openInNewTab = () => {
    if (app) {
      const appPath = resolvedParams.path ? `/${resolvedParams.path.join('/')}` : '';
      window.open(`${app.manifest.homepage}${appPath}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to Load App</AlertTitle>
          <AlertDescription>
            {error || "Failed to load app details"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Build the iframe URL with the path
  const appPath = resolvedParams.path ? `/${resolvedParams.path.join('/')}` : '';
  const iframeSrc = `${app.manifest.homepage}${appPath}`;

  // Get the current navigation item title
  const currentNavItem = app.manifest.navigation?.find(item => {
    const itemPath = item.path === '/' ? '' : item.path;
    return itemPath === appPath || item.path === appPath;
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/my-apps")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            My Apps
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold">{app.manifest.name}</h1>
          {currentNavItem && (
            <Badge variant="outline">{currentNavItem.title}</Badge>
          )}
          <Badge variant="outline">v{app.manifest.version}</Badge>
          <Badge
            variant={app.status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {app.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reloadIframe}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={openInNewTab}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
          <Link href={`/dashboard/apps/${resolvedParams.installationId}/settings`}>
            <Button variant="ghost" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </header>

      {/* Iframe Container */}
      <div className="flex-1 relative">
        {iframeError ? (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Failed to Load Application</CardTitle>
                <CardDescription>
                  The application could not be loaded. This might be because:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>The application server is not running</li>
                  <li>The application URL is incorrect</li>
                  <li>Network connectivity issues</li>
                  <li>The application does not support embedded mode</li>
                </ul>
                <div className="flex gap-2 mt-4">
                  <Button onClick={reloadIframe} size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={openInNewTab} size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <iframe
            id="app-iframe"
            src={iframeSrc}
            className="absolute inset-0 w-full h-full border-0"
            title={app.manifest.name}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            allow="clipboard-read; clipboard-write"
          />
        )}
      </div>
    </div>
  );
}