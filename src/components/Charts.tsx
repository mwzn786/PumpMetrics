"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

type FuelSalesChartProps = {
  labels: string[];
  data: number[];
};

export function FuelSalesChart({ labels, data }: FuelSalesChartProps) {
  const chartData = {
    labels: labels.map((d) =>
      new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    ),
    datasets: [
      {
        label: "Liters Sold",
        data,
        backgroundColor: "rgba(13, 110, 253, 0.7)",
        borderColor: "rgba(13, 110, 253, 1)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Liters" },
      },
    },
  };

  return (
    <div className="chart-container" style={{ height: 280 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

type ProductMixChartProps = {
  labels: string[];
  data: number[];
};

export function ProductMixChart({ labels, data }: ProductMixChartProps) {
  const colors = [
    "rgba(13, 110, 253, 0.8)",
    "rgba(255, 193, 7, 0.8)",
    "rgba(25, 135, 84, 0.8)",
    "rgba(220, 53, 69, 0.8)",
  ];

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="chart-container" style={{ height: 280 }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
