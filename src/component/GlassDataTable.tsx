import React from "react";
import GlassCard from "./Glasscard";

type Align = "left" | "center" | "right";
type ActionKey = "action" | "aksi";

type DataColumn<T, K extends Extract<keyof T, string> = Extract<keyof T, string>> = {
  key: K;
  header: string;
  align?: Align;
  render?: (value: T[K], row: T, index: number) => React.ReactNode;
  className?: string;
};

type ActionColumn<T> = {
  key: ActionKey;
  header: string;
  align?: Align;
  render?: (value: undefined, row: T, index: number) => React.ReactNode;
  className?: string;
};

export type ColumnDef<T> = DataColumn<T> | ActionColumn<T>;

interface GlassDataTableProps<T extends object> {
  columns: ColumnDef<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
  variant?: "glass" | "flat";
  hideHeaderOnMobile?: boolean;
}

function GlassDataTable<T extends object>({
  columns,
  data,
  className = "",
  emptyMessage = "Tidak ada data tersedia",
  variant = "glass",
  hideHeaderOnMobile = false,
}: GlassDataTableProps<T>) {
  const Header = () => {
    const actionIndex = columns.findIndex(
      (c) => c.key === "action" || c.key === "aksi"
    );
    return (
      <div className={`${hideHeaderOnMobile ? "hidden sm:flex" : "flex"} h-[60px] px-4 items-center bg-[#F4F8FB] text-sm font-semibold rounded-t-xl text-[#222222]`}>
        {columns.map((column, idx) => {
          const isAction = idx === actionIndex;
          const isFirst = idx === 0;
          const hiddenOnMobile = !isFirst && !isAction;
          return (
            <div
              key={String(column.key)}
              className={`${hiddenOnMobile ? "hidden sm:flex" : "flex"} ${
                isAction
                  ? "w-28 sm:w-44 sm:flex-shrink-0"
                  : column.className || "flex-1"
              } ${
                column.align === "center"
                  ? "text-center"
                  : column.align === "right" || isAction
                  ? "text-right"
                  : "text-left"
              } items-center ${
                column.align === "right" || isAction
                  ? "justify-end"
                  : column.align === "center"
                  ? "justify-center"
                  : "justify-start"
              }`}
            >
              {column.header}
            </div>
          );
        })}
      </div>
    );
  };

  const Body = () => (
    <div className="divide-y divide-[#E9EEF3]">
      {data.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        data.map((row, rowIndex) => {
          const DesktopRow = (
            <div
              key={`desktop-${rowIndex}`}
              className="hidden sm:flex h-[60px] px-4 items-center text-[#222222]"
            >
              {columns.map((column, colIndex) => {
                if (column.key === "action" || column.key === "aksi") {
                  const render = (column as ActionColumn<T>).render;
                  const content = render
                    ? render(undefined, row, rowIndex)
                    : null;
                  return (
                    <div
                      key={String(column.key)}
                      className={`${column.className || "w-28 sm:w-44 sm:flex-shrink-0"} ${
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
                }

                const dataColumn = column as Exclude<ColumnDef<T>, ActionColumn<T>>;
                const value = row[dataColumn.key];
                const render = dataColumn.render;
                const content = render
                  ? render(
                      // value is T[K] here
                      value as never,
                      row,
                      rowIndex
                    )
                  : value !== null && value !== undefined
                  ? String(value as unknown)
                  : "-";

                return (
                  <div
                    key={String(column.key)}
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
          );

          const MobileRow = (
            <div key={`mobile-${rowIndex}`} className="sm:hidden px-4 py-4">
              <div className="text-lg font-semibold text-[#0E1D3D]">
                {(() => {
                  const firstCol = columns[0];
                  if (firstCol.key === "action" || firstCol.key === "aksi") return null;
                  const value = row[firstCol.key];
                  return firstCol.render
                    ? (firstCol.render as (
                        v: never,
                        r: T,
                        i: number
                      ) => React.ReactNode)(value as never, row, rowIndex)
                    : value !== null && value !== undefined
                    ? String(value as unknown)
                    : "-";
                })()}
              </div>

              <div className="mt-3 grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-2 text-[#0E1D3D]">
                {columns.slice(1).map((column) => {
                  if (column.key === "action" || column.key === "aksi") return null;
                  const value = row[column.key];
                  const content = column.render
                    ? (column.render as (
                        v: never,
                        r: T,
                        i: number
                      ) => React.ReactNode)(value as never, row, rowIndex)
                    : value !== null && value !== undefined
                    ? String(value as unknown)
                    : "-";
                  return (
                    <React.Fragment key={`m-${String(column.key)}`}>
                      <div className="text-sm font-semibold">
                        {column.header}
                      </div>
                      <div className="text-sm text-[#6B7280]">:</div>
                      <div className="text-sm">{content}</div>
                    </React.Fragment>
                  );
                })}
              </div>

              {columns.find((c) => c.key === "action" || c.key === "aksi") && (
                <div className="mt-3 flex justify-end">
                  {(() => {
                    const actionCol = columns.find(
                      (c) => c.key === "action" || c.key === "aksi"
                    );
                    if (!actionCol) return null;
                    const render = (actionCol as ActionColumn<T>).render;
                    return render
                      ? render(undefined, row, rowIndex)
                      : null;
                  })()}
                </div>
              )}
            </div>
          );

          return (
            <div key={rowIndex}>
              {DesktopRow}
              {MobileRow}
            </div>
          );
        })
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
