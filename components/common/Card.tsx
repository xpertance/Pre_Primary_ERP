import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
  shadow?: "sm" | "md" | "lg" | "none";
  padding?: "sm" | "md" | "lg";
}

export default function Card({
  children,
  className = "",
  bordered = false,
  shadow = "md",
  padding = "md",
}: CardProps) {
  const shadowStyles = {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    none: "",
  };

  const paddingStyles = {
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`bg-white rounded-lg ${shadowStyles[shadow]} ${paddingStyles[padding]} ${bordered ? "border border-gray-200" : ""
        } ${className}`}
    >
      {children}
    </div>
  );
}
