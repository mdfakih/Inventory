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

interface Paper {
  _id: string;
  name: string;
  width: number;
  quantity: number;
  piecesPerRoll: number;
  weightPerPiece: number;
  inventoryType: 'internal' | 'out';
}

interface PaperTableProps {
  inventoryType?: 'internal' | 'out';
}

export default function PaperTable({
  inventoryType = 'internal',
}: PaperTableProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState('');
  const { showSuccess, showError } = useSnackbarHelpers();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const fetchPapers = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        }
        const response = await fetch(
          `/api/inventory/paper?type=${inventoryType}`,
        );
        const data = await response.json();
        if (data.success) {
          setPapers(data.data);
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
    [inventoryType, showError],
  );

  useEffect(() => {
    // Only fetch data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchPapers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryType, authLoading, isAuthenticated]);

  const handleUpdateQuantity = async (paperId: string, newQuantity: number) => {
    setIsUpdating(paperId);
    try {
      const response = await fetch(`/api/inventory/paper/${paperId}`, {
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
          'Paper quantity has been updated successfully.',
        );
        await fetchPapers(true);
        setIsUpdateDialogOpen(false);
        setSelectedPaper(null);
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

  const handleResetPaper = async (paperId: string) => {
    setIsDeleting(paperId);
    try {
      const response = await fetch(`/api/inventory/paper/${paperId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
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

  const openUpdateDialog = (paper: Paper) => {
    setSelectedPaper(paper);
    setUpdateQuantity(paper.quantity.toString());
    setIsUpdateDialogOpen(true);
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
              if (selectedPaper) {
                const quantity = parseInt(updateQuantity);
                if (!isNaN(quantity) && quantity >= 0) {
                  handleUpdateQuantity(selectedPaper._id, quantity);
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
              <Label htmlFor="updateQuantity">New Quantity (rolls)</Label>
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
                  setSelectedPaper(null);
                  setUpdateQuantity('');
                }}
                disabled={isUpdating === selectedPaper?._id}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                loading={isUpdating === selectedPaper?._id}
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
                  <TableCell>{paper.quantity * paper.piecesPerRoll}</TableCell>
                  <TableCell>
                    <Badge
                      variant={paper.quantity < 5 ? 'destructive' : 'default'}
                    >
                      {paper.quantity < 5 ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <LoadingButton
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateDialog(paper)}
                        loading={isUpdating === paper._id}
                        loadingText="Updating..."
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Update
                      </LoadingButton>
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
