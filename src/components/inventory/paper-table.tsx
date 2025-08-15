'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSnackbarHelpers } from '@/components/ui/snackbar';

export default function PaperTable() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    width: '',
    quantity: '',
    piecesPerRoll: '',
    weightPerPiece: '',
  });
  const { showSuccess, showError } = useSnackbarHelpers();

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const response = await fetch('/api/inventory/paper');
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        showSuccess('Paper Added', 'New paper roll has been added successfully.');
        setIsDialogOpen(false);
        setFormData({
          width: '',
          quantity: '',
          piecesPerRoll: '',
          weightPerPiece: '',
        });
        fetchPapers();
      } else {
        showError('Creation Failed', data.message || 'Failed to add paper roll.');
      }
    } catch (error) {
      console.error('Error creating paper:', error);
      showError('Network Error', 'Failed to add paper roll. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Paper Rolls ({papers.length})</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Paper</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Paper Roll</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Width (inches)</Label>
                  <Select value={formData.width} onValueChange={(value) => setFormData({ ...formData, width: value })}>
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
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, piecesPerRoll: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, weightPerPiece: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Paper</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                <TableCell className="font-medium">{paper.width}"</TableCell>
                <TableCell>{paper.quantity}</TableCell>
                <TableCell>{paper.piecesPerRoll}</TableCell>
                <TableCell>{paper.weightPerPiece}g</TableCell>
                <TableCell>{paper.quantity * paper.piecesPerRoll}</TableCell>
                <TableCell>
                  <Badge variant={paper.quantity < 5 ? 'destructive' : 'default'}>
                    {paper.quantity < 5 ? 'Low Stock' : 'In Stock'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
