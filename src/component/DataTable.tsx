import React from "react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
}

function DataTable<T extends Record<string, any>>({ 
  columns, 
  data, 
  className = "",
  emptyMessage = "Tidak ada data tersedia"
}: DataTableProps<T>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.align === "center" ? "text-center" : 
                  column.align === "right" ? "text-right" : 
                  "text-left"
                } ${column.className || ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => {
                  const value = row[column.key];
                  const content = column.render 
                    ? column.render(value, row, rowIndex)
                    : value ?? "-";

                  return (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                        column.align === "center" ? "text-center" : 
                        column.align === "right" ? "text-right" : 
                        "text-left"
                      } ${column.className || ""}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
