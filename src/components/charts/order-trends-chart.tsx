'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Order {
  _id: string;
  type: 'internal' | 'out';
  status: string;
  createdAt: string;
  finalTotalWeight?: number;
  calculatedWeight?: number;
}

interface OrderTrendsChartProps {
  orders: Order[];
}

export default function OrderTrendsChart({ orders }: OrderTrendsChartProps) {
  const chartData = useMemo(() => {
    // Group orders by month for the last 12 months
    const monthlyData: Record<
      string,
      {
        month: string;
        internal: number;
        external: number;
        total: number;
        avgWeight: number;
      }
    > = {};

    const now = new Date();
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });

      monthlyData[monthKey] = {
        month: monthName,
        internal: 0,
        external: 0,
        total: 0,
        avgWeight: 0,
      };

      return { monthKey, monthName };
    }).reverse();

    // Process orders
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const monthKey = orderDate.toISOString().slice(0, 7);

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].total++;
        if (order.type === 'internal') {
          monthlyData[monthKey].internal++;
        } else {
          monthlyData[monthKey].external++;
        }
      }
    });

    // Calculate average weight for each month
    Object.keys(monthlyData).forEach((monthKey) => {
      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toISOString().slice(0, 7) === monthKey;
      });

      if (monthOrders.length > 0) {
        const totalWeight = monthOrders.reduce((sum, order) => {
          return sum + (order.finalTotalWeight || order.calculatedWeight || 0);
        }, 0);
        monthlyData[monthKey].avgWeight = Math.round(
          totalWeight / monthOrders.length,
        );
      }
    });

    return last12Months.map(({ monthKey }) => monthlyData[monthKey]);
  }, [orders]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No order data available for trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value, name) => [
              name === 'avgWeight' ? `${value}g` : value,
              name === 'internal'
                ? 'Internal Orders'
                : name === 'external'
                ? 'External Orders'
                : name === 'total'
                ? 'Total Orders'
                : name === 'avgWeight'
                ? 'Avg Weight'
                : name,
            ]}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="internal"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Internal Orders"
          />
          <Line
            type="monotone"
            dataKey="external"
            stroke="#10b981"
            strokeWidth={2}
            name="External Orders"
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Total Orders"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
