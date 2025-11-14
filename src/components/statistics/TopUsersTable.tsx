'use client'

import React from 'react'
import type { TopUsersTableProps } from '@/types/statistics'

export function TopUsersTable({ users, limit = 20, filterBy, onUserClick }: TopUsersTableProps) {
  const displayUsers = users.slice(0, limit)

  return (
    <div className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Usuarios Más Activos
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Rank
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Usuario
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Préstamos Activos
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Consumibles
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Costo Total
              </th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.map((user) => (
              <tr
                key={user.userId}
                onClick={() => onUserClick(user.userId)}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  #{user.rank}
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  {user.activeLoans}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  {user.totalConsumables}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  ${user.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
