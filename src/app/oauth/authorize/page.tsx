"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Shield, AlertCircle } from "lucide-react";

function AuthorizeContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // For demo, we'll assume user is logged in
  const user = { id: "user_1", email: "admin@nexusvite.com", name: "Admin User" };

  // Get OAuth parameters
  const clientId = searchParams.get("client_id") || "com.nexusvite.analytics";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const responseType = searchParams.get("response_type") || "code";
  const scope = searchParams.get("scope") || "";
  const state = searchParams.get("state") || "";

  // Parse scopes
  const scopes = scope.split(" ").filter(Boolean);

  // For demo, we'll use the Analytics app info
  const appInfo = {
    name: "Analytics Dashboard",
    description: "Advanced analytics and reporting for NexusVite platform",
    icon: "/apps/analytics-icon.png",
    vendor: "NexusVite",
  };

  const scopeDescriptions: Record<string, string> = {
    "read:users": "View user information",
    "read:organizations": "Access organization data",
    "read:apps": "View installed apps",
    "read:transactions": "Access transaction history",
    "write:users": "Modify user information",
    "write:organizations": "Modify organization settings",
  };

  const handleAuthorize = async () => {
    setLoading(true);

    // Auto-install app if not already installed
    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appId: clientId,
          userId: user?.id || "user_1",
        }),
      });

      if (!response.ok && response.status !== 409) {
        // 409 means already installed, which is fine
        console.error("Failed to auto-install app");
      }
    } catch (error) {
      console.error("Auto-install error:", error);
    }

    // Generate authorization code
    const authCode = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store auth code in sessionStorage for token exchange
    sessionStorage.setItem(`oauth_${authCode}`, JSON.stringify({
      clientId,
      redirectUri,
      scope,
      userId: user?.id || "user_1",
      timestamp: Date.now(),
    }));

    // Redirect back to app with auth code
    const params = new URLSearchParams({
      code: authCode,
      state: state,
    });

    window.location.href = `${redirectUri}?${params.toString()}`;
  };

  const handleDeny = () => {
    // Redirect back with error
    const params = new URLSearchParams({
      error: "access_denied",
      error_description: "User denied authorization",
      state: state,
    });

    window.location.href = `${redirectUri}?${params.toString()}`;
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Authorize Application</CardTitle>
          <CardDescription>
            {appInfo.name} is requesting access to your NexusVite account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* App Info */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{appInfo.name}</h3>
                <p className="text-sm text-muted-foreground">{appInfo.description}</p>
                <p className="text-xs text-muted-foreground mt-1">By {appInfo.vendor}</p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h3 className="font-semibold mb-3">This app will be able to:</h3>
            <div className="space-y-2">
              {scopes.map((scope) => (
                <div key={scope} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">
                    {scopeDescriptions[scope] || scope}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Make sure you trust {appInfo.vendor}. You can revoke access at any time from your account settings.
            </AlertDescription>
          </Alert>

          {/* User Info */}
          <div className="text-center text-sm text-muted-foreground">
            Authorizing as <strong>{user.email}</strong>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDeny}
              disabled={loading}
            >
              Deny
            </Button>
            <Button
              className="flex-1"
              onClick={handleAuthorize}
              disabled={loading}
            >
              {loading ? "Authorizing..." : "Authorize"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <AuthorizeContent />
    </Suspense>
  );
}