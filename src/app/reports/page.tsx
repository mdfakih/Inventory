'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Calendar,
  Package,
  Users,
  FileText,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface ReportData {
  inventory: any[];
  orders: any[];
  users: any[];
  stones: any[];
  papers: any[];
  plastics: any[];
  tapes: any[];
}

interface Order {
  _id: string;
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  designId: { name: string; number: string };
  finalTotalWeight: number;
  createdAt: string;
  stonesUsed: Array<{ stoneId: { name: string }; quantity: number }>;
  paperUsed: { sizeInInch: number; quantityInPcs: number };
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [reportData, setReportData] = useState<ReportData>({
    inventory: [],
    orders: [],
    users: [],
    stones: [],
    papers: [],
    plastics: [],
    tapes: []
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportType, setReportType] = useState('all');
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useSnackbarHelpers();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user.role !== 'admin') {
          showError('Access Denied', 'Only administrators can access reports.');
          router.push('/dashboard');
          return;
        }
        setUserRole(data.user.role);
        await loadReportData();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      showError('Authentication Error', 'Failed to verify authentication.');
      router.push('/login');
    }
  };

  const loadReportData = async () => {
    try {
      const [inventoryRes, ordersRes, usersRes, stonesRes, papersRes, plasticsRes, tapesRes] =
        await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/orders'),
          fetch('/api/masters/users'),
          fetch('/api/inventory/stones'),
          fetch('/api/inventory/paper'),
          fetch('/api/inventory/plastic'),
          fetch('/api/inventory/tape'),
        ]);

      const inventoryData = await inventoryRes.json();
      const ordersData = await ordersRes.json();
      const usersData = await usersRes.json();
      const stonesData = await stonesRes.json();
      const papersData = await papersRes.json();
      const plasticsData = await plasticsRes.json();
      const tapesData = await tapesRes.json();

      setReportData({
        inventory: inventoryData.success ? inventoryData.data : [],
        orders: ordersData.success ? ordersData.data : [],
        users: usersData.success ? usersData.data : [],
        stones: stonesData.success ? stonesData.data : [],
        papers: papersData.success ? papersData.data : [],
        plastics: plasticsData.success ? plasticsData.data : [],
        tapes: tapesData.success ? tapesData.data : [],
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      showError('Data Loading Error', 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reportType,
          dateRange,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Report Generated', 'Report has been generated successfully.');
        // Handle report download or display
      } else {
        showError('Report Generation Failed', data.message || 'Failed to generate report.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showError('Network Error', 'Failed to generate report. Please try again.');
    }
  };

  const handleExportData = async (type: string) => {
    try {
      const response = await fetch(`/api/reports/export?type=${type}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('Export Successful', `${type} data has been exported successfully.`);
      } else {
        showError('Export Failed', 'Failed to export data.');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showError('Network Error', 'Failed to export data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            Only administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalOrders = reportData.orders.length;
  const totalUsers = reportData.users.length;
  const totalStones = reportData.stones.length;
  const totalPapers = reportData.papers.length;
  const totalPlastics = reportData.plastics.length;
  const totalTapes = reportData.tapes.length;

  const lowStockItems = reportData.stones.filter(stone => stone.quantity < 100).length;
  const recentOrders = reportData.orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orderDate >= weekAgo;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-600">Generate reports and view system analytics</p>
      </div>

      {/* Report Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>
            Generate and export reports based on your criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleGenerateReport} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export</CardTitle>
          <CardDescription>
            Export data in different formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => handleExportData('inventory')}
              className="flex flex-col items-center space-y-2 p-4"
            >
              <Package className="h-6 w-6" />
              <span>Inventory</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData('orders')}
              className="flex flex-col items-center space-y-2 p-4"
            >
              <FileText className="h-6 w-6" />
              <span>Orders</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData('users')}
              className="flex flex-col items-center space-y-2 p-4"
            >
              <Users className="h-6 w-6" />
              <span>Users</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData('analytics')}
              className="flex flex-col items-center space-y-2 p-4"
            >
              <BarChart3 className="h-6 w-6" />
              <span>Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {recentOrders} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStones + totalPapers + totalPlastics + totalTapes}</div>
                <p className="text-xs text-muted-foreground">
                  {lowStockItems} low stock
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {lowStockItems > 0 ? (
                    <span className="text-yellow-600">{lowStockItems}</span>
                  ) : (
                    <span className="text-green-600">Good</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lowStockItems > 0 ? 'Items need attention' : 'All systems operational'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalStones}</div>
                  <p className="text-sm text-muted-foreground">Stones</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalPapers}</div>
                  <p className="text-sm text-muted-foreground">Papers</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalPlastics}</div>
                  <p className="text-sm text-muted-foreground">Plastics</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalTapes}</div>
                  <p className="text-sm text-muted-foreground">Tapes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Design</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.orders.slice(0, 10).map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell>
                        <Badge variant={order.type === 'internal' ? 'default' : 'secondary'}>
                          {order.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.designId?.name || 'N/A'}</TableCell>
                      <TableCell>{order.finalTotalWeight}g</TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Chart visualization will be implemented here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
