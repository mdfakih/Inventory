'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import { authenticatedFetch } from '@/lib/utils';
import { Customer } from '@/types';
import { CustomerOrderHistoryModal } from '@/components/customer-order-history-modal';

import {
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  Filter,
  Users,
  TrendingUp,
  Calendar,
  Building2,
  Phone,
  Mail,
  Package,
} from 'lucide-react';

// Define the form data type to match CustomerForm expectations
type CustomerFormData = {
  name: string;
  phone: string;
  email: string;
  company: string;
  gstNumber: string;
  customerType: 'retail' | 'wholesale' | 'corporate';
  creditLimit: number;
  paymentTerms: 'immediate' | '7days' | '15days' | '30days' | '45days';
  isActive: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  notes: string;
  tags: string[];
};

// Define analytics type
type CustomerAnalytics = {
  totalCustomers: number;
  newCustomersThisPeriod: number;
  customerTypeStats: Array<{ _id: string; count: number }>;
};

export default function CustomersPage() {
  const { showSuccess, showError } = useSnackbarHelpers();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] =
    useState<Customer | null>(null);

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    company: '',
    gstNumber: '',
    customerType: 'retail',
    creditLimit: 0,
    paymentTerms: 'immediate',
    isActive: true,
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    notes: '',
    tags: [],
  });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (customerTypeFilter && customerTypeFilter !== 'all')
        params.append('customerType', customerTypeFilter);
      if (statusFilter && statusFilter !== 'all')
        params.append('isActive', statusFilter);

      const response = await authenticatedFetch(`/api/customers?${params}`);
      const result = await response.json();
      if (result.success) {
        setCustomers(result.data);
        setTotalPages(result.pagination.pages);
        setTotalCustomers(result.pagination.total);
      }
    } catch {
      showError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, customerTypeFilter, statusFilter]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/customers/analytics');
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, customerTypeFilter, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCustomers();
  };

  const handleCreateCustomer = async () => {
    try {
      const response = await authenticatedFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        showSuccess('Customer created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchCustomers();
        fetchAnalytics();
      } else {
        showError(result.message || 'Failed to create customer');
      }
    } catch {
      showError('Failed to create customer');
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await authenticatedFetch(
        `/api/customers/${selectedCustomer._id}`,
        {
          method: 'PUT',
          body: JSON.stringify(formData),
        },
      );
      const result = await response.json();

      if (result.success) {
        showSuccess('Customer updated successfully');
        setIsEditDialogOpen(false);
        setSelectedCustomer(null);
        resetForm();
        fetchCustomers();
        fetchAnalytics();
      } else {
        showError(result.message || 'Failed to update customer');
      }
    } catch {
      showError('Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to deactivate this customer?')) return;

    try {
      const response = await authenticatedFetch(
        `/api/customers/${customerId}`,
        {
          method: 'DELETE',
        },
      );
      const result = await response.json();

      if (result.success) {
        showSuccess('Customer deactivated successfully');
        fetchCustomers();
        fetchAnalytics();
      } else {
        showError(result.message || 'Failed to deactivate customer');
      }
    } catch {
      showError('Failed to deactivate customer');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      gstNumber: '',
      customerType: 'retail',
      creditLimit: 0,
      paymentTerms: 'immediate',
      isActive: true,
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
      },
      notes: '',
      tags: [],
    });
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      company: customer.company || '',
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType,
      creditLimit: customer.creditLimit,
      paymentTerms: customer.paymentTerms,
      isActive: customer.isActive,
      address: {
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        pincode: customer.address?.pincode || '',
        country: customer.address?.country || 'India',
      },
      notes: customer.notes || '',
      tags: customer.tags || [],
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const openOrderHistory = (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
    setIsOrderHistoryOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'retail':
        return 'bg-blue-100 text-blue-800';
      case 'wholesale':
        return 'bg-green-100 text-green-800';
      case 'corporate':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <Button
          onClick={openCreateDialog}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold">
                    {analytics.totalCustomers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold">
                    {analytics.newCustomersThisPeriod}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Corporate</p>
                  <p className="text-2xl font-bold">
                    {analytics.customerTypeStats?.find(
                      (s: { _id: string; count: number }) =>
                        s._id === 'corporate',
                    )?.count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">
                    {customers.filter((c) => c.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={customerTypeFilter}
              onValueChange={setCustomerTypeFilter}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Customer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleSearch}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({totalCustomers})</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Try adjusting your search or filters to find customers."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          {customer.email && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>{customer.company || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          className={getCustomerTypeColor(
                            customer.customerType,
                          )}
                        >
                          {customer.customerType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(customer.isActive)}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewDialog(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderHistory(customer)}
                            title="View Order History"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>

          <CustomerForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreateCustomer}
            submitLabel="Create Customer"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>

          <CustomerForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateCustomer}
            submitLabel="Update Customer"
          />
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Name
                  </Label>
                  <p className="text-lg font-semibold">
                    {selectedCustomer.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Phone
                  </Label>
                  <p className="text-lg">{selectedCustomer.phone}</p>
                </div>
                {selectedCustomer.email && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Email
                    </Label>
                    <p className="text-lg">{selectedCustomer.email}</p>
                  </div>
                )}
                {selectedCustomer.company && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Company
                    </Label>
                    <p className="text-lg">{selectedCustomer.company}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Customer Type
                  </Label>
                  <Badge
                    className={getCustomerTypeColor(
                      selectedCustomer.customerType,
                    )}
                  >
                    {selectedCustomer.customerType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Status
                  </Label>
                  <Badge className={getStatusColor(selectedCustomer.isActive)}>
                    {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {selectedCustomer.address && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Address
                  </Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p>{selectedCustomer.address.street}</p>
                    <p>
                      {selectedCustomer.address.city},{' '}
                      {selectedCustomer.address.state}
                    </p>
                    <p>
                      {selectedCustomer.address.pincode},{' '}
                      {selectedCustomer.address.country}
                    </p>
                  </div>
                </div>
              )}

              {selectedCustomer.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Notes
                  </Label>
                  <p className="mt-1">{selectedCustomer.notes}</p>
                </div>
              )}

              {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Tags
                  </Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order History Modal */}
      {selectedCustomerForHistory && (
        <CustomerOrderHistoryModal
          isOpen={isOrderHistoryOpen}
          onClose={() => {
            setIsOrderHistoryOpen(false);
            setSelectedCustomerForHistory(null);
          }}
          customerId={selectedCustomerForHistory._id}
          customerName={selectedCustomerForHistory.name}
        />
      )}
    </div>
  );
}

