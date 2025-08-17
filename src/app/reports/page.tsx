'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  BarChart3,
  Package,
  Users,
  FileText,
  AlertTriangle,
  Download,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface Stone {
  _id: string;
  name: string;
  quantity: number;
  color?: string;
  size?: string;
  unit?: string;
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

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Order {
  _id: string;
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  designId: { name: string; number: string };
  finalTotalWeight: number;
  calculatedWeight: number;
  weightDiscrepancy: number;
  discrepancyPercentage: number;
  status: string;
  isFinalized: boolean;
  createdAt: string;
  stonesUsed: Array<{ stoneId: { name: string }; quantity: number }>;
  paperUsed: { sizeInInch: number; quantityInPcs: number };
}

interface ReportData {
  inventory: unknown[];
  orders: Order[];
  users: User[];
  stones: Stone[];
  papers: Paper[];
  plastics: Plastic[];
  tapes: Tape[];
  analytics?: {
    inventory: {
      totalStoneQuantity: number;
      totalPaperQuantity: number;
      lowStockStones: number;
      lowStockPapers: number;
    };
    orders: {
      total: number;
      completed: number;
      pending: number;
      internal: number;
      out: number;
    };
    lowStockItems: Array<Stone | Paper>;
  };
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
    tapes: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [reportType, setReportType] = useState('all');
  const router = useRouter();
  const { showSuccess, showError } = useSnackbarHelpers();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const loadReportData = useCallback(async () => {
    try {
      // Use the reports generate API to get all data at once
      const response = await fetch('/api/reports/generate?type=all');

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReportData({
            inventory: [],
            orders: data.data.orders || [],
            users: data.data.users || [],
            stones: data.data.stones || [],
            papers: data.data.papers || [],
            plastics: data.data.plastics || [],
            tapes: data.data.tapes || [],
            analytics: data.data.analytics,
          });
        } else {
          showError('Data Loading Error', 'Failed to load report data.');
        }
      } else {
        showError('Data Loading Error', 'Failed to load report data.');
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      showError('Data Loading Error', 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (user?.role !== 'admin') {
        showError('Access Denied', 'Only administrators can access reports.');
        router.push('/dashboard');
        return;
      }

      loadReportData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.role]);

  const handleGenerateReport = async () => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
      });

      const response = await fetch(`/api/reports/generate?${params}`, {
        method: 'GET',
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Report Generated',
          'Report has been generated successfully.',
        );
        // Update the report data with the new filtered data
        setReportData((prev) => ({
          ...prev,
          orders: data.data.orders || prev.orders,
          users: data.data.users || prev.users,
          stones: data.data.stones || prev.stones,
          papers: data.data.papers || prev.papers,
          plastics: data.data.plastics || prev.plastics,
          tapes: data.data.tapes || prev.tapes,
        }));
      } else {
        showError(
          'Report Generation Failed',
          data.message || 'Failed to generate report.',
        );
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showError(
        'Network Error',
        'Failed to generate report. Please try again.',
      );
    }
  };

  const handleExportData = async (type: string) => {
    try {
      const params = new URLSearchParams({
        type,
        format: 'csv',
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
      });

      const response = await fetch(`/api/reports/export?${params}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${
          new Date().toISOString().split('T')[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess(
          'Export Successful',
          `${type} data has been exported successfully.`,
        );
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner
            size="lg"
            className="mx-auto mb-4"
          />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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

  const lowStockItems = reportData.stones.filter(
    (stone) => stone.quantity < 100,
  ).length;
  const recentOrders = reportData.orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orderDate >= weekAgo;
  }).length;

  const totalInventoryItems =
    totalStones + totalPapers + totalPlastics + totalTapes;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Generate reports and view system analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Report Generation Controls */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Reports
          </CardTitle>
          <CardDescription>
            Generate and export reports based on your criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={handleGenerateReport}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Buttons */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Quick Export
          </CardTitle>
          <CardDescription>Export data in different formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => handleExportData('inventory')}
              className="flex flex-col items-center space-y-2 p-6 h-auto"
            >
              <Package className="h-8 w-8" />
              <span className="font-medium">Inventory</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData('orders')}
              className="flex flex-col items-center space-y-2 p-6 h-auto"
            >
              <FileText className="h-8 w-8" />
              <span className="font-medium">Orders</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData('users')}
              className="flex flex-col items-center space-y-2 p-6 h-auto"
            >
              <Users className="h-8 w-8" />
              <span className="font-medium">Users</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData('analytics')}
              className="flex flex-col items-center space-y-2 p-6 h-auto"
            >
              <BarChart3 className="h-8 w-8" />
              <span className="font-medium">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {recentOrders} this week
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">Active users</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inventory Items
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInventoryItems}</div>
                <p className="text-xs text-muted-foreground">
                  {lowStockItems} low stock
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Health
                </CardTitle>
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
                  {lowStockItems > 0
                    ? 'Items need attention'
                    : 'All systems operational'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">System is running normally</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Just now
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">
                      {recentOrders} new orders this week
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    This week
                  </span>
                </div>
                {lowStockItems > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">
                        {lowStockItems} items need restocking
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Attention needed
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="inventory"
          className="space-y-6"
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
              <CardDescription>
                Overview of all inventory categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {totalStones}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Stones
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {totalPapers}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Papers
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {totalPlastics}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Plastics
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">
                    {totalTapes}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Tapes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          {lowStockItems > 0 && (
            <Card className="shadow-sm border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700">
                  {lowStockItems} items have low stock levels and may need
                  restocking.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent
          value="orders"
          className="space-y-6"
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Design</TableHead>
                        <TableHead>Weight Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.orders.slice(0, 10).map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">
                            {order.customerName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.type === 'internal'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {order.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.designId?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div>
                                Final:{' '}
                                {order.finalTotalWeight?.toFixed(2) || 'N/A'}g
                              </div>
                              <div>
                                Calculated:{' '}
                                {order.calculatedWeight?.toFixed(2) || 'N/A'}g
                              </div>
                              {order.weightDiscrepancy !== undefined &&
                                order.weightDiscrepancy !== null && (
                                  <div
                                    className={`text-sm ${
                                      order.weightDiscrepancy !== 0
                                        ? order.weightDiscrepancy > 0
                                          ? 'text-red-600'
                                          : 'text-green-600'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    Discrepancy:{' '}
                                    {order.weightDiscrepancy.toFixed(2)}g (
                                    {order.discrepancyPercentage?.toFixed(1)}%)
                                  </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge
                                className={
                                  order.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {order.status}
                              </Badge>
                              {order.isFinalized && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  Finalized
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comprehensive Orders Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>All Orders with Discrepancy Analysis</CardTitle>
              <CardDescription>
                Complete order data including weight discrepancies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Design</TableHead>
                        <TableHead>Calculated Weight</TableHead>
                        <TableHead>Final Weight</TableHead>
                        <TableHead>Discrepancy</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Finalized</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.orders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">
                            {order.customerName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.type === 'internal'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {order.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.designId?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {order.calculatedWeight?.toFixed(2) || 'N/A'}g
                          </TableCell>
                          <TableCell>
                            {order.finalTotalWeight?.toFixed(2) || 'Not set'}g
                          </TableCell>
                          <TableCell>
                            {order.weightDiscrepancy !== undefined &&
                            order.weightDiscrepancy !== null ? (
                              <div
                                className={`${
                                  order.weightDiscrepancy !== 0
                                    ? order.weightDiscrepancy > 0
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                    : 'text-gray-600'
                                }`}
                              >
                                {order.weightDiscrepancy.toFixed(2)}g (
                                {order.discrepancyPercentage?.toFixed(1)}%)
                              </div>
                            ) : (
                              <span className="text-gray-500">
                                Not calculated
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                order.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.isFinalized ? (
                              <Badge className="bg-green-100 text-green-800">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="analytics"
          className="space-y-6"
        >
          {/* Inventory Analytics */}
          {reportData.analytics && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Inventory Analytics</CardTitle>
                <CardDescription>
                  Current inventory status and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.analytics.inventory.totalStoneQuantity.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Stone Quantity
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.analytics.inventory.totalPaperQuantity.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Paper Quantity
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {reportData.analytics.inventory.lowStockStones}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Low Stock Stones
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {reportData.analytics.inventory.lowStockPapers}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Low Stock Papers
                    </p>
                  </div>
                </div>

                {/* Low Stock Alerts */}
                {reportData.analytics.lowStockItems.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">
                      Low Stock Alerts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reportData.analytics.lowStockItems
                        .slice(0, 6)
                        .map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {'name' in item
                                  ? item.name
                                  : `${item.width}" Paper`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {'number' in item
                                  ? `#${item.number}`
                                  : `Quantity: ${item.quantity}`}
                              </p>
                            </div>
                            <Badge variant="destructive">{item.quantity}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Analytics */}
          {reportData.analytics && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Order Analytics</CardTitle>
                <CardDescription>
                  Order statistics and distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.analytics.orders.total}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Orders
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.analytics.orders.completed}
                    </div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {reportData.analytics.orders.pending}
                    </div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {reportData.analytics.orders.internal}
                    </div>
                    <p className="text-sm text-muted-foreground">Internal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Order Trends</CardTitle>
              <CardDescription>
                Visualization of order patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Chart visualization will be implemented here</p>
                  <p className="text-sm">Order analytics and trend analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Order Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Internal Orders</span>
                    <span className="font-medium">
                      {
                        reportData.orders.filter((o) => o.type === 'internal')
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">External Orders</span>
                    <span className="font-medium">
                      {reportData.orders.filter((o) => o.type === 'out').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Admins</span>
                    <span className="font-medium">
                      {
                        reportData.users.filter((u) => u.role === 'admin')
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Managers</span>
                    <span className="font-medium">
                      {
                        reportData.users.filter((u) => u.role === 'manager')
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Employees</span>
                    <span className="font-medium">
                      {
                        reportData.users.filter((u) => u.role === 'employee')
                          .length
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
