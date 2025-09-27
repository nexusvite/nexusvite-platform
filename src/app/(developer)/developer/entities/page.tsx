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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Database,
  Code,
  Settings,
  Trash2,
  Edit,
  Eye,
  X,
  ArrowRight,
  Table as TableIcon,
  Key,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  FileJson,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Field type definitions
const FIELD_TYPES = [
  { value: "text", label: "Text", icon: Type },
  { value: "number", label: "Number", icon: Hash },
  { value: "boolean", label: "Boolean", icon: ToggleLeft },
  { value: "date", label: "Date", icon: Calendar },
  { value: "json", label: "JSON", icon: FileJson },
] as const;

// Entity creation schema
const entitySchema = z.object({
  name: z.string().min(1, "Entity name is required"),
  tableName: z.string().min(1, "Table name is required").regex(/^[a-z_][a-z0-9_]*$/, "Table name must be lowercase with underscores only"),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(["text", "number", "boolean", "date", "json"]),
    required: z.boolean(),
    unique: z.boolean(),
    defaultValue: z.string().optional(),
  })).min(1, "At least one field is required"),
});

type EntityFormValues = z.infer<typeof entitySchema>;

interface EntityField {
  name: string;
  type: "text" | "number" | "boolean" | "date" | "json";
  required: boolean;
  unique: boolean;
  defaultValue?: string;
}

interface Entity {
  id: string;
  name: string;
  tableName: string;
  description?: string;
  fields: EntityField[];
  createdAt: string;
  recordCount: number;
}

