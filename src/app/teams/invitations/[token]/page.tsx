"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Params {
  params: Promise<{
    token: string;
  }>;
}

interface InvitationDetails {
  id: string;
  teamId: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  team: {
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
  };
  invitedBy: {
    name: string | null;
    email: string;
  };
}

export default function AcceptInvitation({ params }: Params) {
  const { token } = use(params);
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/teams/invitations/${token}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch invitation");
      }

      const data = await response.json();
      setInvitation(data);
    } catch (error: any) {
      console.error("Error fetching invitation:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/invitations/${token}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept invitation");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/team");
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAccepting(false);
    }
  };

  const declineInvitation = async () => {
    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/invitations/${token}/decline`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to decline invitation");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-center">Success!</CardTitle>
            <CardDescription className="text-center">
              Redirecting you to the team dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isExpired = invitation && new Date(invitation.expiresAt) < new Date();
  const isAlreadyAccepted = invitation?.status === "accepted";

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-center">Team Invitation</CardTitle>
          {invitation && (
            <CardDescription className="text-center">
              You've been invited to join <strong>{invitation.team.name}</strong>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {invitation && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Team</span>
                  <span className="font-medium">{invitation.team.name}</span>
                </div>
                {invitation.team.description && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Description</span>
                    <span className="text-sm">{invitation.team.description}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Role</span>
                  <Badge variant="secondary">{invitation.role}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Invited By</span>
                  <span className="text-sm">
                    {invitation.invitedBy.name || invitation.invitedBy.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Members</span>
                  <span className="text-sm">{invitation.team.memberCount} members</span>
                </div>
                {!isExpired && !isAlreadyAccepted && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expires</span>
                    <span className="text-sm">
                      {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isExpired && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Invitation Expired</AlertTitle>
                  <AlertDescription>
                    This invitation has expired. Please contact the team administrator for a new invitation.
                  </AlertDescription>
                </Alert>
              )}

              {isAlreadyAccepted && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Already Accepted</AlertTitle>
                  <AlertDescription>
                    You've already accepted this invitation.
                  </AlertDescription>
                </Alert>
              )}

              {!isExpired && !isAlreadyAccepted && (
                <div className="flex gap-3">
                  <Button
                    onClick={acceptInvitation}
                    disabled={accepting}
                    className="flex-1"
                  >
                    {accepting ? "Processing..." : "Accept Invitation"}
                  </Button>
                  <Button
                    onClick={declineInvitation}
                    disabled={accepting}
                    variant="outline"
                    className="flex-1"
                  >
                    Decline
                  </Button>
                </div>
              )}

              {(isExpired || isAlreadyAccepted) && (
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}