import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  className = "",
  align = "left",
}) => {
  const isCenter = align === "center";
  return (
    <div
      className={`${
        isCenter
          ? "flex flex-col items-center text-center gap-2"
          : "flex justify-between items-start"
      } mb-6 ${className}`}
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-2 text-gray-600 max-w-prose">{description}</p>
        )}
      </div>
      {!isCenter && action && <div className="flex-shrink-0">{action}</div>}
      {isCenter && action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default PageHeader;