// Customer Form Component
function CustomerForm({
  formData,
  setFormData,
  onSubmit,
  submitLabel,
}: {
  formData: CustomerFormData;
  setFormData: (data: CustomerFormData) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const handleInputChange = (
    field: string,
    value: string | number | boolean | string[],
  ) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'address' && typeof child === 'string') {
        setFormData({
          ...formData,
          address: {
            ...formData.address,
            [child]: value,
          },
        });
      }
    } else {
      // Use type assertion for the dynamic field update
      const updatedData = { ...formData, [field]: value };
      setFormData(updatedData as CustomerFormData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="gstNumber">GST Number</Label>
          <Input
            id="gstNumber"
            value={formData.gstNumber}
            onChange={(e) => handleInputChange('gstNumber', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="customerType">Customer Type</Label>
          <Select
            value={formData.customerType}
            onValueChange={(value) => handleInputChange('customerType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="wholesale">Wholesale</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="creditLimit">Credit Limit</Label>
          <Input
            id="creditLimit"
            type="number"
            value={formData.creditLimit}
            onChange={(e) =>
              handleInputChange('creditLimit', parseFloat(e.target.value) || 0)
            }
          />
        </div>

        <div>
          <Label htmlFor="paymentTerms">Payment Terms</Label>
          <Select
            value={formData.paymentTerms}
            onValueChange={(value) => handleInputChange('paymentTerms', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="15days">15 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="45days">45 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Address</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) =>
                handleInputChange('address.street', e.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.address.city}
              onChange={(e) =>
                handleInputChange('address.city', e.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.address.state}
              onChange={(e) =>
                handleInputChange('address.state', e.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              value={formData.address.pincode}
              onChange={(e) =>
                handleInputChange('address.pincode', e.target.value)
              }
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={3}
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          type="button"
        >
          Cancel
        </Button>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}
