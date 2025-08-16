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

interface Paper {
  _id: string;
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    width: '',
    quantity: '',
    piecesPerRoll: '',
    weightPerPiece: '',
    inventoryType: inventoryType as 'internal' | 'out',
  });
  const { showSuccess, showError } = useSnackbarHelpers();

  const fetchPapers = useCallback(async () => {
    try {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryType]);

  useEffect(() => {
    fetchPapers();
    setFormData((prev) => ({ ...prev, inventoryType }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await fetch('/api/inventory/paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          width: parseInt(formData.width),
          quantity: parseInt(formData.quantity),
          piecesPerRoll: parseInt(formData.piecesPerRoll),
          weightPerPiece: parseFloat(formData.weightPerPiece),
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Paper Added',
          'New paper roll has been added successfully.',
        );
        setIsDialogOpen(false);
        setFormData({
          width: '',
          quantity: '',
          piecesPerRoll: '',
          weightPerPiece: '',
          inventoryType,
        });
        fetchPapers();
      } else {
        showError(
          'Creation Failed',
          data.message || 'Failed to add paper roll.',
        );
      }
    } catch (error) {
      console.error('Error creating paper:', error);
      showError('Network Error', 'Failed to add paper roll. Please try again.');
    } finally {
      setIsCreating(false);
    }
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
          <h3 className="text-lg font-semibold">
            {title} Rolls ({papers.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            {isOutJob
              ? 'Manage paper received from customers for out jobs'
              : 'Manage internal paper inventory with quantity tracking'}
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Paper
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {title} Roll</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Width (inches)</Label>
                  <Select
                    value={formData.width}
                    onValueChange={(value) =>
                      setFormData({ ...formData, width: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select width" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">9 inches</SelectItem>
                      <SelectItem value="13">13 inches</SelectItem>
                      <SelectItem value="16">16 inches</SelectItem>
                      <SelectItem value="19">19 inches</SelectItem>
                      <SelectItem value="20">20 inches</SelectItem>
                      <SelectItem value="24">24 inches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity (pcs)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="piecesPerRoll">Pieces per Roll</Label>
                  <Input
                    id="piecesPerRoll"
                    type="number"
                    value={formData.piecesPerRoll}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        piecesPerRoll: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="weightPerPiece">Weight per Piece (g)</Label>
                  <Input
                    id="weightPerPiece"
                    type="number"
                    step="0.01"
                    value={formData.weightPerPiece}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weightPerPiece: e.target.value,
                      })
                    }
                    required
                  />
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
                  Add Paper
                </LoadingButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {papers.length === 0 ? (
        <EmptyState
          icon={Package}
          title={`No ${title} Rolls Found`}
          description={`Get started by adding your first ${title.toLowerCase()} roll. ${title} inventory will appear here once added.`}
          action={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First {title} Roll
            </Button>
          }
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Width</TableHead>
                <TableHead>Quantity (pcs)</TableHead>
                <TableHead>Pieces per Roll</TableHead>
                <TableHead>Weight per Piece</TableHead>
                <TableHead>Total Pieces</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papers.map((paper) => (
                <TableRow key={paper._id}>
                  <TableCell className="font-medium">
                    {paper.width}&quot;
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
