import React from "react";

interface ButtonBlueProps {
  className?: string;
  divClassName?: string;
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
  size?: "s" | "m" | "l";
  state?: "default" | "hover" | "disabled";
  text?: string;
  theme?: "primary" | "secondary";
  type?: "solid" | "outline";
  onClick?: () => void; // Added onClick property
}

export const ButtonBlue: React.FC<ButtonBlueProps> = ({
  className = "",
  divClassName = "",
  showLeftIcon = false,
  showRightIcon = false,
  size = "m",
  state = "default",
  text = "Button",
  theme = "primary",
  type = "solid",
  onClick, // Destructure onClick
}) => {
  const sizeClasses = {
    s: "px-3 py-2 text-sm",
    m: "px-4 py-3 text-base",
    l: "px-6 py-4 text-lg",
  };

  const themeClasses = {
    primary: {
      solid: "bg-blue-600 hover:bg-blue-700 text-white",
      outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
    },
    secondary: {
      solid: "bg-gray-600 hover:bg-gray-700 text-white",
      outline: "border-2 border-gray-600 text-gray-600 hover:bg-gray-50",
    },
  };

  const stateClasses = {
    default: "",
    hover: "transform scale-105",
    disabled: "opacity-50 cursor-not-allowed",
  };

  const baseClasses = `
    ${sizeClasses[size]}
    ${themeClasses[theme][type]}
    ${stateClasses[state]}
    rounded-lg font-medium transition-all duration-200
    flex items-center justify-center gap-2
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${className}
  `;

  return (
    <button className={baseClasses.trim()} onClick={onClick}>
      {showLeftIcon && (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
        </svg>
      )}
      <div className={divClassName}>{text}</div>
      {showRightIcon && (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};