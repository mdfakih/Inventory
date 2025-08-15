'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function PlasticTable() {
  const [plastics, setPlastics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    width: '',
    quantity: '',
  });

  useEffect(() => {
    fetchPlastics();
  }, []);

  const fetchPlastics = async () => {
    try {
      const response = await fetch('/api/inventory/plastic');
      const data = await response.json();
      if (data.success) {
        setPlastics(data.data);
      }
    } catch (error) {
      console.error('Error fetching plastics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory/plastic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          width: parseInt(formData.width),
          quantity: parseInt(formData.quantity),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsDialogOpen(false);
        setFormData({
          width: '',
          quantity: '',
        });
        fetchPlastics();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error creating plastic:', error);
      alert('Error creating plastic');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Plastic ({plastics.length})</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Plastic</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Plastic</DialogTitle>
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
                      <SelectItem value="12">12 inches</SelectItem>
                      <SelectItem value="14">14 inches</SelectItem>
                      <SelectItem value="16">16 inches</SelectItem>
                      <SelectItem value="18">18 inches</SelectItem>
                      <SelectItem value="20">20 inches</SelectItem>
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
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Plastic</Button>
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
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plastics.map((plastic) => (
              <TableRow key={plastic._id}>
                <TableCell className="font-medium">{plastic.width}"</TableCell>
                <TableCell>{plastic.quantity}</TableCell>
                <TableCell>
                  <Badge variant={plastic.quantity < 10 ? 'destructive' : 'default'}>
                    {plastic.quantity < 10 ? 'Low Stock' : 'In Stock'}
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
