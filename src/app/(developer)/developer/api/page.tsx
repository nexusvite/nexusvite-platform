"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Copy,
  Save,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  X,
  FileJson,
  Code,
  Server,
  Globe,
  Key,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  category: string;
  requiresAuth: boolean;
  params?: Record<string, any>;
  body?: Record<string, any>;
}

interface SavedRequest {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: string;
}

const API_CATEGORIES = [
  { value: "all", label: "All Endpoints" },
  { value: "auth", label: "Authentication" },
  { value: "entities", label: "Developer Entities" },
  { value: "apps", label: "Applications" },
  { value: "teams", label: "Teams" },
  { value: "portal", label: "Portal" },
];

const COMMON_ENDPOINTS: ApiEndpoint[] = [
  // Auth
  {
    path: "/api/auth/get-session",
    method: "GET",
    description: "Get current user session",
    category: "auth",
    requiresAuth: false,
  },
  {
    path: "/api/auth/sign-in/email",
    method: "POST",
    description: "Sign in with email and password",
    category: "auth",
    requiresAuth: false,
    body: {
      email: "user@example.com",
      password: "password123",
    },
  },
  {
    path: "/api/auth/sign-up/email",
    method: "POST",
    description: "Register new user",
    category: "auth",
    requiresAuth: false,
    body: {
      name: "John Doe",
      email: "user@example.com",
      password: "password123",
    },
  },
  // Developer Entities
  {
    path: "/api/developer/entities",
    method: "GET",
    description: "List all developer entities",
    category: "entities",
    requiresAuth: true,
  },
  {
    path: "/api/developer/entities",
    method: "POST",
    description: "Create new entity",
    category: "entities",
    requiresAuth: true,
    body: {
      name: "EntityName",
      tableName: "entity_table",
      description: "Entity description",
      fields: [
        {
          name: "field_name",
          type: "text",
          required: true,
          unique: false,
        },
      ],
    },
  },
  {
    path: "/api/developer/entities/{entityId}",
    method: "GET",
    description: "Get entity details",
    category: "entities",
    requiresAuth: true,
    params: {
      entityId: "entity-id-here",
    },
  },
  {
    path: "/api/developer/entities/{entityId}",
    method: "DELETE",
    description: "Delete entity",
    category: "entities",
    requiresAuth: true,
    params: {
      entityId: "entity-id-here",
    },
  },
  {
    path: "/api/developer/entities/{entityId}/data",
    method: "GET",
    description: "Get entity data records",
    category: "entities",
    requiresAuth: true,
    params: {
      entityId: "entity-id-here",
    },
  },
  {
    path: "/api/developer/entities/{entityId}/data",
    method: "POST",
    description: "Create new data record",
    category: "entities",
    requiresAuth: true,
    params: {
      entityId: "entity-id-here",
    },
    body: {
      // Dynamic based on entity fields
    },
  },
  // Apps
  {
    path: "/api/apps",
    method: "GET",
    description: "List all apps",
    category: "apps",
    requiresAuth: false,
    params: {
      installed: "true",
    },
  },
  // Teams
  {
    path: "/api/teams",
    method: "GET",
    description: "List user teams",
    category: "teams",
    requiresAuth: true,
  },
  // Portal
  {
    path: "/api/portal/stats",
    method: "GET",
    description: "Get portal statistics",
    category: "portal",
    requiresAuth: true,
  },
];

