'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Package, Trash2, Plus } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import AddInventoryModal from './add-inventory-modal';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedTape, setSelectedTape] = useState<Tape | null>(null);
  const [isAddInventoryModalOpen, setIsAddInventoryModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { showSuccess, showError } = useSnackbarHelpers();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const fetchTapes = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        }
        const response = await fetch(
          `/api/inventory/tape?page=${currentPage}&limit=${itemsPerPage}`,
        );
        const data = await safeJsonParse<{
          success: boolean;
          data: Tape[];
          pagination: { pages: number; total: number };
          message?: string;
        }>(response);
        if (data.success) {
          setTapes(data.data);
          setTotalPages(data.pagination.pages);
          setTotalItems(data.pagination.total);
        } else {
          showError('Data Loading Error', 'Failed to load tape data.');
        }
      } catch (error) {
        console.error('Error fetching tapes:', error);
        showError(
          'Network Error',
          'Failed to load tape data. Please try again.',
        );
      } finally {
        setLoading(false);
        if (isRefresh) {
          setRefreshing(false);
        }
      }
    },
    [currentPage, itemsPerPage, showError],
  );

  useEffect(() => {
    // Only fetch data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchTapes();
    }
  }, [authLoading, isAuthenticated, currentPage, itemsPerPage, fetchTapes]);

  const handleResetTape = async (tapeId: string) => {
    setIsDeleting(tapeId);
    try {
      const response = await fetch(`/api/inventory/tape/${tapeId}`, {
        method: 'DELETE',
      });

      const data = await safeJsonParse<{ success: boolean; message?: string }>(
        response,
      );
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

  const openDeleteDialog = (tape: Tape) => {
    setSelectedTape(tape);
    setIsDeleteDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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
          fetchTapes(true);
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
                    {tape.quantity > 0 && (
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
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={totalItems}
          />
        </div>
      )}
    </div>
  );
}
