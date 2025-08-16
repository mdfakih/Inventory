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
import { Edit, Trash2, Eye, Package, Plus, CheckCircle } from 'lucide-react';

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
}

interface Stone {
  _id: string;
  name: string;
  number: string;
  color: string;
  size: string;
  quantity: number;
  unit: string;
  inventoryType: 'internal' | 'out';
}

interface Paper {
  _id: string;
  width: number;
  quantity: number;
  piecesPerRoll: number;
  weightPerPiece: number;
  inventoryType: 'internal' | 'out';
}

interface Order {
  _id: string;
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  designId: Design;
  stonesUsed: Array<{
    stoneId: Stone;
    quantity: number;
  }>;
  paperUsed: {
    sizeInInch: number;
    quantityInPcs: number;
    paperWeightPerPc: number;
  };
  receivedMaterials?: {
    stones: Array<{
      stoneId: Stone;
      quantity: number;
    }>;
    paper: {
      sizeInInch: number;
      quantityInPcs: number;
      paperWeightPerPc: number;
    };
  };
  calculatedWeight?: number;
  finalTotalWeight?: number;
  weightDiscrepancy: number;
  discrepancyPercentage: number;
  stoneUsed?: number;
  stoneBalance?: number;
  stoneLoss?: number;
  paperBalance?: number;
  paperLoss?: number;
  status: 'pending' | 'completed' | 'cancelled';
  isFinalized: boolean;
  finalizedAt?: string;
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
  designId: string;
  stonesUsed: Array<{ stoneId: string; quantity: number }>;
  paperUsed: {
    sizeInInch: number;
    quantityInPcs: number;
  };
  receivedMaterials?: {
    stones: Array<{ stoneId: string; quantity: number }>;
    paper: {
      sizeInInch: number;
      quantityInPcs: number;
      paperWeightPerPc: number;
    };
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Loading states for individual operations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'internal' as 'internal' | 'out',
    customerName: '',
    phone: '',
    designId: '',
    stonesUsed: [] as Array<{ stoneId: string; quantity: number }>,
    paperUsed: {
      sizeInInch: '',
      quantityInPcs: '',
    },
    receivedMaterials: {
      stones: [] as Array<{ stoneId: string; quantity: string }>,
      paper: {
        sizeInInch: '',
        quantityInPcs: '',
        paperWeightPerPc: '',
      },
    },
  });
  const [editFormData, setEditFormData] = useState({
    type: 'internal' as 'internal' | 'out',
    customerName: '',
    phone: '',
    designId: '',
    stonesUsed: [] as Array<{ stoneId: string; quantity: number }>,
    paperUsed: {
      sizeInInch: '',
      quantityInPcs: '',
    },
    finalTotalWeight: '',
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
    isFinalized: false,
  });
  const { showSuccess, showError } = useSnackbarHelpers();

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, designsRes, papersRes, stonesRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/designs'),
        fetch('/api/inventory/paper'),
        fetch('/api/inventory/stones'),
      ]);

      const ordersData = await ordersRes.json();
      const designsData = await designsRes.json();
      const papersData = await papersRes.json();
      const stonesData = await stonesRes.json();

      if (ordersData.success) setOrders(ordersData.data);
      if (designsData.success) setDesigns(designsData.data);
      if (papersData.success) setPapers(papersData.data);
      if (stonesData.success) setStones(stonesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Data Loading Error', 'Failed to load orders data.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const orderData: CreateOrderData = {
        type: formData.type,
        customerName: formData.customerName,
        phone: formData.phone,
        designId: formData.designId,
        stonesUsed: formData.stonesUsed,
        paperUsed: {
          sizeInInch: parseInt(formData.paperUsed.sizeInInch),
          quantityInPcs: parseInt(formData.paperUsed.quantityInPcs),
        },
      };

      // Only include received materials for out orders
      if (formData.type === 'out') {
        orderData.receivedMaterials = {
          stones: formData.receivedMaterials.stones.map((stone) => ({
            stoneId: stone.stoneId,
            quantity: parseFloat(stone.quantity),
          })),
          paper: {
            sizeInInch: parseInt(formData.receivedMaterials.paper.sizeInInch),
            quantityInPcs: parseInt(
              formData.receivedMaterials.paper.quantityInPcs,
            ),
            paperWeightPerPc: parseFloat(
              formData.receivedMaterials.paper.paperWeightPerPc,
            ),
          },
        };
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          designId: '',
          stonesUsed: [],
          paperUsed: {
            sizeInInch: '',
            quantityInPcs: '',
          },
          receivedMaterials: {
            stones: [],
            paper: {
              sizeInInch: '',
              quantityInPcs: '',
              paperWeightPerPc: '',
            },
          },
        });
        fetchData();
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
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Order Updated', 'Order has been updated successfully.');
        setIsEditDialogOpen(false);
        setSelectedOrder(null);
        fetchData();
      } else {
        showError('Update Failed', data.message || 'Failed to update order.');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showError('Network Error', 'Failed to update order. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFinalize = async (orderId: string) => {
    if (
      !confirm(
        'Are you sure you want to finalize this order? This will deduct consumed materials from inventory.',
      )
    )
      return;

    setIsFinalizing(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
        fetchData();
      } else {
        showError(
          'Finalization Failed',
          data.message || 'Failed to finalize order.',
        );
      }
    } catch (error) {
      console.error('Error finalizing order:', error);
      showError('Network Error', 'Failed to finalize order. Please try again.');
    } finally {
      setIsFinalizing(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    setIsDeleting(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Order Deleted', 'Order has been deleted successfully.');
        fetchData();
      } else {
        showError('Deletion Failed', data.message || 'Failed to delete order.');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showError('Network Error', 'Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (order: Order) => {
    setSelectedOrder(order);
    setEditFormData({
      type: order.type,
      customerName: order.customerName,
      phone: order.phone,
      designId: order.designId._id,
      stonesUsed: order.stonesUsed.map((stone) => ({
        stoneId:
          typeof stone.stoneId === 'string' ? stone.stoneId : stone.stoneId._id,
        quantity: stone.quantity,
      })),
      paperUsed: {
        sizeInInch: order.paperUsed.sizeInInch.toString(),
        quantityInPcs: order.paperUsed.quantityInPcs.toString(),
      },
      finalTotalWeight: order.finalTotalWeight?.toString() || '',
      status: order.status,
      isFinalized: order.isFinalized,
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
          <h2 className="text-xl font-semibold">Orders ({orders.length})</h2>
          <p className="text-sm text-muted-foreground">
            Track all internal and external orders
          </p>
        </div>
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
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleCreateSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Order Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
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
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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

              {/* Received Materials Section for Out Orders */}
              {formData.type === 'out' && (
                <div className="space-y-4 border p-4 rounded-lg">
                  <h3 className="font-semibold">
                    Received Materials (Customer Provided)
                  </h3>

                  {/* Received Stones */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold">Received Stones</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            receivedMaterials: {
                              ...formData.receivedMaterials,
                              stones: [
                                ...formData.receivedMaterials.stones,
                                { stoneId: '', quantity: '' },
                              ],
                            },
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Stone
                      </Button>
                    </div>
                    {formData.receivedMaterials.stones.map((stone, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-3 gap-4"
                      >
                        <div className="space-y-2">
                          <Label>Stone</Label>
                          <Select
                            value={stone.stoneId}
                            onValueChange={(value) => {
                              const updatedStones = [
                                ...formData.receivedMaterials.stones,
                              ];
                              updatedStones[index] = {
                                ...stone,
                                stoneId: value,
                              };
                              setFormData({
                                ...formData,
                                receivedMaterials: {
                                  ...formData.receivedMaterials,
                                  stones: updatedStones,
                                },
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select stone" />
                            </SelectTrigger>
                            <SelectContent>
                              {stones
                                .filter((s) => s.inventoryType === 'internal')
                                .map((stoneItem) => (
                                  <SelectItem
                                    key={stoneItem._id}
                                    value={stoneItem._id}
                                  >
                                    {stoneItem.name} ({stoneItem.number})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Quantity (g)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={stone.quantity}
                            onChange={(e) => {
                              const updatedStones = [
                                ...formData.receivedMaterials.stones,
                              ];
                              updatedStones[index] = {
                                ...stone,
                                quantity: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                receivedMaterials: {
                                  ...formData.receivedMaterials,
                                  stones: updatedStones,
                                },
                              });
                            }}
                            required
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedStones =
                                formData.receivedMaterials.stones.filter(
                                  (_, i) => i !== index,
                                );
                              setFormData({
                                ...formData,
                                receivedMaterials: {
                                  ...formData.receivedMaterials,
                                  stones: updatedStones,
                                },
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Received Paper */}
                  <div className="space-y-4">
                    <Label className="font-semibold">Received Paper</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="received-paper-size">
                          Paper Size (inches)
                        </Label>
                        <Select
                          value={formData.receivedMaterials.paper.sizeInInch}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              receivedMaterials: {
                                ...formData.receivedMaterials,
                                paper: {
                                  ...formData.receivedMaterials.paper,
                                  sizeInInch: value,
                                },
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select paper size" />
                          </SelectTrigger>
                          <SelectContent>
                            {papers
                              .filter((p) => p.inventoryType === 'internal')
                              .map((paper) => (
                                <SelectItem
                                  key={paper._id}
                                  value={paper.width.toString()}
                                >
                                  {paper.width}&quot; ({paper.weightPerPiece}g
                                  per piece)
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="received-paper-quantity">
                          Paper Quantity (pieces)
                        </Label>
                        <Input
                          id="received-paper-quantity"
                          type="number"
                          value={formData.receivedMaterials.paper.quantityInPcs}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              receivedMaterials: {
                                ...formData.receivedMaterials,
                                paper: {
                                  ...formData.receivedMaterials.paper,
                                  quantityInPcs: e.target.value,
                                },
                              },
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="received-paper-weight">
                        Paper Weight per Piece (g)
                      </Label>
                      <Input
                        id="received-paper-weight"
                        type="number"
                        step="0.01"
                        value={
                          formData.receivedMaterials.paper.paperWeightPerPc
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            receivedMaterials: {
                              ...formData.receivedMaterials,
                              paper: {
                                ...formData.receivedMaterials.paper,
                                paperWeightPerPc: e.target.value,
                              },
                            },
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sizeInInch">Paper Size (inches)</Label>
                  <Select
                    value={formData.paperUsed.sizeInInch}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        paperUsed: { ...formData.paperUsed, sizeInInch: value },
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
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  loading={isCreating}
                  loadingText="Creating..."
                >
                  Create Order
                </LoadingButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No Orders Found"
              description="Get started by creating your first order. Orders will appear here once they are created."
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
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Design</TableHead>
                <TableHead>Paper Used</TableHead>
                <TableHead>Calculated Weight</TableHead>
                <TableHead>Final Weight</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Finalized</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-customerName">Customer Name</Label>
                <Input
                  id="edit-customerName"
                  value={editFormData.customerName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      customerName: e.target.value,
                    })
                  }
                  required
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                loading={isUpdating}
                loadingText="Updating..."
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Customer Name</Label>
                  <p>{selectedOrder.customerName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Phone</Label>
                  <p>{selectedOrder.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label className="font-semibold">Design</Label>
                <p>{selectedOrder.designId?.name || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Paper Used</Label>
                  <p>
                    {selectedOrder.paperUsed.sizeInInch}&quot; ×{' '}
                    {selectedOrder.paperUsed.quantityInPcs} pcs
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">
                    Paper Weight per Piece
                  </Label>
                  <p>{selectedOrder.paperUsed.paperWeightPerPc}g</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
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
                      selectedOrder.weightDiscrepancy > 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    }
                  >
                    {selectedOrder.weightDiscrepancy?.toFixed(2)}g (
                    {selectedOrder.discrepancyPercentage?.toFixed(1)}%)
                  </p>
                </div>
              </div>

              {/* Stone Usage and Balance for Out Orders */}
              {selectedOrder.type === 'out' &&
                selectedOrder.finalTotalWeight && (
                  <div className="space-y-4 border p-4 rounded-lg">
                    <Label className="font-semibold">
                      Stone Usage Analysis
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold">Stone Used</Label>
                        <p>{selectedOrder.stoneUsed?.toFixed(2)}g</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Stone Balance</Label>
                        <p
                          className={
                            selectedOrder.stoneBalance &&
                            selectedOrder.stoneBalance > 0
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }
                        >
                          {selectedOrder.stoneBalance?.toFixed(2)}g
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Stone Loss</Label>
                        <p
                          className={
                            selectedOrder.stoneLoss &&
                            selectedOrder.stoneLoss > 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }
                        >
                          {selectedOrder.stoneLoss?.toFixed(2)}g
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Paper Balance</Label>
                        <p
                          className={
                            selectedOrder.paperBalance &&
                            selectedOrder.paperBalance > 0
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }
                        >
                          {selectedOrder.paperBalance?.toFixed(2)} pcs
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Paper Loss</Label>
                        <p
                          className={
                            selectedOrder.paperLoss &&
                            selectedOrder.paperLoss > 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }
                        >
                          {selectedOrder.paperLoss?.toFixed(2)} pcs
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              <div>
                <Label className="font-semibold">Stones Used</Label>
                <div className="space-y-2">
                  {selectedOrder.stonesUsed.map((stone, index) => (
                    <div
                      key={index}
                      className="flex justify-between"
                    >
                      <span>{stone.stoneId?.name || 'Unknown Stone'}</span>
                      <span>{stone.quantity}g</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedOrder.receivedMaterials && (
                <div className="space-y-4 border p-4 rounded-lg">
                  <Label className="font-semibold">Received Materials</Label>
                  <div>
                    <Label className="font-semibold">Received Paper</Label>
                    <p>
                      {selectedOrder.receivedMaterials.paper.sizeInInch}&quot; ×{' '}
                      {selectedOrder.receivedMaterials.paper.quantityInPcs} pcs
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Received Stones</Label>
                    <div className="space-y-2">
                      {selectedOrder.receivedMaterials.stones.map(
                        (stone, index) => (
                          <div
                            key={index}
                            className="flex justify-between"
                          >
                            <span>
                              {stone.stoneId?.name || 'Unknown Stone'}
                            </span>
                            <span>{stone.quantity}g</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Created By</Label>
                  <p>{selectedOrder.createdBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Last Updated By</Label>
                  <p>{selectedOrder.updatedBy?.name || 'Not updated'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
