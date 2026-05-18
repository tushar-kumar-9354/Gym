"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface GoalChartProps {
  dates: string[];
  actualData: number[];
  targetData: number[];
  label: string;
}

export default function GoalChart({ dates, actualData, targetData, label }: GoalChartProps) {
  const data = {
    labels: dates,
    datasets: [
      {
        label: `Actual ${label}`,
        data: actualData,
        borderColor: "#3b82f6", // Blue
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#3b82f6",
      },
      {
        label: `Target ${label}`,
        data: targetData,
        borderColor: "#93c5fd", // Light Blue
        borderDash: [5, 5], // Dashed line
        borderWidth: 2,
        tension: 0,
        pointRadius: 0, // No points for target line
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: "#6b7280",
          font: { size: 12 },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        grid: { color: "#f3f4f6" },
        ticks: { color: "#9ca3af" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af" },
      },
    },
  };

  return <Line data={data} options={options} />;
}