export default function DeveloperPage() {
  const { toast } = useToast();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fields, setFields] = useState<EntityField[]>([
    { name: "name", type: "text", required: true, unique: false }
  ]);
  const [loading, setLoading] = useState(false);

  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      name: "",
      tableName: "",
      description: "",
      fields: fields,
    },
  });

  // Fetch entities
  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      const response = await fetch("/api/developer/entities");
      if (response.ok) {
        const data = await response.json();
        setEntities(data.entities || []);
      }
    } catch (error) {
      console.error("Error fetching entities:", error);
      toast({
        title: "Error",
        description: "Failed to fetch entities",
        variant: "destructive",
      });
    }
  };

  // Add field to form
  const addField = () => {
    setFields([
      ...fields,
      { name: "", type: "text", required: false, unique: false }
    ]);
  };

  // Remove field from form
  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // Update field in form
  const updateField = (index: number, field: EntityField) => {
    const updatedFields = [...fields];
    updatedFields[index] = field;
    setFields(updatedFields);
  };

  // Create entity
  const onSubmit = async (values: EntityFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/developer/entities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          fields: fields.filter(f => f.name), // Filter out empty fields
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Entity "${values.name}" created successfully`,
        });
        setIsCreateDialogOpen(false);
        fetchEntities();
        form.reset();
        setFields([{ name: "name", type: "text", required: true, unique: false }]);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create entity",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create entity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete entity
  const deleteEntity = async (entityId: string) => {
    if (!confirm("Are you sure you want to delete this entity? This will also delete all associated data.")) {
      return;
    }

    try {
      const response = await fetch(`/api/developer/entities/${entityId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Entity deleted successfully",
        });
        fetchEntities();
        setSelectedEntity(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete entity",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entity",
        variant: "destructive",
      });
    }
  };

  // Generate table name from entity name
  const generateTableName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entity Management</h1>
          <p className="text-muted-foreground">
            Create and manage dynamic entities with database tables
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Entity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Entity</DialogTitle>
              <DialogDescription>
                Define your entity structure and it will create a real database table
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entity Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Product"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            form.setValue("tableName", generateTableName(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tableName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., products" {...field} />
                      </FormControl>
                      <FormDescription>
                        Database table name (lowercase with underscores)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this entity..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Fields</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addField}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Field
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-3">
                              <Label>Field Name</Label>
                              <Input
                                placeholder="field_name"
                                value={field.name}
                                onChange={(e) =>
                                  updateField(index, { ...field, name: e.target.value })
                                }
                              />
                            </div>
                            <div className="col-span-3">
                              <Label>Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) =>
                                  updateField(index, { ...field, type: value as EntityField["type"] })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FIELD_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center">
                                        <type.icon className="mr-2 h-4 w-4" />
                                        {type.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Label>Required</Label>
                              <div className="flex items-center h-10">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) =>
                                    updateField(index, { ...field, required: checked })
                                  }
                                />
                              </div>
                            </div>
                            <div className="col-span-2">
                              <Label>Unique</Label>
                              <div className="flex items-center h-10">
                                <Switch
                                  checked={field.unique}
                                  onCheckedChange={(checked) =>
                                    updateField(index, { ...field, unique: checked })
                                  }
                                />
                              </div>
                            </div>
                            <div className="col-span-2 flex items-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeField(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Create Entity
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Entity Tabs */}
      <Tabs defaultValue="entities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entities">
            <Database className="mr-2 h-4 w-4" />
            Entities
          </TabsTrigger>
          <TabsTrigger value="schema">
            <Code className="mr-2 h-4 w-4" />
            Schema Viewer
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Entity List */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Entities</CardTitle>
                  <CardDescription>
                    Select an entity to view details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {entities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No entities created yet
                        </p>
                      ) : (
                        entities.map((entity) => (
                          <button
                            key={entity.id}
                            onClick={() => setSelectedEntity(entity)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              selectedEntity?.id === entity.id
                                ? "bg-primary/10 border border-primary"
                                : "hover:bg-accent"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{entity.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {entity.tableName}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                {entity.recordCount} records
                              </Badge>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Entity Details */}
            <div className="md:col-span-2">
              {selectedEntity ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedEntity.name}</CardTitle>
                        <CardDescription>
                          Table: {selectedEntity.tableName}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(`/developer/entities/${selectedEntity.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteEntity(selectedEntity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedEntity.description || "No description provided"}
                        </p>
                      </div>

                      <div>
                        <Label className="mb-2 block">Fields</Label>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Required</TableHead>
                              <TableHead>Unique</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedEntity.fields.map((field, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono text-sm">
                                  {field.name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {field.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {field.required ? (
                                    <Badge variant="default">Yes</Badge>
                                  ) : (
                                    <Badge variant="secondary">No</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {field.unique ? (
                                    <Badge variant="default">Yes</Badge>
                                  ) : (
                                    <Badge variant="secondary">No</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="pt-4">
                        <Button className="w-full" asChild>
                          <a href={`/developer/entities/${selectedEntity.id}`}>
                            <TableIcon className="mr-2 h-4 w-4" />
                            View Data Table
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-[600px]">
                    <Database className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select an entity to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Schema Viewer Tab */}
        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>
                View generated SQL schemas for your entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entities.map((entity) => (
                  <div key={entity.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4" />
                      <span className="font-medium">{entity.tableName}</span>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-xs font-mono">
{`CREATE TABLE ${entity.tableName} (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
${entity.fields.map(field => {
  let sqlType = field.type === "text" ? "TEXT" :
                field.type === "number" ? "NUMERIC" :
                field.type === "boolean" ? "BOOLEAN" :
                field.type === "date" ? "TIMESTAMP" :
                field.type === "json" ? "JSONB" : "TEXT";
  let constraints = [];
  if (field.required) constraints.push("NOT NULL");
  if (field.unique) constraints.push("UNIQUE");
  return `  ${field.name} ${sqlType}${constraints.length ? ' ' + constraints.join(' ') : ''}`;
}).join(',\n')},
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Developer Settings</CardTitle>
              <CardDescription>
                Configure developer console settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-generate API Endpoints</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically create REST API endpoints for entities
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable GraphQL</p>
                  <p className="text-sm text-muted-foreground">
                    Generate GraphQL schema and resolvers
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Audit Logging</p>
                  <p className="text-sm text-muted-foreground">
                    Track all changes to entities
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}