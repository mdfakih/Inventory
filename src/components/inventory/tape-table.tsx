'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
import { LoadingButton } from '@/components/ui/loading-button';
import { EmptyState } from '@/components/ui/empty-state';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import { useAuth } from '@/lib/auth-context';
import { Package, Edit, Trash2 } from 'lucide-react';

interface Tape {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export default function TapeTable() {
  const [tapes, setTapes] = useState<Tape[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedTape, setSelectedTape] = useState<Tape | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState('');
  const { showSuccess, showError } = useSnackbarHelpers();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const fetchTapes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
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
      if (isRefresh) {
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only fetch data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchTapes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  const handleUpdateQuantity = async (tapeId: string, newQuantity: number) => {
    setIsUpdating(tapeId);
    try {
      const response = await fetch(`/api/inventory/tape/${tapeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Quantity Updated',
          'Tape quantity has been updated successfully.',
        );
        await fetchTapes(true);
        setIsUpdateDialogOpen(false);
        setSelectedTape(null);
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

  const handleResetTape = async (tapeId: string) => {
    setIsDeleting(tapeId);
    try {
      const response = await fetch(`/api/inventory/tape/${tapeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Tape Reset',
          'Tape quantity has been reset to 0 successfully.',
        );
        await fetchTapes(true);
        setIsDeleteDialogOpen(false);
        setSelectedTape(null);
      } else {
        showError(
          'Reset Failed',
          data.message || 'Failed to reset tape quantity.',
        );
      }
    } catch (error) {
      console.error('Error resetting tape quantity:', error);
      showError(
        'Network Error',
        'Failed to reset tape quantity. Please try again.',
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const openUpdateDialog = (tape: Tape) => {
    setSelectedTape(tape);
    setUpdateQuantity(tape.quantity.toString());
    setIsUpdateDialogOpen(true);
  };

  const openDeleteDialog = (tape: Tape) => {
    setSelectedTape(tape);
    setIsDeleteDialogOpen(true);
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
        {refreshing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            <span>Refreshing...</span>
          </div>
        )}
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
              if (selectedTape) {
                const quantity = parseInt(updateQuantity);
                if (!isNaN(quantity) && quantity >= 0) {
                  handleUpdateQuantity(selectedTape._id, quantity);
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
              <Label htmlFor="updateQuantity">New Quantity (pcs)</Label>
              <Input
                id="updateQuantity"
                type="number"
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
                  setSelectedTape(null);
                  setUpdateQuantity('');
                }}
                disabled={isUpdating === selectedTape?._id}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                loading={isUpdating === selectedTape?._id}
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
            <DialogTitle>Reset Tape Quantity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to reset the quantity of{' '}
              <strong>{selectedTape?.name}</strong> to 0? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedTape(null);
                }}
                disabled={isDeleting === selectedTape?._id}
              >
                Cancel
              </Button>
              <LoadingButton
                type="button"
                variant="destructive"
                onClick={() =>
                  selectedTape && handleResetTape(selectedTape._id)
                }
                loading={isDeleting === selectedTape?._id}
                loadingText="Resetting..."
              >
                Reset
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {tapes.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Tape Found"
          description="No tape items are currently available in the inventory."
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity (pcs)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                  <TableCell>
                    <div className="flex gap-2">
                      <LoadingButton
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateDialog(tape)}
                        loading={isUpdating === tape._id}
                        loadingText="Updating..."
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Update
                      </LoadingButton>
                      <LoadingButton
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(tape)}
                        loading={isDeleting === tape._id}
                        loadingText="Resetting..."
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Reset
                      </LoadingButton>
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
