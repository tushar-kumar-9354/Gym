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
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface SparklineProps {
  data: number[];
  color: string;
  labels?: string[];
}

export default function Sparkline({ data, color, labels }: SparklineProps) {
  const chartData = {
    labels: labels || data.map((_, i) => i.toString()),
    datasets: [
      {
        fill: true,
        data: data,
        borderColor: color,
        backgroundColor: `${color}20`, // 20% opacity
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4, // Smooth curve
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: { display: false },
      y: { display: false, min: Math.min(...data) * 0.9, max: Math.max(...data) * 1.1 },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return (
    <div className="h-16 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
