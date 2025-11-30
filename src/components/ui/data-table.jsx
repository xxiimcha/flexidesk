// src/components/ui/data-table.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Loader2 } from "lucide-react";

export function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found.",
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  className = "",
}) {
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const pageData = useMemo(() => {
    const start = page * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, page, pageSize]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [totalPages, page]);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className={className}>
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="sticky top-0 z-20 bg-background">
            {columns.map((col) => (
              <TableHead
                key={col.id}
                className={`h-11 border-b align-middle ${
                  col.headerClassName || ""
                } ${col.align === "right" ? "text-right" : ""}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                <Loader2 className="inline h-5 w-5 animate-spin mr-2" />
                Loading…
              </TableCell>
            </TableRow>
          ) : pageData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            pageData.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                className="hover:bg-brand/10 transition-colors"
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={`align-middle ${
                      col.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {col.cell ? col.cell(row) : row[col.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-2 py-3 text-xs text-muted-foreground">
        <div>
          Page {page + 1} of {totalPages} • {data.length} row(s)
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-7 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={goPrev}
            disabled={page === 0}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={goNext}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
