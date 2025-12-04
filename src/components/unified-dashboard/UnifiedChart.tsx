'use client'

import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import type { UnifiedChartProps } from '@/types/unified-dashboard'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Theme-aware color palettes
const lightColors = [
  'rgba(59, 130, 246, 0.8)',   // blue
  'rgba(16, 185, 129, 0.8)',   // green
  'rgba(245, 158, 11, 0.8)',   // yellow
  'rgba(239, 68, 68, 0.8)',    // red
  'rgba(139, 92, 246, 0.8)',   // purple
  'rgba(249, 115, 22, 0.8)',   // orange
  'rgba(20, 184, 166, 0.8)',   // teal
  'rgba(236, 72, 153, 0.8)',   // pink
]

const darkColors = [
  'rgba(96, 165, 250, 0.8)',   // blue
  'rgba(52, 211, 153, 0.8)',   // green
  'rgba(251, 191, 36, 0.8)',   // yellow
  'rgba(248, 113, 113, 0.8)', // red
  'rgba(167, 139, 250, 0.8)', // purple
  'rgba(251, 146, 60, 0.8)',  // orange
  'rgba(45, 212, 191, 0.8)',  // teal
  'rgba(244, 114, 182, 0.8)', // pink
]

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div 
      className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
      style={{ height }}
    >
      <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
  )
}

export function UnifiedChart({ type, data, title, loading = false, height = 300 }: UnifiedChartProps) {
  // Detect dark mode
  const isDarkMode = typeof window !== 'undefined' 
    ? document.documentElement.classList.contains('dark')
    : false

  const colors = isDarkMode ? darkColors : lightColors

  // Apply theme colors to datasets
  const themedData = useMemo(() => {
    return {
      ...data,
      datasets: data.datasets.map((dataset, index) => {
        const color = colors[index % colors.length]
        const borderColor = color.replace('0.8', '1')
        
        if (type === 'line') {
          return {
            ...dataset,
            borderColor: dataset.borderColor || borderColor,
            backgroundColor: dataset.backgroundColor || color.replace('0.8', '0.2'),
            fill: true,
            tension: 0.4,
          }
        }
        
        if (type === 'bar') {
          return {
            ...dataset,
            backgroundColor: dataset.backgroundColor || color,
            borderColor: dataset.borderColor || borderColor,
            borderWidth: 1,
          }
        }
        
        // Pie and Doughnut
        return {
          ...dataset,
          backgroundColor: dataset.backgroundColor || colors.slice(0, data.labels.length),
          borderColor: isDarkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
          borderWidth: 2,
        }
      }),
    }
  }, [data, colors, type, isDarkMode])

  const commonOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDarkMode ? 'rgba(209, 213, 219, 1)' : 'rgba(55, 65, 81, 1)',
          padding: 16,
          usePointStyle: true,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? 'rgba(243, 244, 246, 1)' : 'rgba(17, 24, 39, 1)',
        bodyColor: isDarkMode ? 'rgba(209, 213, 219, 1)' : 'rgba(55, 65, 81, 1)',
        borderColor: isDarkMode ? 'rgba(75, 85, 99, 1)' : 'rgba(229, 231, 235, 1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
  }), [isDarkMode])

  const axisOptions = useMemo(() => ({
    scales: {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
        },
        ticks: {
          color: isDarkMode ? 'rgba(156, 163, 175, 1)' : 'rgba(107, 114, 128, 1)',
        },
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
        },
        ticks: {
          color: isDarkMode ? 'rgba(156, 163, 175, 1)' : 'rgba(107, 114, 128, 1)',
        },
        beginAtZero: true,
      },
    },
  }), [isDarkMode])

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={themedData} options={{ ...commonOptions, ...axisOptions }} />
      case 'bar':
        return <Bar data={themedData} options={{ ...commonOptions, ...axisOptions }} />
      case 'pie':
        return <Pie data={themedData} options={commonOptions} />
      case 'doughnut':
        return <Doughnut data={themedData} options={commonOptions} />
      default:
        return null
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      {loading ? (
        <ChartSkeleton height={height} />
      ) : (
        <div style={{ height }}>
          {renderChart()}
        </div>
      )}
    </div>
  )
}
