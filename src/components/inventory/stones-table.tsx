'use client';

import { useState, useEffect } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useSnackbarHelpers } from '@/components/ui/snackbar';

interface Stone {
  _id: string;
  name: string;
  number: string;
  color: string;
  size: string;
  quantity: number;
  unit: 'g' | 'kg';
  createdAt: string;
  updatedAt: string;
}

export default function StonesTable() {
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    color: '',
    size: '',
    quantity: '',
    unit: 'g' as 'g' | 'kg',
  });
  const { showSuccess, showError } = useSnackbarHelpers();

  useEffect(() => {
    fetchStones();
  }, []);

  const fetchStones = async () => {
    try {
      const response = await fetch('/api/inventory/stones');
      const data = await response.json();
      if (data.success) {
        setStones(data.data);
      } else {
        showError('Data Loading Error', 'Failed to load stones data.');
      }
    } catch (error) {
      console.error('Error fetching stones:', error);
      showError('Network Error', 'Failed to load stones data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory/stones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity),
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Stone Added', 'New stone has been added successfully.');
        setIsDialogOpen(false);
        setFormData({
          name: '',
          number: '',
          color: '',
          size: '',
          quantity: '',
          unit: 'g',
        });
        fetchStones();
      } else {
        showError('Creation Failed', data.message || 'Failed to add stone.');
      }
    } catch (error) {
      console.error('Error adding stone:', error);
      showError('Network Error', 'Failed to add stone. Please try again.');
    }
  };

  const handleUpdateQuantity = async (stoneId: string, newQuantity: number) => {
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
        showSuccess('Quantity Updated', 'Stone quantity has been updated successfully.');
        fetchStones();
      } else {
        showError('Update Failed', data.message || 'Failed to update quantity.');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError('Network Error', 'Failed to update quantity. Please try again.');
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Stones Inventory</h3>
          <p className="text-sm text-muted-foreground">
            Manage stone inventory with quantity tracking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Stone</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Stone</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Number</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
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
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value: 'g' | 'kg') => setFormData({ ...formData, unit: value })}
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Stone</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newQuantity = prompt('Enter new quantity:', stone.quantity.toString());
                      if (newQuantity !== null) {
                        const quantity = parseFloat(newQuantity);
                        if (!isNaN(quantity) && quantity >= 0) {
                          handleUpdateQuantity(stone._id, quantity);
                        } else {
                          showError('Invalid Input', 'Please enter a valid positive number.');
                        }
                      }
                    }}
                  >
                    Update Quantity
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
