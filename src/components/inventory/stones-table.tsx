'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';

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
import { safeJsonParse } from '@/lib/utils';
import { Package, Plus } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import AddInventoryModal from './add-inventory-modal';
import type { Stone } from '@/types';

interface StonesTableProps {
  inventoryType?: 'internal' | 'out';
}

function StonesTable({ inventoryType = 'internal' }: StonesTableProps) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedStone, setSelectedStone] = useState<Stone | null>(null);
  const [isAddInventoryModalOpen, setIsAddInventoryModalOpen] = useState(false);

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

        const data = await safeJsonParse<{
          success: boolean;
          data: Stone[];
          pagination: { pages: number; total: number };
          message?: string;
        }>(response);
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
    [inventoryType, currentPage, itemsPerPage, showError],
  );

  useEffect(() => {
    // Only fetch data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchStones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, inventoryType, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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

      const data = await safeJsonParse<{ success: boolean; message?: string }>(
        response,
      );
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
        <div className="flex items-center gap-3">
          {refreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="sm" />
              <span>Refreshing...</span>
            </div>
          )}
          <Button
            onClick={() => setIsAddInventoryModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Inventory
          </Button>
        </div>
      </div>

      {/* Add Inventory Modal */}
      <AddInventoryModal
        isOpen={isAddInventoryModalOpen}
        onClose={() => setIsAddInventoryModalOpen(false)}
        onSuccess={() => {
          fetchStones(true);
          setIsAddInventoryModalOpen(false);
        }}
      />

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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
    </div>
  );
}

export default memo(StonesTable);
