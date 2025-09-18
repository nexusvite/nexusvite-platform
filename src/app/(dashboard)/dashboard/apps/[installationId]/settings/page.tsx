"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Settings, Info, ExternalLink, Frame, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function AppSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [app, setApp] = useState<InstalledApp | null>(null);
  const [embedMode, setEmbedMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAppDetails = async () => {
      try {
        const response = await fetch(`/api/apps/${params.installationId}`);
        if (!response.ok) {
          throw new Error("Failed to load app details");
        }
        const data = await response.json();
        setApp(data);
        setEmbedMode(data.settings?.embedMode ?? false);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
        router.push("/dashboard/apps");
      } finally {
        setLoading(false);
      }
    };

    if (params.installationId) {
      fetchAppDetails();
    }
  }, [params.installationId, router, toast]);

  const handleSaveSettings = async () => {
    if (!app) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/apps/${params.installationId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embedMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });

      // Update local state
      setApp({
        ...app,
        settings: { ...app.settings, embedMode },
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !app) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
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
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h1 className="text-2xl font-bold">{app.manifest.name} Settings</h1>
        </div>
      </div>

      {/* Display Mode Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display Mode</CardTitle>
          <CardDescription>
            Configure how {app.manifest.name} appears in your platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="embed-mode" className="text-base">
                Embedded Mode
              </Label>
              <div className="text-sm text-muted-foreground">
                Display the app directly within the platform interface
              </div>
            </div>
            <Switch
              id="embed-mode"
              checked={embedMode}
              onCheckedChange={setEmbedMode}
            />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {embedMode ? (
                <>
                  <strong>Embedded Mode:</strong> The app will appear as an integrated part
                  of your platform. Users won't need to switch between windows.
                </>
              ) : (
                <>
                  <strong>External Window Mode:</strong> The app will open in a new browser
                  tab when accessed. This provides a full-screen experience.
                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              {embedMode ? <Frame className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
              Current Mode: {embedMode ? "Embedded" : "External Window"}
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {embedMode ? (
                <>
                  <li>✓ Seamless integration with your platform</li>
                  <li>✓ Consistent user experience</li>
                  <li>✓ No context switching</li>
                  <li>✓ Shared navigation and headers</li>
                </>
              ) : (
                <>
                  <li>✓ Full-screen app view</li>
                  <li>✓ Independent browser controls</li>
                  <li>✓ Can be used on multiple monitors</li>
                  <li>✓ Direct URL access</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/apps")}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm">App ID</Label>
            <p className="text-sm text-muted-foreground mt-1">{app.appId}</p>
          </div>
          <div>
            <Label className="text-sm">Homepage</Label>
            <p className="text-sm text-muted-foreground mt-1">{app.manifest.homepage}</p>
          </div>
          <div>
            <Label className="text-sm">Description</Label>
            <p className="text-sm text-muted-foreground mt-1">{app.manifest.description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}