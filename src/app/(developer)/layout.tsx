"use client";

import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  Search,
  Code2,
  Home,
  Database,
  Terminal,
  GitBranch,
  Layers,
  Key,
  FileCode,
  Zap,
  ArrowLeft,
  Workflow,
  Plug
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const developerNavItems = [
  {
    title: "Overview",
    href: "/developer",
    icon: Home,
    description: "Developer portal dashboard"
  },
  {
    title: "Entities",
    href: "/developer/entities",
    icon: Database,
    description: "Manage dynamic entities"
  },
  {
    title: "API Explorer",
    href: "/developer/api",
    icon: Terminal,
    description: "Test and explore APIs"
  },
  {
    title: "Webhooks",
    href: "/developer/webhooks",
    icon: GitBranch,
    description: "Configure webhooks"
  },
  {
    title: "Workflows",
    href: "/developer/workflows",
    icon: Workflow,
    description: "Automation workflows"
  },
  {
    title: "Integrations",
    href: "/developer/integrations",
    icon: Plug,
    description: "Third-party integrations"
  },
  {
    title: "API Keys",
    href: "/developer/keys",
    icon: Key,
    description: "Manage API keys"
  },
  {
    title: "Documentation",
    href: "/developer/docs",
    icon: FileCode,
    description: "API documentation"
  },
];

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Logo and Portal Title */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/developer" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Code2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold">Developer</span>
                <span className="text-xs text-muted-foreground block -mt-1">Portal</span>
              </div>
            </Link>
          </div>

          {/* Back to Platform */}
          <div className="px-4 py-2 border-b">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Platform
              </Button>
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-1">
              {developerNavItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/developer" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors group",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      {!isActive && (
                        <div className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Developer Info Card */}
          <div className="p-4 border-t">
            <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Developer Mode</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Build powerful integrations and manage your app ecosystem
              </p>
              <Link href="/developer/docs">
                <Button size="sm" variant="secondary" className="w-full">
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-6">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <div className="flex h-full flex-col">
                {/* Logo and Portal Title */}
                <div className="flex h-16 items-center border-b px-6">
                  <Link href="/developer" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <Code2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <span className="text-lg font-bold">Developer</span>
                      <span className="text-xs text-muted-foreground block -mt-1">Portal</span>
                    </div>
                  </Link>
                </div>

                {/* Back to Platform */}
                <div className="px-4 py-2 border-b">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Platform
                    </Button>
                  </Link>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 px-4 py-4">
                  <nav className="space-y-1">
                    {developerNavItems.map((item) => {
                      const isActive = pathname === item.href ||
                        (item.href !== "/developer" && pathname?.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documentation, APIs..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.avatar || ""}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4" />
                    Platform Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}