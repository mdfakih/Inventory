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
import { Package } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

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
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedStone, setSelectedStone] = useState<Stone | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const { showSuccess, showError } = useSnackbarHelpers();

  const fetchStones = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        const response = await fetch(
          `/api/inventory/stones?type=${inventoryType}&page=${currentPage}&limit=${itemsPerPage}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setStones(data.data);
          setTotalPages(data.pagination.pages);
          setTotalItems(data.pagination.total);
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
        if (isRefresh) {
          setRefreshing(false);
        }
      }
    },
    [inventoryType, currentPage, itemsPerPage],
  );

  useEffect(() => {
    // Only fetch data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchStones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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
        await fetchStones(true);
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

  const handleResetStone = async (stoneId: string) => {
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
        showSuccess(
          'Stone Reset',
          'Stone quantity has been reset to 0 successfully.',
        );
        await fetchStones(true);
        setIsDeleteDialogOpen(false);
        setSelectedStone(null);
      } else {
        showError(
          'Reset Failed',
          data.message || 'Failed to reset stone quantity.',
        );
      }
    } catch (error) {
      console.error('Error resetting stone quantity:', error);
      showError(
        'Network Error',
        'Failed to reset stone quantity. Please try again.',
      );
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
            <DialogTitle>Reset Stone Quantity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to reset the quantity of{' '}
              <strong>{selectedStone?.name}</strong> to 0? This action cannot be
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
                  selectedStone && handleResetStone(selectedStone._id)
                }
                loading={isDeleting === selectedStone?._id}
                loadingText="Resetting..."
              >
                Reset
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {stones.length === 0 ? (
        <EmptyState
          icon={Package}
          title={`No ${title} Found`}
          description={`No ${title.toLowerCase()} are currently available in the inventory.`}
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
                          loadingText="Resetting..."
                        >
                          Reset
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

      {totalPages > 1 && (
        <div className="flex justify-center items-center py-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        </div>
      )}
    </div>
  );
}
