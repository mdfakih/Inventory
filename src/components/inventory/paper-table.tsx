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
import { Package, Trash2, Plus } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import AddInventoryModal from './add-inventory-modal';
import type { Paper } from '@/types';

interface PaperTableProps {
  inventoryType?: 'internal' | 'out';
}

function PaperTable({ inventoryType = 'internal' }: PaperTableProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isAddInventoryModalOpen, setIsAddInventoryModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { showSuccess, showError } = useSnackbarHelpers();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const fetchPapers = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        }
        const response = await fetch(
          `/api/inventory/paper?type=${inventoryType}&page=${currentPage}&limit=${itemsPerPage}`,
        );
        const data = await safeJsonParse<{
          success: boolean;
          data: Paper[];
          pagination: { pages: number; total: number };
          message?: string;
        }>(response);
        if (data.success) {
          setPapers(data.data);
          setTotalPages(data.pagination.pages);
          setTotalItems(data.pagination.total);
        }
      } catch (error) {
        console.error('Error fetching papers:', error);
        showError('Data Loading Error', 'Failed to load paper data.');
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
      fetchPapers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryType, authLoading, isAuthenticated, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleResetPaper = async (paperId: string) => {
    setIsDeleting(paperId);
    try {
      const response = await fetch(`/api/inventory/paper/${paperId}`, {
        method: 'DELETE',
      });

      const data = await safeJsonParse<{ success: boolean; message?: string }>(
        response,
      );
      if (data.success) {
        showSuccess(
          'Paper Reset',
          'Paper quantity has been reset to 0 successfully.',
        );
        await fetchPapers(true);
        setIsDeleteDialogOpen(false);
        setSelectedPaper(null);
      } else {
        showError(
          'Reset Failed',
          data.message || 'Failed to reset paper quantity.',
        );
      }
    } catch (error) {
      console.error('Error resetting paper quantity:', error);
      showError(
        'Network Error',
        'Failed to reset paper quantity. Please try again.',
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const openDeleteDialog = (paper: Paper) => {
    setSelectedPaper(paper);
    setIsDeleteDialogOpen(true);
  };

  const isOutJob = inventoryType === 'out';
  const title = isOutJob ? 'Out Job Paper' : 'Internal Paper';

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
              ? 'Manage paper received from customers for out jobs'
              : 'Manage paper rolls with different widths and weights'}
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
          fetchPapers(true);
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
            <DialogTitle>Reset Paper Quantity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to reset the quantity of{' '}
              <strong>{selectedPaper?.name}</strong> to 0? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedPaper(null);
                }}
                disabled={isDeleting === selectedPaper?._id}
              >
                Cancel
              </Button>
              <LoadingButton
                type="button"
                variant="destructive"
                onClick={() =>
                  selectedPaper && handleResetPaper(selectedPaper._id)
                }
                loading={isDeleting === selectedPaper?._id}
                loadingText="Resetting..."
              >
                Reset
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {papers.length === 0 ? (
        <EmptyState
          icon={Package}
          title={`No ${title} Rolls Found`}
          description={`No ${title.toLowerCase()} rolls are currently available in the inventory.`}
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Width</TableHead>
                <TableHead>Quantity (rolls)</TableHead>
                <TableHead>Pieces per Roll</TableHead>
                <TableHead>Weight per Piece</TableHead>
                <TableHead>Total Pieces</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papers.map((paper) => (
                <TableRow key={paper._id}>
                  <TableCell className="font-medium">{paper.name}</TableCell>
                  <TableCell>{paper.width}&quot;</TableCell>
                  <TableCell>{paper.quantity}</TableCell>
                  <TableCell>{paper.piecesPerRoll}</TableCell>
                  <TableCell>{paper.weightPerPiece}g</TableCell>
                  <TableCell>{paper.totalPieces}</TableCell>
                  <TableCell>
                    <Badge
                      variant={paper.quantity < 5 ? 'destructive' : 'default'}
                    >
                      {paper.quantity < 5 ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <LoadingButton
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(paper)}
                      loading={isDeleting === paper._id}
                      loadingText="Resetting..."
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Reset
                    </LoadingButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
      />
    </div>
  );
}

export default memo(PaperTable);
