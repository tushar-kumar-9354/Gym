import React from "react";

interface ProgressBarProps {
  label: string;
  progress: number;
  colorClass?: string;
  showText?: boolean;
}

export default function ProgressBar({
  label,
  progress,
  colorClass = "bg-primary-500",
  showText = true,
}: ProgressBarProps) {
  // Cap at 100% for display purposes, but allow higher values
  const displayProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      {showText && (
        <div className="flex justify-between items-center mb-1 text-sm font-medium">
          <span className="text-gray-300">{label}</span>
          <span className="text-gray-400">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-[var(--color-surface)] rounded-full h-2.5 shadow-inner">
        <div
          className={`h-2.5 rounded-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${displayProgress}%` }}
        ></div>
      </div>
    </div>
  );
}
