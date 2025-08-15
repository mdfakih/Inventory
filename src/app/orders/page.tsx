'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import { Edit, Trash2, Eye } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [designs, setDesigns] = useState<any[]>([]);
  const [stones, setStones] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: 'internal',
    customerName: '',
    phone: '',
    designId: '',
    stonesUsed: [],
    paperUsed: {
      sizeInInch: '',
      quantityInPcs: '',
    },
  });
  const [editFormData, setEditFormData] = useState({
    type: 'internal',
    customerName: '',
    phone: '',
    designId: '',
    stonesUsed: [],
    paperUsed: {
      sizeInInch: '',
      quantityInPcs: '',
    },
    finalTotalWeight: '',
    status: 'pending',
  });
  const { showSuccess, showError } = useSnackbarHelpers();

  useEffect(() => {
    fetchData();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [ordersRes, designsRes, stonesRes, papersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/designs'),
        fetch('/api/inventory/stones'),
        fetch('/api/inventory/paper'),
      ]);

      const ordersData = await ordersRes.json();
      const designsData = await designsRes.json();
      const stonesData = await stonesRes.json();
      const papersData = await papersRes.json();

      if (ordersData.success) setOrders(ordersData.data);
      if (designsData.success) setDesigns(designsData.data);
      if (stonesData.success) setStones(stonesData.data);
      if (papersData.success) setPapers(papersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Data Loading Error', 'Failed to load orders data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          paperUsed: {
            ...formData.paperUsed,
            sizeInInch: parseInt(formData.paperUsed.sizeInInch),
            quantityInPcs: parseInt(formData.paperUsed.quantityInPcs),
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Order Created', 'New order has been created successfully.');
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
        });
        fetchData();
      } else {
        showError('Creation Failed', data.message || 'Failed to create order.');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Network Error', 'Failed to create order. Please try again.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/orders/${selectedOrder._id}`, {
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
          finalTotalWeight: editFormData.finalTotalWeight ? parseFloat(editFormData.finalTotalWeight) : undefined,
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
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
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
    }
  };

  const openEditDialog = (order: any) => {
    setSelectedOrder(order);
    setEditFormData({
      type: order.type,
      customerName: order.customerName,
      phone: order.phone,
      designId: order.designId._id,
      stonesUsed: order.stonesUsed,
      paperUsed: {
        sizeInInch: order.paperUsed.sizeInInch.toString(),
        quantityInPcs: order.paperUsed.quantityInPcs.toString(),
      },
      finalTotalWeight: order.finalTotalWeight?.toString() || '',
      status: order.status,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (order: any) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <p className="text-gray-600">Manage customer orders and track production</p>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Orders ({orders.length})</h2>
          <p className="text-sm text-muted-foreground">
            Track all internal and external orders
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Order Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
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
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designId">Design</Label>
                  <Select
                    value={formData.designId}
                    onValueChange={(value) => setFormData({ ...formData, designId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select design" />
                    </SelectTrigger>
                    <SelectContent>
                      {designs.map((design) => (
                        <SelectItem key={design._id} value={design._id}>
                          {design.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sizeInInch">Paper Size (inches)</Label>
                  <Select
                    value={formData.paperUsed.sizeInInch}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      paperUsed: { ...formData.paperUsed, sizeInInch: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select paper size" />
                    </SelectTrigger>
                    <SelectContent>
                      {papers.map((paper) => (
                        <SelectItem key={paper._id} value={paper.width.toString()}>
                          {paper.width}" ({paper.weightPerPiece}g per piece)
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
                    onChange={(e) => setFormData({
                      ...formData,
                      paperUsed: { ...formData.paperUsed, quantityInPcs: e.target.value }
                    })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Order</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
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
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-medium">{order.customerName}</TableCell>
                  <TableCell>{order.phone}</TableCell>
                  <TableCell>
                    <Badge variant={order.type === 'internal' ? 'default' : 'secondary'}>
                      {order.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.designId?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {order.paperUsed.sizeInInch}" × {order.paperUsed.quantityInPcs} pcs
                  </TableCell>
                  <TableCell>{order.calculatedWeight?.toFixed(2)}g</TableCell>
                  <TableCell>
                    {order.finalTotalWeight ? `${order.finalTotalWeight.toFixed(2)}g` : 'Not set'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
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
                      {user?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(order._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Order Type</Label>
                <Select
                  value={editFormData.type}
                  onValueChange={(value) => setEditFormData({ ...editFormData, type: value })}
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
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
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
                  onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-designId">Design</Label>
                <Select
                  value={editFormData.designId}
                  onValueChange={(value) => setEditFormData({ ...editFormData, designId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select design" />
                  </SelectTrigger>
                  <SelectContent>
                    {designs.map((design) => (
                      <SelectItem key={design._id} value={design._id}>
                        {design.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-finalTotalWeight">Final Total Weight (g)</Label>
                <Input
                  id="edit-finalTotalWeight"
                  type="number"
                  step="0.01"
                  value={editFormData.finalTotalWeight}
                  onChange={(e) => setEditFormData({ ...editFormData, finalTotalWeight: e.target.value })}
                  placeholder="Enter final weight"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sizeInInch">Paper Size (inches)</Label>
                <Select
                  value={editFormData.paperUsed.sizeInInch}
                  onValueChange={(value) => setEditFormData({
                    ...editFormData,
                    paperUsed: { ...editFormData.paperUsed, sizeInInch: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select paper size" />
                  </SelectTrigger>
                  <SelectContent>
                    {papers.map((paper) => (
                      <SelectItem key={paper._id} value={paper.width.toString()}>
                        {paper.width}" ({paper.weightPerPiece}g per piece)
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
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    paperUsed: { ...editFormData.paperUsed, quantityInPcs: e.target.value }
                  })}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Order</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
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
                  <Badge variant={selectedOrder.type === 'internal' ? 'default' : 'secondary'}>
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
                  <p>{selectedOrder.paperUsed.sizeInInch}" × {selectedOrder.paperUsed.quantityInPcs} pcs</p>
                </div>
                <div>
                  <Label className="font-semibold">Paper Weight per Piece</Label>
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
                  <p>{selectedOrder.finalTotalWeight ? `${selectedOrder.finalTotalWeight.toFixed(2)}g` : 'Not set'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Discrepancy</Label>
                  <p className={selectedOrder.weightDiscrepancy > 0 ? 'text-red-600' : 'text-green-600'}>
                    {selectedOrder.weightDiscrepancy?.toFixed(2)}g ({selectedOrder.discrepancyPercentage?.toFixed(1)}%)
                  </p>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Stones Used</Label>
                <div className="space-y-2">
                  {selectedOrder.stonesUsed.map((stone: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span>{stone.stoneId?.name || 'Unknown Stone'}</span>
                      <span>{stone.quantity}g</span>
                    </div>
                  ))}
                </div>
              </div>
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
