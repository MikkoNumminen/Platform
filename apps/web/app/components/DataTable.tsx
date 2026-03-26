"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  TextField,
  InputAdornment,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { colors } from "../styles";

export interface Column<T> {
  id: string;
  label: string;
  accessor: (row: T) => string | number | Date;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyAccessor: (row: T) => string;
  defaultSortColumn?: string;
  defaultSortDirection?: "asc" | "desc";
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
}

type SortDirection = "asc" | "desc";

function compareValues(a: string | number | Date, b: string | number | Date): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

export default function DataTable<T>({
  columns,
  rows,
  keyAccessor,
  defaultSortColumn,
  defaultSortDirection = "asc",
  searchPlaceholder = "Search...",
  pageSize = 10,
  emptyMessage = "No data to display.",
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState(defaultSortColumn ?? "");
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const searchableColumns = columns.filter((c) => c.searchable !== false);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase();
    return rows.filter((row) =>
      searchableColumns.some((col) =>
        String(col.accessor(row)).toLowerCase().includes(query),
      ),
    );
  }, [rows, searchQuery, searchableColumns]);

  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const result = compareValues(col.accessor(a), col.accessor(b));
      return sortDirection === "asc" ? result : -result;
    });
  }, [filteredRows, sortColumn, sortDirection, columns]);

  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  function handleSort(columnId: string) {
    if (sortColumn === columnId) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
    setPage(0);
  }

  return (
    <Box>
      <TextField
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setPage(0);
        }}
        placeholder={searchPlaceholder}
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colors.slate400, fontSize: 20 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            color: colors.slate100,
            "& fieldset": { borderColor: colors.slate400 },
            "&:hover fieldset": { borderColor: colors.slate300 },
            "&.Mui-focused fieldset": { borderColor: colors.green400 },
          },
          "& .MuiInputBase-input::placeholder": {
            color: colors.slate400,
            opacity: 1,
          },
        }}
      />

      <TableContainer
        sx={{
          border: `1px solid ${colors.slate300}`,
          borderRadius: "4px",
          backgroundColor: colors.slate700,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  sx={{
                    color: colors.slate400,
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    borderColor: colors.slate300,
                  }}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={sortColumn === col.id}
                      direction={sortColumn === col.id ? sortDirection : "asc"}
                      onClick={() => handleSort(col.id)}
                      sx={{
                        color: `${colors.slate400} !important`,
                        "&.Mui-active": { color: `${colors.green400} !important` },
                        "& .MuiTableSortLabel-icon": {
                          color: `${colors.green400} !important`,
                        },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  sx={{
                    textAlign: "center",
                    py: 4,
                    color: colors.slate400,
                    borderColor: colors.slate300,
                  }}
                >
                  <Typography variant="body2">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow
                  key={keyAccessor(row)}
                  sx={{
                    "&:hover": { backgroundColor: colors.hoverOverlay },
                    "& td": { borderColor: colors.slate300 },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      sx={{ color: colors.slate100, fontSize: "0.85rem" }}
                    >
                      {col.render ? col.render(row) : String(col.accessor(row))}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {sortedRows.length > rowsPerPage && (
        <TablePagination
          component="div"
          count={sortedRows.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            color: colors.slate400,
            "& .MuiTablePagination-selectIcon": { color: colors.slate400 },
            "& .MuiIconButton-root": { color: colors.slate400 },
            "& .MuiIconButton-root.Mui-disabled": { color: colors.slate300 },
          }}
        />
      )}
    </Box>
  );
}
