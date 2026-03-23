"use client";
import React, { ReactNode } from "react";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
  width?: string;
  sortable?: boolean;
}

interface TableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  loading?: boolean;
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: (row: Record<string, unknown>) => ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  noDataMessage?: string;
}

export default function Table({
  columns,
  data,
  loading = false,
  onRowClick,
  actions,
  striped = true,
  hoverable = true,
  compact = false,
  noDataMessage = "No data available",
}: TableProps) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={`text-left font-semibold text-gray-700 ${compact ? "px-3 py-2 text-sm" : "px-6 py-3 text-sm"}`}
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th
                className={`text-left font-semibold text-gray-700 ${compact ? "px-3 py-2 text-sm" : "px-6 py-3 text-sm"}`}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="text-center py-8"
              >
                <div className="flex items-center justify-center">
                  <span className="text-gray-500">Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="text-center py-8"
              >
                <span className="text-gray-500">{noDataMessage}</span>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-gray-200 transition-colors ${striped && idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } ${hoverable ? "hover:bg-blue-50 cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`text-gray-900 ${compact ? "px-3 py-2 text-sm" : "px-6 py-3 text-sm"}`}
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                  </td>
                ))}
                {actions && (
                  <td
                    className={`${compact ? "px-3 py-2 text-sm" : "px-6 py-3 text-sm"}`}
                  >
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}