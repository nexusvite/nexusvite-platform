'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Webhook,
  Terminal,
  Key,
  FileCode,
  Activity,
  Users,
  Package,
  Settings,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  entities: number;
  totalRecords: number;
  webhooks: number;
  activeWebhooks: number;
  apiCalls: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
}

export default function DeveloperOverviewPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    entities: 0,
    totalRecords: 0,
    webhooks: 0,
    activeWebhooks: 0,
    apiCalls: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch entities
      const entitiesRes = await fetch('/api/developer/entities');
      const entitiesData = await entitiesRes.json();

      // Fetch webhooks
      const webhooksRes = await fetch('/api/developer/webhooks');
      const webhooksData = await webhooksRes.json();

      // Calculate stats
      const entities = entitiesData.entities || [];
      const webhooks = webhooksData.webhooks || [];

      const totalRecords = entities.reduce((acc: number, entity: any) => acc + (entity.recordCount || 0), 0);
      const activeWebhooks = webhooks.filter((w: any) => w.active).length;

      // Mock recent activity (in a real app, this would come from an API)
      const recentActivity = [
        {
          id: '1',
          type: 'entity',
          description: 'Entity "Products" created',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'success' as const,
        },
        {
          id: '2',
          type: 'webhook',
          description: 'Webhook delivery to https://api.example.com/hook',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'success' as const,
        },
        {
          id: '3',
          type: 'api',
          description: 'API call to /api/developer/entities',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          status: 'success' as const,
        },
        {
          id: '4',
          type: 'entity',
          description: 'Failed to create entity "Invalid"',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          status: 'error' as const,
        },
      ];

      setStats({
        entities: entities.length,
        totalRecords,
        webhooks: webhooks.length,
        activeWebhooks,
        apiCalls: 150, // Mock value
        recentActivity,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const features = [
    {
      title: 'Entity Management',
      description: 'Create and manage dynamic entities with real database tables',
      icon: Database,
      href: '/developer/entities',
      stats: `${stats.entities} entities`,
      color: 'text-blue-500',
    },
    {
      title: 'API Explorer',
      description: 'Test and explore API endpoints with real-time responses',
      icon: Terminal,
      href: '/developer/api',
      stats: `${stats.apiCalls} calls today`,
      color: 'text-green-500',
    },
    {
      title: 'Webhooks',
      description: 'Configure webhooks to receive real-time event notifications',
      icon: Webhook,
      href: '/developer/webhooks',
      stats: `${stats.activeWebhooks} active`,
      color: 'text-purple-500',
    },
    {
      title: 'API Keys',
      description: 'Manage API keys for secure access to your applications',
      icon: Key,
      href: '/developer/keys',
      stats: 'Coming soon',
      color: 'text-orange-500',
    },
    {
      title: 'Integrations',
      description: 'Connect with third-party services and platforms',
      icon: Package,
      href: '/developer/integrations',
      stats: 'Coming soon',
      color: 'text-pink-500',
    },
    {
      title: 'Documentation',
      description: 'Comprehensive API documentation and guides',
      icon: FileCode,
      href: '/developer/docs',
      stats: 'View docs',
      color: 'text-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Developer Portal</h1>
        <p className="text-muted-foreground">
          Build powerful integrations and manage your application ecosystem
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Entities
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.entities}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalRecords} total records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Webhooks
              </CardTitle>
              <Webhook className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWebhooks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats.webhooks} configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                API Calls Today
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.apiCalls}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                System Status
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Operational</div>
            <p className="text-xs text-muted-foreground mt-1">
              All systems running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <Link key={feature.title} href={feature.href}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  <Badge variant="secondary" className="text-xs">
                    {feature.stats}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Explore
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest events and actions in your developer portal
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 pb-3 border-b last:border-0 last:pb-0"
                >
                  {getActivityIcon(activity.status)}
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts for developers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/developer/entities">
                <Database className="h-4 w-4 mr-2" />
                Create Entity
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/developer/api">
                <Terminal className="h-4 w-4 mr-2" />
                Test API
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/developer/webhooks">
                <Webhook className="h-4 w-4 mr-2" />
                Add Webhook
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/developer/docs">
                <FileCode className="h-4 w-4 mr-2" />
                View Docs
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}