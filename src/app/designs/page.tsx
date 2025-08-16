'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
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
import { Upload, X, Edit, Trash2, Eye, Plus, Palette } from 'lucide-react';

interface Stone {
  _id: string;
  name: string;
  number: string;
  color: string;
  size: string;
  quantity: number;
  unit: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Design {
  _id: string;
  name: string;
  number: string;
  imageUrl: string;
  defaultStones: Array<{
    stoneId: { _id: string; name: string };
    quantity: number;
  }>;
  paperConfigurations: Array<{
    paperSize: number;
    defaultStones: Array<{
      stoneId: { _id: string; name: string };
      quantity: number;
    }>;
  }>;
  createdBy: { name: string; email: string };
  updatedBy?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  number: string;
  imageUrl: string;
  defaultStones: Array<{
    stoneId: string;
    quantity: number;
  }>;
  paperConfigurations: Array<{
    paperSize: number;
    defaultStones: Array<{
      stoneId: string;
      quantity: number;
    }>;
  }>;
}

export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    number: '',
    imageUrl: '',
    defaultStones: [],
    paperConfigurations: [],
  });
  const [editFormData, setEditFormData] = useState<FormData>({
    name: '',
    number: '',
    imageUrl: '',
    defaultStones: [],
    paperConfigurations: [],
  });
  const { showSuccess, showError } = useSnackbarHelpers();

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [designsRes, stonesRes] = await Promise.all([
        fetch('/api/designs'),
        fetch('/api/inventory/stones'),
      ]);

      const designsData = await designsRes.json();
      const stonesData = await stonesRes.json();

      if (designsData.success) setDesigns(designsData.data);
      if (stonesData.success) setStones(stonesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Data Loading Error', 'Failed to load designs data.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    fetchUser();
  }, [fetchData, fetchUser]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Image Uploaded',
          'Design image has been uploaded successfully.',
        );
        setFormData((prev) => ({ ...prev, imageUrl: data.data.url }));
      } else {
        showError('Upload Failed', data.message || 'Failed to upload image.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Network Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Design Created',
          'New design has been created successfully.',
        );
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          number: '',
          imageUrl: '',
          defaultStones: [],
          paperConfigurations: [],
        });
        fetchData();
      } else {
        showError(
          'Creation Failed',
          data.message || 'Failed to create design.',
        );
      }
    } catch (error) {
      console.error('Error creating design:', error);
      showError('Network Error', 'Failed to create design. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesign) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/designs/${selectedDesign._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Design Updated', 'Design has been updated successfully.');
        setIsEditDialogOpen(false);
        setSelectedDesign(null);
        fetchData();
      } else {
        showError('Update Failed', data.message || 'Failed to update design.');
      }
    } catch (error) {
      console.error('Error updating design:', error);
      showError('Network Error', 'Failed to update design. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    setIsDeleting(designId);
    try {
      const response = await fetch(`/api/designs/${designId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Design Deleted', 'Design has been deleted successfully.');
        fetchData();
      } else {
        showError(
          'Deletion Failed',
          data.message || 'Failed to delete design.',
        );
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      showError('Network Error', 'Failed to delete design. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (design: Design) => {
    setSelectedDesign(design);
    setEditFormData({
      name: design.name,
      number: design.number,
      imageUrl: design.imageUrl,
      defaultStones: design.defaultStones.map((stone) => ({
        stoneId: stone.stoneId._id,
        quantity: stone.quantity,
      })),
      paperConfigurations: design.paperConfigurations.map((config) => ({
        paperSize: config.paperSize,
        defaultStones: config.defaultStones.map((stone) => ({
          stoneId: stone.stoneId._id,
          quantity: stone.quantity,
        })),
      })),
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (design: Design) => {
    setSelectedDesign(design);
    setIsViewDialogOpen(true);
  };

  const addDefaultStone = () => {
    setFormData((prev) => ({
      ...prev,
      defaultStones: [...prev.defaultStones, { stoneId: '', quantity: 0 }],
    }));
  };

  const removeDefaultStone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      defaultStones: prev.defaultStones.filter((_, i) => i !== index),
    }));
  };

  const updateDefaultStone = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      defaultStones: prev.defaultStones.map((stone, i) =>
        i === index ? { ...stone, [field]: value } : stone,
      ),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Designs Management</h1>
        <p className="text-gray-600">
          Manage design templates and configurations
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Designs ({designs.length})</h2>
          <p className="text-sm text-muted-foreground">
            Manage design templates and their default stone configurations
          </p>
        </div>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Design
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Design</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleCreateSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Design Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Design Number</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Design Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {formData.imageUrl ? (
                    <div className="space-y-2">
                      <Image
                        src={formData.imageUrl}
                        alt="Design preview"
                        width={128}
                        height={128}
                        className="mx-auto max-h-32 object-contain"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData({ ...formData, imageUrl: '' })
                        }
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <Spinner
                                size="sm"
                                className="mr-2"
                              />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Image
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Default Stones</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDefaultStone}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stone
                  </Button>
                </div>
                {formData.defaultStones.map((stone, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-4 items-end"
                  >
                    <div>
                      <Label>Stone</Label>
                      <Select
                        value={stone.stoneId}
                        onValueChange={(value) =>
                          updateDefaultStone(index, 'stoneId', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stone" />
                        </SelectTrigger>
                        <SelectContent>
                          {stones.map((s) => (
                            <SelectItem
                              key={s._id}
                              value={s._id}
                            >
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantity (g)</Label>
                      <Input
                        type="number"
                        value={stone.quantity}
                        onChange={(e) =>
                          updateDefaultStone(
                            index,
                            'quantity',
                            parseInt(e.target.value),
                          )
                        }
                        min="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDefaultStone(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  loading={isCreating}
                  loadingText="Creating..."
                >
                  Create Design
                </LoadingButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {designs.length === 0 ? (
            <EmptyState
              icon={Palette}
              title="No Designs Found"
              description="Get started by creating your first design. Designs will appear here once they are created."
              action={
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Design
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Default Stones</TableHead>
                  <TableHead>Paper Configurations</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designs.map((design) => (
                  <TableRow key={design._id}>
                    <TableCell>
                      {design.imageUrl ? (
                        <Image
                          src={design.imageUrl}
                          alt={design.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-500 text-xs">
                            No Image
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{design.name}</TableCell>
                    <TableCell>{design.number}</TableCell>
                    <TableCell>
                      {design.defaultStones.length > 0 ? (
                        <div className="space-y-1">
                          {design.defaultStones.map((stone, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="mr-1"
                            >
                              {stone.stoneId.name}: {stone.quantity}g
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No default stones</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {design.paperConfigurations.length > 0 ? (
                        <div className="space-y-1">
                          {design.paperConfigurations.map((config, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="mr-1"
                            >
                              {config.paperSize}&quot;:{' '}
                              {config.defaultStones.length} stones
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No paper configs</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(design.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(design)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(design)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user?.role === 'admin' && (
                          <LoadingButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(design._id)}
                            loading={isDeleting === design._id}
                            loadingText=""
                          >
                            <Trash2 className="h-4 w-4" />
                          </LoadingButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Design</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Design Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-number">Design Number</Label>
                <Input
                  id="edit-number"
                  value={editFormData.number}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, number: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Design Image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {editFormData.imageUrl ? (
                  <div className="space-y-2">
                    <Image
                      src={editFormData.imageUrl}
                      alt="Design preview"
                      width={128}
                      height={128}
                      className="mx-auto max-h-32 object-contain"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditFormData({ ...editFormData, imageUrl: '' })
                      }
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Spinner
                              size="sm"
                              className="mr-2"
                            />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Default Stones</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditFormData((prev) => ({
                      ...prev,
                      defaultStones: [
                        ...prev.defaultStones,
                        { stoneId: '', quantity: 0 },
                      ],
                    }))
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stone
                </Button>
              </div>
              {editFormData.defaultStones.map((stone, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 items-end"
                >
                  <div>
                    <Label>Stone</Label>
                    <Select
                      value={stone.stoneId}
                      onValueChange={(value) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          defaultStones: prev.defaultStones.map((s, i) =>
                            i === index ? { ...s, stoneId: value } : s,
                          ),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stone" />
                      </SelectTrigger>
                      <SelectContent>
                        {stones.map((s) => (
                          <SelectItem
                            key={s._id}
                            value={s._id}
                          >
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity (g)</Label>
                    <Input
                      type="number"
                      value={stone.quantity}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          defaultStones: prev.defaultStones.map((s, i) =>
                            i === index
                              ? { ...s, quantity: parseInt(e.target.value) }
                              : s,
                          ),
                        }))
                      }
                      min="0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditFormData((prev) => ({
                        ...prev,
                        defaultStones: prev.defaultStones.filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                loading={isUpdating}
                loadingText="Updating..."
              >
                Update Design
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Design Details</DialogTitle>
          </DialogHeader>
          {selectedDesign && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Design Name</Label>
                  <p>{selectedDesign.name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Design Number</Label>
                  <p>{selectedDesign.number}</p>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Design Image</Label>
                {selectedDesign.imageUrl ? (
                  <Image
                    src={selectedDesign.imageUrl}
                    alt={selectedDesign.name}
                    width={192}
                    height={192}
                    className="mt-2 max-h-48 object-contain rounded"
                  />
                ) : (
                  <p className="text-gray-500 mt-2">No image</p>
                )}
              </div>
              <div>
                <Label className="font-semibold">Default Stones</Label>
                {selectedDesign.defaultStones.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {selectedDesign.defaultStones.map((stone, index) => (
                      <div
                        key={index}
                        className="flex justify-between"
                      >
                        <span>{stone.stoneId.name}</span>
                        <span>{stone.quantity}g</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">No default stones</p>
                )}
              </div>
              <div>
                <Label className="font-semibold">Paper Configurations</Label>
                {selectedDesign.paperConfigurations.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {selectedDesign.paperConfigurations.map((config, index) => (
                      <div
                        key={index}
                        className="border rounded p-3"
                      >
                        <div className="font-medium mb-2">
                          {config.paperSize}&quot; Paper
                        </div>
                        <div className="space-y-1">
                          {config.defaultStones.map((stone, stoneIndex) => (
                            <div
                              key={stoneIndex}
                              className="flex justify-between text-sm"
                            >
                              <span>{stone.stoneId.name}</span>
                              <span>{stone.quantity}g</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">No paper configurations</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Created By</Label>
                  <p>{selectedDesign.createdBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Last Updated By</Label>
                  <p>{selectedDesign.updatedBy?.name || 'Not updated'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
