'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Order {
  _id: string;
  type: 'internal' | 'out';
  status: string;
  paymentStatus: 'pending' | 'partial' | 'completed' | 'overdue';
}

interface OrderDistributionChartProps {
  orders: Order[];
}

const COLORS = {
  internal: '#3b82f6',
  external: '#10b981',
  pending: '#f59e0b',
  partial: '#8b5cf6',
  completed: '#10b981',
  overdue: '#ef4444',
};

export default function OrderDistributionChart({
  orders,
}: OrderDistributionChartProps) {
  const orderTypeData = useMemo(() => {
    const internal = orders.filter((order) => order.type === 'internal').length;
    const external = orders.filter((order) => order.type === 'out').length;

    return [
      { name: 'Internal Orders', value: internal, color: COLORS.internal },
      { name: 'External Orders', value: external, color: COLORS.external },
    ];
  }, [orders]);

  const paymentStatusData = useMemo(() => {
    const pending = orders.filter(
      (order) => order.paymentStatus === 'pending',
    ).length;
    const partial = orders.filter(
      (order) => order.paymentStatus === 'partial',
    ).length;
    const completed = orders.filter(
      (order) => order.paymentStatus === 'completed',
    ).length;
    const overdue = orders.filter(
      (order) => order.paymentStatus === 'overdue',
    ).length;

    return [
      { name: 'Pending', value: pending, color: COLORS.pending },
      { name: 'Partial', value: partial, color: COLORS.partial },
      { name: 'Completed', value: completed, color: COLORS.completed },
      { name: 'Overdue', value: overdue, color: COLORS.overdue },
    ];
  }, [orders]);

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
            Percentage: {((payload[0].value / orders.length) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (orders.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No order data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Order Type Distribution */}
      <div className="h-64 w-full overflow-hidden">
        <h3 className="text-lg font-semibold mb-4 text-center">Order Types</h3>
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={orderTypeData}
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
              {orderTypeData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Status Distribution */}
      <div className="h-64 w-full overflow-hidden">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Payment Status
        </h3>
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={paymentStatusData}
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
              {paymentStatusData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
