// src/component/TableSkeleton.tsx
"use client";

import React from "react";

interface TableSkeletonProps {
  /**
   * Number of skeleton rows to display
   * @default 5
   */
  rows?: number;
  /**
   * Number of columns to display
   * @default 4
   */
  columns?: number;
  /**
   * Show header skeleton
   * @default true
   */
  showHeader?: boolean;
  /**
   * Custom class name for the container
   */
  className?: string;
}

/**
 * A skeleton loader component for tables
 * Displays animated placeholder rows while data is loading
 */
export default function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = "",
}: TableSkeletonProps) {
  return (
    <div
      className={`overflow-hidden rounded-[28px] border border-white/40 bg-white/70 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.06)] ${className}`}
    >
      {/* Header Skeleton */}
      {showHeader && (
        <div className="flex h-[60px] items-center bg-[#F4F8FB] px-5 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={`header-${i}`}
              className={`h-4 rounded-md bg-gray-200 animate-pulse ${
                i === 0 ? "w-32" : i === columns - 1 ? "w-20 ml-auto" : "flex-1"
              }`}
            />
          ))}
        </div>
      )}

      {/* Row Skeletons */}
      <div className="divide-y divide-[#E9EEF3]">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex items-center px-5 py-4 gap-4"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className={`rounded-md bg-gray-200 animate-pulse ${
                  colIndex === 0
                    ? "h-5 w-28"
                    : colIndex === columns - 1
                    ? "h-9 w-9 rounded-lg ml-auto"
                    : "h-4 flex-1"
                }`}
                style={{
                  animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A simpler inline skeleton for cards
 */
export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`p-6 rounded-[28px] bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] ${className}`}
    >
      <div className="space-y-4">
        <div className="h-6 w-32 rounded-md bg-gray-200 animate-pulse" />
        <div className="h-10 w-24 rounded-md bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Skeleton for stats cards
 */
export function StatsCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
