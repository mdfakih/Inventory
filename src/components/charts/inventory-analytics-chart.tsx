'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Stone {
  _id: string;
  name: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface Paper {
  _id: string;
  width: number;
  quantity: number;
  piecesPerRoll?: number;
}

interface Plastic {
  _id: string;
  width: number;
  quantity: number;
}

interface Tape {
  _id: string;
  quantity: number;
}

interface InventoryAnalyticsChartProps {
  stones: Stone[];
  papers: Paper[];
  plastics: Plastic[];
  tapes: Tape[];
}

export default function InventoryAnalyticsChart({
  stones,
  papers,
  plastics,
  tapes,
}: InventoryAnalyticsChartProps) {
  const inventoryData = useMemo(() => {
    const totalStones = stones.reduce((sum, stone) => sum + stone.quantity, 0);
    const totalPapers = papers.reduce((sum, paper) => sum + paper.quantity, 0);
    const totalPlastics = plastics.reduce(
      (sum, plastic) => sum + plastic.quantity,
      0,
    );
    const totalTapes = tapes.reduce((sum, tape) => sum + tape.quantity, 0);

    return [
      {
        category: 'Stones',
        total: totalStones,
        items: stones.length,
        lowStock: stones.filter((s) => s.quantity < 100).length,
        color: '#3b82f6',
      },
      {
        category: 'Papers',
        total: totalPapers,
        items: papers.length,
        lowStock: papers.filter((p) => p.quantity < 10).length,
        color: '#10b981',
      },
      {
        category: 'Plastics',
        total: totalPlastics,
        items: plastics.length,
        lowStock: plastics.filter((p) => p.quantity < 10).length,
        color: '#8b5cf6',
      },
      {
        category: 'Tapes',
        total: totalTapes,
        items: tapes.length,
        lowStock: tapes.filter((t) => t.quantity < 10).length,
        color: '#f59e0b',
      },
    ];
  }, [stones, papers, plastics, tapes]);

  const topStones = useMemo(() => {
    return stones
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((stone) => ({
        name:
          stone.name.length > 15
            ? stone.name.substring(0, 15) + '...'
            : stone.name,
        quantity: stone.quantity,
        color: stone.color || '#3b82f6',
      }));
  }, [stones]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        total: number;
        items: number;
        lowStock: number;
      };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-popover-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            Total Quantity: {data.total.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Items: {data.items}</p>
          <p className="text-sm text-muted-foreground">
            Low Stock: {data.lowStock}
          </p>
        </div>
      );
    }
    return null;
  };

  if (inventoryData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No inventory data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Overview Chart */}
      <div className="h-64">
        <h3 className="text-lg font-semibold mb-4">Inventory Overview</h3>
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart data={inventoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="total"
              fill="#3b82f6"
              name="Total Quantity"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="items"
              fill="#10b981"
              name="Number of Items"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Stones Chart */}
      {topStones.length > 0 && (
        <div className="h-64">
          <h3 className="text-lg font-semibold mb-4">
            Top 10 Stones by Quantity
          </h3>
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={topStones}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={120}
              />
              <Tooltip
                formatter={(value) => [value, 'Quantity']}
                labelFormatter={(label) => `Stone: ${label}`}
              />
              <Bar
                dataKey="quantity"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
