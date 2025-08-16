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
import { Package, Plus } from 'lucide-react';

interface Plastic {
  _id: string;
  name: string;
  width: number;
  quantity: number;
}

interface PlasticType {
  _id: string;
  name: string;
  width: number;
}

export default function PlasticTable() {
  const [plastics, setPlastics] = useState<Plastic[]>([]);
  const [plasticTypes, setPlasticTypes] = useState<PlasticType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    plasticTypeId: '',
    quantity: '',
  });
  const { showSuccess, showError } = useSnackbarHelpers();

  const fetchPlastics = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/plastic');
      const data = await response.json();
      if (data.success) {
        setPlastics(data.data);
      } else {
        showError('Data Loading Error', 'Failed to load plastic data.');
      }
    } catch (error) {
      console.error('Error fetching plastics:', error);
      showError(
        'Network Error',
        'Failed to load plastic data. Please try again.',
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlasticTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/plastic');
      const data = await response.json();
      if (data.success) {
        setPlasticTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching plastic types:', error);
      showError('Data Loading Error', 'Failed to load plastic types.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPlastics();
    fetchPlasticTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const selectedPlasticType = plasticTypes.find(
        (pt) => pt._id === formData.plasticTypeId,
      );
      if (!selectedPlasticType) {
        showError('Validation Error', 'Please select a valid plastic type.');
        return;
      }

      const response = await fetch('/api/inventory/plastic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedPlasticType.name,
          width: selectedPlasticType.width,
          quantity: parseInt(formData.quantity),
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Plastic Added',
          'New plastic has been added successfully.',
        );
        setIsDialogOpen(false);
        setFormData({
          plasticTypeId: '',
          quantity: '',
        });
        fetchPlastics();
      } else {
        showError('Creation Failed', data.message || 'Failed to add plastic.');
      }
    } catch (error) {
      console.error('Error creating plastic:', error);
      showError('Network Error', 'Failed to add plastic. Please try again.');
    } finally {
      setIsCreating(false);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Plastic Inventory</h1>
          <p className="text-gray-600">
            Manage packaging plastic with different widths
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Plastic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Plastic</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="plasticType">Plastic Type</Label>
                <Select
                  value={formData.plasticTypeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, plasticTypeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plastic type" />
                  </SelectTrigger>
                  <SelectContent>
                    {plasticTypes.map((plasticType) => (
                      <SelectItem
                        key={plasticType._id}
                        value={plasticType._id}
                      >
                        {plasticType.name} ({plasticType.width}&quot;)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (pcs)</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  placeholder="Enter number of pieces"
                  required
                />
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
                  Add Plastic
                </LoadingButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {plastics.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Plastic Found"
          description="Get started by adding your first plastic. Plastic inventory will appear here once added."
          action={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Plastic
            </Button>
          }
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Width</TableHead>
                <TableHead>Quantity (pcs)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plastics.map((plastic) => (
                <TableRow key={plastic._id}>
                  <TableCell className="font-medium">{plastic.name}</TableCell>
                  <TableCell>{plastic.width}&quot;</TableCell>
                  <TableCell>{plastic.quantity}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        plastic.quantity < 10 ? 'destructive' : 'default'
                      }
                    >
                      {plastic.quantity < 10 ? 'Low Stock' : 'In Stock'}
                    </Badge>
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
