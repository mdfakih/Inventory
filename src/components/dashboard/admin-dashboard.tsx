'use client';

import { useState, useEffect, useMemo, memo } from 'react';
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
import type { Stone as StoneType, Paper as PaperType, Order as OrderType } from '@/types';
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

// Remove duplicate interfaces - using types from @/types

interface DashboardData {
  stones: StoneType[];
  papers: PaperType[];
  orders: OrderType[];
  recentOrders: OrderType[];
}

function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    stones: [],
    papers: [],
    orders: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, authLoading]);

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

  const orderTypeData = useMemo(() => {
    const internalCount = data.orders.filter(
      (order) => order.type === 'internal',
    ).length;
    const outCount = data.orders.filter(
      (order) => order.type === 'out',
    ).length;

    return [
      { name: 'Internal', value: internalCount, fill: '#0088FE' },
      { name: 'Out', value: outCount, fill: '#00C49F' },
    ];
  }, [data.orders]);

  const stoneStockData = useMemo(() => {
    return data.stones.map((stone) => ({
      name: stone.name,
      stock: stone.quantity,
      color: stone.color,
    }));
  }, [data.stones]);

  const paperStockData = useMemo(() => {
    return data.papers.map((paper) => ({
      name: `${paper.width}"`,
      pcs: paper.quantity,
    }));
  }, [data.papers]);

  const recentOrdersCount = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return data.orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= weekAgo;
    }).length;
  }, [data.orders]);

  const paymentStatusCounts = useMemo(() => {
    return {
      pending: data.orders.filter((order) => order.paymentStatus === 'pending').length,
      partial: data.orders.filter((order) => order.paymentStatus === 'partial').length,
      completed: data.orders.filter((order) => order.paymentStatus === 'completed').length,
      overdue: data.orders.filter((order) => order.paymentStatus === 'overdue').length,
    };
  }, [data.orders]);

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
                (sum, stone) => sum + stone.quantity,
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
                (sum, paper) => sum + paper.quantity,
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
              {recentOrdersCount}
            </div>
            <p className="text-xs text-muted-foreground">Orders this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Attention</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {paymentStatusCounts.pending}
            </div>
            <p className="text-xs text-muted-foreground">Orders awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial Payments</CardTitle>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">Partial</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {paymentStatusCounts.partial}
            </div>
            <p className="text-xs text-muted-foreground">Orders with partial payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paymentStatusCounts.completed}
            </div>
            <p className="text-xs text-muted-foreground">Fully paid orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <Badge variant="secondary" className="bg-red-100 text-red-800">Urgent</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {paymentStatusCounts.overdue}
            </div>
            <p className="text-xs text-muted-foreground">Overdue payments</p>
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
                  data={orderTypeData}
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
                  {orderTypeData.map((entry, index) => (
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
              <BarChart data={stoneStockData}>
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
            <BarChart data={paperStockData}>
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
        <CardHeader className="pb-3">
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recentOrders.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <p>No recent orders found</p>
            </div>
          ) : (
            <>
              {data.recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="p-3 border rounded-md hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Customer & Design Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {order.customerName}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0.5 ${
                            !order.isFinalized
                              ? 'border-amber-300 bg-amber-50 text-amber-700'
                              : order.status === 'completed'
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : order.status === 'cancelled'
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : 'border-blue-300 bg-blue-50 text-blue-700'
                          }`}
                        >
                          {!order.isFinalized 
                            ? 'Draft' 
                            : order.status === 'completed'
                            ? 'Done'
                            : order.status === 'cancelled'
                            ? 'Cancel'
                            : 'Active'
                          }
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {typeof order.designId === 'object' 
                          ? order.designId?.name 
                          : order.designId || 'N/A'
                        } • {order.type === 'internal' ? 'Internal' : 'Out Job'}
                      </div>
                    </div>

                    {/* Right: Weight & Payment */}
                    <div className="text-right text-xs space-y-0.5">
                      <div className="font-medium">
                        {order.calculatedWeight?.toFixed(1) || '--'}g
                        {order.finalTotalWeight && order.calculatedWeight && (
                          <span
                            className={`ml-1 ${
                              order.weightDiscrepancy && order.weightDiscrepancy > 0
                                ? 'text-red-600'
                                : order.weightDiscrepancy && order.weightDiscrepancy < 0
                                ? 'text-green-600'
                                : 'text-muted-foreground'
                            }`}
                          >
                            →{order.finalTotalWeight.toFixed(1)}g
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${
                            order.paymentStatus === 'completed'
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : order.paymentStatus === 'overdue'
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : order.paymentStatus === 'partial'
                              ? 'border-amber-300 bg-amber-50 text-amber-700'
                              : 'border-gray-300 bg-gray-50 text-gray-700'
                          }`}
                        >
                          {order.paymentStatus === 'completed' 
                            ? '✓ Paid' 
                            : order.paymentStatus === 'partial'
                            ? '◐ Partial'
                            : order.paymentStatus === 'overdue'
                            ? '⚠ Overdue'
                            : '○ Pending'
                          }
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(AdminDashboard);
