import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Input({
  label,
  error,
  helperText,
  icon,
  fullWidth = false,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-2.5 text-gray-500">{icon}</span>}
        <input
          {...props}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${icon ? "pl-10" : ""
            } ${error ? "border-red-500 focus:ring-red-500" : ""} ${className}`}
        />
      </div>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      {helperText && <p className="text-gray-500 text-sm mt-1">{helperText}</p>}
    </div>
  );
}