export default function ApiExplorerPage() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("http://localhost:3000/api/");
  const [headers, setHeaders] = useState<Record<string, string>>({
    "Content-Type": "application/json",
  });
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [showSavedRequests, setShowSavedRequests] = useState(false);
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: "", value: "" },
  ]);

  // Load saved requests from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("api-explorer-requests");
    if (saved) {
      setSavedRequests(JSON.parse(saved));
    }
  }, []);

  // Filter endpoints by category
  const filteredEndpoints =
    selectedCategory === "all"
      ? COMMON_ENDPOINTS
      : COMMON_ENDPOINTS.filter((ep) => ep.category === selectedCategory);

  // Select an endpoint
  const selectEndpoint = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setMethod(endpoint.method);

    let path = endpoint.path;
    if (endpoint.params) {
      Object.entries(endpoint.params).forEach(([key, value]) => {
        path = path.replace(`{${key}}`, value);
      });
    }

    setUrl(`http://localhost:3000${path}`);

    if (endpoint.body) {
      setBody(JSON.stringify(endpoint.body, null, 2));
    } else {
      setBody("");
    }
  };

  // Add custom header
  const addHeader = () => {
    setCustomHeaders([...customHeaders, { key: "", value: "" }]);
  };

  // Remove custom header
  const removeHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  // Update custom header
  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const updated = [...customHeaders];
    updated[index][field] = value;
    setCustomHeaders(updated);
  };

  // Send request
  const sendRequest = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      // Merge custom headers with default headers
      const allHeaders: Record<string, string> = { ...headers };
      customHeaders.forEach((header) => {
        if (header.key) {
          allHeaders[header.key] = header.value;
        }
      });

      // Get auth token if available
      const authResponse = await fetch("/api/auth/get-session");
      if (authResponse.ok) {
        const session = await authResponse.json();
        if (session?.session?.token) {
          allHeaders["Authorization"] = `Bearer ${session.session.token}`;
        }
      }

      const options: RequestInit = {
        method,
        headers: allHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && body) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      let responseData;
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseSize = new Blob([JSON.stringify(responseData)]).size;

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data: responseData,
        time: responseTime,
        size: `${(responseSize / 1024).toFixed(2)} KB`,
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  // Save request
  const saveRequest = () => {
    const name = prompt("Enter a name for this request:");
    if (!name) return;

    const newRequest: SavedRequest = {
      id: Date.now().toString(),
      name,
      endpoint: url,
      method,
      headers,
      body,
      timestamp: new Date().toISOString(),
    };

    const updated = [...savedRequests, newRequest];
    setSavedRequests(updated);
    localStorage.setItem("api-explorer-requests", JSON.stringify(updated));

    toast({
      title: "Request Saved",
      description: `Saved as "${name}"`,
    });
  };

  // Load saved request
  const loadRequest = (request: SavedRequest) => {
    setUrl(request.endpoint);
    setMethod(request.method);
    setHeaders(request.headers);
    setBody(request.body);
    setShowSavedRequests(false);
  };

  // Delete saved request
  const deleteRequest = (id: string) => {
    const updated = savedRequests.filter((r) => r.id !== id);
    setSavedRequests(updated);
    localStorage.setItem("api-explorer-requests", JSON.stringify(updated));
  };

  // Copy response
  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      toast({
        title: "Copied",
        description: "Response copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Explorer</h1>
        <p className="text-muted-foreground">
          Test and explore API endpoints with real-time responses
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoints List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Endpoints</CardTitle>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {API_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filteredEndpoints.map((endpoint, index) => (
                    <button
                      key={index}
                      onClick={() => selectEndpoint(endpoint)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        selectedEndpoint === endpoint
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            endpoint.method === "GET"
                              ? "default"
                              : endpoint.method === "POST"
                              ? "secondary"
                              : endpoint.method === "DELETE"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {endpoint.method}
                        </Badge>
                        {endpoint.requiresAuth && (
                          <Key className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-sm font-mono">{endpoint.path}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {endpoint.description}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Request Builder & Response */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Builder */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Request</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSavedRequests(!showSavedRequests)}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Saved ({savedRequests.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveRequest}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL Bar */}
              <div className="flex gap-2">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter API endpoint URL"
                  className="flex-1"
                />
                <Button onClick={sendRequest} disabled={loading}>
                  {loading ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>

              {/* Request Tabs */}
              <Tabs defaultValue="body">
                <TabsList>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="auth">Auth</TabsTrigger>
                </TabsList>

                <TabsContent value="body" className="space-y-2">
                  <Label>Request Body (JSON)</Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="font-mono min-h-[200px]"
                  />
                </TabsContent>

                <TabsContent value="headers" className="space-y-2">
                  <Label>Custom Headers</Label>
                  <div className="space-y-2">
                    {customHeaders.map((header, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Header name"
                          value={header.key}
                          onChange={(e) => updateHeader(index, "key", e.target.value)}
                        />
                        <Input
                          placeholder="Header value"
                          value={header.value}
                          onChange={(e) => updateHeader(index, "value", e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHeader(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addHeader}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Header
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="auth" className="space-y-2">
                  <Label>Authentication</Label>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Authentication is automatically included from your current session.
                      Sign in to test authenticated endpoints.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Response */}
          {response && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Response</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge
                        variant={
                          response.status >= 200 && response.status < 300
                            ? "default"
                            : response.status >= 400
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {response.status} {response.statusText}
                      </Badge>
                      <span className="text-muted-foreground">
                        {response.time}ms
                      </span>
                      <span className="text-muted-foreground">{response.size}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={copyResponse}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="body">
                  <TabsList>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>

                  <TabsContent value="body">
                    <ScrollArea className="h-[400px]">
                      <pre className="text-sm font-mono p-4 bg-muted rounded-lg">
                        {typeof response.data === "object"
                          ? JSON.stringify(response.data, null, 2)
                          : response.data}
                      </pre>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="headers">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2 p-4 bg-muted rounded-lg">
                        {Object.entries(response.headers).map(([key, value]) => (
                          <div key={key} className="text-sm font-mono">
                            <span className="text-primary">{key}:</span>{" "}
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="raw">
                    <ScrollArea className="h-[400px]">
                      <pre className="text-sm font-mono p-4 bg-muted rounded-lg">
                        {JSON.stringify(response, null, 2)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Saved Requests */}
          {showSavedRequests && savedRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Saved Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{request.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.method} {request.endpoint}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(request.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadRequest(request)}
                        >
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRequest(request.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}