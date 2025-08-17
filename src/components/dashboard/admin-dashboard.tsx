'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SpinnerPage } from '@/components/ui/spinner';
import { useAuth } from '@/lib/auth-context';
import { authenticatedFetch } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Stone {
  _id: string;
  name: string;
  color: string;
  quantity: number;
}

interface Paper {
  _id: string;
  width: number;
  quantity: number;
}

interface Order {
  _id: string;
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  designId: { name: string; number: string };
  calculatedWeight?: number;
  finalTotalWeight?: number;
  weightDiscrepancy?: number;
  discrepancyPercentage?: number;
  status: string;
  isFinalized: boolean;
  createdAt: string;
}

interface DashboardData {
  stones: Stone[];
  papers: Paper[];
  orders: Order[];
  recentOrders: Order[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    stones: [],
    papers: [],
    orders: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      const [stonesRes, papersRes, ordersRes] = await Promise.all([
        authenticatedFetch('/api/inventory/stones'),
        authenticatedFetch('/api/inventory/paper'),
        authenticatedFetch('/api/orders'),
      ]);

      const stones = await stonesRes.json();
      const papers = await papersRes.json();
      const orders = await ordersRes.json();

      // Ensure orders have all required fields populated
      const ordersWithDetails = orders.data || [];

      setData({
        stones: stones.data || [],
        papers: papers.data || [],
        orders: ordersWithDetails,
        recentOrders: ordersWithDetails.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderTypeData = () => {
    const internalCount = data.orders.filter(
      (order: Order) => order.type === 'internal',
    ).length;
    const outCount = data.orders.filter(
      (order: Order) => order.type === 'out',
    ).length;

    return [
      { name: 'Internal', value: internalCount, fill: '#0088FE' },
      { name: 'Out', value: outCount, fill: '#00C49F' },
    ];
  };

  const getStoneStockData = () => {
    return data.stones.map((stone: Stone) => ({
      name: stone.name,
      stock: stone.quantity,
      color: stone.color,
    }));
  };

  const getPaperStockData = () => {
    return data.papers.map((paper: Paper) => ({
      name: `${paper.width}"`,
      pcs: paper.quantity,
    }));
  };

  if (loading) {
    return <SpinnerPage />;
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access frequently used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/masters"
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="font-medium">Master Data</div>
                  <div className="text-sm text-muted-foreground">
                    Manage system data
                  </div>
                </CardContent>
              </Card>
            </a>
            <a
              href="/reports"
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium">Reports</div>
                  <div className="text-sm text-muted-foreground">
                    Generate reports
                  </div>
                </CardContent>
              </Card>
            </a>
            <a
              href="/inventory"
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">📦</div>
                  <div className="font-medium">Inventory</div>
                  <div className="text-sm text-muted-foreground">
                    Manage inventory
                  </div>
                </CardContent>
              </Card>
            </a>
            <a
              href="/orders"
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-medium">Orders</div>
                  <div className="text-sm text-muted-foreground">
                    View orders
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stones</CardTitle>
            <Badge variant="secondary">{data.stones.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stones.reduce(
                (sum: number, stone: Stone) => sum + stone.quantity,
                0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total quantity in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Paper Rolls
            </CardTitle>
            <Badge variant="secondary">{data.papers.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.papers.reduce(
                (sum: number, paper: Paper) => sum + paper.quantity,
                0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pieces in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Badge variant="secondary">{data.orders.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.orders.length}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
            <Badge variant="secondary">Last 7 days</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                data.orders.filter((order: Order) => {
                  const orderDate = new Date(order.createdAt);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return orderDate >= weekAgo;
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Orders this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Types Distribution</CardTitle>
            <CardDescription>Internal vs Out jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <PieChart>
                <Pie
                  data={getOrderTypeData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getOrderTypeData().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stone Stock by Color</CardTitle>
            <CardDescription>Current stone inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart data={getStoneStockData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="stock"
                  fill="#8884d8"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paper Stock by Width</CardTitle>
          <CardDescription>Current paper inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart data={getPaperStockData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="pcs"
                fill="#82ca9d"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest 5 orders with weight details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentOrders.map((order: Order) => (
              <div
                key={order._id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Design: {order.designId?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        order.type === 'internal' ? 'default' : 'secondary'
                      }
                    >
                      {order.type}
                    </Badge>
                    <Badge
                      className={`ml-2 ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Weight Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Calculated Weight
                    </p>
                    <p className="font-medium">
                      {order.calculatedWeight?.toFixed(2) || 'N/A'}g
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Final Weight
                    </p>
                    <p className="font-medium">
                      {order.finalTotalWeight?.toFixed(2) || 'Not set'}g
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Discrepancy</p>
                    <p
                      className={`font-medium ${
                        order.weightDiscrepancy !== undefined &&
                        order.weightDiscrepancy !== null
                          ? order.weightDiscrepancy !== 0
                            ? order.weightDiscrepancy > 0
                              ? 'text-red-600'
                              : 'text-green-600'
                            : 'text-gray-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {order.weightDiscrepancy !== undefined &&
                      order.weightDiscrepancy !== null
                        ? `${order.weightDiscrepancy.toFixed(
                            2,
                          )}g (${order.discrepancyPercentage?.toFixed(1)}%)`
                        : 'Not calculated'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="flex flex-col gap-1">
                      <Badge
                        className={`text-xs ${
                          order.isFinalized
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.isFinalized ? 'Finalized' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
