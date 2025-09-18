"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Settings, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface InstalledApp {
  id: string;
  appId: string;
  manifest: {
    id: string;
    name: string;
    homepage: string;
    description: string;
  };
  settings?: {
    embedMode?: boolean;
  };
}

export default function AppEmbeddedView() {
  const params = useParams();
  const router = useRouter();
  const [app, setApp] = useState<InstalledApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppDetails = async () => {
      try {
        const response = await fetch(`/api/apps/${params.installationId}`);
        if (!response.ok) {
          throw new Error("Failed to load app details");
        }
        const data = await response.json();

        // Check if app supports embedded mode
        if (!data.settings?.embedMode) {
          // If not in embed mode, redirect to external URL
          window.open(data.manifest.homepage, "_blank");
          router.push("/dashboard/apps");
          return;
        }

        setApp(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.installationId) {
      fetchAppDetails();
    }
  }, [params.installationId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6 max-w-md">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold">Failed to Load App</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {error || "The app could not be loaded. Please try again."}
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard/apps")}>
              Back to Apps
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/apps")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Apps
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold">{app.manifest.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(app.manifest.homepage, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
          <Link href={`/dashboard/apps/${params.installationId}/settings`}>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Embedded iframe */}
      <div className="flex-1 relative">
        <iframe
          src={app.manifest.homepage}
          className="absolute inset-0 w-full h-full border-0"
          title={app.manifest.name}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}