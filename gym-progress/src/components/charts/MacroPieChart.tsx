"use client";

import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface MacroPieChartProps {
  protein: number;
  fat: number;
  carbs: number;
}

export default function MacroPieChart({ protein, fat, carbs }: MacroPieChartProps) {
  const data = {
    labels: ["Protein", "Fat", "Carbs"],
    datasets: [
      {
        data: [protein, fat, carbs],
        backgroundColor: [
          "#0ea5e9", // Primary
          "#f59e0b", // Warning (yellowish for fat)
          "#10b981", // Success (green for carbs)
        ],
        borderColor: "#1e212b",
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#9ca3af",
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    cutout: "75%",
  };

  return (
    <div className="h-64 w-full relative">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-30px]">
        <span className="text-sm text-gray-400">Total Cals</span>
        <span className="text-xl font-bold text-white">
          {protein * 4 + carbs * 4 + fat * 9}
        </span>
      </div>
    </div>
  );
}
