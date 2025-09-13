'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface UserDistributionChartProps {
  users: User[];
}

const COLORS = {
  admin: '#ef4444',
  manager: '#f59e0b',
  employee: '#10b981',
};

export default function UserDistributionChart({
  users,
}: UserDistributionChartProps) {
  const userData = useMemo(() => {
    const admin = users.filter((user) => user.role === 'admin').length;
    const manager = users.filter((user) => user.role === 'manager').length;
    const employee = users.filter((user) => user.role === 'employee').length;

    return [
      { name: 'Admins', value: admin, color: COLORS.admin },
      { name: 'Managers', value: manager, color: COLORS.manager },
      { name: 'Employees', value: employee, color: COLORS.employee },
    ];
  }, [users]);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
    }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-popover-foreground">
            {payload[0].name}
          </p>
          <p className="text-sm text-muted-foreground">
            Count: {payload[0].value}
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: {((payload[0].value / users.length) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (users.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full overflow-hidden">
      <h3 className="text-lg font-semibold mb-4 text-center">
        User Role Distribution
      </h3>
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <PieChart>
          <Pie
            data={userData}
            cx="50%"
            cy="50%"
            labelLine={false}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={({ name, percent }: any) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
          >
            {userData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
