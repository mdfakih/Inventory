'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { LoadingButton } from '@/components/ui/loading-button';
import { EmptyState } from '@/components/ui/empty-state';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import { authenticatedFetch } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Pagination } from '@/components/ui/pagination';

import { Edit, Trash2, Eye, Package, Plus, CheckCircle } from 'lucide-react';
import { CustomerAutocomplete } from '@/components/customer-autocomplete';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Design {
  _id: string;
  name: string;
  number: string;
  prices: Array<{
    currency: '₹' | '$';
    price: number;
  }>;
}

interface Paper {
  _id: string;
  width: number;
  quantity: number;
  totalPieces: number;
  piecesPerRoll: number;
  weightPerPiece: number;
  inventoryType: 'internal' | 'out';
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  customerType: 'retail' | 'wholesale' | 'corporate';
}

interface Order {
  _id: string;
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  customerId?: string;
  designId: Design;
  stonesUsed: Array<{
    stoneId: {
      _id: string;
      name: string;
      color: string;
      size: string;
    };
    quantity: number;
  }>;
  paperUsed: {
    sizeInInch: number;
    quantityInPcs: number;
    paperWeightPerPc: number;
  };
  calculatedWeight?: number;
  finalTotalWeight?: number;
  weightDiscrepancy: number;
  discrepancyPercentage: number;
  status: 'pending' | 'completed' | 'cancelled';
  isFinalized: boolean;
  finalizedAt?: string;
  modeOfPayment: 'cash' | 'UPI' | 'card';
  paymentStatus: 'pending' | 'partial' | 'completed' | 'overdue';
  discountType: 'percentage' | 'flat';
  discountValue: number;
  totalCost: number;
  discountedAmount: number;
  finalAmount: number;
  notes?: string;
  createdBy: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

// Type for creating/updating orders via API
interface CreateOrderData {
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  customerId?: string;
  designId: string;
  paperUsed: {
    sizeInInch: number;
    quantityInPcs: number;
  };
  modeOfPayment: 'cash' | 'UPI' | 'card';
  discountType: 'percentage' | 'flat';
  discountValue: number;
  notes?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isFinalizing, setIsFinalizing] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    cancelText: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });
  const [formData, setFormData] = useState({
    type: 'internal' as 'internal' | 'out',
    customerName: '',
    phone: '',
    customerId: '',
    designId: '',
    paperUsed: {
      sizeInInch: '',
      quantityInPcs: '',
    },
    modeOfPayment: 'cash' as 'cash' | 'UPI' | 'card',
    paymentStatus: 'pending' as 'pending' | 'partial' | 'completed' | 'overdue',
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: '',
    notes: '',
  });
  const [editFormData, setEditFormData] = useState({
    type: 'internal' as 'internal' | 'out',
    customerName: '',
    phone: '',
    customerId: '',
    designId: '',
    paperUsed: {
      sizeInInch: '',
      quantityInPcs: '',
    },
    finalTotalWeight: '',
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
    isFinalized: false,
    modeOfPayment: 'cash' as 'cash' | 'UPI' | 'card',
    paymentStatus: 'pending' as 'pending' | 'partial' | 'completed' | 'overdue',
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: '',
    notes: '',
  });
  const { showSuccess, showError } = useSnackbarHelpers();
  const { loading: authLoading, isAuthenticated } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const [ordersRes, designsRes, internalPapersRes, outPapersRes] =
        await Promise.all([
          authenticatedFetch(`/api/orders?page=${currentPage}&limit=${itemsPerPage}`),
          authenticatedFetch('/api/designs'),
          authenticatedFetch('/api/inventory/paper?type=internal'),
          authenticatedFetch('/api/inventory/paper?type=out'),
        ]);

      const ordersData = await ordersRes.json();
      const designsData = await designsRes.json();
      const internalPapersData = await internalPapersRes.json();
      const outPapersData = await outPapersRes.json();

      if (ordersData.success) {
        setOrders(ordersData.data);
        setTotalPages(ordersData.pagination.pages);
        setTotalItems(ordersData.pagination.total);
      }
      if (designsData.success) setDesigns(designsData.data);

      // Combine both internal and out papers
      const allPapers = [];
      if (internalPapersData.success)
        allPapers.push(...internalPapersData.data);
      if (outPapersData.success) allPapers.push(...outPapersData.data);
      setPapers(allPapers);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Data Loading Error', 'Failed to load orders data.');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, [currentPage, itemsPerPage]);

  const fetchUser = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }, []);

  useEffect(() => {
    // Only fetch data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchData();
      fetchUser();
    }
  }, [authLoading, isAuthenticated, fetchData, fetchUser]);

  // Separate useEffect for pagination changes to avoid infinite loops
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchData();
    }
  }, [currentPage, itemsPerPage, authLoading, isAuthenticated, fetchData]);

  // Update filtered orders when orders change
  useEffect(() => {
    setFilteredOrders(orders);
  }, [orders]);

  // Reset paper size when order type changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      paperUsed: {
        ...prev.paperUsed,
        sizeInInch: '',
      },
    }));
  }, [formData.type]);

  // Reset paper size when edit form order type changes
  useEffect(() => {
    setEditFormData((prev) => ({
      ...prev,
      paperUsed: {
        ...prev.paperUsed,
        sizeInInch: '',
      },
    }));
  }, [editFormData.type]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const orderData: CreateOrderData = {
        type: formData.type,
        customerName: formData.customerName,
        phone: formData.phone,
        customerId: formData.customerId || undefined,
        designId: formData.designId,
        paperUsed: {
          sizeInInch: parseInt(formData.paperUsed.sizeInInch),
          quantityInPcs: parseInt(formData.paperUsed.quantityInPcs),
        },
        modeOfPayment: formData.modeOfPayment,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue) || 0,
        notes: formData.notes || undefined,
      };

      const response = await authenticatedFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Order Created',
          'New order has been created successfully.',
        );
        setIsCreateDialogOpen(false);
        setFormData({
          type: 'internal',
          customerName: '',
          phone: '',
          customerId: '',
          designId: '',
          paperUsed: {
            sizeInInch: '',
            quantityInPcs: '',
          },
          modeOfPayment: 'cash',
          paymentStatus: 'pending',
          discountType: 'percentage',
          discountValue: '',
          notes: '',
        });
        await fetchData(true);
      } else {
        showError('Creation Failed', data.message || 'Failed to create order.');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Network Error', 'Failed to create order. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsUpdating(selectedOrder._id);
    try {
      const response = await authenticatedFetch(
        `/api/orders/${selectedOrder._id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...editFormData,
            paperUsed: {
              ...editFormData.paperUsed,
              sizeInInch: parseInt(editFormData.paperUsed.sizeInInch),
              quantityInPcs: parseInt(editFormData.paperUsed.quantityInPcs),
            },
            finalTotalWeight: editFormData.finalTotalWeight
              ? parseFloat(editFormData.finalTotalWeight)
              : undefined,
            modeOfPayment: editFormData.modeOfPayment,
            discountType: editFormData.discountType,
            discountValue: parseFloat(editFormData.discountValue) || 0,
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        showSuccess('Order Updated', 'Order has been updated successfully.');
        setIsEditDialogOpen(false);
        setSelectedOrder(null);
        await fetchData(true);
      } else {
        showError('Update Failed', data.message || 'Failed to update order.');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showError('Network Error', 'Failed to update order. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      setFormData({
        ...formData,
        customerName: customer.name,
        phone: customer.phone,
        customerId: customer._id,
      });
    } else {
      setFormData({
        ...formData,
        customerName: '',
        phone: '',
        customerId: '',
        notes: formData.notes, // Preserve notes when clearing customer
      });
    }
  };

  const handleEditCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      setEditFormData({
        ...editFormData,
        customerName: customer.name,
        phone: customer.phone,
        customerId: customer._id,
      });
    } else {
      setEditFormData({
        ...editFormData,
        customerName: '',
        phone: '',
        customerId: '',
      });
    }
  };

  const handleFinalize = async (orderId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Finalize Order',
      message:
        'Are you sure you want to finalize this order? This will deduct consumed materials from inventory.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsFinalizing(orderId);
        try {
          const response = await authenticatedFetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({
              isFinalized: true,
            }),
          });

          const data = await response.json();
          if (data.success) {
            showSuccess(
              'Order Finalized',
              'Order has been finalized and materials deducted from inventory.',
            );
            await fetchData(true);
          } else {
            showError(
              'Finalization Failed',
              data.message || 'Failed to finalize order.',
            );
          }
        } catch (error) {
          console.error('Error finalizing order:', error);
          showError(
            'Network Error',
            'Failed to finalize order. Please try again.',
          );
        } finally {
          setIsFinalizing(null);
        }
      },
      confirmText: 'Finalize',
      cancelText: 'Cancel',
    });
  };

  const handleComplete = async (orderId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Complete Order',
      message:
        'Are you sure you want to mark this order as completed? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsCompleting(orderId);
        try {
          // Get the current order data to ensure we have all necessary fields
          const orderResponse = await authenticatedFetch(
            `/api/orders/${orderId}`,
          );
          const orderData = await orderResponse.json();

          if (!orderData.success) {
            throw new Error('Failed to fetch order data');
          }

          const order = orderData.data;

          // Prepare update data with all necessary fields
          const updateData = {
            status: 'completed',
            // Include existing data to ensure discrepancy calculation works
            type: order.type,
            customerName: order.customerName,
            phone: order.phone,
            designId: order.designId._id || order.designId,
            paperUsed: order.paperUsed,
            calculatedWeight: order.calculatedWeight,
            // Only include finalTotalWeight if it exists, otherwise use calculated weight
            finalTotalWeight: order.finalTotalWeight || order.calculatedWeight,
          };

          const response = await authenticatedFetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
          });

          const data = await response.json();
          if (data.success) {
            showSuccess(
              'Order Completed',
              'Order has been marked as completed successfully.',
            );
            // Close all modals and reset state
            setIsViewDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedOrder(null);
            await fetchData(true);
          } else {
            showError(
              'Completion Failed',
              data.message || 'Failed to complete order.',
            );
          }
        } catch (error) {
          console.error('Error completing order:', error);
          showError(
            'Network Error',
            'Failed to complete order. Please try again.',
          );
        } finally {
          setIsCompleting(null);
        }
      },
      confirmText: 'Complete',
      cancelText: 'Cancel',
    });
  };

  const handleDelete = async (orderId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Order',
      message:
        'Are you sure you want to delete this order? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsDeleting(orderId);
        try {
          const response = await authenticatedFetch(`/api/orders/${orderId}`, {
            method: 'DELETE',
          });

          const data = await response.json();
          if (data.success) {
            showSuccess(
              'Order Deleted',
              'Order has been deleted successfully.',
            );
            await fetchData(true);
          } else {
            showError(
              'Deletion Failed',
              data.message || 'Failed to delete order.',
            );
          }
        } catch (error) {
          console.error('Error deleting order:', error);
          showError(
            'Network Error',
            'Failed to delete order. Please try again.',
          );
        } finally {
          setIsDeleting(null);
        }
      },
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
  };

  const openEditDialog = (order: Order) => {
    setSelectedOrder(order);
    setEditFormData({
      type: order.type,
      customerName: order.customerName,
      phone: order.phone,
      customerId: order.customerId || '',
      designId: order.designId._id,
      paperUsed: {
        sizeInInch: order.paperUsed.sizeInInch.toString(),
        quantityInPcs: order.paperUsed.quantityInPcs.toString(),
      },
      finalTotalWeight: order.finalTotalWeight?.toString() || '',
      status: order.status,
      isFinalized: order.isFinalized,
      modeOfPayment: order.modeOfPayment || 'cash',
      paymentStatus: order.paymentStatus || 'pending',
      discountType: order.discountType || 'percentage',
      discountValue: order.discountValue?.toString() || '',
      notes: order.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInventoryTypeFilter = (type: 'internal' | 'out') => {
    return type === 'out' ? 'out' : 'internal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <p className="text-gray-600">
          Manage customer orders and track production
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Orders ({filteredOrders.length})</h2>
          <p className="text-sm text-muted-foreground">
            Track all internal and external orders
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Payment Status Filter */}
          <Select
            value={paymentStatusFilter}
            onValueChange={(value) => {
              setPaymentStatusFilter(value);
              // Filter orders based on the selected payment status
              const filtered = orders.filter(order => {
                if (value === 'all') return true;
                return order.paymentStatus === value;
              });
              setFilteredOrders(filtered);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          
          {refreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="sm" />
              <span>Refreshing...</span>
            </div>
          )}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-[75vw] max-w-[1200px] h-[85vh] sm:h-[75vh] max-h-[800px] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl sm:text-2xl">Create New Order</DialogTitle>
              </DialogHeader>
                             <form
                 onSubmit={handleCreateSubmit}
                 className="space-y-4 p-2"
               >
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                   {/* Left Half - Customer & Order Details */}
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold border-b pb-2">Customer & Order Details</h3>
                     
                     <div className="space-y-4">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <Label htmlFor="type" className="text-sm font-medium">Order Type</Label>
                           <Select
                             value={formData.type}
                             onValueChange={(value) =>
                               setFormData({
                                 ...formData,
                                 type: value as 'internal' | 'out',
                               })
                             }
                           >
                             <SelectTrigger className="h-10">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="internal">Internal</SelectItem>
                               <SelectItem value="out">Out</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor="customerName" className="text-sm font-medium">Customer Name</Label>
                           <CustomerAutocomplete
                             onChange={(value) =>
                               setFormData({
                                 ...formData,
                                 customerName: value,
                               })
                             }
                             onCustomerSelect={handleCustomerSelect}
                             placeholder="Search customers..."
                             className="h-10"
                           />
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <Label htmlFor="phone">Phone</Label>
                           <Input
                             id="phone"
                             value={formData.phone}
                             onChange={(e) =>
                               setFormData({ ...formData, phone: e.target.value })
                             }
                             required
                           />
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor="designId">Design</Label>
                           <Select
                             value={formData.designId}
                             onValueChange={(value) =>
                               setFormData({ ...formData, designId: value })
                             }
                           >
                             <SelectTrigger>
                               <SelectValue placeholder="Select design" />
                             </SelectTrigger>
                             <SelectContent>
                               {designs.map((design) => (
                                 <SelectItem
                                   key={design._id}
                                   value={design._id}
                                 >
                                   {design.name}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <Label htmlFor="sizeInInch">Paper Size (inches)</Label>
                           <Select
                             value={formData.paperUsed.sizeInInch}
                             onValueChange={(value) =>
                               setFormData({
                                 ...formData,
                                 paperUsed: {
                                   ...formData.paperUsed,
                                   sizeInInch: value,
                                 },
                               })
                             }
                           >
                             <SelectTrigger>
                               <SelectValue placeholder="Select paper size" />
                             </SelectTrigger>
                             <SelectContent>
                               {papers
                                 .filter(
                                   (p) =>
                                     p.inventoryType ===
                                     getInventoryTypeFilter(formData.type),
                                 )
                                 .map((paper) => (
                                   <SelectItem
                                     key={paper._id}
                                     value={paper.width.toString()}
                                   >
                                     {paper.width}&quot; ({paper.weightPerPiece}g per
                                     piece)
                                   </SelectItem>
                                 ))}
                             </SelectContent>
                           </Select>
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor="quantityInPcs">Quantity (pieces)</Label>
                           <Input
                             id="quantityInPcs"
                             type="number"
                             value={formData.paperUsed.quantityInPcs}
                             onChange={(e) =>
                               setFormData({
                                 ...formData,
                                 paperUsed: {
                                   ...formData.paperUsed,
                                   quantityInPcs: e.target.value,
                                 },
                               })
                             }
                             required
                           />
                         </div>
                       </div>

                       {/* Payment and Pricing Section */}
                       <div className="space-y-4">
                         <h3 className="text-lg font-semibold border-b pb-2">Payment & Pricing</h3>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label htmlFor="modeOfPayment">Mode of Payment</Label>
                             <Select
                               value={formData.modeOfPayment}
                               onValueChange={(value) =>
                                 setFormData({
                                   ...formData,
                                   modeOfPayment: value as 'cash' | 'UPI' | 'card',
                                 })
                               }
                             >
                               <SelectTrigger>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="cash">Cash</SelectItem>
                                 <SelectItem value="UPI">UPI</SelectItem>
                                 <SelectItem value="card">Card</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div className="space-y-2">
                             <Label htmlFor="paymentStatus">Payment Status</Label>
                             <Select
                               value={formData.paymentStatus}
                               onValueChange={(value) =>
                                 setFormData({
                                   ...formData,
                                   paymentStatus: value as 'pending' | 'partial' | 'completed' | 'overdue',
                                 })
                               }
                             >
                               <SelectTrigger>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="pending">Pending</SelectItem>
                                 <SelectItem value="partial">Partial</SelectItem>
                                 <SelectItem value="completed">Completed</SelectItem>
                                 <SelectItem value="overdue">Overdue</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label htmlFor="discountType">Discount Type</Label>
                             <Select
                               value={formData.discountType}
                               onValueChange={(value) =>
                                 setFormData({
                                   ...formData,
                                   discountType: value as 'percentage' | 'flat',
                                 })
                               }
                             >
                               <SelectTrigger>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="percentage">Percentage (%)</SelectItem>
                                 <SelectItem value="flat">Flat Amount</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div className="space-y-2">
                             <Label htmlFor="discountValue">Discount Value</Label>
                             <Input
                               id="discountValue"
                               type="number"
                               step="0.01"
                               value={formData.discountValue}
                               onChange={(e) =>
                                 setFormData({
                                   ...formData,
                                   discountValue: e.target.value,
                                 })
                               }
                               placeholder={formData.discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                             />
                           </div>
                         </div>

                         <div className="space-y-2">
                           <Label className="text-sm font-medium">Total Cost</Label>
                           <div className="p-3 bg-muted/30 rounded-lg border">
                             <div className="space-y-2">
                               <div className="flex justify-between items-center">
                                 <span className="text-sm">Base Cost:</span>
                                 <span className="font-medium">
                                   {formData.designId && formData.paperUsed.quantityInPcs
                                     ? (() => {
                                         const design = designs.find(d => d._id === formData.designId);
                                         return design?.prices?.[0]?.price 
                                           ? `${design.prices[0].currency} ${(design.prices[0].price * parseInt(formData.paperUsed.quantityInPcs)).toFixed(2)}`
                                           : 'Not set';
                                       })()
                                     : 'Not set'}
                                 </span>
                               </div>
                               <div className="flex justify-between items-center">
                                 <span className="text-sm">Discount:</span>
                                 <span className="font-medium text-green-600">
                                   {formData.discountValue && formData.discountType
                                     ? (() => {
                                         const design = designs.find(d => d._id === formData.designId);
                                         if (!design?.prices?.[0]?.price || !formData.paperUsed.quantityInPcs) return '₹ 0.00';
                                         const baseCost = design.prices[0].price * parseInt(formData.paperUsed.quantityInPcs);
                                         const discount = formData.discountType === 'percentage' 
                                           ? (baseCost * parseFloat(formData.discountValue)) / 100
                                           : parseFloat(formData.discountValue);
                                         return `₹ ${discount.toFixed(2)}`;
                                       })()
                                     : '₹ 0.00'}
                                 </span>
                               </div>
                               <div className="flex justify-between items-center pt-2 border-t">
                                 <span className="font-semibold">Final Amount:</span>
                                 <span className="text-lg font-bold text-primary">
                                   {formData.designId && formData.paperUsed.quantityInPcs && formData.discountValue
                                     ? (() => {
                                         const design = designs.find(d => d._id === formData.designId);
                                         if (!design?.prices?.[0]?.price) return 'Not set';
                                         const baseCost = design.prices[0].price * parseInt(formData.paperUsed.quantityInPcs);
                                         const discount = formData.discountType === 'percentage' 
                                           ? (baseCost * parseFloat(formData.discountValue)) / 100
                                           : parseFloat(formData.discountValue);
                                         return `₹ ${(baseCost - discount).toFixed(2)}`;
                                       })()
                                     : 'Not set'}
                                 </span>
                               </div>
                             </div>
                           </div>
                         </div>
                         </div>
                     </div>
                   </div>

                   {/* Right Half - Weight Calculations & Info */}
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold border-b pb-2">Weight Calculations & Information</h3>
                     
                     <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                       <div className="space-y-3">
                         <div className="flex justify-between items-center py-2 border-b border-muted/50">
                           <span className="text-sm font-medium">Paper Weight per Piece:</span>
                           <span className="text-sm font-semibold text-muted-foreground">
                             {formData.paperUsed.sizeInInch && formData.paperUsed.quantityInPcs
                               ? papers.find(p => p.width.toString() === formData.paperUsed.sizeInInch)?.weightPerPiece || 0
                               : 0}g
                           </span>
                         </div>
                         
                         <div className="flex justify-between items-center py-2 border-b border-muted/50">
                           <span className="text-sm font-medium">Total Quantity:</span>
                           <span className="text-sm font-semibold text-muted-foreground">
                             {formData.paperUsed.quantityInPcs || 0} pieces
                           </span>
                         </div>
                         
                         <div className="flex justify-between items-center py-2">
                           <span className="text-sm font-medium">Calculated Weight:</span>
                           <span className="text-lg font-bold text-primary">
                             {formData.paperUsed.sizeInInch && formData.paperUsed.quantityInPcs
                               ? ((papers.find(p => p.width.toString() === formData.paperUsed.sizeInInch)?.weightPerPiece || 0) * parseInt(formData.paperUsed.quantityInPcs))
                               : 0}g
                           </span>
                         </div>
                       </div>
                       
                       <div className="pt-3 border-t border-muted/50">
                         <div className="text-xs text-muted-foreground space-y-1">
                           <p>• Weight is calculated based on paper size and quantity</p>
                           <p>• Final weight may vary during production</p>
                           <p>• Stones weight will be added separately if used</p>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Notes Section */}
                 <div className="space-y-2">
                   <Label htmlFor="notes">Notes</Label>
                   <textarea
                     id="notes"
                     value={formData.notes}
                     onChange={(e) =>
                       setFormData({
                         ...formData,
                         notes: e.target.value,
                       })
                     }
                     placeholder="Add any additional notes about this order..."
                     className="w-full p-3 border border-gray-300 rounded-md resize-none"
                     rows={3}
                   />
                 </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 sm:space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    type="submit"
                    loading={isCreating}
                    loadingText="Creating..."
                    className="w-full sm:w-auto"
                  >
                    Create Order
                  </LoadingButton>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payment Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(order => order.paymentStatus === 'pending').length}
                </p>
              </div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Partial Payments</p>
                <p className="text-2xl font-bold text-orange-600">
                  {orders.filter(order => order.paymentStatus === 'partial').length}
                </p>
              </div>
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Payments</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(order => order.paymentStatus === 'completed').length}
                </p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Payments</p>
                <p className="text-2xl font-bold text-red-600">
                  {orders.filter(order => order.paymentStatus === 'overdue').length}
                </p>
              </div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No Orders Found"
              description={paymentStatusFilter === 'all' 
                ? "Get started by creating your first order. Orders will appear here once they are created."
                : `No orders found with ${paymentStatusFilter} payment status.`
              }
              action={
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Order
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Design</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Final Amount</TableHead>
                  <TableHead>Stones Used</TableHead>
                  <TableHead>Paper Used</TableHead>
                  <TableHead>Calculated Weight</TableHead>
                  <TableHead>Final Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Finalized</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell>{order.phone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.type === 'internal' ? 'default' : 'secondary'
                        }
                      >
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.designId?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {order.designId?.prices &&
                      order.designId.prices.length > 0 ? (
                        <div className="space-y-1">
                          {order.designId.prices.map((price, index) => (
                            <div
                              key={index}
                              className="font-medium"
                            >
                              {price.currency}{' '}
                              {price.price % 1 === 0
                                ? price.price.toFixed(0)
                                : price.price.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {order.modeOfPayment || 'Not set'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(order.paymentStatus || 'pending')}>
                        {order.paymentStatus || 'Not set'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.totalCost ? (
                        <span className="font-medium">₹ {order.totalCost.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-500">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.finalAmount ? (
                        <span className="font-bold text-primary">₹ {order.finalAmount.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-500">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.stonesUsed && order.stonesUsed.length > 0 ? (
                        <div className="space-y-1">
                          {order.stonesUsed.map((stone, index) => (
                            <div
                              key={index}
                              className="text-sm"
                            >
                              {stone.stoneId?.name || 'Unknown Stone'} (
                              {stone.quantity}g)
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No stones</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.paperUsed.sizeInInch}&quot; ×{' '}
                      {order.paperUsed.quantityInPcs} pcs
                    </TableCell>
                    <TableCell>{order.calculatedWeight?.toFixed(2)}g</TableCell>
                    <TableCell>
                      {order.finalTotalWeight
                        ? `${order.finalTotalWeight.toFixed(2)}g`
                        : 'Not set'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.isFinalized ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Finalized
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {order.type === 'out' &&
                          !order.isFinalized &&
                          order.finalTotalWeight && (
                            <LoadingButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFinalize(order._id)}
                              loading={isFinalizing === order._id}
                              loadingText="Finalizing..."
                            >
                              <CheckCircle className="h-4 w-4" />
                            </LoadingButton>
                          )}
                        {user?.role === 'admin' && (
                          <LoadingButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order._id)}
                            loading={isDeleting === order._id}
                            loadingText=""
                          >
                            <Trash2 className="h-4 w-4" />
                          </LoadingButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="w-[95vw] sm:w-[75vw] max-w-[1200px] h-[85vh] sm:h-[75vh] max-h-[800px] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl sm:text-2xl">Edit Order</DialogTitle>
          </DialogHeader>
                     <form
             onSubmit={handleEditSubmit}
             className="space-y-4 p-2"
           >
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
               {/* Left Half - Customer & Order Details */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">Customer & Order Details</h3>
                 
                 <div className="space-y-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="edit-type">Order Type</Label>
                       <Select
                         value={editFormData.type}
                         onValueChange={(value) =>
                           setEditFormData({
                             ...editFormData,
                             type: value as 'internal' | 'out',
                           })
                         }
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="internal">Internal</SelectItem>
                           <SelectItem value="out">Out</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="edit-status">Status</Label>
                       <Select
                         value={editFormData.status}
                         onValueChange={(value) =>
                           setEditFormData({
                             ...editFormData,
                             status: value as 'pending' | 'completed' | 'cancelled',
                           })
                         }
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="pending">Pending</SelectItem>
                           <SelectItem value="completed">Completed</SelectItem>
                           <SelectItem value="cancelled">Cancelled</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="edit-customerName">Customer Name</Label>
                       <CustomerAutocomplete
                         onChange={(value) =>
                           setEditFormData({
                             ...editFormData,
                             customerName: value,
                           })
                         }
                         onCustomerSelect={handleEditCustomerSelect}
                         placeholder="Search customers..."
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="edit-phone">Phone</Label>
                       <Input
                         id="edit-phone"
                         value={editFormData.phone}
                         onChange={(e) =>
                           setEditFormData({ ...editFormData, phone: e.target.value })
                         }
                         required
                       />
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="edit-designId">Design</Label>
                       <Select
                         value={editFormData.designId}
                         onValueChange={(value) =>
                           setEditFormData({ ...editFormData, designId: value })
                         }
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Select design" />
                         </SelectTrigger>
                         <SelectContent>
                           {designs.map((design) => (
                             <SelectItem
                               key={design._id}
                               value={design._id}
                             >
                               {design.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="edit-sizeInInch">Paper Size (inches)</Label>
                       <Select
                         value={editFormData.paperUsed.sizeInInch}
                         onValueChange={(value) =>
                           setEditFormData({
                             ...editFormData,
                             paperUsed: {
                               ...editFormData.paperUsed,
                               sizeInInch: value,
                             },
                           })
                         }
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Select paper size" />
                         </SelectTrigger>
                         <SelectContent>
                           {papers
                             .filter(
                               (p) =>
                                 p.inventoryType ===
                                 getInventoryTypeFilter(editFormData.type),
                             )
                             .map((paper) => (
                               <SelectItem
                                 key={paper._id}
                                 value={paper.width.toString()}
                               >
                                 {paper.width}&quot; ({paper.weightPerPiece}g per
                                 piece)
                               </SelectItem>
                             ))}
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="edit-quantityInPcs">Quantity (pieces)</Label>
                       <Input
                         id="edit-quantityInPcs"
                         type="number"
                         value={editFormData.paperUsed.quantityInPcs}
                         onChange={(e) =>
                           setEditFormData({
                             ...editFormData,
                             paperUsed: {
                               ...editFormData.paperUsed,
                               quantityInPcs: e.target.value,
                             },
                           })
                         }
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="edit-finalTotalWeight">
                         Final Total Weight (g)
                       </Label>
                       <Input
                         id="edit-finalTotalWeight"
                         type="number"
                         step="0.01"
                         value={editFormData.finalTotalWeight}
                         onChange={(e) =>
                           setEditFormData({
                             ...editFormData,
                             finalTotalWeight: e.target.value,
                           })
                         }
                         placeholder="Enter final weight"
                       />
                     </div>
                   </div>
                 </div>
               </div>

               {/* Right Half - Weight Calculations & Info */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">Payment & Pricing</h3>
                 
                 <div className="space-y-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="edit-modeOfPayment">Mode of Payment</Label>
                       <Select
                         value={editFormData.modeOfPayment}
                         onValueChange={(value) =>
                           setEditFormData({
                             ...editFormData,
                             modeOfPayment: value as 'cash' | 'UPI' | 'card',
                           })
                         }
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="cash">Cash</SelectItem>
                           <SelectItem value="UPI">UPI</SelectItem>
                           <SelectItem value="card">Card</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="edit-paymentStatus">Payment Status</Label>
                       <Select
                         value={editFormData.paymentStatus}
                         onValueChange={(value) =>
                           setEditFormData({
                             ...editFormData,
                             paymentStatus: value as 'pending' | 'partial' | 'completed' | 'overdue',
                           })
                         }
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="pending">Pending</SelectItem>
                           <SelectItem value="partial">Partial</SelectItem>
                           <SelectItem value="completed">Completed</SelectItem>
                           <SelectItem value="overdue">Overdue</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="edit-discountType">Discount Type</Label>
                       <Select
                         value={editFormData.discountType}
                         onValueChange={(value) =>
                           setEditFormData({
                             ...editFormData,
                             discountType: value as 'percentage' | 'flat',
                           })
                         }
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="percentage">Percentage (%)</SelectItem>
                           <SelectItem value="flat">Flat Amount</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="edit-discountValue">Discount Value</Label>
                       <Input
                         id="edit-discountValue"
                         type="number"
                         step="0.01"
                         value={editFormData.discountValue}
                         onChange={(e) =>
                           setEditFormData({
                             ...editFormData,
                             discountValue: e.target.value,
                           })
                         }
                         placeholder={editFormData.discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="text-sm font-medium">Total Cost</Label>
                       <div className="p-3 bg-muted/30 rounded-lg border">
                         <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <span className="text-sm">Base Cost:</span>
                             <span className="font-medium">
                               {editFormData.designId && editFormData.paperUsed.quantityInPcs
                                 ? (() => {
                                     const design = designs.find(d => d._id === editFormData.designId);
                                     return design?.prices?.[0]?.price 
                                       ? `${design.prices[0].currency} ${(design.prices[0].price * parseInt(editFormData.paperUsed.quantityInPcs)).toFixed(2)}`
                                       : 'Not set';
                                   })()
                                 : 'Not set'}
                             </span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-sm">Discount:</span>
                             <span className="font-medium text-green-600">
                               {editFormData.discountValue && editFormData.discountType
                                 ? (() => {
                                     const design = designs.find(d => d._id === editFormData.designId);
                                     if (!design?.prices?.[0]?.price || !editFormData.paperUsed.quantityInPcs) return '₹ 0.00';
                                     const baseCost = design.prices[0].price * parseInt(editFormData.paperUsed.quantityInPcs);
                                     const discount = editFormData.discountType === 'percentage' 
                                       ? (baseCost * parseFloat(editFormData.discountValue)) / 100
                                       : parseFloat(editFormData.discountValue);
                                     return `₹ ${discount.toFixed(2)}`;
                                   })()
                                 : '₹ 0.00'}
                             </span>
                           </div>
                           <div className="flex justify-between items-center pt-2 border-t">
                             <span className="font-semibold">Final Amount:</span>
                             <span className="text-lg font-bold text-primary">
                               {editFormData.designId && editFormData.paperUsed.quantityInPcs && editFormData.discountValue
                                 ? (() => {
                                     const design = designs.find(d => d._id === editFormData.designId);
                                     if (!design?.prices?.[0]?.price) return 'Not set';
                                     const baseCost = design.prices[0].price * parseInt(editFormData.paperUsed.quantityInPcs);
                                     const discount = editFormData.discountType === 'percentage' 
                                       ? (baseCost * parseFloat(editFormData.discountValue)) / 100
                                       : parseFloat(editFormData.discountValue);
                                     return `₹ ${(baseCost - discount).toFixed(2)}`;
                                   })()
                                 : 'Not set'}
                             </span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 <h3 className="text-lg font-semibold border-b pb-2">Weight Calculations & Information</h3>
                 
                                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                     <div className="space-y-3">
                       <div className="flex justify-between items-center py-2 border-b border-muted/50">
                         <span className="text-sm font-medium">Paper Weight per Piece:</span>
                         <span className="text-sm font-semibold text-muted-foreground">
                           {editFormData.paperUsed.sizeInInch
                             ? papers.find(p => p.width.toString() === editFormData.paperUsed.sizeInInch)?.weightPerPiece || 0
                             : 0}g
                         </span>
                       </div>
                       
                       <div className="flex justify-between items-center py-2 border-b border-muted/50">
                         <span className="text-sm font-medium">Total Quantity:</span>
                         <span className="text-sm font-semibold text-muted-foreground">
                           {editFormData.paperUsed.quantityInPcs || 0} pieces
                         </span>
                       </div>
                       
                       <div className="flex justify-between items-center py-2 border-b border-muted/50">
                         <span className="text-sm font-medium">Calculated Weight:</span>
                         <span className="text-lg font-bold text-primary">
                           {editFormData.paperUsed.sizeInInch && editFormData.paperUsed.quantityInPcs
                             ? ((papers.find(p => p.width.toString() === editFormData.paperUsed.sizeInInch)?.weightPerPiece || 0) * parseInt(editFormData.paperUsed.quantityInPcs))
                             : 0}g
                           </span>
                       </div>
                       
                       <div className="flex justify-between items-center py-2">
                         <span className="text-sm font-medium">Final Weight (if set):</span>
                         <span className="text-sm font-semibold text-green-600">
                           {editFormData.finalTotalWeight ? `${editFormData.finalTotalWeight}g` : 'Not set'}
                         </span>
                       </div>
                       
                       {editFormData.finalTotalWeight && editFormData.paperUsed.sizeInInch && editFormData.paperUsed.quantityInPcs && (
                         <div className="pt-2 border-t border-muted/50">
                           <div className="flex justify-between items-center">
                             <span className="text-sm font-medium">Weight Difference:</span>
                             <span className={`text-sm font-semibold ${
                               (parseFloat(editFormData.finalTotalWeight) - ((papers.find(p => p.width.toString() === editFormData.paperUsed.sizeInInch)?.weightPerPiece || 0) * parseInt(editFormData.paperUsed.quantityInPcs))) > 0 
                                 ? 'text-red-600' 
                                 : 'text-green-600'
                             }`}>
                               {((parseFloat(editFormData.finalTotalWeight) - ((papers.find(p => p.width.toString() === editFormData.paperUsed.sizeInInch)?.weightPerPiece || 0) * parseInt(editFormData.paperUsed.quantityInPcs))).toFixed(2))}g
                         </span>
                           </div>
                         </div>
                       )}
                     </div>
                     
                     <div className="pt-3 border-t border-muted/50">
                       <div className="text-xs text-muted-foreground space-y-1">
                         <p>• Weight is calculated based on paper size and quantity</p>
                         <p>• Final weight may vary during production</p>
                         <p>• Stones weight will be added separately if used</p>
                         <p>• Weight difference shows variance from calculated to final</p>
                       </div>
                     </div>
                   </div>
               </div>
             </div>
             
             {/* Notes Section */}
             <div className="space-y-2">
               <Label htmlFor="edit-notes">Notes</Label>
               <textarea
                 id="edit-notes"
                 value={editFormData.notes}
                 onChange={(e) =>
                   setEditFormData({
                     ...editFormData,
                     notes: e.target.value,
                   })
                 }
                 placeholder="Add any additional notes about this order..."
                 className="w-full p-3 border border-gray-300 rounded-md resize-none"
                 rows={3}
               />
             </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 sm:space-x-2">
                              <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={!!isUpdating}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  loading={!!isUpdating}
                  loadingText="Updating..."
                  className="w-full sm:w-auto"
                >
                  Update Order
                </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      >
        <DialogContent className="w-[95vw] sm:w-[75vw] max-w-[1200px] h-[85vh] sm:h-[75vh] max-h-[800px] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl sm:text-2xl">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Customer Name</Label>
                  <p>{selectedOrder.customerName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Phone</Label>
                  <p>{selectedOrder.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Order Type</Label>
                  <Badge
                    variant={
                      selectedOrder.type === 'internal'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {selectedOrder.type}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Design</Label>
                  <p>{selectedOrder.designId?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Design Price</Label>
                  <p>
                    {selectedOrder.designId?.prices &&
                    selectedOrder.designId.prices.length > 0 ? (
                      <div className="space-y-1">
                        {selectedOrder.designId.prices.map((price, index) => (
                          <div
                            key={index}
                            className="font-medium"
                          >
                            {price.currency}{' '}
                            {price.price % 1 === 0
                              ? price.price.toFixed(0)
                              : price.price.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Payment and Pricing Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Mode of Payment</Label>
                  <Badge variant="outline" className="capitalize">
                    {selectedOrder.modeOfPayment || 'Not set'}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Payment Status</Label>
                  <Badge 
                    variant="outline" 
                    className={`capitalize ${
                      selectedOrder.paymentStatus === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedOrder.paymentStatus === 'overdue' 
                        ? 'bg-red-100 text-red-800'
                        : selectedOrder.paymentStatus === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedOrder.paymentStatus || 'Not set'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Total Cost</Label>
                  <p className="font-medium">
                    {selectedOrder.totalCost ? `₹ ${selectedOrder.totalCost.toFixed(2)}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Discount</Label>
                  <p>
                    {selectedOrder.discountValue && selectedOrder.discountType ? (
                      <span className="text-green-600 font-medium">
                        {selectedOrder.discountType === 'percentage' 
                          ? `${selectedOrder.discountValue}%` 
                          : `₹ ${selectedOrder.discountValue.toFixed(2)}`}
                        {' '}({selectedOrder.discountedAmount ? `₹ ${selectedOrder.discountedAmount.toFixed(2)}` : 'Calculating...'})
                      </span>
                    ) : (
                      <span className="text-gray-500">No discount</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Final Amount</Label>
                  <p className="text-lg font-bold text-primary">
                    {selectedOrder.finalAmount ? `₹ ${selectedOrder.finalAmount.toFixed(2)}` : 'Not set'}
                  </p>
                </div>
              </div>
              
              {/* Notes Section */}
              {selectedOrder.notes && (
                <div className="space-y-2">
                  <Label className="font-semibold">Notes</Label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Stones Used</Label>
                  <p>
                    {selectedOrder.stonesUsed &&
                    selectedOrder.stonesUsed.length > 0 ? (
                      <div className="space-y-1">
                        {selectedOrder.stonesUsed.map((stone, index) => (
                          <div
                            key={index}
                            className="text-sm"
                          >
                            {stone.stoneId?.name || 'Unknown Stone'} (
                            {stone.quantity}g)
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No stones used</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Paper Used</Label>
                  <p>
                    {selectedOrder.paperUsed.sizeInInch}&quot; ×{' '}
                    {selectedOrder.paperUsed.quantityInPcs} pcs
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">
                    Paper Weight per Piece
                  </Label>
                  <p>{selectedOrder.paperUsed.paperWeightPerPc}g</p>
                </div>
                <div>
                  <Label className="font-semibold">Created By</Label>
                  <p>{selectedOrder.createdBy?.name || 'Unknown'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="font-semibold">Calculated Weight</Label>
                  <p>{selectedOrder.calculatedWeight?.toFixed(2)}g</p>
                </div>
                <div>
                  <Label className="font-semibold">Final Weight</Label>
                  <p>
                    {selectedOrder.finalTotalWeight
                      ? `${selectedOrder.finalTotalWeight.toFixed(2)}g`
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Discrepancy</Label>
                  <p
                    className={
                      selectedOrder.weightDiscrepancy !== 0
                        ? selectedOrder.weightDiscrepancy > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                        : 'text-gray-600'
                    }
                  >
                    {selectedOrder.weightDiscrepancy !== undefined &&
                    selectedOrder.weightDiscrepancy !== null
                      ? `${selectedOrder.weightDiscrepancy.toFixed(
                          2,
                        )}g (${selectedOrder.discrepancyPercentage?.toFixed(
                          1,
                        )}%)`
                      : 'Not calculated'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Created By</Label>
                  <p>{selectedOrder.createdBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Last Updated By</Label>
                  <p>{selectedOrder.updatedBy?.name || 'Not updated'}</p>
                </div>
              </div>

              {/* Mark as Completed Button */}
              {selectedOrder.status !== 'completed' &&
                selectedOrder.finalTotalWeight && (
                  <div className="flex justify-center pt-4">
                    <LoadingButton
                      onClick={() => handleComplete(selectedOrder._id)}
                      loading={isCompleting === selectedOrder._id}
                      loadingText="Marking as Completed..."
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                    >
                      Mark as Completed
                    </LoadingButton>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">{confirmDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {confirmDialog.message}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }
              className="w-full sm:w-auto"
            >
              {confirmDialog.cancelText}
            </Button>
            <Button
              onClick={confirmDialog.onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            >
              {confirmDialog.confirmText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
