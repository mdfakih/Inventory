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
  name: string;
  width: number;
  quantity: number;
  piecesPerRoll: number;
  weightPerPiece: number;
  inventoryType: 'internal' | 'out';
}

interface PaperType {
  _id: string;
  name: string;
  width: number;
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
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    paperTypeId: '',
    quantity: '',
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

  const fetchPaperTypes = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/inventory/paper?type=${inventoryType}`,
      );
      const data = await response.json();
      if (data.success) {
        setPaperTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching paper types:', error);
      showError('Data Loading Error', 'Failed to load paper types.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryType]);

  useEffect(() => {
    fetchPapers();
    fetchPaperTypes();
    setFormData((prev) => ({ ...prev, inventoryType }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const selectedPaperType = paperTypes.find(pt => pt._id === formData.paperTypeId);
      if (!selectedPaperType) {
        showError('Validation Error', 'Please select a valid paper type.');
        return;
      }

      const response = await fetch('/api/inventory/paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedPaperType.name,
          width: selectedPaperType.width,
          quantity: parseInt(formData.quantity),
          piecesPerRoll: selectedPaperType.piecesPerRoll,
          weightPerPiece: selectedPaperType.weightPerPiece,
          inventoryType: formData.inventoryType,
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
          paperTypeId: '',
          quantity: '',
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
          <h1 className="text-3xl font-bold">{title} Inventory</h1>
          <p className="text-gray-600">
            {isOutJob
              ? 'Manage paper received from customers for out jobs'
              : 'Manage paper rolls with different widths and weights'}
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
              <div className="space-y-2">
                <Label htmlFor="paperType">Paper Type</Label>
                <Select
                  value={formData.paperTypeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paperTypeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select paper type" />
                  </SelectTrigger>
                  <SelectContent>
                    {paperTypes.map((paperType) => (
                      <SelectItem key={paperType._id} value={paperType._id}>
                        {paperType.name} ({paperType.width}&quot;, {paperType.piecesPerRoll} pcs/roll)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (rolls)</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  placeholder="Enter number of rolls"
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
                <TableHead>Name</TableHead>
                <TableHead>Width</TableHead>
                <TableHead>Quantity (rolls)</TableHead>
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
                    {paper.name}
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
