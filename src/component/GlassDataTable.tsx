import React from "react";
import GlassCard from "./Glasscard";

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

interface GlassDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
  variant?: "glass" | "flat";
}

/** WhiteCard di dalam GlassCard */
const WhiteCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = "",
}) => (
  <div className={`bg-white rounded-xl shadow-sm border border-[#E9EEF3] ${className}`}>
    {children}
  </div>
);

function GlassDataTable<T extends Record<string, any>>({
  columns,
  data,
  className = "",
  emptyMessage = "Tidak ada data tersedia",
  variant = "glass",
}: GlassDataTableProps<T>) {
  const Header = () => (
    <div className="flex h-[60px] px-4 items-center bg-[#F4F8FB] text-sm font-semibold rounded-t-xl text-[#222222]">
      {columns.map((column) => (
        <div
          key={column.key}
          className={`${column.className || "flex-1"} ${
            column.align === "center"
              ? "text-center"
              : column.align === "right"
              ? "text-right"
              : "text-left"
          } flex items-center ${
            column.align === "right"
              ? "justify-end"
              : column.align === "center"
              ? "justify-center"
              : "justify-start"
          }`}
        >
          {column.header}
        </div>
      ))}
    </div>
  );

  const Body = () => (
    <div className="divide-y divide-[#E9EEF3]">
      {data.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex h-[60px] px-4 items-center text-[#222222]"
          >
            {columns.map((column, colIndex) => {
              const value = row[column.key];
              const content = column.render
                ? column.render(value, row, rowIndex)
                : value ?? "-";

              return (
                <div
                  key={column.key}
                  className={`${column.className || "flex-1"} ${
                    colIndex === 0
                      ? "font-medium tracking-tight"
                      : "text-[15px]"
                  } ${
                    column.align === "center"
                      ? "text-center"
                      : column.align === "right"
                      ? "text-right"
                      : "text-left"
                  } flex items-center ${
                    column.align === "right"
                      ? "justify-end"
                      : column.align === "center"
                      ? "justify-center"
                      : "justify-start"
                  }`}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );

  if (variant === "flat") {
    return (
      <div
        className={`w-full overflow-hidden rounded-xl border border-[#E9EEF3] bg-white ${className}`}
      >
        <Header />
        <Body />
      </div>
    );
  }

  return (
    <GlassCard className={`w-full overflow-hidden p-0 ${className}`}>
      <Header />
      <Body />
    </GlassCard>
  );
}

export default GlassDataTable;
