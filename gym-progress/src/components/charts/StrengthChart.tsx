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
import { getExerciseTrackingType, formatExerciseValue } from "@/utils/oneRM";

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
  const trackingType = getExerciseTrackingType(exerciseName);
  
  let datasetLabel = `${exerciseName} Estimated 1RM (kg)`;
  let yAxisTitle = "Estimated 1RM (kg)";
  
  if (trackingType === "Time") {
    datasetLabel = `${exerciseName} Max Time`;
    yAxisTitle = "Time (seconds)";
  } else if (trackingType === "Reps") {
    datasetLabel = `${exerciseName} Max Reps`;
    yAxisTitle = "Reps";
  }

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: datasetLabel,
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
        callbacks: {
          label: function (context: any) {
            const val = context.parsed.y;
            return ` ${exerciseName}: ${formatExerciseValue(val, trackingType)}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#9ca3af" },
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: {
          color: "#9ca3af",
          callback: function (value: any) {
            return formatExerciseValue(value, trackingType);
          }
        },
        title: {
          display: true,
          text: yAxisTitle,
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
