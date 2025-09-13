'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import { authenticatedFetch } from '@/lib/utils';
import { Customer, Order } from '@/types';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Calendar,
  Package,
  TrendingUp,
  DollarSign,
  CheckCircle
} from 'lucide-react';

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { showError } = useSnackbarHelpers();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchCustomerDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/customers/${params.id}`);
      const result = await response.json();
      if (result.success) {
        setCustomer(result.data);
      } else {
        showError('Failed to fetch customer details');
      }
    } catch {
      showError('Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  }, [params.id, showError]);

  const fetchCustomerAnalytics = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`/api/customers/analytics?customerId=${params.id}`);
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data.analytics);
        setOrders(result.data.analytics.recentOrders || []);
      }
    } catch (error) {
      console.error('Failed to fetch customer analytics:', error);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchCustomerDetails();
      fetchCustomerAnalytics();
    }
  }, [params.id, fetchCustomerDetails, fetchCustomerAnalytics]);

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'retail': return 'bg-blue-100 text-blue-800';
      case 'wholesale': return 'bg-green-100 text-green-800';
      case 'corporate': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Customer not found</h1>
          <p className="text-muted-foreground mt-2">The customer you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/customers')} className="mt-4">
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/customers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">Customer Details</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(customer.isActive)}>
            {customer.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge className={getCustomerTypeColor(customer.customerType)}>
            {customer.customerType}
          </Badge>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{analytics.totalOrders as number}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500 dark:text-green-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalAmount as number)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.averageOrderValue as number)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{(analytics.completionRate as number).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-lg font-semibold">{customer.name}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              
              {customer.company && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                  <p>{customer.company}</p>
                </div>
              )}
              
              {customer.gstNumber && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">GST Number</Label>
                  <p>{customer.gstNumber}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Customer Type</Label>
                  <Badge className={getCustomerTypeColor(customer.customerType)}>
                    {customer.customerType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Credit Limit</Label>
                  <p>{formatCurrency(customer.creditLimit)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Payment Terms</Label>
                <p>{customer.paymentTerms}</p>
              </div>
              
              {customer.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm">{customer.notes}</p>
                </div>
              )}
              
              {customer.tags && customer.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {customer.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          {customer.address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customer.address.street && <p>{customer.address.street}</p>}
                  {customer.address.city && customer.address.state && (
                    <p>{customer.address.city}, {customer.address.state}</p>
                  )}
                  {customer.address.pincode && customer.address.country && (
                    <p>{customer.address.pincode}, {customer.address.country}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Member Since</Label>
                <p>{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
              
              {customer.updatedAt && customer.updatedAt !== customer.createdAt && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                  <p>{new Date(customer.updatedAt).toLocaleDateString()}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <Badge className={getStatusColor(customer.isActive)}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                  <p>No orders found for this customer.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="border border-border rounded-lg p-4 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <Badge className={getPaymentStatusColor(order.paymentStatus || 'pending')}>
                            {order.paymentStatus || 'pending'}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Order ID</Label>
                          <p className="font-mono">{order._id.slice(-8)}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                          <p className="capitalize">{order.type}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Amount</Label>
                          <p className="font-semibold">{formatCurrency(order.finalAmount || 0)}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Weight</Label>
                          <p>{order.finalTotalWeight ? `${order.finalTotalWeight}g` : 'N/A'}</p>
                        </div>
                      </div>
                      
                      {order.notes && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
                          <p className="text-sm">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
