import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

interface DynamicTableProps {
  data: Record<string, any>;
  sectionName: string;
}

export function DynamicTable({ data, sectionName }: DynamicTableProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card/50 rounded-lg border border-dashed">
        <p className="text-muted-foreground">No data available for {sectionName}</p>
      </div>
    );
  }

  let rows: any[] = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (typeof data === "object") {
    const values = Object.values(data);
    if (values.length > 0 && typeof values[0] === "object" && values[0] !== null) {
      rows = Object.entries(data).map(([key, value]) => ({ _id: key, ...value }));
    } else {
      rows = [data];
    }
  }

  if (rows.length === 0) return null;

  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter((key) => key !== "_id");
  if (rows.some((r) => r._id)) columns.unshift("_id");

  const formatHeader = (key: string) => {
    if (key === "_id") return "Identifier";
    return key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  };

  const renderCell = (value: any, key: string) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"} className={value ? "bg-green-500/10 text-green-700" : ""}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    }
    if (typeof value === "number") {
      if (key.toLowerCase().includes("percent") || key.toLowerCase().includes("rate") || (value <= 100 && value > 0 && key.toLowerCase().includes("attendance"))) {
        return (
          <div className="flex items-center gap-2">
            <span className="w-12 text-right">{value}%</span>
            <Progress value={value} className="h-2 w-24" />
          </div>
        );
      }
      if (key.toLowerCase().includes("rating") && value <= 5) {
        return (
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < value ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`} />
            ))}
            <span className="ml-2 text-xs text-muted-foreground">{value}</span>
          </div>
        );
      }
      return value.toLocaleString();
    }
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (["done", "resolved", "completed", "green", "active"].includes(lower)) {
        return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200">{value}</Badge>;
      }
      if (["pending", "open", "red", "critical", "high"].includes(lower)) {
        return <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200">{value}</Badge>;
      }
      if (["delayed", "in-progress", "yellow", "orange", "medium"].includes(lower)) {
        return <Badge className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border-orange-200">{value}</Badge>;
      }
      return value;
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={col} className="whitespace-nowrap font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  {formatHeader(col)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                {columns.map((col) => (
                  <TableCell key={col} className="py-3">{renderCell(row[col], col)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
