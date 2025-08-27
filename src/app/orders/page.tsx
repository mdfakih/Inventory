'use client';

import { useState, useEffect } from 'react';
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
import OrderInvoice from '@/components/invoice/order-invoice';

import {
  Edit,
  Trash2,
  Eye,
  Package,
  Plus,
  CheckCircle,
  FileText,
} from 'lucide-react';
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
  defaultStones?: Array<{
    stoneId: string;
    quantity: number;
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

interface Stone {
  _id: string;
  name: string;
  number: string;
  color: string;
  size: string;
  quantity: number;
  unit: string;
  weightPerPiece: number;
  inventoryType: 'internal' | 'out';
}

interface Plastic {
  _id: string;
  name: string;
  width: number;
  quantity: number;
  unit: string;
}

interface Tape {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  gstNumber?: string;
  customerType: 'retail' | 'wholesale' | 'corporate';
}

interface Order {
  _id: string;
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  customerId?: string;
  gstNumber?: string;
  designOrders: Array<{
    _id?: string;
    designId: string | Design;
    stonesUsed: Array<{
      stoneId: string | Stone;
      quantity: number;
    }>;
    otherItemsUsed?: Array<{
      itemType: 'plastic' | 'tape' | 'other';
      itemId: string | Plastic | Tape;
      quantity: number;
      unit?: string;
    }>;
    paperUsed: {
      sizeInInch: number;
      quantityInPcs: number;
      paperWeightPerPc: number;
      customPaperWeight?: number;
    };
    calculatedWeight?: number;
    finalWeight?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  designId?: Design; // Legacy field
  stonesUsed?: Array<{
    stoneId: {
      _id: string;
      name: string;
      color: string;
      size: string;
    };
    quantity: number;
  }>;
  paperUsed?: {
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
  gstNumber?: string;
  designOrders: Array<{
    designId: string;
    stonesUsed: Array<{
      stoneId: string;
      quantity: number;
    }>;
    otherItemsUsed?: Array<{
      itemType: 'plastic' | 'tape' | 'other';
      itemId: string;
      quantity: number;
      unit?: string;
    }>;
    paperUsed: {
      sizeInInch: number;
      quantityInPcs: number;
      paperWeightPerPc: number;
      customPaperWeight?: number;
    };
    calculatedWeight?: number;
    finalWeight?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  modeOfPayment: 'cash' | 'UPI' | 'card';
  paymentStatus: 'pending' | 'partial' | 'completed' | 'overdue';
  discountType: 'percentage' | 'flat';
  discountValue: number;
  notes?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  // const [stones, setStones] = useState<Stone[]>([]);
  const [plastics, setPlastics] = useState<Plastic[]>([]);
  const [tapes, setTapes] = useState<Tape[]>([]);
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
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<
    string | null
  >(null);
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
    gstNumber: '',
    designOrders: [
      {
        designId: '',
        stonesUsed: [] as Array<{ stoneId: string; quantity: number }>,
        otherItemsUsed: [] as Array<{
          itemType: 'plastic' | 'tape' | 'other';
          itemId: string;
          quantity: number;
          unit?: string;
        }>,
        paperUsed: {
          sizeInInch: '',
          quantityInPcs: '',
          paperWeightPerPc: 0,
        },
      },
    ],
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
    gstNumber: '',
    designOrders: [
      {
        designId: '',
        stonesUsed: [] as Array<{ stoneId: string; quantity: number }>,
        otherItemsUsed: [] as Array<{
          itemType: 'plastic' | 'tape' | 'other';
          itemId: string;
          quantity: number;
          unit?: string;
        }>,
        paperUsed: {
          sizeInInch: '',
          quantityInPcs: '',
          paperWeightPerPc: 0,
        },
      },
    ],
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

  // Helper function to calculate total weight including stones
  const calculateTotalWeight = (
    designOrders: Array<{
      designId: string | Design;
      paperUsed: {
        sizeInInch: string | number;
        quantityInPcs: string | number;
      };
    }>,
  ) => {
    let totalWeight = 0;
    designOrders.forEach((order) => {
      if (order.paperUsed.sizeInInch && order.paperUsed.quantityInPcs) {
        // Paper weight per piece
        const paperWeightPerPiece =
          papers.find(
            (p) => p.width.toString() === order.paperUsed.sizeInInch.toString(),
          )?.weightPerPiece || 0;

        // Stone weight from design
        const design = designs.find((d) => d._id === order.designId);
        let stoneWeight = 0;
        if (design && design.defaultStones) {
          design.defaultStones.forEach((designStone) => {
            // Use designStone.quantity directly as it represents the weight of this stone used in the design
            stoneWeight += designStone.quantity || 0;
          });
        }

        // Total weight per piece * quantity
        const totalWeightPerPiece = paperWeightPerPiece + stoneWeight;
        totalWeight +=
          totalWeightPerPiece *
          (typeof order.paperUsed.quantityInPcs === 'string'
            ? parseInt(order.paperUsed.quantityInPcs)
            : order.paperUsed.quantityInPcs);
      }
    });
    return totalWeight;
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const [
        ordersRes,
        designsRes,
        internalPapersRes,
        outPapersRes,
        internalStonesRes,
        outStonesRes,
        plasticsRes,
        tapesRes,
      ] = await Promise.all([
        authenticatedFetch(
          `/api/orders?page=${currentPage}&limit=${itemsPerPage}`,
        ),
        authenticatedFetch('/api/designs'),
        authenticatedFetch('/api/inventory/paper?type=internal'),
        authenticatedFetch('/api/inventory/paper?type=out'),
        authenticatedFetch('/api/inventory/stones?type=internal'),
        authenticatedFetch('/api/inventory/stones?type=out'),
        authenticatedFetch('/api/inventory/plastic'),
        authenticatedFetch('/api/inventory/tape'),
      ]);

      const ordersData = await ordersRes.json();
      const designsData = await designsRes.json();
      const internalPapersData = await internalPapersRes.json();
      const outPapersData = await outPapersRes.json();
      const internalStonesData = await internalStonesRes.json();
      const outStonesData = await outStonesRes.json();
      const plasticsData = await plasticsRes.json();
      const tapesData = await tapesRes.json();

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

      // Combine both internal and out stones
      const allStones = [];
      if (internalStonesData.success)
        allStones.push(...internalStonesData.data);
      if (outStonesData.success) allStones.push(...outStonesData.data);
      // setStones(allStones);

      // Set plastics and tapes data
      if (plasticsData.success) setPlastics(plasticsData.data);
      if (tapesData.success) setTapes(tapesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Data Loading Error', 'Failed to load orders data.');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const fetchUser = async () => {
    try {
      const response = await authenticatedFetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    // Only fetch data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchData();
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, currentPage, itemsPerPage]); // Include currentPage and itemsPerPage

  // Update filtered orders when orders change
  useEffect(() => {
    setFilteredOrders(orders);
  }, [orders]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const orderData: CreateOrderData = {
        type: formData.type,
        customerName: formData.customerName,
        phone: formData.phone,
        customerId: formData.customerId || undefined,
        gstNumber: formData.gstNumber || undefined,
        designOrders: formData.designOrders.map((order) => ({
          designId: order.designId,
          stonesUsed: order.stonesUsed,
          otherItemsUsed: order.otherItemsUsed,
          paperUsed: {
            sizeInInch: parseInt(order.paperUsed.sizeInInch),
            quantityInPcs: parseInt(order.paperUsed.quantityInPcs),
            paperWeightPerPc: order.paperUsed.paperWeightPerPc,
          },
        })),
        modeOfPayment: formData.modeOfPayment,
        paymentStatus: formData.paymentStatus,
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
          gstNumber: '',
          designOrders: [
            {
              designId: '',
              stonesUsed: [] as Array<{ stoneId: string; quantity: number }>,
              otherItemsUsed: [] as Array<{
                itemType: 'plastic' | 'tape' | 'other';
                itemId: string;
                quantity: number;
                unit?: string;
              }>,
              paperUsed: {
                sizeInInch: '',
                quantityInPcs: '',
                paperWeightPerPc: 0,
              },
            },
          ],
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
            gstNumber: editFormData.gstNumber || undefined,
            designOrders: editFormData.designOrders.map((order) => ({
              ...order,
              paperUsed: {
                sizeInInch: parseInt(order.paperUsed.sizeInInch),
                quantityInPcs: parseInt(order.paperUsed.quantityInPcs),
              },
            })),
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
        gstNumber: customer.gstNumber || '',
      });
    } else {
      setFormData({
        ...formData,
        customerName: '',
        phone: '',
        customerId: '',
        gstNumber: '',
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
        gstNumber: customer.gstNumber || '',
      });
    } else {
      setEditFormData({
        ...editFormData,
        customerName: '',
        phone: '',
        customerId: '',
        gstNumber: '',
      });
    }
  };

  const addDesignOrder = () => {
    setFormData((prev) => ({
      ...prev,
      designOrders: [
        ...prev.designOrders,
        {
          designId: '',
          stonesUsed: [] as Array<{ stoneId: string; quantity: number }>,
          otherItemsUsed: [] as Array<{
            itemType: 'plastic' | 'tape' | 'other';
            itemId: string;
            quantity: number;
            unit?: string;
          }>,
          paperUsed: {
            sizeInInch: '',
            quantityInPcs: '',
            paperWeightPerPc: 0,
          },
        },
      ],
    }));
  };

  const removeDesignOrder = (index: number) => {
    if (formData.designOrders.length > 1) {
      setFormData((prev) => ({
        ...prev,
        designOrders: prev.designOrders.filter((_, i) => i !== index),
      }));
    }
  };

  const updateDesignOrder = (
    index: number,
    field: 'designId',
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      designOrders: prev.designOrders.map((order, i) =>
        i === index ? { ...order, [field]: value } : order,
      ),
    }));
  };

  const updateDesignOrderPaper = (
    index: number,
    field: 'sizeInInch' | 'quantityInPcs',
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      designOrders: prev.designOrders.map((order, i) =>
        i === index
          ? {
              ...order,
              paperUsed: { ...order.paperUsed, [field]: value },
            }
          : order,
      ),
    }));
  };

  const addOtherItem = (designOrderIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      designOrders: prev.designOrders.map((order, i) =>
        i === designOrderIndex
          ? {
              ...order,
              otherItemsUsed: [
                ...order.otherItemsUsed,
                {
                  itemType: 'plastic',
                  itemId: '',
                  quantity: 0,
                },
              ],
            }
          : order,
      ),
    }));
  };

  const removeOtherItem = (designOrderIndex: number, itemIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      designOrders: prev.designOrders.map((order, i) =>
        i === designOrderIndex
          ? {
              ...order,
              otherItemsUsed: order.otherItemsUsed.filter(
                (_, idx) => idx !== itemIndex,
              ),
            }
          : order,
      ),
    }));
  };

  const updateOtherItem = (
    designOrderIndex: number,
    itemIndex: number,
    field: 'itemType' | 'itemId' | 'quantity',
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      designOrders: prev.designOrders.map((order, i) =>
        i === designOrderIndex
          ? {
              ...order,
              otherItemsUsed: order.otherItemsUsed.map((item, idx) =>
                idx === itemIndex ? { ...item, [field]: value } : item,
              ),
            }
          : order,
      ),
    }));
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
            designOrders: order.designOrders, // Use the full designOrders array
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
    // Find the order to check if it's finalized
    const order = orders.find((o) => o._id === orderId);
    if (order?.isFinalized) {
      showError('Cannot Delete', 'Finalized orders cannot be deleted.');
      return;
    }

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
    if (order.isFinalized) {
      showError('Cannot Edit', 'Finalized orders cannot be edited.');
      return;
    }
    setSelectedOrder(order);
    setEditFormData({
      type: order.type,
      customerName: order.customerName,
      phone: order.phone,
      customerId: order.customerId || '',
      gstNumber: order.gstNumber || '',
      designOrders: order.designOrders.map((designOrder) => ({
        designId:
          typeof designOrder.designId === 'string'
            ? designOrder.designId
            : designOrder.designId._id,
        stonesUsed: (designOrder.stonesUsed || []).map((stone) => ({
          stoneId:
            typeof stone.stoneId === 'string'
              ? stone.stoneId
              : stone.stoneId._id,
          quantity: stone.quantity,
        })),
        otherItemsUsed: (designOrder.otherItemsUsed || []).map(
          (item: {
            itemType: 'plastic' | 'tape' | 'other';
            itemId: string | Plastic | Tape;
            quantity: number;
            unit?: string;
          }) => ({
            itemType: item.itemType,
            itemId:
              typeof item.itemId === 'string' ? item.itemId : item.itemId._id,
            quantity: item.quantity,
            unit: item.unit,
          }),
        ),
        paperUsed: {
          sizeInInch: designOrder.paperUsed?.sizeInInch.toString() || '',
          quantityInPcs: designOrder.paperUsed?.quantityInPcs.toString() || '',
          paperWeightPerPc: designOrder.paperUsed?.paperWeightPerPc || 0,
        },
      })),
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

  const openInvoice = (orderId: string) => {
    setSelectedOrderForInvoice(orderId);
    setIsInvoiceOpen(true);
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
          <h2 className="text-xl font-semibold">
            Orders ({filteredOrders.length})
          </h2>
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
              const filtered = orders.filter((order) => {
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
                <DialogTitle className="text-xl sm:text-2xl">
                  Create New Order
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleCreateSubmit}
                className="space-y-4 p-2"
              >
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                  {/* Left Half - Customer & Order Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Customer & Order Details
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="type"
                            className="text-sm font-medium"
                          >
                            Order Type
                          </Label>
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
                          <Label
                            htmlFor="customerName"
                            className="text-sm font-medium"
                          >
                            Customer Name
                          </Label>
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
                            allowCreate={true}
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
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerId">Customer ID</Label>
                          <Input
                            id="customerId"
                            value={formData.customerId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customerId: e.target.value,
                              })
                            }
                            placeholder="Optional"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gstNumber">GST Number</Label>
                          <Input
                            id="gstNumber"
                            value={formData.gstNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                gstNumber: e.target.value,
                              })
                            }
                            placeholder="Optional GST number"
                          />
                        </div>
                      </div>

                      {/* Design Orders Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Design Orders
                          </h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addDesignOrder}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Design
                          </Button>
                        </div>

                        {formData.designOrders.map((designOrder, index) => (
                          <div
                            key={index}
                            className="p-4 border rounded-lg space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">
                                Design {index + 1}
                              </h4>
                              {formData.designOrders.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDesignOrder(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`design-${index}`}>Design</Label>
                              <Select
                                value={designOrder.designId}
                                onValueChange={(value) =>
                                  updateDesignOrder(index, 'designId', value)
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`size-${index}`}>
                                  Paper Size (inches)
                                </Label>
                                <Select
                                  value={designOrder.paperUsed.sizeInInch}
                                  onValueChange={(value) =>
                                    updateDesignOrderPaper(
                                      index,
                                      'sizeInInch',
                                      value,
                                    )
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
                                          {paper.width}&quot; (
                                          {paper.weightPerPiece}g per piece)
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`pieces-${index}`}>
                                  Quantity (pieces)
                                </Label>
                                <Input
                                  id={`pieces-${index}`}
                                  type="number"
                                  value={designOrder.paperUsed.quantityInPcs}
                                  onChange={(e) =>
                                    updateDesignOrderPaper(
                                      index,
                                      'quantityInPcs',
                                      e.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Payment and Pricing Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          Payment & Pricing
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="modeOfPayment">
                              Mode of Payment
                            </Label>
                            <Select
                              value={formData.modeOfPayment}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  modeOfPayment: value as
                                    | 'cash'
                                    | 'UPI'
                                    | 'card',
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
                            <Label htmlFor="paymentStatus">
                              Payment Status
                            </Label>
                            <Select
                              value={formData.paymentStatus}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  paymentStatus: value as
                                    | 'pending'
                                    | 'partial'
                                    | 'completed'
                                    | 'overdue',
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
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
                                <SelectItem value="percentage">
                                  Percentage (%)
                                </SelectItem>
                                <SelectItem value="flat">
                                  Flat Amount
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="discountValue">
                              Discount Value
                            </Label>
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
                              placeholder={
                                formData.discountType === 'percentage'
                                  ? 'Enter percentage'
                                  : 'Enter amount'
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Total Cost
                          </Label>
                          <div className="p-3 bg-muted/30 rounded-lg border">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Base Cost:</span>
                                <span className="font-medium">
                                  {(() => {
                                    let totalCost = 0;
                                    formData.designOrders.forEach((order) => {
                                      if (
                                        order.designId &&
                                        order.paperUsed.quantityInPcs
                                      ) {
                                        const design = designs.find(
                                          (d) => d._id === order.designId,
                                        );
                                        if (design?.prices?.[0]?.price) {
                                          totalCost +=
                                            design.prices[0].price *
                                            parseInt(
                                              order.paperUsed.quantityInPcs,
                                            );
                                        }
                                      }
                                    });
                                    return totalCost > 0
                                      ? `₹ ${totalCost.toFixed(2)}`
                                      : 'Not set';
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Discount:</span>
                                <span className="font-medium text-green-600">
                                  {formData.discountValue &&
                                  formData.discountType
                                    ? (() => {
                                        let totalCost = 0;
                                        formData.designOrders.forEach(
                                          (order) => {
                                            if (
                                              order.designId &&
                                              order.paperUsed.quantityInPcs
                                            ) {
                                              const design = designs.find(
                                                (d) => d._id === order.designId,
                                              );
                                              if (design?.prices?.[0]?.price) {
                                                totalCost +=
                                                  design.prices[0].price *
                                                  parseInt(
                                                    order.paperUsed
                                                      .quantityInPcs,
                                                  );
                                              }
                                            }
                                          },
                                        );
                                        if (totalCost === 0) return '₹ 0.00';
                                        const discount =
                                          formData.discountType === 'percentage'
                                            ? (totalCost *
                                                parseFloat(
                                                  formData.discountValue,
                                                )) /
                                              100
                                            : parseFloat(
                                                formData.discountValue,
                                              );
                                        return `₹ ${discount.toFixed(2)}`;
                                      })()
                                    : '₹ 0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="font-semibold">
                                  Final Amount:
                                </span>
                                <span className="text-lg font-bold text-primary">
                                  {formData.discountValue
                                    ? (() => {
                                        let totalCost = 0;
                                        formData.designOrders.forEach(
                                          (order) => {
                                            if (
                                              order.designId &&
                                              order.paperUsed.quantityInPcs
                                            ) {
                                              const design = designs.find(
                                                (d) => d._id === order.designId,
                                              );
                                              if (design?.prices?.[0]?.price) {
                                                totalCost +=
                                                  design.prices[0].price *
                                                  parseInt(
                                                    order.paperUsed
                                                      .quantityInPcs,
                                                  );
                                              }
                                            }
                                          },
                                        );
                                        if (totalCost === 0) return 'Not set';
                                        const discount =
                                          formData.discountType === 'percentage'
                                            ? (totalCost *
                                                parseFloat(
                                                  formData.discountValue,
                                                )) /
                                              100
                                            : parseFloat(
                                                formData.discountValue,
                                              );
                                        return `₹ ${(
                                          totalCost - discount
                                        ).toFixed(2)}`;
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
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Weight Calculations & Information
                    </h3>

                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-muted/50">
                          <span className="text-sm font-medium">
                            Total Quantity:
                          </span>
                          <span className="text-sm font-semibold text-muted-foreground">
                            {(() => {
                              let totalPieces = 0;
                              formData.designOrders.forEach((order) => {
                                if (order.paperUsed.quantityInPcs) {
                                  totalPieces += parseInt(
                                    order.paperUsed.quantityInPcs,
                                  );
                                }
                              });
                              return totalPieces;
                            })()}{' '}
                            pieces
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium">
                            Calculated Weight:
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {calculateTotalWeight(formData.designOrders)}g
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-muted/50">
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            • Weight is calculated based on paper size,
                            quantity, and stone weight from design
                          </p>
                          <p>• Final weight may vary during production</p>
                        </div>
                      </div>
                    </div>

                    {/* Other Inventory Items Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Other Inventory Items (Optional)
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Add plastic, tape, or other inventory items that
                            will be deducted from inventory immediately when
                            order is created
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOtherItem(0)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                          </Button>
                        </div>

                        {formData.designOrders[0]?.otherItemsUsed.map(
                          (item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="p-4 border rounded-lg space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  Item {itemIndex + 1}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeOtherItem(0, itemIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Item Type</Label>
                                  <Select
                                    value={item.itemType}
                                    onValueChange={(value) =>
                                      updateOtherItem(
                                        0,
                                        itemIndex,
                                        'itemType',
                                        value as 'plastic' | 'tape' | 'other',
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="plastic">
                                        Plastic
                                      </SelectItem>
                                      <SelectItem value="tape">Tape</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Item</Label>
                                  <Select
                                    value={item.itemId}
                                    onValueChange={(value) =>
                                      updateOtherItem(
                                        0,
                                        itemIndex,
                                        'itemId',
                                        value,
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {item.itemType === 'plastic' &&
                                        plastics.map((plastic) => (
                                          <SelectItem
                                            key={plastic._id}
                                            value={plastic._id}
                                          >
                                            {plastic.name} ({plastic.width}
                                            &quot;)
                                          </SelectItem>
                                        ))}
                                      {item.itemType === 'tape' &&
                                        tapes.map((tape) => (
                                          <SelectItem
                                            key={tape._id}
                                            value={tape._id}
                                          >
                                            {tape.name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateOtherItem(
                                      0,
                                      itemIndex,
                                      'quantity',
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  min="0"
                                  placeholder="Enter quantity"
                                />
                              </div>

                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="text-xs text-green-700 space-y-1">
                                  <p className="font-medium">
                                    Inventory Deduction Notice:
                                  </p>
                                  <p>
                                    • The selected quantity will be
                                    automatically deducted from inventory
                                    immediately when order is created
                                  </p>
                                  <p>
                                    • Please ensure sufficient stock is
                                    available
                                  </p>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
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
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Payments
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    orders.filter((order) => order.paymentStatus === 'pending')
                      .length
                  }
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
                <p className="text-sm font-medium text-muted-foreground">
                  Partial Payments
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {
                    orders.filter((order) => order.paymentStatus === 'partial')
                      .length
                  }
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
                <p className="text-sm font-medium text-muted-foreground">
                  Completed Payments
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    orders.filter(
                      (order) => order.paymentStatus === 'completed',
                    ).length
                  }
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
                <p className="text-sm font-medium text-muted-foreground">
                  Overdue Payments
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {
                    orders.filter((order) => order.paymentStatus === 'overdue')
                      .length
                  }
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
              description={
                paymentStatusFilter === 'all'
                  ? 'Get started by creating your first order. Orders will appear here once they are created.'
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
                  {/* <TableHead>Phone</TableHead> */}
                  {/* <TableHead>GST Number</TableHead> */}
                  <TableHead>Type</TableHead>
                  <TableHead>Design</TableHead>
                  {/* <TableHead>Price</TableHead> */}
                  {/* <TableHead>Payment</TableHead> */}
                  <TableHead>Payment Status</TableHead>
                  {/* <TableHead>Total Cost</TableHead> */}
                  <TableHead>Final Amount</TableHead>
                  {/* <TableHead>Stones Used</TableHead> */}
                  <TableHead>Paper Used</TableHead>
                  <TableHead>Other Items</TableHead>
                  <TableHead>Calculated Weight</TableHead>
                  <TableHead>Final Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Finalized</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead title="Invoice | View | Edit | Actions">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    {/* <TableCell>{order.phone}</TableCell> */}
                    {/* <TableCell>{order.gstNumber || 'Not set'}</TableCell> */}
                    <TableCell>
                      <Badge
                        variant={
                          order.type === 'internal' ? 'default' : 'secondary'
                        }
                      >
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.designOrders && order.designOrders.length > 0 ? (
                        <div className="space-y-1">
                          {order.designOrders.map((designOrder, index) => {
                            const design = designs.find(
                              (d) => d._id === designOrder.designId,
                            );
                            return (
                              <div
                                key={index}
                                className="text-sm"
                              >
                                {design?.name || 'Unknown'} (
                                {designOrder.paperUsed.quantityInPcs} pcs)
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-500">No designs</span>
                      )}
                    </TableCell>
                    {/* <TableCell>
                      {(() => {
                        let totalCost = 0;
                        if (
                          order.designOrders &&
                          order.designOrders.length > 0
                        ) {
                          order.designOrders.forEach((designOrder) => {
                            const design = designs.find(
                              (d) => d._id === designOrder.designId,
                            );
                            if (design?.prices?.[0]?.price) {
                              totalCost +=
                                design.prices[0].price * designOrder.paperUsed.quantityInPcs;
                            }
                          });
                        }
                        return totalCost > 0
                          ? `₹ ${totalCost.toFixed(2)}`
                          : 'Not set';
                      })()}
                    </TableCell> */}
                    {/* <TableCell>
                      <Badge
                        variant="outline"
                        className="capitalize"
                      >
                        {order.modeOfPayment || 'Not set'}
                      </Badge>
                    </TableCell> */}
                    <TableCell>
                      <Badge
                        className={getPaymentStatusColor(
                          order.paymentStatus || 'pending',
                        )}
                      >
                        {order.paymentStatus || 'Not set'}
                      </Badge>
                    </TableCell>
                    {/* <TableCell>
                      {order.totalCost ? (
                        <span className="font-medium">
                          ₹ {order.totalCost.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-500">Not set</span>
                      )}
                    </TableCell> */}
                    <TableCell>
                      {order.finalAmount ? (
                        <span className="font-bold text-primary">
                          ₹ {order.finalAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-500">Not set</span>
                      )}
                    </TableCell>
                    {/* <TableCell>
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
                    </TableCell> */}
                    <TableCell>
                      {order.designOrders && order.designOrders.length > 0 ? (
                        <div className="space-y-1">
                          {order.designOrders.map((designOrder, index) => (
                            <div
                              key={index}
                              className="text-sm"
                            >
                              {designOrder.paperUsed.sizeInInch}&quot; ×{' '}
                              {designOrder.paperUsed.quantityInPcs} pcs
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No paper used</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.designOrders && order.designOrders.length > 0 ? (
                        <div className="space-y-1">
                          {order.designOrders.map((designOrder, index) => {
                            if (
                              !designOrder.otherItemsUsed ||
                              designOrder.otherItemsUsed.length === 0
                            ) {
                              return (
                                <div
                                  key={index}
                                  className="text-sm text-gray-500"
                                >
                                  No items
                                </div>
                              );
                            }

                            return (
                              <div
                                key={index}
                                className="space-y-1"
                              >
                                {designOrder.otherItemsUsed.map(
                                  (item, itemIndex) => {
                                    let itemName = 'Unknown';
                                    if (item.itemType === 'plastic') {
                                      const plastic = plastics.find(
                                        (p) => p._id === item.itemId,
                                      );
                                      itemName =
                                        plastic?.name || 'Unknown Plastic';
                                    } else if (item.itemType === 'tape') {
                                      const tape = tapes.find(
                                        (t) => t._id === item.itemId,
                                      );
                                      itemName = tape?.name || 'Unknown Tape';
                                    }

                                    return (
                                      <div
                                        key={itemIndex}
                                        className="text-xs"
                                      >
                                        {itemName} ({item.quantity}{' '}
                                        {item.unit || 'pcs'})
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-500">No items</span>
                      )}
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
                          onClick={() => openInvoice(order._id)}
                          title="View Invoice"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
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
                          disabled={order.isFinalized}
                          title={
                            order.isFinalized
                              ? 'Cannot edit finalized orders'
                              : 'Edit order'
                          }
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
                        {user?.role === 'admin' && !order.isFinalized && (
                          <LoadingButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order._id)}
                            loading={isDeleting === order._id}
                            loadingText=""
                            title="Delete order"
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="w-[95vw] sm:w-[75vw] max-w-[1200px] h-[85vh] sm:h-[75vh] max-h-[800px] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl sm:text-2xl">
              Edit Order
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditSubmit}
            className="space-y-4 p-2"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Half - Customer & Order Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Customer & Order Details
                </h3>

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
                            status: value as
                              | 'pending'
                              | 'completed'
                              | 'cancelled',
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
                        allowCreate={true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            phone: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-customerId">Customer ID</Label>
                      <Input
                        id="edit-customerId"
                        value={editFormData.customerId}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            customerId: e.target.value,
                          })
                        }
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-gstNumber">GST Number</Label>
                      <Input
                        id="edit-gstNumber"
                        value={editFormData.gstNumber}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            gstNumber: e.target.value,
                          })
                        }
                        placeholder="Optional GST number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-designId">Design</Label>
                      <Select
                        value={editFormData.designOrders[0]?.designId}
                        onValueChange={(value) =>
                          setEditFormData({
                            ...editFormData,
                            designOrders: editFormData.designOrders.map(
                              (order) => ({
                                ...order,
                                designId: value,
                              }),
                            ),
                          })
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
                      <Label htmlFor="edit-sizeInInch">
                        Paper Size (inches)
                      </Label>
                      <Select
                        value={
                          editFormData.designOrders[0]?.paperUsed.sizeInInch
                        }
                        onValueChange={(value) =>
                          setEditFormData({
                            ...editFormData,
                            designOrders: editFormData.designOrders.map(
                              (order) => ({
                                ...order,
                                paperUsed: {
                                  ...order.paperUsed,
                                  sizeInInch: value,
                                },
                              }),
                            ),
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
                      <Label htmlFor="edit-quantityInPcs">
                        Quantity (pieces)
                      </Label>
                      <Input
                        id="edit-quantityInPcs"
                        type="number"
                        value={
                          editFormData.designOrders[0]?.paperUsed.quantityInPcs
                        }
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            designOrders: editFormData.designOrders.map(
                              (order) => ({
                                ...order,
                                paperUsed: {
                                  ...order.paperUsed,
                                  quantityInPcs: e.target.value,
                                },
                              }),
                            ),
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
                <h3 className="text-lg font-semibold border-b pb-2">
                  Payment & Pricing
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-modeOfPayment">
                        Mode of Payment
                      </Label>
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
                            paymentStatus: value as
                              | 'pending'
                              | 'partial'
                              | 'completed'
                              | 'overdue',
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
                          <SelectItem value="percentage">
                            Percentage (%)
                          </SelectItem>
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
                        placeholder={
                          editFormData.discountType === 'percentage'
                            ? 'Enter percentage'
                            : 'Enter amount'
                        }
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
                              {editFormData.designOrders.length > 0 &&
                              editFormData.designOrders[0]?.paperUsed
                                .quantityInPcs
                                ? (() => {
                                    const design = designs.find(
                                      (d) =>
                                        d._id ===
                                        editFormData.designOrders[0]?.designId,
                                    );
                                    return design?.prices?.[0]?.price
                                      ? `${design.prices[0].currency} ${(
                                          design.prices[0].price *
                                          parseInt(
                                            editFormData.designOrders[0]
                                              ?.paperUsed.quantityInPcs,
                                          )
                                        ).toFixed(2)}`
                                      : 'Not set';
                                  })()
                                : 'Not set'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Discount:</span>
                            <span className="font-medium text-green-600">
                              {editFormData.discountValue &&
                              editFormData.discountType
                                ? (() => {
                                    const design = designs.find(
                                      (d) =>
                                        d._id ===
                                        editFormData.designOrders[0]?.designId,
                                    );
                                    if (
                                      !design?.prices?.[0]?.price ||
                                      !editFormData.designOrders[0]?.paperUsed
                                        .quantityInPcs
                                    )
                                      return '₹ 0.00';
                                    const baseCost =
                                      design.prices[0].price *
                                      parseInt(
                                        editFormData.designOrders[0]?.paperUsed
                                          .quantityInPcs,
                                      );
                                    const discount =
                                      editFormData.discountType === 'percentage'
                                        ? (baseCost *
                                            parseFloat(
                                              editFormData.discountValue,
                                            )) /
                                          100
                                        : parseFloat(
                                            editFormData.discountValue,
                                          );
                                    return `₹ ${discount.toFixed(2)}`;
                                  })()
                                : '₹ 0.00'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-semibold">Final Amount:</span>
                            <span className="text-lg font-bold text-primary">
                              {editFormData.designOrders.length > 0 &&
                              editFormData.designOrders[0]?.paperUsed
                                .quantityInPcs &&
                              editFormData.discountValue
                                ? (() => {
                                    const design = designs.find(
                                      (d) =>
                                        d._id ===
                                        editFormData.designOrders[0]?.designId,
                                    );
                                    if (!design?.prices?.[0]?.price)
                                      return 'Not set';
                                    const baseCost =
                                      design.prices[0].price *
                                      parseInt(
                                        editFormData.designOrders[0]?.paperUsed
                                          .quantityInPcs,
                                      );
                                    const discount =
                                      editFormData.discountType === 'percentage'
                                        ? (baseCost *
                                            parseFloat(
                                              editFormData.discountValue,
                                            )) /
                                          100
                                        : parseFloat(
                                            editFormData.discountValue,
                                          );
                                    return `₹ ${(baseCost - discount).toFixed(
                                      2,
                                    )}`;
                                  })()
                                : 'Not set'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold border-b pb-2">
                  Weight Calculations & Information
                </h3>

                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-muted/50">
                      <span className="text-sm font-medium">
                        Paper Weight per Piece:
                      </span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {editFormData.designOrders.length > 0 &&
                        editFormData.designOrders[0]?.paperUsed.sizeInInch
                          ? papers.find(
                              (p) =>
                                p.width.toString() ===
                                editFormData.designOrders[0]?.paperUsed
                                  .sizeInInch,
                            )?.weightPerPiece || 0
                          : 0}
                        g
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-muted/50">
                      <span className="text-sm font-medium">
                        Total Quantity:
                      </span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {(editFormData.designOrders.length > 0 &&
                          editFormData.designOrders[0]?.paperUsed
                            .quantityInPcs) ||
                          0}{' '}
                        pieces
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-muted/50">
                      <span className="text-sm font-medium">
                        Calculated Weight:
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {calculateTotalWeight(editFormData.designOrders)}g
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium">
                        Final Weight (if set):
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        {editFormData.finalTotalWeight
                          ? `${editFormData.finalTotalWeight}g`
                          : 'Not set'}
                      </span>
                    </div>

                    {editFormData.finalTotalWeight && (
                      <div className="pt-2 border-t border-muted/50">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Weight Difference:
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              calculateTotalWeight(editFormData.designOrders) -
                                parseFloat(editFormData.finalTotalWeight) >
                              0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {(
                              calculateTotalWeight(editFormData.designOrders) -
                              parseFloat(editFormData.finalTotalWeight)
                            ).toFixed(2)}
                            g
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-muted/50">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        • Weight is calculated based on paper size, quantity,
                        and stone weight from design
                      </p>
                      <p>• Final weight may vary during production</p>
                      <p>
                        • Weight difference shows variance from calculated to
                        final weight
                      </p>
                    </div>
                  </div>
                </div>

                {/* Other Inventory Items Section for Edit */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Other Inventory Items (Optional)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Add plastic, tape, or other inventory items that will be
                        deducted from inventory immediately when order is
                        created
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditFormData({
                            ...editFormData,
                            designOrders: editFormData.designOrders.map(
                              (order, i) =>
                                i === 0
                                  ? {
                                      ...order,
                                      otherItemsUsed: [
                                        ...order.otherItemsUsed,
                                        {
                                          itemType: 'plastic',
                                          itemId: '',
                                          quantity: 0,
                                        },
                                      ],
                                    }
                                  : order,
                            ),
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>

                    {editFormData.designOrders[0]?.otherItemsUsed.map(
                      (item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="p-4 border rounded-lg space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Item {itemIndex + 1}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditFormData({
                                  ...editFormData,
                                  designOrders: editFormData.designOrders.map(
                                    (order, i) =>
                                      i === 0
                                        ? {
                                            ...order,
                                            otherItemsUsed:
                                              order.otherItemsUsed.filter(
                                                (_, idx) => idx !== itemIndex,
                                              ),
                                          }
                                        : order,
                                  ),
                                });
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Item Type</Label>
                              <Select
                                value={item.itemType}
                                onValueChange={(value) => {
                                  setEditFormData({
                                    ...editFormData,
                                    designOrders: editFormData.designOrders.map(
                                      (order, i) =>
                                        i === 0
                                          ? {
                                              ...order,
                                              otherItemsUsed:
                                                order.otherItemsUsed.map(
                                                  (otherItem, idx) =>
                                                    idx === itemIndex
                                                      ? {
                                                          ...otherItem,
                                                          itemType: value as
                                                            | 'plastic'
                                                            | 'tape'
                                                            | 'other',
                                                          itemId: '', // Reset itemId when type changes
                                                        }
                                                      : otherItem,
                                                ),
                                            }
                                          : order,
                                    ),
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="plastic">
                                    Plastic
                                  </SelectItem>
                                  <SelectItem value="tape">Tape</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Item</Label>
                              <Select
                                value={item.itemId}
                                onValueChange={(value) => {
                                  setEditFormData({
                                    ...editFormData,
                                    designOrders: editFormData.designOrders.map(
                                      (order, i) =>
                                        i === 0
                                          ? {
                                              ...order,
                                              otherItemsUsed:
                                                order.otherItemsUsed.map(
                                                  (otherItem, idx) =>
                                                    idx === itemIndex
                                                      ? {
                                                          ...otherItem,
                                                          itemId: value,
                                                        }
                                                      : otherItem,
                                                ),
                                            }
                                          : order,
                                    ),
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.itemType === 'plastic' &&
                                    plastics.map((plastic) => (
                                      <SelectItem
                                        key={plastic._id}
                                        value={plastic._id}
                                      >
                                        {plastic.name} ({plastic.width}&quot;)
                                      </SelectItem>
                                    ))}
                                  {item.itemType === 'tape' &&
                                    tapes.map((tape) => (
                                      <SelectItem
                                        key={tape._id}
                                        value={tape._id}
                                      >
                                        {tape.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                setEditFormData({
                                  ...editFormData,
                                  designOrders: editFormData.designOrders.map(
                                    (order, i) =>
                                      i === 0
                                        ? {
                                            ...order,
                                            otherItemsUsed:
                                              order.otherItemsUsed.map(
                                                (otherItem, idx) =>
                                                  idx === itemIndex
                                                    ? {
                                                        ...otherItem,
                                                        quantity:
                                                          parseInt(
                                                            e.target.value,
                                                          ) || 0,
                                                      }
                                                    : otherItem,
                                              ),
                                          }
                                        : order,
                                  ),
                                });
                              }}
                              min="0"
                              placeholder="Enter quantity"
                            />
                          </div>

                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-xs text-green-700 space-y-1">
                              <p className="font-medium">
                                Inventory Deduction Notice:
                              </p>
                              <p>
                                • The selected quantity will be automatically
                                deducted from inventory immediately when order
                                is created
                              </p>
                              <p>
                                • Please ensure sufficient stock is available
                              </p>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
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
            <DialogTitle className="text-xl sm:text-2xl">
              Order Details
            </DialogTitle>
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
                  <Label className="font-semibold">Customer ID</Label>
                  <p>{selectedOrder.customerId || 'Not set'}</p>
                </div>
                <div>
                  <Label className="font-semibold">GST Number</Label>
                  <p>{selectedOrder.gstNumber || 'Not set'}</p>
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Design Orders
                </h3>
                {selectedOrder.designOrders &&
                selectedOrder.designOrders.length > 0 ? (
                  selectedOrder.designOrders.map((designOrder, index) => {
                    const design = designs.find(
                      (d) => d._id === designOrder.designId,
                    );
                    return (
                      <div
                        key={index}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <h4 className="font-medium">
                          Design {index + 1}: {design?.name || 'Unknown'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold">
                              Paper Pieces
                            </Label>
                            <p>{designOrder.paperUsed.quantityInPcs} pieces</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Paper Used</Label>
                            <p>
                              {designOrder.paperUsed.sizeInInch}&quot; ×{' '}
                              {designOrder.paperUsed.quantityInPcs} pcs
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold">Unit Price</Label>
                            <p>
                              {design?.prices && design.prices.length > 0 ? (
                                <span className="font-medium">
                                  {design.prices[0].currency}{' '}
                                  {design.prices[0].price.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-500">Not set</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="font-semibold">Total Price</Label>
                            <p>
                              {design?.prices && design.prices.length > 0 ? (
                                <span className="font-bold text-primary">
                                  ₹{' '}
                                  {(
                                    design.prices[0].price *
                                    designOrder.paperUsed.quantityInPcs
                                  ).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-500">Not set</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No design orders found</p>
                )}
              </div>

              {/* Payment and Pricing Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Mode of Payment</Label>
                  <Badge
                    variant="outline"
                    className="capitalize"
                  >
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
                    {selectedOrder.totalCost
                      ? `₹ ${selectedOrder.totalCost.toFixed(2)}`
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Discount</Label>
                  <p>
                    {selectedOrder.discountValue &&
                    selectedOrder.discountType ? (
                      <span className="text-green-600 font-medium">
                        {selectedOrder.discountType === 'percentage'
                          ? `${selectedOrder.discountValue}%`
                          : `₹ ${selectedOrder.discountValue.toFixed(2)}`}{' '}
                        (
                        {selectedOrder.discountedAmount
                          ? `₹ ${selectedOrder.discountedAmount.toFixed(2)}`
                          : 'Calculating...'}
                        )
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
                    {selectedOrder.finalAmount
                      ? `₹ ${selectedOrder.finalAmount.toFixed(2)}`
                      : 'Not set'}
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
              </div>

              {/* Other Inventory Items Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Other Inventory Items
                </h3>
                {selectedOrder.designOrders &&
                selectedOrder.designOrders.length > 0 &&
                selectedOrder.designOrders.some(
                  (order) =>
                    order.otherItemsUsed && order.otherItemsUsed.length > 0,
                ) ? (
                  selectedOrder.designOrders.map((designOrder, designIndex) => {
                    if (
                      !designOrder.otherItemsUsed ||
                      designOrder.otherItemsUsed.length === 0
                    )
                      return null;

                    return (
                      <div
                        key={designIndex}
                        className="space-y-3"
                      >
                        <h4 className="font-medium text-sm text-muted-foreground">
                          Design {designIndex + 1} Items:
                        </h4>
                        <div className="space-y-2">
                          {designOrder.otherItemsUsed.map((item, itemIndex) => {
                            let itemName = 'Unknown Item';
                            let itemDetails = '';

                            if (item.itemType === 'plastic') {
                              const plastic = plastics.find(
                                (p) => p._id === item.itemId,
                              );
                              itemName = plastic?.name || 'Unknown Plastic';
                              itemDetails = plastic ? `${plastic.width}"` : '';
                            } else if (item.itemType === 'tape') {
                              const tape = tapes.find(
                                (t) => t._id === item.itemId,
                              );
                              itemName = tape?.name || 'Unknown Tape';
                            }

                            return (
                              <div
                                key={itemIndex}
                                className="p-3 border rounded-lg"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-sm">
                                      {itemName}
                                    </p>
                                    {itemDetails && (
                                      <p className="text-xs text-muted-foreground">
                                        {itemDetails}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-sm">
                                      {item.quantity} {item.unit || 'pcs'}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {item.itemType}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No other inventory items used</p>
                )}
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
            <DialogTitle className="text-lg sm:text-xl">
              {confirmDialog.title}
            </DialogTitle>
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

      {/* Invoice Component */}
      {selectedOrderForInvoice && (
        <OrderInvoice
          orderId={selectedOrderForInvoice}
          isOpen={isInvoiceOpen}
          onClose={() => {
            setIsInvoiceOpen(false);
            setSelectedOrderForInvoice(null);
          }}
        />
      )}
    </div>
  );
}
