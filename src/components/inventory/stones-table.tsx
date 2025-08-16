'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@/lib/auth-context';
import { Gem, Plus } from 'lucide-react';

interface Stone {
  _id: string;
  name: string;
  number: string;
  color: string;
  size: string;
  quantity: number;
  unit: 'g' | 'kg';
  inventoryType: 'internal' | 'out';
  createdAt: string;
  updatedAt: string;
}

interface StonesTableProps {
  inventoryType?: 'internal' | 'out';
}

export default function StonesTable({
  inventoryType = 'internal',
}: StonesTableProps) {
  const { user } = useAuth();
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedStone, setSelectedStone] = useState<Stone | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    color: '',
    size: '',
    quantity: '',
    unit: 'g' as 'g' | 'kg',
    inventoryType: inventoryType as 'internal' | 'out',
  });
  const { showSuccess, showError } = useSnackbarHelpers();

  const fetchStones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/inventory/stones?type=${inventoryType}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setStones(data.data);
      } else {
        showError(
          'Data Loading Error',
          data.message || 'Failed to load stones data.',
        );
      }
    } catch (error) {
      console.error('Error fetching stones:', error);
      showError(
        'Network Error',
        'Failed to load stones data. Please try again.',
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryType]);

  useEffect(() => {
    fetchStones();
    setFormData((prev) => ({ ...prev, inventoryType }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await fetch('/api/inventory/stones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        showSuccess('Stone Added', 'New stone has been added successfully.');
        setIsDialogOpen(false);
        setFormData({
          name: '',
          number: '',
          color: '',
          size: '',
          quantity: '',
          unit: 'g',
          inventoryType,
        });
        fetchStones();
      } else {
        showError('Creation Failed', data.message || 'Failed to add stone.');
      }
    } catch (error) {
      console.error('Error adding stone:', error);
      showError('Network Error', 'Failed to add stone. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateQuantity = async (stoneId: string, newQuantity: number) => {
    setIsUpdating(stoneId);
    try {
      const response = await fetch(`/api/inventory/stones/${stoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Quantity Updated',
          'Stone quantity has been updated successfully.',
        );
        fetchStones();
        setIsUpdateDialogOpen(false);
        setSelectedStone(null);
        setUpdateQuantity('');
      } else {
        showError(
          'Update Failed',
          data.message || 'Failed to update quantity.',
        );
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError(
        'Network Error',
        'Failed to update quantity. Please try again.',
      );
    } finally {
      setIsUpdating(null);
    }
  };

  const openUpdateDialog = (stone: Stone) => {
    setSelectedStone(stone);
    setUpdateQuantity(stone.quantity.toString());
    setIsUpdateDialogOpen(true);
  };

  const openDeleteDialog = (stone: Stone) => {
    setSelectedStone(stone);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteStone = async (stoneId: string) => {
    setIsDeleting(stoneId);
    try {
      const response = await fetch(`/api/inventory/stones/${stoneId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        showSuccess('Stone Deleted', 'Stone has been deleted successfully.');
        fetchStones();
        setIsDeleteDialogOpen(false);
        setSelectedStone(null);
      } else {
        showError('Delete Failed', data.message || 'Failed to delete stone.');
      }
    } catch (error) {
      console.error('Error deleting stone:', error);
      showError('Network Error', 'Failed to delete stone. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const isOutJob = inventoryType === 'out';
  const title = isOutJob ? 'Out Job Stones' : 'Internal Stones';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{title} Inventory</h1>
          <p className="text-gray-600">
            {isOutJob
              ? 'Manage stones received from customers for out jobs'
              : 'Manage internal stone inventory with name, number, color, size, and quantity'}
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Stone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {title} Stone</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Number</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value: 'g' | 'kg') =>
                      setFormData({ ...formData, unit: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  loading={isCreating}
                  loadingText="Adding..."
                >
                  Add Stone
                </LoadingButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Update Quantity Modal */}
      <Dialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Quantity</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedStone) {
                const quantity = parseFloat(updateQuantity);
                if (!isNaN(quantity) && quantity >= 0) {
                  handleUpdateQuantity(selectedStone._id, quantity);
                } else {
                  showError(
                    'Invalid Input',
                    'Please enter a valid positive number.',
                  );
                }
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="updateQuantity">New Quantity</Label>
              <Input
                id="updateQuantity"
                type="number"
                step="0.01"
                value={updateQuantity}
                onChange={(e) => setUpdateQuantity(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUpdateDialogOpen(false);
                  setSelectedStone(null);
                  setUpdateQuantity('');
                }}
                disabled={isUpdating === selectedStone?._id}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                loading={isUpdating === selectedStone?._id}
                loadingText="Updating..."
              >
                Update Quantity
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{' '}
              <strong>{selectedStone?.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedStone(null);
                }}
                disabled={isDeleting === selectedStone?._id}
              >
                Cancel
              </Button>
              <LoadingButton
                type="button"
                variant="destructive"
                onClick={() =>
                  selectedStone && handleDeleteStone(selectedStone._id)
                }
                loading={isDeleting === selectedStone?._id}
                loadingText="Deleting..."
              >
                Delete
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {stones.length === 0 ? (
        <EmptyState
          icon={Gem}
          title={`No ${title} Found`}
          description={`Get started by adding your first ${title.toLowerCase()}. ${title} inventory will appear here once added.`}
          action={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First {title} Stone
            </Button>
          }
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stones.map((stone) => (
                <TableRow key={stone._id}>
                  <TableCell className="font-medium">{stone.name}</TableCell>
                  <TableCell>{stone.number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{stone.color}</Badge>
                  </TableCell>
                  <TableCell>{stone.size}</TableCell>
                  <TableCell>{stone.quantity}</TableCell>
                  <TableCell>{stone.unit}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <LoadingButton
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateDialog(stone)}
                        loading={isUpdating === stone._id}
                        loadingText="Updating..."
                      >
                        Update Quantity
                      </LoadingButton>
                      {user?.role === 'admin' && (
                        <LoadingButton
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(stone)}
                          loading={isDeleting === stone._id}
                          loadingText="Deleting..."
                        >
                          Delete
                        </LoadingButton>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
