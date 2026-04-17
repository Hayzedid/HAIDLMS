import React from "react";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
  showPercentage?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  color = "blue",
  showPercentage = true,
  animated = true,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colors = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-600",
    yellow: "bg-yellow-600",
    purple: "bg-purple-600",
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${colors[color]} ${animated ? "transition-all duration-300" : ""}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
