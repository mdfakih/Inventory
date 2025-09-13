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

interface Plastic {
  _id: string;
  name: string;
  width: number;
  quantity: number;
}

export default function PlasticTable() {
  const [plastics, setPlastics] = useState<Plastic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedPlastic, setSelectedPlastic] = useState<Plastic | null>(null);
  const [isAddInventoryModalOpen, setIsAddInventoryModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { showSuccess, showError } = useSnackbarHelpers();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const fetchPlastics = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        }
        const response = await fetch(
          `/api/inventory/plastic?page=${currentPage}&limit=${itemsPerPage}`,
        );
        const data = await safeJsonParse<{
          success: boolean;
          data: Plastic[];
          pagination: { pages: number; total: number };
          message?: string;
        }>(response);
        if (data.success) {
          setPlastics(data.data);
          setTotalPages(data.pagination.pages);
          setTotalItems(data.pagination.total);
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
      fetchPlastics();
    }
  }, [authLoading, isAuthenticated, currentPage, itemsPerPage, fetchPlastics]);

  const handleResetPlastic = async (plasticId: string) => {
    setIsDeleting(plasticId);
    try {
      const response = await fetch(`/api/inventory/plastic/${plasticId}`, {
        method: 'DELETE',
      });

      const data = await safeJsonParse<{ success: boolean; message?: string }>(
        response,
      );
      if (data.success) {
        showSuccess(
          'Plastic Reset',
          'Plastic quantity has been reset to 0 successfully.',
        );
        await fetchPlastics(true);
        setIsDeleteDialogOpen(false);
        setSelectedPlastic(null);
      } else {
        showError(
          'Reset Failed',
          data.message || 'Failed to reset plastic quantity.',
        );
      }
    } catch (error) {
      console.error('Error resetting plastic quantity:', error);
      showError(
        'Network Error',
        'Failed to reset plastic quantity. Please try again.',
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const openDeleteDialog = (plastic: Plastic) => {
    setSelectedPlastic(plastic);
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
          <h1 className="text-3xl font-bold">Plastic Inventory</h1>
          <p className="text-gray-600">
            Manage packaging plastic with different widths
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
          fetchPlastics(true);
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
            <DialogTitle>Reset Plastic Quantity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to reset the quantity of{' '}
              <strong>{selectedPlastic?.name}</strong> to 0? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedPlastic(null);
                }}
                disabled={isDeleting === selectedPlastic?._id}
              >
                Cancel
              </Button>
              <LoadingButton
                type="button"
                variant="destructive"
                onClick={() =>
                  selectedPlastic && handleResetPlastic(selectedPlastic._id)
                }
                loading={isDeleting === selectedPlastic?._id}
                loadingText="Resetting..."
              >
                Reset
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {plastics.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Plastic Found"
          description="No plastic items are currently available in the inventory."
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
                <TableHead>Actions</TableHead>
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
                  <TableCell>
                    <div className="flex gap-2">
                      <LoadingButton
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(plastic)}
                        loading={isDeleting === plastic._id}
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

      {/* Pagination */}
      <div className="flex justify-center mt-4">
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
