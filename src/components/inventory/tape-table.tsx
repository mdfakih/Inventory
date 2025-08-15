'use client';

import { useState, useEffect } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';

export default function TapeTable() {
  const [tapes, setTapes] = useState<
    {
      _id: string;
      quantity: number;
      unit: string;
      createdAt: string;
      updatedAt: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
  });

  useEffect(() => {
    fetchTapes();
  }, []);

  const fetchTapes = async () => {
    try {
      const response = await fetch('/api/inventory/tape');
      const data = await response.json();
      if (data.success) {
        setTapes(data.data);
      }
    } catch (error) {
      console.error('Error fetching tapes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory/tape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: parseInt(formData.quantity),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsDialogOpen(false);
        setFormData({
          quantity: '',
        });
        fetchTapes();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error creating tape:', error);
      alert('Error creating tape');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Cello Tape ({tapes.length})</h3>
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>Add Tape</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tape</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
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
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Tape</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quantity (pcs)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tapes.map((tape) => (
              <TableRow key={tape._id}>
                <TableCell className="font-medium">{tape.quantity}</TableCell>
                <TableCell>
                  <Badge
                    variant={tape.quantity < 20 ? 'destructive' : 'default'}
                  >
                    {tape.quantity < 20 ? 'Low Stock' : 'In Stock'}
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
