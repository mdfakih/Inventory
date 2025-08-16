'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

interface Stone {
  _id: string;
  name: string;
  number: string;
  color: string;
  size: string;
  quantity: number;
  unit: string;
  inventoryType: 'internal' | 'out';
}

interface Paper {
  _id: string;
  width: number;
  quantity: number;
  piecesPerRoll: number;
  weightPerPiece: number;
  inventoryType: 'internal' | 'out';
}

export default function OutInventoryPage() {
  const [stones, setStones] = useState<Stone[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stones' | 'paper'>('stones');

  // Stone management states
  const [isStoneDialogOpen, setIsStoneDialogOpen] = useState(false);
  const [isCreatingStone, setIsCreatingStone] = useState(false);
  const [isUpdatingStone, setIsUpdatingStone] = useState<string | null>(null);
  const [stoneFormData, setStoneFormData] = useState({
    name: '',
    number: '',
    color: '',
    size: '',
    quantity: '',
    unit: 'g' as 'g' | 'kg',
  });

  // Paper management states
  const [isPaperDialogOpen, setIsPaperDialogOpen] = useState(false);
  const [isCreatingPaper, setIsCreatingPaper] = useState(false);
  const [isUpdatingPaper, setIsUpdatingPaper] = useState<string | null>(null);
  const [paperFormData, setPaperFormData] = useState({
    width: '',
    quantity: '',
    piecesPerRoll: '',
    weightPerPiece: '',
  });

  const { showSuccess, showError } = useSnackbarHelpers();

  const fetchData = useCallback(async () => {
    try {
      const [stonesRes, papersRes] = await Promise.all([
        fetch('/api/inventory/stones?type=out'),
        fetch('/api/inventory/paper?type=out'),
      ]);

      const stonesData = await stonesRes.json();
      const papersData = await papersRes.json();

      if (stonesData.success) setStones(stonesData.data);
      if (papersData.success) setPapers(papersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Data Loading Error', 'Failed to load out inventory data.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stone management functions
  const handleCreateStone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingStone(true);
    try {
      const response = await fetch('/api/inventory/stones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...stoneFormData,
          quantity: parseFloat(stoneFormData.quantity),
          inventoryType: 'out',
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Stone Added',
          'New stone has been added to out inventory successfully.',
        );
        setIsStoneDialogOpen(false);
        setStoneFormData({
          name: '',
          number: '',
          color: '',
          size: '',
          quantity: '',
          unit: 'g',
        });
        fetchData();
      } else {
        showError('Creation Failed', data.message || 'Failed to add stone.');
      }
    } catch (error) {
      console.error('Error adding stone:', error);
      showError('Network Error', 'Failed to add stone. Please try again.');
    } finally {
      setIsCreatingStone(false);
    }
  };

  const handleUpdateStoneQuantity = async (
    stoneId: string,
    newQuantity: number,
  ) => {
    setIsUpdatingStone(stoneId);
    try {
      const response = await fetch(`/api/inventory/stones/${stoneId}`, {
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
          'Stone quantity has been updated successfully.',
        );
        fetchData();
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
      setIsUpdatingStone(null);
    }
  };

  // Paper management functions
  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingPaper(true);
    try {
      const response = await fetch('/api/inventory/paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paperFormData,
          width: parseInt(paperFormData.width),
          quantity: parseInt(paperFormData.quantity),
          piecesPerRoll: parseInt(paperFormData.piecesPerRoll),
          weightPerPiece: parseFloat(paperFormData.weightPerPiece),
          inventoryType: 'out',
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Paper Added',
          'New paper has been added to out inventory successfully.',
        );
        setIsPaperDialogOpen(false);
        setPaperFormData({
          width: '',
          quantity: '',
          piecesPerRoll: '',
          weightPerPiece: '',
        });
        fetchData();
      } else {
        showError('Creation Failed', data.message || 'Failed to add paper.');
      }
    } catch (error) {
      console.error('Error adding paper:', error);
      showError('Network Error', 'Failed to add paper. Please try again.');
    } finally {
      setIsCreatingPaper(false);
    }
  };

  const handleUpdatePaperQuantity = async (
    paperId: string,
    newQuantity: number,
  ) => {
    setIsUpdatingPaper(paperId);
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
        fetchData();
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
      setIsUpdatingPaper(null);
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
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold">Out Job Inventory Management</h1>
        <p className="text-gray-600">
          Manage stones and paper received from customers for out jobs
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('stones')}
          className={`pb-2 px-4 font-medium ${
            activeTab === 'stones'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Stones ({stones.length})
        </button>
        <button
          onClick={() => setActiveTab('paper')}
          className={`pb-2 px-4 font-medium ${
            activeTab === 'paper'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Paper ({papers.length})
        </button>
      </div>

      {/* Stones Tab */}
      {activeTab === 'stones' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Out Job Stones</CardTitle>
                <CardDescription>
                  Manage stones received from customers for out jobs
                </CardDescription>
              </div>
              <Dialog
                open={isStoneDialogOpen}
                onOpenChange={setIsStoneDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Out Job Stone</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleCreateStone}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={stoneFormData.name}
                          onChange={(e) =>
                            setStoneFormData({
                              ...stoneFormData,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number">Number</Label>
                        <Input
                          id="number"
                          value={stoneFormData.number}
                          onChange={(e) =>
                            setStoneFormData({
                              ...stoneFormData,
                              number: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          value={stoneFormData.color}
                          onChange={(e) =>
                            setStoneFormData({
                              ...stoneFormData,
                              color: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="size">Size</Label>
                        <Input
                          id="size"
                          value={stoneFormData.size}
                          onChange={(e) =>
                            setStoneFormData({
                              ...stoneFormData,
                              size: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          step="0.01"
                          value={stoneFormData.quantity}
                          onChange={(e) =>
                            setStoneFormData({
                              ...stoneFormData,
                              quantity: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Select
                          value={stoneFormData.unit}
                          onValueChange={(value: 'g' | 'kg') =>
                            setStoneFormData({ ...stoneFormData, unit: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">Grams (g)</SelectItem>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsStoneDialogOpen(false)}
                        disabled={isCreatingStone}
                      >
                        Cancel
                      </Button>
                      <LoadingButton
                        type="submit"
                        loading={isCreatingStone}
                        loadingText="Adding..."
                      >
                        Add Stone
                      </LoadingButton>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {stones.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No Out Job Stones Found"
                description="Get started by adding stones received from customers for out jobs."
                action={
                  <Button onClick={() => setIsStoneDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Stone
                  </Button>
                }
              />
            ) : (
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
                      <TableCell className="font-medium">
                        {stone.name}
                      </TableCell>
                      <TableCell>{stone.number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{stone.color}</Badge>
                      </TableCell>
                      <TableCell>{stone.size}</TableCell>
                      <TableCell>{stone.quantity}</TableCell>
                      <TableCell>{stone.unit}</TableCell>
                      <TableCell>
                        <LoadingButton
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newQuantity = prompt(
                              'Enter new quantity:',
                              stone.quantity.toString(),
                            );
                            if (newQuantity !== null) {
                              const quantity = parseFloat(newQuantity);
                              if (!isNaN(quantity) && quantity >= 0) {
                                handleUpdateStoneQuantity(stone._id, quantity);
                              } else {
                                showError(
                                  'Invalid Input',
                                  'Please enter a valid positive number.',
                                );
                              }
                            }
                          }}
                          loading={isUpdatingStone === stone._id}
                          loadingText="Updating..."
                        >
                          Update Quantity
                        </LoadingButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paper Tab */}
      {activeTab === 'paper' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Out Job Paper</CardTitle>
                <CardDescription>
                  Manage paper received from customers for out jobs
                </CardDescription>
              </div>
              <Dialog
                open={isPaperDialogOpen}
                onOpenChange={setIsPaperDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Paper
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Out Job Paper</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleCreatePaper}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width">Width (inches)</Label>
                        <Select
                          value={paperFormData.width}
                          onValueChange={(value) =>
                            setPaperFormData({ ...paperFormData, width: value })
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
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity (pcs)</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={paperFormData.quantity}
                          onChange={(e) =>
                            setPaperFormData({
                              ...paperFormData,
                              quantity: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="piecesPerRoll">Pieces per Roll</Label>
                        <Input
                          id="piecesPerRoll"
                          type="number"
                          value={paperFormData.piecesPerRoll}
                          onChange={(e) =>
                            setPaperFormData({
                              ...paperFormData,
                              piecesPerRoll: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weightPerPiece">
                          Weight per Piece (g)
                        </Label>
                        <Input
                          id="weightPerPiece"
                          type="number"
                          step="0.01"
                          value={paperFormData.weightPerPiece}
                          onChange={(e) =>
                            setPaperFormData({
                              ...paperFormData,
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
                        onClick={() => setIsPaperDialogOpen(false)}
                        disabled={isCreatingPaper}
                      >
                        Cancel
                      </Button>
                      <LoadingButton
                        type="submit"
                        loading={isCreatingPaper}
                        loadingText="Adding..."
                      >
                        Add Paper
                      </LoadingButton>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {papers.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No Out Job Paper Found"
                description="Get started by adding paper received from customers for out jobs."
                action={
                  <Button onClick={() => setIsPaperDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Paper
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Width</TableHead>
                    <TableHead>Quantity (pcs)</TableHead>
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
                      <TableCell className="font-medium">
                        {paper.width}&quot;
                      </TableCell>
                      <TableCell>{paper.quantity}</TableCell>
                      <TableCell>{paper.piecesPerRoll}</TableCell>
                      <TableCell>{paper.weightPerPiece}g</TableCell>
                      <TableCell>
                        {paper.quantity * paper.piecesPerRoll}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            paper.quantity < 5 ? 'destructive' : 'default'
                          }
                        >
                          {paper.quantity < 5 ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <LoadingButton
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newQuantity = prompt(
                              'Enter new quantity:',
                              paper.quantity.toString(),
                            );
                            if (newQuantity !== null) {
                              const quantity = parseInt(newQuantity);
                              if (!isNaN(quantity) && quantity >= 0) {
                                handleUpdatePaperQuantity(paper._id, quantity);
                              } else {
                                showError(
                                  'Invalid Input',
                                  'Please enter a valid positive number.',
                                );
                              }
                            }
                          }}
                          loading={isUpdatingPaper === paper._id}
                          loadingText="Updating..."
                        >
                          Update Quantity
                        </LoadingButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
