"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowLeft,
  Database,
  RefreshCw,
  Download,
  Upload,
  Search,
} from "lucide-react";

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

interface DataRecord {
  id: string;
  [key: string]: any;
  created_at: string;
  updated_at: string;
}

export default function EntityDataPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DataRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const entityId = params.entityId as string;

  useEffect(() => {
    fetchEntityDetails();
    fetchRecords();
  }, [entityId]);

  const fetchEntityDetails = async () => {
    try {
      const response = await fetch(`/api/developer/entities/${entityId}`);
      if (response.ok) {
        const data = await response.json();
        setEntity(data.entity);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch entity details",
          variant: "destructive",
        });
        router.push("/developer");
      }
    } catch (error) {
      console.error("Error fetching entity:", error);
      toast({
        title: "Error",
        description: "Failed to fetch entity",
        variant: "destructive",
      });
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/developer/entities/${entityId}/data`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async () => {
    if (!entity) return;

    try {
      const response = await fetch(`/api/developer/entities/${entityId}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Record created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({});
        fetchRecords();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create record",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create record",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRecord = async () => {
    if (!entity || !editingRecord) return;

    try {
      const response = await fetch(
        `/api/developer/entities/${entityId}/data/${editingRecord.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Record updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingRecord(null);
        setFormData({});
        fetchRecords();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update record",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(
        `/api/developer/entities/${entityId}/data/${recordId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Record deleted successfully",
        });
        fetchRecords();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete record",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  const renderFormField = (field: EntityField) => {
    const value = formData[field.name] || "";

    switch (field.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.name}
              checked={value === true || value === "true"}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, [field.name]: checked })
              }
            />
            <Label htmlFor={field.name}>{field.name}</Label>
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: parseFloat(e.target.value) || 0 })
              }
              required={field.required}
            />
          </div>
        );

      case "date":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="datetime-local"
              value={value}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
            />
          </div>
        );

      case "json":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.name} (JSON)
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={typeof value === "object" ? JSON.stringify(value, null, 2) : value}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setFormData({ ...formData, [field.name]: parsed });
                } catch {
                  setFormData({ ...formData, [field.name]: e.target.value });
                }
              }}
              required={field.required}
              className="font-mono"
              rows={4}
            />
          </div>
        );

      default: // text
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="text"
              value={value}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
            />
          </div>
        );
    }
  };

  const filteredRecords = records.filter((record) => {
    if (!searchTerm) return true;
    return Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/developer")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{entity.name} Data</h1>
            <p className="text-muted-foreground">
              Manage records in {entity.tableName} table
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRecords}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData({})}>
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Record</DialogTitle>
                <DialogDescription>
                  Fill in the fields to create a new record
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {entity.fields.map((field) => (
                  <div key={field.name}>{renderFormField(field)}</div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setFormData({});
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateRecord}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{records.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Table Name</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{entity.tableName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{entity.fields.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Records</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {entity.fields.map((field) => (
                    <TableHead key={field.name}>
                      {field.name}
                      {field.required && <span className="text-red-500">*</span>}
                    </TableHead>
                  ))}
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={entity.fields.length + 2}
                      className="text-center py-8"
                    >
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={entity.fields.length + 2}
                      className="text-center py-8"
                    >
                      {searchTerm
                        ? "No records found matching your search"
                        : "No records yet. Create your first record."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      {entity.fields.map((field) => (
                        <TableCell key={field.name}>
                          {field.type === "boolean" ? (
                            <Badge variant={record[field.name] ? "default" : "secondary"}>
                              {record[field.name] ? "Yes" : "No"}
                            </Badge>
                          ) : field.type === "json" ? (
                            <code className="text-xs">
                              {JSON.stringify(record[field.name])}
                            </code>
                          ) : field.type === "date" ? (
                            record[field.name]
                              ? new Date(record[field.name]).toLocaleString()
                              : "-"
                          ) : (
                            record[field.name] || "-"
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        {new Date(record.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingRecord(record);
                                setFormData(record);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>Update the record fields</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {entity.fields.map((field) => (
              <div key={field.name}>{renderFormField(field)}</div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingRecord(null);
                setFormData({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRecord}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}