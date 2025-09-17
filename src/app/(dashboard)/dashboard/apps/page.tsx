"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Filter,
  Star,
  Download,
  Zap,
  Shield,
  Palette,
  Database,
  Mail,
  BarChart3,
  MessageSquare,
  CreditCard,
  Calendar,
  FileText,
  Users,
  Globe,
  Smartphone,
  Code,
  Bot,
} from "lucide-react";

const categories = [
  { id: "all", name: "All Apps", icon: Zap },
  { id: "productivity", name: "Productivity", icon: FileText },
  { id: "communication", name: "Communication", icon: MessageSquare },
  { id: "analytics", name: "Analytics", icon: BarChart3 },
  { id: "finance", name: "Finance", icon: CreditCard },
  { id: "marketing", name: "Marketing", icon: Mail },
  { id: "design", name: "Design", icon: Palette },
  { id: "developer", name: "Developer", icon: Code },
  { id: "ai", name: "AI & ML", icon: Bot },
];

const apps = [
  {
    id: 1,
    name: "Slack Integration",
    description: "Connect your team communication with powerful integrations",
    category: "communication",
    rating: 4.8,
    installs: "50K+",
    price: "Free",
    featured: true,
    icon: MessageSquare,
    tags: ["Team", "Chat", "Notifications"],
  },
  {
    id: 2,
    name: "Stripe Payments",
    description: "Accept payments and manage subscriptions seamlessly",
    category: "finance",
    rating: 4.9,
    installs: "100K+",
    price: "$9/month",
    featured: true,
    icon: CreditCard,
    tags: ["Payments", "Subscriptions", "E-commerce"],
  },
  {
    id: 3,
    name: "Google Analytics",
    description: "Track user behavior and app performance",
    category: "analytics",
    rating: 4.7,
    installs: "75K+",
    price: "Free",
    featured: false,
    icon: BarChart3,
    tags: ["Analytics", "Tracking", "Reports"],
  },
  {
    id: 4,
    name: "Notion Workspace",
    description: "Sync your workspace and manage content efficiently",
    category: "productivity",
    rating: 4.6,
    installs: "25K+",
    price: "$5/month",
    featured: false,
    icon: FileText,
    tags: ["Workspace", "Notes", "Collaboration"],
  },
  {
    id: 5,
    name: "SendGrid Email",
    description: "Powerful email delivery and marketing automation",
    category: "marketing",
    rating: 4.8,
    installs: "40K+",
    price: "$15/month",
    featured: true,
    icon: Mail,
    tags: ["Email", "Marketing", "Automation"],
  },
  {
    id: 6,
    name: "Figma Design",
    description: "Import designs and collaborate with your design team",
    category: "design",
    rating: 4.9,
    installs: "30K+",
    price: "Free",
    featured: false,
    icon: Palette,
    tags: ["Design", "Collaboration", "Prototyping"],
  },
  {
    id: 7,
    name: "GitHub Integration",
    description: "Connect your repositories and automate workflows",
    category: "developer",
    rating: 4.8,
    installs: "60K+",
    price: "Free",
    featured: false,
    icon: Code,
    tags: ["Git", "CI/CD", "Development"],
  },
  {
    id: 8,
    name: "OpenAI Assistant",
    description: "AI-powered chatbot and content generation",
    category: "ai",
    rating: 4.7,
    installs: "35K+",
    price: "$20/month",
    featured: true,
    icon: Bot,
    tags: ["AI", "Chatbot", "Content"],
  },
];

export default function AppsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || app.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedApps = [...filteredApps].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return parseInt(b.installs.replace(/\D/g, "")) - parseInt(a.installs.replace(/\D/g, ""));
      case "rating":
        return b.rating - a.rating;
      case "name":
        return a.name.localeCompare(b.name);
      case "price":
        return a.price === "Free" ? -1 : b.price === "Free" ? 1 : 0;
      default:
        return 0;
    }
  });

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
        <div className="flex items-center gap-3">
          <Button variant="outline">
            Submit Your App
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search apps, categories, or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Sort by: {sortBy}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortBy("popular")}>
              Most Popular
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("rating")}>
              Highest Rated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("name")}>
              Name A-Z
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("price")}>
              Price (Free First)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center gap-2"
            >
              <category.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Featured Apps */}
        {selectedCategory === "all" && (
          <TabsContent value="all" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Featured Apps</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {apps.filter(app => app.featured).map((app) => (
                  <Card key={app.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <app.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{app.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-muted-foreground">
                                  {app.rating}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {app.installs}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary">Featured</Badge>
                      </div>
                      <CardDescription>{app.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            {app.price}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {app.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Install
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        )}

        {/* All Apps */}
        <TabsContent value={selectedCategory} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {selectedCategory === "all" ? "All Apps" :
                 categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <span className="text-sm text-muted-foreground">
                {sortedApps.length} apps found
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedApps.map((app) => (
                <Card key={app.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <app.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{app.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-muted-foreground">
                              {app.rating}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {app.installs}
                          </span>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary text-sm">
                        {app.price}
                      </span>
                      <Button size="sm" variant="outline">
                        Install
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {sortedApps.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No apps found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or browse different categories.
          </p>
        </div>
      )}
    </div>
  );
}