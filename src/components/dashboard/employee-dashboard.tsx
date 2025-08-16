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
import { Button } from '@/components/ui/button';
import { SpinnerPage } from '@/components/ui/spinner';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface Stone {
  _id: string;
  name: string;
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
  createdAt: string;
}

interface DashboardData {
  stones: Stone[];
  papers: Paper[];
  orders: Order[];
  recentOrders: Order[];
}

export default function EmployeeDashboard() {
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
        fetch('/api/inventory/stones'),
        fetch('/api/inventory/paper'),
        fetch('/api/orders'),
      ]);

      const stones = await stonesRes.json();
      const papers = await papersRes.json();
      const orders = await ordersRes.json();

      setData({
        stones: stones.data || [],
        papers: papers.data || [],
        orders: orders.data || [],
        recentOrders: (orders.data || []).slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SpinnerPage />;
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>View inventory and orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/inventory">
              <Button
                className="w-full"
                variant="outline"
              >
                View Inventory
              </Button>
            </Link>
            <Link href="/designs">
              <Button
                className="w-full"
                variant="outline"
              >
                View Designs
              </Button>
            </Link>
            <Link href="/orders">
              <Button
                className="w-full"
                variant="outline"
              >
                View Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest 5 orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentOrders.map((order: Order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <p className="font-medium text-sm">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.phone}
                    </p>
                  </div>
                  <Badge
                    variant={
                      order.type === 'internal' ? 'default' : 'secondary'
                    }
                  >
                    {order.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
