import React from "react";
import { Loader } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  fullScreen = false,
  message,
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {message && <p className="text-gray-600 text-sm mt-2">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
