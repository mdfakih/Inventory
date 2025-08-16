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
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
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
          <h3 className="text-lg font-semibold">{title} Inventory</h3>
          <p className="text-sm text-muted-foreground">
            {isOutJob
              ? 'Manage stones received from customers for out jobs'
              : 'Manage internal stone inventory with quantity tracking'}
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
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newQuantity = prompt(
                          'Enter new quantity:',
                          stone.quantity.toString(),
                        );
                        if (newQuantity !== null) {
                          const quantity = parseFloat(newQuantity);
                          if (!isNaN(quantity) && quantity >= 0) {
                            handleUpdateQuantity(stone._id, quantity);
                          } else {
                            showError(
                              'Invalid Input',
                              'Please enter a valid positive number.',
                            );
                          }
                        }
                      }}
                      loading={isUpdating === stone._id}
                      loadingText="Updating..."
                    >
                      Update Quantity
                    </LoadingButton>
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
