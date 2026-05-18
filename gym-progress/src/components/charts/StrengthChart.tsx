"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StrengthChartProps {
  dates: string[];
  oneRMs: number[];
  exerciseName: string;
}

export default function StrengthChart({ dates, oneRMs, exerciseName }: StrengthChartProps) {
  const chartData = {
    labels: dates,
    datasets: [
      {
        label: `${exerciseName} Estimated 1RM (kg)`,
        data: oneRMs,
        borderColor: "#8b5cf6", // Accent color
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        borderWidth: 3,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#8b5cf6",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#9ca3af",
          font: {
            family: "Inter, sans-serif",
          },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#9ca3af" },
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#9ca3af" },
        title: {
          display: true,
          text: "Estimated 1RM (kg)",
          color: "#6b7280"
        }
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return (
    <div className="h-72 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
