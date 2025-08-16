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

interface Tape {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

interface TapeType {
  _id: string;
  name: string;
}

export default function TapeTable() {
  const [tapes, setTapes] = useState<Tape[]>([]);
  const [tapeTypes, setTapeTypes] = useState<TapeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    tapeTypeId: '',
    quantity: '',
  });
  const { showSuccess, showError } = useSnackbarHelpers();

  const fetchTapes = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/tape');
      const data = await response.json();
      if (data.success) {
        setTapes(data.data);
      } else {
        showError('Data Loading Error', 'Failed to load tape data.');
      }
    } catch (error) {
      console.error('Error fetching tapes:', error);
      showError('Network Error', 'Failed to load tape data. Please try again.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTapeTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/tape');
      const data = await response.json();
      if (data.success) {
        setTapeTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching tape types:', error);
      showError('Data Loading Error', 'Failed to load tape types.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTapes();
    fetchTapeTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const selectedTapeType = tapeTypes.find(
        (tt) => tt._id === formData.tapeTypeId,
      );
      if (!selectedTapeType) {
        showError('Validation Error', 'Please select a valid tape type.');
        return;
      }

      const response = await fetch('/api/inventory/tape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedTapeType.name,
          quantity: parseInt(formData.quantity),
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Tape Added', 'New tape has been added successfully.');
        setIsDialogOpen(false);
        setFormData({
          tapeTypeId: '',
          quantity: '',
        });
        fetchTapes();
      } else {
        showError('Creation Failed', data.message || 'Failed to add tape.');
      }
    } catch (error) {
      console.error('Error creating tape:', error);
      showError('Network Error', 'Failed to add tape. Please try again.');
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
          <h1 className="text-3xl font-bold">Tape Inventory</h1>
          <p className="text-gray-600">Manage cello tape inventory</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tape
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tape</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="tapeType">Tape Type</Label>
                <Select
                  value={formData.tapeTypeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tapeTypeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tape type" />
                  </SelectTrigger>
                  <SelectContent>
                    {tapeTypes.map((tapeType) => (
                      <SelectItem
                        key={tapeType._id}
                        value={tapeType._id}
                      >
                        {tapeType.name}
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
                  Add Tape
                </LoadingButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tapes.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Tape Found"
          description="Get started by adding your first tape. Tape inventory will appear here once added."
          action={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Tape
            </Button>
          }
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity (pcs)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tapes.map((tape) => (
                <TableRow key={tape._id}>
                  <TableCell className="font-medium">{tape.name}</TableCell>
                  <TableCell>{tape.quantity}</TableCell>
                  <TableCell>
                    <Badge
                      variant={tape.quantity < 20 ? 'destructive' : 'default'}
                    >
                      {tape.quantity < 20 ? 'Low Stock' : 'In Stock'}
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
